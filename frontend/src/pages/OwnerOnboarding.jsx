import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI } from '../utils/api';
import AddressPicker from '../components/AddressPicker';

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
    try {
      await api.ownerProfile.createOrUpdate({
        first_name: basicInfo.first_name,
        last_name: basicInfo.last_name,
        phone: basicInfo.phone,
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
        visible_radius: 10,
      });
      navigate('/owner/horses/new');
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
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
                Basisgegevens (NAW)
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam</label>
                  <input
                    type="text"
                    value={basicInfo.first_name}
                    onChange={(e) => setBasicInfo({...basicInfo, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achternaam</label>
                  <input
                    type="text"
                    value={basicInfo.last_name}
                    onChange={(e) => setBasicInfo({...basicInfo, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
                <input
                  type="tel"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({...basicInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                <AddressPicker value={address} onChange={setAddress} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geboortedatum (optioneel)</label>
                <input
                  type="date"
                  value={basicInfo.date_of_birth}
                  onChange={(e) => setBasicInfo({...basicInfo, date_of_birth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
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
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-colors"
            >
              Opslaan & Paard toevoegen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerOnboarding;
