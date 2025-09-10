import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI } from '../utils/api';
import AddressPicker from '../components/AddressPicker';
import ImageUploader from '../components/ImageUploader';

const OwnerOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, getToken } = useKindeAuth();
  const api = createAPI(getToken);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 1;

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  // NAW (Owner)
  const [basicInfo, setBasicInfo] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    // address is managed separately
    date_of_birth: '',
  });
  const [address, setAddress] = useState({ country_code: 'NL', postcode: '', house_number: '', house_number_addition: '', street: '', city: '', lat: null, lon: null, geocode_confidence: null, needs_review: null });
  const [errors, setErrors] = useState({});
  const [serverMinor, setServerMinor] = useState(null);
  const [prefillDob, setPrefillDob] = useState('');
  const [photoUrls, setPhotoUrls] = useState([]); // single photo via ImageUploader (max=1)

  const calcAge = (dobStr) => {
    if (!dobStr) return null;
    try {
      const d = new Date(dobStr);
      if (isNaN(d.getTime())) return null;
      const t = new Date();
      let age = t.getFullYear() - d.getFullYear();
      const m = t.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && t.getDate() < d.getDate())) age--;
      return age;
    } catch { return null; }
  };
  const isMinor = useMemo(() => {
    // Prefer server-provided is_minor only if DOB hasn't changed since prefill
    const dob = (basicInfo.date_of_birth || '').trim();
    if ((serverMinor !== null && serverMinor !== undefined) && dob === (prefillDob || '')) {
      return !!serverMinor;
    }
    const a = calcAge(dob);
    return a != null && a < 18;
  }, [basicInfo.date_of_birth, serverMinor, prefillDob]);
  const [guardian, setGuardian] = useState({ parent_consent: false, parent_name: '', parent_email: '' });

  // Validations: require all mandatory fields before allowing submit
  const isAddressComplete = !!(
    (address.country_code || '').trim() &&
    (address.postcode || '').trim() &&
    (address.house_number || '').trim() &&
    (address.street || '').trim() &&
    (address.city || '').trim()
  );
  const isFormValid = !!(
    (basicInfo.first_name || '').trim() &&
    (basicInfo.last_name || '').trim() &&
    (basicInfo.phone || '').trim() &&
    (basicInfo.date_of_birth || '').trim() &&
    isAddressComplete
  ) && (
    !isMinor || (guardian.parent_consent && (guardian.parent_name||'').trim() && (guardian.parent_email||'').trim())
  );

  // Prefill vanuit backend indien aanwezig
  useEffect(() => {
    (async () => {
      try {
        if (!isAuthenticated) return;
        const resp = await api.ownerProfile.get();
        if (resp && resp.profile) {
          setBasicInfo(prev => ({
            ...prev,
            first_name: (resp.user?.kinde_given_name || '').trim(),
            last_name: (resp.user?.kinde_family_name || '').trim(),
            phone: (resp.user?.phone || '').trim(),
            date_of_birth: resp.profile.date_of_birth || '',
          }));
          setPrefillDob(resp.profile.date_of_birth || '');
          if (typeof resp.profile.is_minor === 'boolean') {
            setServerMinor(resp.profile.is_minor);
          } else {
            setServerMinor(null);
          }
          setAddress(prev => ({
            ...prev,
            country_code: resp.profile.country_code || prev.country_code || 'NL',
            postcode: resp.profile.postcode || '',
            house_number: resp.profile.house_number || '',
            house_number_addition: resp.profile.house_number_addition || '',
            street: resp.profile.street || '',
            city: resp.profile.city || '',
            lat: resp.profile.lat ?? null,
            lon: resp.profile.lon ?? null,
            geocode_confidence: resp.profile.geocode_confidence ?? null,
            needs_review: resp.profile.needs_review ?? null,
          }));
          if (resp.profile.photo_url) {
            setPhotoUrls([resp.profile.photo_url]);
          }
          // Prefill guardian fields if present
          setGuardian(prev => ({
            ...prev,
            parent_consent: !!resp.profile.parent_consent,
            parent_name: resp.profile.parent_name || '',
            parent_email: resp.profile.parent_email || '',
          }));
        }
      } catch (e) {
        console.warn('Owner profile prefill failed', e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const nextStep = () => { if (currentStep < totalSteps) setCurrentStep(currentStep + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const toggleArrayItem = (array, item, setter) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const handleSubmit = async () => {
    // Basic validations
    const newErr = {};
    const phone = (basicInfo.phone || '').trim();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) newErr.phone = 'Voer een geldig telefoonnummer in (min. 10 cijfers).';
    if (!(basicInfo.date_of_birth||'').trim()) newErr.date_of_birth = 'Geboortedatum is verplicht.';
    if (isMinor) {
      if (!guardian.parent_consent) newErr.parent_consent = 'Ouder/voogd moet instemmen.';
      if (!(guardian.parent_name||'').trim()) newErr.parent_name = 'Naam ouder/voogd is verplicht.';
      const pe = (guardian.parent_email||'').trim();
      if (!/^([^@\s]+)@([^@\s]+)\.[^@\s]+$/.test(pe)) newErr.parent_email = 'Vul een geldig e‑mailadres in.';
    }
    setErrors(newErr);
    if (Object.keys(newErr).length > 0 || !isFormValid) {
      alert('Vul alle verplichte velden correct in.');
      return;
    }
    try {
      await api.ownerProfile.createOrUpdate({
        first_name: basicInfo.first_name,
        last_name: basicInfo.last_name,
        phone: basicInfo.phone,
        photo_url: (photoUrls[0] || null),
        // address fields
        country_code: address.country_code || 'NL',
        postcode: address.postcode,
        house_number: address.house_number,
        house_number_addition: address.house_number_addition || '',
        street: address.street,
        city: address.city,
        lat: address.lat,
        lon: address.lon,
        geocode_confidence: address.geocode_confidence,
        needs_review: address.needs_review,
        date_of_birth: basicInfo.date_of_birth,
        // guardian consent (if minor)
        parent_consent: isMinor ? !!guardian.parent_consent : null,
        parent_name: isMinor ? guardian.parent_name : null,
        parent_email: isMinor ? guardian.parent_email : null,
        visible_radius: 10,
      });
      navigate('/dashboard');
    } catch (e) {
      alert(`Opslaan mislukt: ${e.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🐎</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Eigenaar Profiel</h1>
            <p className="text-gray-600 mt-2">Vul je basisgegevens in en we gaan direct door naar je eerste paard.</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-600">Stap {currentStep} van {totalSteps}</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Stap 1: NAW */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Profielfoto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profielfoto</label>
                <ImageUploader value={photoUrls} onChange={setPhotoUrls} api={api} max={1} />
                <p className="mt-1 text-xs text-gray-500">Kies een duidelijke foto. Alleen jpg/png/webp; we comprimeren automatisch.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={basicInfo.first_name}
                    onChange={(e) => setBasicInfo({...basicInfo, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achternaam <span className="text-red-600">*</span></label>
                  <input
                    type="text"
                    value={basicInfo.last_name}
                    onChange={(e) => setBasicInfo({...basicInfo, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon <span className="text-red-600">*</span></label>
                <input
                  type="tel"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({...basicInfo, phone: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors.phone ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adres <span className="text-red-600">*</span></label>
                <AddressPicker value={address} onChange={setAddress} />
                {!isAddressComplete && (
                  <p className="mt-1 text-xs text-gray-500">Vul land, postcode, huisnummer, straat en plaats in.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geboortedatum <span className="text-red-600">*</span></label>
                <input
                  type="date"
                  value={basicInfo.date_of_birth}
                  onChange={(e) => setBasicInfo({...basicInfo, date_of_birth: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors.date_of_birth ? 'border-red-400' : 'border-gray-300'}`}
                />
                {errors.date_of_birth && <p className="mt-1 text-xs text-red-600">{errors.date_of_birth}</p>}
                <p className="mt-1 text-xs text-gray-500">Onder 18? Dan vragen we toestemming van een ouder/voogd.</p>
              </div>

              {isMinor && (
                <div className="space-y-4 p-4 border rounded-lg bg-orange-50 border-orange-200">
                  <h3 className="text-md font-semibold text-orange-800">Toestemming ouder/voogd (verplicht)</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={guardian.parent_consent} onChange={(e)=> setGuardian({...guardian, parent_consent: e.target.checked})} />
                    Ouder/voogd is op de hoogte en stemt in
                  </label>
                  {errors.parent_consent && <p className="text-xs text-red-600">{errors.parent_consent}</p>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Naam ouder/voogd <span className="text-red-600">*</span></label>
                      <input type="text" value={guardian.parent_name} onChange={(e)=> setGuardian({...guardian, parent_name: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors.parent_name ? 'border-red-400' : 'border-gray-300'}`} />
                      {errors.parent_name && <p className="mt-1 text-xs text-red-600">{errors.parent_name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">E‑mail ouder/voogd <span className="text-red-600">*</span></label>
                      <input type="email" value={guardian.parent_email} onChange={(e)=> setGuardian({...guardian, parent_email: e.target.value})} className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${errors.parent_email ? 'border-red-400' : 'border-gray-300'}`} />
                      {errors.parent_email && <p className="mt-1 text-xs text-red-600">{errors.parent_email}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-orange-700">We slaan deze bevestiging op om te voldoen aan de AVG. Verificatie per e‑mail volgt later.</p>
                </div>
              )}
            </div>
          )}

          {/* Geen stap 2: opslaan stuurt direct door */}

          {/* Step 3: Verwachtingen */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">3</span>
                Verwachtingen
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maandelijkse bijdrage (€)</label>
                <input
                  type="number"
                  value={expectations.cost_sharing_euro}
                  onChange={(e) => setExpectations({...expectations, cost_sharing_euro: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verwachte taken</label>
                <div className="grid grid-cols-2 gap-2">
                  {expectedTasks.map(task => (
                    <button
                      key={task}
                      type="button"
                      onClick={() => toggleArrayItem(expectations.tasks_expected, task, (items) => setExpectations({...expectations, tasks_expected: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        expectations.tasks_expected.includes(task)
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {task.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gewenste rijfrequentie</label>
                <select
                  value={expectations.riding_frequency}
                  onChange={(e) => setExpectations({...expectations, riding_frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Selecteer...</option>
                  {ridingFrequencies.map(freq => (
                    <option key={freq} value={freq}>{freq.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Begeleidingsniveau</label>
                <select
                  value={expectations.supervision_level}
                  onChange={(e) => setExpectations({...expectations, supervision_level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="">Selecteer...</option>
                  {supervisionLevels.map(level => (
                    <option key={level} value={level}>{level.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Placeholder voor andere stappen */}
          {currentStep > 3 && currentStep < 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">{currentStep}</span>
                Stap {currentStep} - Coming Soon
              </h2>
              <p className="text-gray-600">Deze stap wordt binnenkort toegevoegd...</p>
            </div>
          )}

          {/* Step 6: Voltooien */}
          {currentStep === 6 && (
            <div className="space-y-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900">Profiel Voltooien</h2>
              <p className="text-gray-600">Je bent bijna klaar! Controleer je gegevens en voltooi je profiel.</p>
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300"
              >
                Profiel Voltooien
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Vorige
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${isFormValid ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              Opslaan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerOnboarding;
