import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

const OwnerOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useKindeAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  // Basis informatie
  const [basicInfo, setBasicInfo] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    postcode: '',
    stable_name: '',
    stable_address: ''
  });

  // Paard informatie
  const [horseInfo, setHorseInfo] = useState({
    name: '',
    age: '',
    breed: '',
    gender: '',
    height: '',
    color: '',
    temperament: [],
    experience_level: '',
    disciplines: [],
    health_notes: ''
  });

  // Faciliteiten
  const [facilities, setFacilities] = useState({
    indoor_arena: false,
    outdoor_arena: false,
    trails: false,
    jumping_course: false,
    round_pen: false,
    wash_area: false,
    tack_room: false,
    parking: false,
    other_facilities: []
  });

  // Verwachtingen
  const [expectations, setExpectations] = useState({
    cost_sharing_euro: 200,
    tasks_expected: [],
    riding_frequency: '',
    supervision_level: '',
    trial_period_weeks: 4
  });

  // Beschikbaarheid
  const [availability, setAvailability] = useState({
    available_days: [],
    available_times: [],
    start_date: '',
    arrangement_duration: 'ongoing'
  });

  // Media
  const [media, setMedia] = useState({
    horse_photos: [],
    stable_photos: [],
    video_intro_url: ''
  });

  const nextStep = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const toggleArrayItem = (array, item, setter) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  const handleSubmit = async () => {
    // TODO: Implement API call to save owner profile
    console.log('Saving owner profile...');
    navigate('/dashboard');
  };

  const weekDays = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
  const timeBlocks = ['ochtend', 'middag', 'avond'];
  const temperaments = ['rustig', 'energiek', 'speels', 'geduldig', 'gevoelig', 'dominant'];
  const disciplines = ['dressuur', 'springen', 'eventing', 'western', 'buitenritten', 'natural_horsemanship'];
  const expectedTasks = ['voeren', 'poetsen', 'uitrijden', 'longeren', 'stalwerk', 'transport', 'hoefverzorging'];
  const supervisionLevels = ['zelfstandig', 'minimale_begeleiding', 'regelmatige_begeleiding', 'intensieve_begeleiding'];
  const ridingFrequencies = ['1x_per_week', '2x_per_week', '3x_per_week', 'dagelijks', 'flexibel'];

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
            <p className="text-gray-600 mt-2">Vertel ons over je paard en stal voor de beste matches</p>
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

          {/* Step 1: Basis Informatie */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
                Basis Informatie
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
                <input
                  type="text"
                  value={basicInfo.postcode}
                  onChange={(e) => setBasicInfo({...basicInfo, postcode: e.target.value})}
                  placeholder="1234AB"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stal naam</label>
                <input
                  type="text"
                  value={basicInfo.stable_name}
                  onChange={(e) => setBasicInfo({...basicInfo, stable_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stal adres</label>
                <textarea
                  value={basicInfo.stable_address}
                  onChange={(e) => setBasicInfo({...basicInfo, stable_address: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 2: Paard Informatie */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
                Paard Informatie
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Naam</label>
                  <input
                    type="text"
                    value={horseInfo.name}
                    onChange={(e) => setHorseInfo({...horseInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leeftijd</label>
                  <input
                    type="number"
                    value={horseInfo.age}
                    onChange={(e) => setHorseInfo({...horseInfo, age: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ras</label>
                  <input
                    type="text"
                    value={horseInfo.breed}
                    onChange={(e) => setHorseInfo({...horseInfo, breed: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Geslacht</label>
                  <select
                    value={horseInfo.gender}
                    onChange={(e) => setHorseInfo({...horseInfo, gender: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Selecteer...</option>
                    <option value="merrie">Merrie</option>
                    <option value="hengst">Hengst</option>
                    <option value="ruin">Ruin</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stokmaat (cm)</label>
                  <input
                    type="number"
                    value={horseInfo.height}
                    onChange={(e) => setHorseInfo({...horseInfo, height: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kleur</label>
                  <input
                    type="text"
                    value={horseInfo.color}
                    onChange={(e) => setHorseInfo({...horseInfo, color: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Karakter</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {temperaments.map(temp => (
                    <button
                      key={temp}
                      type="button"
                      onClick={() => toggleArrayItem(horseInfo.temperament, temp, (items) => setHorseInfo({...horseInfo, temperament: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        horseInfo.temperament.includes(temp)
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {temp}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Disciplines</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {disciplines.map(discipline => (
                    <button
                      key={discipline}
                      type="button"
                      onClick={() => toggleArrayItem(horseInfo.disciplines, discipline, (items) => setHorseInfo({...horseInfo, disciplines: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        horseInfo.disciplines.includes(discipline)
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {discipline.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

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
            
            {currentStep < totalSteps ? (
              <button
                onClick={nextStep}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Volgende
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-colors"
              >
                Voltooien
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerOnboarding;
