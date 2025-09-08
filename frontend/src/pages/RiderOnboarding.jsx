import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI, transformProfileDataForAPI, transformProfileDataFromAPI } from '../utils/api';
import { calculateRiderProfileProgress } from '../utils/riderProfileProgress';

const RiderOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, getToken } = useKindeAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
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
    task_frequency: ''
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

  // Bereken progress percentage
  const profileData = {
    basicInfo,
    availability,
    budget,
    experience,
    goals,
    tasks,
    preferences,
    media
  };
  const progressPercentage = calculateRiderProfileProgress(profileData);

  // Auto-save functie
  const autoSave = async () => {
    try {
      const api = createAPI(getToken);
      const apiData = transformProfileDataForAPI(profileData);
      await api.riderProfile.createOrUpdate(apiData);
      console.log('Profile auto-saved successfully');
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  };

  // Load existing profile data on component mount
  useEffect(() => {
    const loadExistingProfile = async () => {
      try {
        const api = createAPI(getToken);
        const apiData = await api.riderProfile.get();
        
        console.log('🔍 RAW API DATA:', JSON.stringify(apiData, null, 2));
        
        const transformedData = transformProfileDataFromAPI(apiData);
        
        console.log('🔄 TRANSFORMED DATA:', JSON.stringify(transformedData, null, 2));
        
        // Update state with existing data
        setBasicInfo(transformedData.basicInfo);
        setAvailability(transformedData.availability);
        setBudget(transformedData.budget);
        setExperience(transformedData.experience);
        setGoals(transformedData.goals);
        setTasks(transformedData.tasks);
        setPreferences(transformedData.preferences);
        setMedia(transformedData.media);
        
        console.log('✅ Profile state updated successfully');
        console.log('📋 Current basicInfo state:', transformedData.basicInfo);
        console.log('🎯 Current goals state:', transformedData.goals);
        
      } catch (error) {
        console.log('❌ Error loading profile:', error);
        console.log('Starting fresh profile');
      } finally {
        setLoading(false);
      }
    };

    loadExistingProfile();
  }, [getToken]);

  // Prefill naam/telefoon vanuit Kinde (auth/me) zonder bestaande invoer te overschrijven
  useEffect(() => {
    const prefillFromKinde = async () => {
      try {
        const api = createAPI(getToken);
        const me = await api.user.getMe();
        const fullName = (me?.name || '').trim();
        let first = '';
        let last = '';
        if (fullName) {
          const parts = fullName.split(' ');
          first = parts[0] || '';
          last = parts.length > 1 ? parts.slice(1).join(' ') : '';
        }

        setBasicInfo(prev => ({
          ...prev,
          first_name: prev.first_name || first,
          last_name: prev.last_name || last,
          phone: prev.phone || (me?.phone || ''),
        }));
        console.log('👤 Prefilled from Kinde:', { first, last, phone: me?.phone });
      } catch (e) {
        console.log('Skipping Kinde prefill (not authenticated or failed):', e?.message || e);
      }
    };

    prefillFromKinde();
  }, [getToken]);

  // Auto-save elke 30 seconden als er data is
  useEffect(() => {
    if (loading) return; // Don't auto-save while loading
    
    const interval = setInterval(() => {
      if (progressPercentage > 10) { // Alleen auto-save als er substantiële data is
        autoSave();
      }
    }, 30000); // 30 seconden

    return () => clearInterval(interval);
  }, [profileData, progressPercentage, loading]);

  const handleSubmit = async () => {
    try {
      const api = createAPI(getToken);
      const apiData = transformProfileDataForAPI(profileData);
      await api.riderProfile.createOrUpdate(apiData);
      console.log('Rider profile saved successfully!');
      navigate('/rider-profile');
    } catch (error) {
      console.error('Error saving rider profile:', error);
      alert('Er ging iets mis bij het opslaan. Probeer het opnieuw.');
    }
  };

  const handleSaveDraft = async () => {
    try {
      const api = createAPI(getToken);
      const apiData = transformProfileDataForAPI(profileData);
      await api.riderProfile.createOrUpdate(apiData);
      alert('Concept opgeslagen! Je kunt later verder gaan.');
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Er ging iets mis bij het opslaan van het concept.');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Profiel gegevens laden...</p>
        </div>
      </div>
    );
  }

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
              <span className="text-sm text-gray-500">{progressPercentage}% compleet</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
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

          {/* Step 3: Budget */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">3</span>
                Budget
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum budget (€/maand)</label>
                  <input
                    type="number"
                    value={budget.budget_min_euro}
                    onChange={(e) => setBudget({...budget, budget_min_euro: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum budget (€/maand)</label>
                  <input
                    type="number"
                    value={budget.budget_max_euro}
                    onChange={(e) => setBudget({...budget, budget_max_euro: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget type</label>
                <select
                  value={budget.budget_type}
                  onChange={(e) => setBudget({...budget, budget_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="monthly">Per maand</option>
                  <option value="weekly">Per week</option>
                  <option value="per_session">Per sessie</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 4: Ervaring */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">4</span>
                Ervaring
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jaren ervaring</label>
                <input
                  type="number"
                  value={experience.experience_years}
                  onChange={(e) => setExperience({...experience, experience_years: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificering niveau</label>
                <select
                  value={experience.certification_level}
                  onChange={(e) => setExperience({...experience, certification_level: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecteer niveau...</option>
                  {certificationLevels.map(level => (
                    <option key={level} value={level}>{level.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Comfort levels</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={experience.comfort_levels.traffic}
                      onChange={(e) => setExperience({
                        ...experience, 
                        comfort_levels: {...experience.comfort_levels, traffic: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Comfortabel in verkeer</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={experience.comfort_levels.outdoor_solo}
                      onChange={(e) => setExperience({
                        ...experience, 
                        comfort_levels: {...experience.comfort_levels, outdoor_solo: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Alleen buitenritten</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={experience.comfort_levels.nervous_horses}
                      onChange={(e) => setExperience({
                        ...experience, 
                        comfort_levels: {...experience.comfort_levels, nervous_horses: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Nerveuze paarden</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={experience.comfort_levels.young_horses}
                      onChange={(e) => setExperience({
                        ...experience, 
                        comfort_levels: {...experience.comfort_levels, young_horses: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Jonge paarden</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max spronghoogte (cm)</label>
                <input
                  type="number"
                  value={experience.comfort_levels.jumping_height}
                  onChange={(e) => setExperience({
                    ...experience, 
                    comfort_levels: {...experience.comfort_levels, jumping_height: parseInt(e.target.value)}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Step 5: Doelen */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">5</span>
                Doelen
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rijdoelen</label>
                <div className="grid grid-cols-2 gap-2">
                  {ridingGoals.map(goal => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleArrayItem(goals.riding_goals, goal, (items) => setGoals({...goals, riding_goals: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        goals.riding_goals.includes(goal)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {goal.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Discipline voorkeuren</label>
                <div className="grid grid-cols-2 gap-2">
                  {disciplines.map(discipline => (
                    <button
                      key={discipline}
                      type="button"
                      onClick={() => toggleArrayItem(goals.discipline_preferences, discipline, (items) => setGoals({...goals, discipline_preferences: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        goals.discipline_preferences.includes(discipline)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {discipline.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Persoonlijkheidsstijl</label>
                <div className="grid grid-cols-2 gap-2">
                  {personalityStyles.map(style => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleArrayItem(goals.personality_style, style, (items) => setGoals({...goals, personality_style: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        goals.personality_style.includes(style)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Taken */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">6</span>
                Taken
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bereid om te helpen met</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableTasks.map(task => (
                    <button
                      key={task}
                      type="button"
                      onClick={() => toggleArrayItem(tasks.willing_tasks, task, (items) => setTasks({...tasks, willing_tasks: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        tasks.willing_tasks.includes(task)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {task.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taak frequentie</label>
                <select
                  value={tasks.task_frequency}
                  onChange={(e) => setTasks({...tasks, task_frequency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecteer frequentie...</option>
                  <option value="daily">Dagelijks</option>
                  <option value="weekly">Wekelijks</option>
                  <option value="monthly">Maandelijks</option>
                  <option value="as_needed">Indien nodig</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 7: Voorkeuren */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">7</span>
                Voorkeuren
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Materiaal voorkeuren</label>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.material_preferences.bitless_ok}
                      onChange={(e) => setPreferences({
                        ...preferences, 
                        material_preferences: {...preferences.material_preferences, bitless_ok: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Bitloos rijden OK</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.material_preferences.spurs}
                      onChange={(e) => setPreferences({
                        ...preferences, 
                        material_preferences: {...preferences.material_preferences, spurs: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Sporen gebruiken</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.material_preferences.auxiliary_reins}
                      onChange={(e) => setPreferences({
                        ...preferences, 
                        material_preferences: {...preferences.material_preferences, auxiliary_reins: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Hulpteugels OK</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={preferences.material_preferences.own_helmet}
                      onChange={(e) => setPreferences({
                        ...preferences, 
                        material_preferences: {...preferences.material_preferences, own_helmet: e.target.checked}
                      })}
                      className="mr-2"
                    />
                    <span className="text-sm">Eigen cap</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gezondheids beperkingen</label>
                <div className="grid grid-cols-2 gap-2">
                  {healthRestrictions.map(restriction => (
                    <button
                      key={restriction}
                      type="button"
                      onClick={() => toggleArrayItem(preferences.health_restrictions, restriction, (items) => setPreferences({...preferences, health_restrictions: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        preferences.health_restrictions.includes(restriction)
                          ? 'bg-blue-100 border-blue-500 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {restriction.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.insurance_coverage}
                    onChange={(e) => setPreferences({...preferences, insurance_coverage: e.target.checked})}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Ik heb een verzekering</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">No-go's</label>
                <div className="grid grid-cols-2 gap-2">
                  {noGos.map(nogo => (
                    <button
                      key={nogo}
                      type="button"
                      onClick={() => toggleArrayItem(preferences.no_gos, nogo, (items) => setPreferences({...preferences, no_gos: items}))}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        preferences.no_gos.includes(nogo)
                          ? 'bg-red-100 border-red-500 text-red-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {nogo.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 8: Media & Voltooien */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">8</span>
                Foto's & Video (Optioneel)
              </h2>

              <div className="space-y-6">
                {/* Foto Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profiel foto's
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">📷</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Sleep foto's hierheen of klik om te uploaden
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG tot 5MB (max 5 foto's)
                        </p>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          if (files.length > 5) {
                            alert('Maximaal 5 foto\'s toegestaan');
                            return;
                          }
                          // Voor nu slaan we alleen de bestandsnamen op
                          const fileNames = files.map(file => file.name);
                          setMedia({...media, photos: fileNames});
                        }}
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                      >
                        Foto's Selecteren
                      </label>
                    </div>
                  </div>
                  
                  {media.photos.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Geselecteerde foto's:</p>
                      <div className="flex flex-wrap gap-2">
                        {media.photos.map((photo, index) => (
                          <div key={index} className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-sm">
                            <span className="text-blue-700">{photo}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newPhotos = media.photos.filter((_, i) => i !== index);
                                setMedia({...media, photos: newPhotos});
                              }}
                              className="ml-2 text-blue-500 hover:text-blue-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Intro URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video introductie (YouTube/Vimeo link)
                  </label>
                  <input
                    type="url"
                    value={media.video_intro_url}
                    onChange={(e) => setMedia({...media, video_intro_url: e.target.value})}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optioneel: Deel een korte video waarin je jezelf voorstelt
                  </p>
                </div>

                {/* Profiel Samenvatting */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Profiel Samenvatting</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• Naam: {basicInfo.first_name} {basicInfo.last_name}</p>
                    <p>• Postcode: {basicInfo.postcode}</p>
                    <p>• Budget: €{budget.budget_min_euro} - €{budget.budget_max_euro}</p>
                    <p>• Ervaring: {experience.experience_years} jaar</p>
                    <p>• Beschikbare dagen: {availability.available_days.length} geselecteerd</p>
                    <p>• Rijdoelen: {goals.riding_goals.length} geselecteerd</p>
                    <p>• Bereid te helpen met: {tasks.willing_tasks.length} taken</p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="text-center pt-4">
                  <div className="space-y-3">
                    <button
                      onClick={handleSubmit}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300"
                    >
                      Profiel Voltooien & Opslaan
                    </button>
                    <button
                      onClick={handleSaveDraft}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-full transition-all duration-300"
                    >
                      Concept Opslaan & Later Verder
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Auto-save elke 30 seconden • Je kunt je profiel later altijd aanpassen
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            {/* Concept Opslaan knop voor alle stappen behalve de laatste */}
            {currentStep < totalSteps && (
              <div className="text-center mb-4">
                <button
                  onClick={handleSaveDraft}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-full transition-all duration-300"
                >
                  💾 Concept Opslaan & Later Verder
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-save elke 30 seconden actief
                </p>
              </div>
            )}
            
            <div className="flex justify-between">
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
                onClick={nextStep}
                disabled={currentStep === totalSteps}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  currentStep === totalSteps
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Volgende
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiderOnboarding;
