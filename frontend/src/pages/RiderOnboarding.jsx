import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

const RiderOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useKindeAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 8;

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  // Basis informatie
  const [basicInfo, setBasicInfo] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    postcode: '',
    max_travel_distance_km: 25,
    transport_options: []
  });

  // Beschikbaarheid
  const [availability, setAvailability] = useState({
    available_days: [],
    available_time_blocks: [],
    session_duration_min: 60,
    session_duration_max: 120,
    start_date: '',
    arrangement_duration: 'ongoing'
  });

  // Budget
  const [budget, setBudget] = useState({
    budget_min_euro: 150,
    budget_max_euro: 250,
    budget_type: 'monthly'
  });

  // Ervaring
  const [experience, setExperience] = useState({
    experience_years: 0,
    certification_level: '',
    comfort_levels: {
      traffic: false,
      outdoor_solo: false,
      nervous_horses: false,
      young_horses: false,
      jumping_height: 0
    }
  });

  // Doelen
  const [goals, setGoals] = useState({
    riding_goals: [],
    discipline_preferences: [],
    personality_style: []
  });

  // Taken
  const [tasks, setTasks] = useState({
    willing_tasks: [],
    task_frequency: {}
  });

  // Voorkeuren
  const [preferences, setPreferences] = useState({
    material_preferences: {
      bitless_ok: false,
      spurs: false,
      auxiliary_reins: false,
      own_helmet: true
    },
    health_restrictions: [],
    insurance_coverage: false,
    no_gos: []
  });

  // Media
  const [media, setMedia] = useState({
    photos: [],
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
    // TODO: Implement API call to save rider profile
    console.log('Saving rider profile...');
    navigate('/dashboard');
  };

  const transportOptions = ['auto', 'openbaar_vervoer', 'fiets', 'te_voet'];
  const weekDays = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
  const timeBlocks = ['ochtend', 'middag', 'avond'];
  const ridingGoals = ['recreatie', 'training', 'wedstrijden', 'therapie', 'sociale_contacten'];
  const disciplines = ['dressuur', 'springen', 'eventing', 'western', 'buitenritten', 'natural_horsemanship'];
  const availableTasks = ['uitrijden', 'voeren', 'poetsen', 'longeren', 'stalwerk', 'transport'];
  const healthRestrictions = ['hoogtevrees', 'rugproblemen', 'knieproblemen', 'allergieën', 'medicatie'];
  const noGos = ['drukke_stallen', 'avond_afspraken', 'weekenden', 'slecht_weer', 'grote_groepen'];
  const personalityStyles = ['rustig', 'energiek', 'geduldig', 'assertief', 'flexibel', 'gestructureerd'];
  const certificationLevels = ['beginner', 'gevorderd_beginner', 'intermediate', 'gevorderd', 'expert'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏇</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Ruiter Profiel</h1>
            <p className="text-gray-600 mt-2">Vertel ons alles over jezelf voor de beste matches</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">Stap {currentStep} van {totalSteps}</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Step 1: Basis Informatie */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
                Basis Informatie
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam</label>
                  <input
                    type="text"
                    value={basicInfo.first_name}
                    onChange={(e) => setBasicInfo({...basicInfo, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achternaam</label>
                  <input
                    type="text"
                    value={basicInfo.last_name}
                    onChange={(e) => setBasicInfo({...basicInfo, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefoon</label>
                <input
                  type="tel"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({...basicInfo, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Geboortedatum</label>
                <input
                  type="date"
                  value={basicInfo.date_of_birth}
                  onChange={(e) => setBasicInfo({...basicInfo, date_of_birth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Postcode</label>
                  <input
                    type="text"
                    value={basicInfo.postcode}
                    onChange={(e) => setBasicInfo({...basicInfo, postcode: e.target.value})}
                    placeholder="1234AB"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max reisafstand (km)</label>
                  <input
                    type="number"
                    value={basicInfo.max_travel_distance_km}
                    onChange={(e) => setBasicInfo({...basicInfo, max_travel_distance_km: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vervoer opties</label>
                <div className="grid grid-cols-2 gap-2">
                  {transportOptions.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArrayItem(basicInfo.transport_options, option, (items) => setBasicInfo({...basicInfo, transport_options: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        basicInfo.transport_options.includes(option)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Beschikbaarheid */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
                Beschikbaarheid
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschikbare dagen</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {weekDays.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleArrayItem(availability.available_days, day, (items) => setAvailability({...availability, available_days: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        availability.available_days.includes(day)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {day.slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tijdsblokken</label>
                <div className="grid grid-cols-3 gap-2">
                  {timeBlocks.map(block => (
                    <button
                      key={block}
                      type="button"
                      onClick={() => toggleArrayItem(availability.available_time_blocks, block, (items) => setAvailability({...availability, available_time_blocks: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        availability.available_time_blocks.includes(block)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {block}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min sessie duur (min)</label>
                  <input
                    type="number"
                    value={availability.session_duration_min}
                    onChange={(e) => setAvailability({...availability, session_duration_min: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max sessie duur (min)</label>
                  <input
                    type="number"
                    value={availability.session_duration_max}
                    onChange={(e) => setAvailability({...availability, session_duration_max: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Placeholder voor andere stappen */}
          {currentStep > 2 && currentStep < 8 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">{currentStep}</span>
                Stap {currentStep} - Coming Soon
              </h2>
              <p className="text-gray-600">Deze stap wordt binnenkort toegevoegd...</p>
            </div>
          )}

          {/* Step 8: Voltooien */}
          {currentStep === 8 && (
            <div className="space-y-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900">Profiel Voltooien</h2>
              <p className="text-gray-600">Je bent bijna klaar! Controleer je gegevens en voltooi je profiel.</p>
              <button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300"
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Volgende
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
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

export default RiderOnboarding;
