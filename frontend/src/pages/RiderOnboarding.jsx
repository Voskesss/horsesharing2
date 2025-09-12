import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI, transformProfileDataForAPI, transformProfileDataFromAPI } from '../utils/api';
import { calculateMatchingScore, publishableReady } from '../utils/riderProfileProgress';
import ImageUploader from '../components/ImageUploader';
import AddressPicker from '../components/AddressPicker';
import VideosUploader from '../components/VideosUploader';
import DatePicker from 'react-datepicker';
import { format as formatDate } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

const RiderOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, getToken } = useKindeAuth();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  // Simple toast state
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const totalSteps = 10;

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
    transport_options: [],
    parent_consent: null,
    parent_contact_name: '',
    parent_contact_email: '',
    rider_height_cm: '',
    rider_weight_kg: '',
    rider_bio: '',
  });

  // Adres (zoals bij owner)
  const [address, setAddress] = useState({ country_code: 'NL', postcode: '', house_number: '', house_number_addition: '', street: '', city: '', lat: null, lon: null, geocode_confidence: null, needs_review: null });

  // Beschikbaarheid
  const [availability, setAvailability] = useState({
    available_days: [],
    available_time_blocks: [],
    session_duration_min: 60,
    session_duration_max: 120,
    start_date: '',
    arrangement_duration: 'ongoing',
    min_days_per_week: 1
  });

  // Budget
  const [budget, setBudget] = useState({
    budget_min_euro: '',
    budget_max_euro: ''
  });

  // Ervaring
  const [experience, setExperience] = useState({
    experience_years: 0,
    certification_level: '', // legacy, niet meer gebruikt maar behouden voor compat
    certifications: [],
    comfort_levels: {
      traffic: false,
      outdoor_solo: false,
      nervous_horses: false,
      young_horses: false,
      jumping_height: 0
    },
    // Activiteiten
    activity_mode: null, // 'care_only' | 'ride_or_care' | 'ride_only'
    activity_preferences: [], // ['verzorging','grondwerk','longeren','rijden','mennen']
    mennen_experience: null // 'beginner' | 'gevorderd' | 'ervaren'
  });

  // Doelen
  const [goals, setGoals] = useState({
    riding_goals: [],
    discipline_preferences: [],
    personality_style: []
  });

  // Vaardigheden
  const [skills, setSkills] = useState({
    general_skills: []
  });

  // Lease voorkeuren
  const [lease, setLease] = useState({
    wants_lease: false,
    budget_max_pm_lease: undefined,
    location_preference: null, // ['on_site','off_site'] of null (=maakt niet uit)
    scope_preference: null, // ['full','part'] of null (=maakt niet uit)
    duration: { type: null, months: null }, // type: 'doorlopend' | 'vaste_periode' | null
    eigen_stalplek_beschikbaar: null, // true/false/null
    kan_transporteren: null, // true/false/null
    required_inclusions: null, // array of null
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
    no_gos: [],
    riding_styles: [],
    desired_horse: {
      type: [], // ['pony','paard']
      schofthoogte_cm_min: '',
      schofthoogte_cm_max: '',
      geslacht: [], // ['merrie','ruin','hengst']
      leeftijd_min: '',
      leeftijd_max: '',
      ras: '',
      stamboek: '',
      disciplines_paard: [],
      handgevoeligheid: '', // 'zachte_hand'|'neutraal'|'sterke_hand'
      temperament: [],
      vergevingsgezindheid: '', // 'laag'|'gemiddeld'|'hoog'
      ervaring_rijder_nodig: '', // 'beginner_ok'|'licht_gevorderd'|'gevorderd'|'zeer_ervaren'
      vachtkleuren: [],
      niet_belangrijk_vachtkleur: false,
      size_categories: [], // ['shetlander','pony_a','pony_b','pony_c','pony_d','pony_e','paard']
    }
  });

  // Gezondheid gating en vrije tekst (afgeleid van preferences)
  const [hasHealthRestrictions, setHasHealthRestrictions] = useState(false);
  const [healthOther, setHealthOther] = useState('');

  // Initieer gating en 'anders' na load van profiel
  useEffect(() => {
    const hr = preferences.health_restrictions || [];
    setHasHealthRestrictions(hr.length > 0);
    const otherItem = hr.find(i => typeof i === 'string' && i.startsWith('anders:'));
    setHealthOther(otherItem ? otherItem.replace(/^anders:\s?/, '') : '');
  }, [preferences.health_restrictions]);

  // Media
  const [media, setMedia] = useState({
    photos: [],
    videos: [],
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

  // Minimale publiceerbaar-criteria per tab (voor badges)
  const age = calculateAge(basicInfo.date_of_birth);
  const step1MinOk = (() => {
    const hasFirst = !!(basicInfo.first_name && basicInfo.first_name.trim());
    const hasLast = !!(basicInfo.last_name && basicInfo.last_name.trim());
    const hasAddress = !!(address && address.postcode && address.house_number);
    const hasAvatar = Array.isArray(media.photos) && media.photos.length >= 1;
    const heightOk = Number(basicInfo.rider_height_cm) > 0;
    const weightOk = Number(basicInfo.rider_weight_kg) > 0;
    const hasDob = age !== null;
    let minorOk = true;
    if (hasDob && age <= 16) {
      const consent = basicInfo.parent_consent;
      const contactsOk = consent === true ? (
        !!(basicInfo.parent_contact_name && basicInfo.parent_contact_name.trim()) &&
        !!(basicInfo.parent_contact_email && basicInfo.parent_contact_email.trim())
      ) : true;
      minorOk = (consent === true || consent === false) && contactsOk;
    }
    return hasFirst && hasLast && hasAddress && hasAvatar && heightOk && weightOk && hasDob && minorOk;
  })();

  const step2MinOk = (() => {
    const schedule = availability.available_schedule || {};
    const hasSchedule = !!schedule && Object.values(schedule).some(arr => Array.isArray(arr) && arr.length > 0);
    return hasSchedule || (Array.isArray(availability.available_days) && availability.available_days.length>0 && Array.isArray(availability.available_time_blocks) && availability.available_time_blocks.length>0);
  })();

  const step3MinOk = (() => {
    const minB = Number(budget.budget_min_euro);
    const maxB = Number(budget.budget_max_euro);
    return (minB > 0 && maxB > 0 && minB <= maxB);
  })();

  const step4MinOk = (() => {
    const dh = preferences.desired_horse || {};
    const hasType = Array.isArray(dh.type) && dh.type.length > 0;
    const hasHeight = (dh.schofthoogte_cm_min !== '' && dh.schofthoogte_cm_min != null) || (dh.schofthoogte_cm_max !== '' && dh.schofthoogte_cm_max != null);
    const hasSizeCats = Array.isArray(dh.size_categories) && dh.size_categories.length > 0;
    return hasType && (hasHeight || hasSizeCats);
  })();

  const step5MinOk = (() => {
    const mode = experience.activity_mode || '';
    const rideInScope = mode === 'ride_only' || mode === 'ride_or_care';
    if (!rideInScope) return true;
    return (Array.isArray(goals.riding_goals) && goals.riding_goals.length>0) || (Array.isArray(goals.discipline_preferences) && goals.discipline_preferences.length>0);
  })();

  const step6MinOk = (() => {
    return (Array.isArray(tasks.willing_tasks) && tasks.willing_tasks.length>0) || !!tasks.task_frequency;
  })();

  const step7MinOk = (() => {
    const yearsOk = Number(experience.experience_years) > 0;
    const modeOk = !!experience.activity_mode;
    const prefsOk = Array.isArray(experience.activity_preferences) && experience.activity_preferences.length > 0;
    const isDriveOnly = experience.activity_mode === 'drive_only';
    const mennenOk = isDriveOnly ? !!experience.mennen_experience : true;
    return mennenOk && (yearsOk || modeOk || prefsOk);
  })();

  // Bereken progress percentage
  const profileData = {
    basicInfo,
    address,
    availability,
    budget,
    experience,
    goals,
    skills,
    lease,
    tasks,
    preferences,
    media
  };
  const matchingScore = calculateMatchingScore(profileData);
  const isPublishable = publishableReady(profileData);

  // Houd basicInfo.* in sync met address.* voor compat en payload-fallbacks
  useEffect(() => {
    setBasicInfo(prev => ({
      ...prev,
      postcode: address.postcode || prev.postcode || '',
      house_number: address.house_number || prev.house_number || '',
      street: address.street || prev.street || '',
      city: address.city || prev.city || '',
    }));
  }, [address.postcode, address.house_number, address.street, address.city]);

  // Helper: bereken leeftijd op basis van geboortedatum (function declaratie voor hoisting)
  function calculateAge(dobStr) {
    if (!dobStr) return null;
    try {
      const dob = new Date(dobStr);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age;
    } catch {
      return null;
    }
  }

  // Auto-save functie
  const autoSave = async () => {
    try {
      const api = createAPI(getToken);
      const apiData = transformProfileDataForAPI(profileData);
      console.log('🛰️ POST /rider-profile payload address:', {
        street: apiData.street,
        city: apiData.city,
        postcode: apiData.postcode,
        house_number: apiData.house_number,
      });
      await api.riderProfile.createOrUpdate(apiData);
      console.log('Profile auto-saved successfully');
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  };

  // Smart autosave state/refs
  const isDirtyRef = useRef(false);
  const lastEditAtRef = useRef(Date.now());
  const idleSavesRef = useRef(0);
  const pausedRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const MAX_IDLE_SAVES = 4; // ~2 min bij 30s interval
  const AUTOSAVE_INTERVAL_MS = 30000;
  const DEBOUNCE_MS = 1500;

  // Load existing profile data on component mount
  useEffect(() => {
    // Lees ?step= uit de URL bij load en wanneer de URL verandert
    try {
      const sp = new URLSearchParams(location.search || '');
      const s = parseInt(sp.get('step') || '');
      if (!Number.isNaN(s) && s >= 1 && s <= totalSteps) {
        setCurrentStep(s);
      }
    } catch {}

    const loadExistingProfile = async () => {
      try {
        const api = createAPI(getToken);
        let hasServerProfile = true;
        let apiData = null;
        try {
          apiData = await api.riderProfile.get();
        } catch (e) {
          const msg = (e && e.message ? String(e.message).toLowerCase() : '');
          if (msg.includes('not found') || msg.includes('rider profile not found') || msg.includes('404')) {
            hasServerProfile = false;
          } else {
            throw e;
          }
        }
        
        if (process.env.NODE_ENV !== 'production') {
          // console.log('🔍 RAW API DATA:', JSON.stringify(apiData, null, 2)); // noisy
          console.log('📥 GET /rider-profile min_days_per_week =', apiData.min_days_per_week);
        }
        
        const transformedData = hasServerProfile && apiData ? transformProfileDataFromAPI(apiData) : transformProfileDataFromAPI({});
        
        // console.log('🔄 TRANSFORMED DATA:', JSON.stringify(transformedData, null, 2)); // noisy
        
        // Update state with existing data
        setBasicInfo(transformedData.basicInfo);
        if (transformedData.address) setAddress(transformedData.address);
        setAvailability(transformedData.availability);
        setBudget(transformedData.budget);
        setExperience(transformedData.experience);
        setGoals(transformedData.goals);
        setSkills(transformedData.skills || { general_skills: [] });
        setTasks(transformedData.tasks);
        setLease(transformedData.lease || { wants_lease: false, budget_max_pm_lease: undefined });
        setPreferences(transformedData.preferences);
        setMedia(transformedData.media);
        // Prefill alleen als er géén ruiterprofiel bestaat (404)
        if (!hasServerProfile) {
          try {
            const me = await api.user.getMe();
            const ownerUrl = me?.owner_photo_url || '';
            const prefillKey = `rider_prefill_owner_avatar_done_${me?.id || 'anon'}`;
            const already = localStorage.getItem(prefillKey) === '1';
            if ((!Array.isArray(transformedData.media.photos) || transformedData.media.photos.length === 0) && ownerUrl && !already) {
              setMedia({ photos: [ownerUrl], videos: transformedData.media.videos || [], video_intro_url: transformedData.media.video_intro_url || '' });
              localStorage.setItem(prefillKey, '1');
            }
          } catch {}
        }
        
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
  }, [getToken, location.search]);

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

  // Mark dirty when user changes any part of the profile (after initial load)
  useEffect(() => {
    if (loading) return;
    // mark dirty and debounce a save
    isDirtyRef.current = true;
    lastEditAtRef.current = Date.now();
    idleSavesRef.current = 0; // reset idle counter on change
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      if (pausedRef.current) return;
      if (!isDirtyRef.current) return;
      await autoSave();
      isDirtyRef.current = false; // just saved changes
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [basicInfo, address, availability, budget, experience, goals, skills, tasks, preferences, media, loading]);

  // Auto-save elke 30 seconden, met smart regels
  useEffect(() => {
    if (loading) return; // Don't auto-save while loading

    const onVisibility = () => {
      pausedRef.current = document.hidden;
      if (!document.hidden) {
        idleSavesRef.current = 0; // resume fresh on focus
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);
    window.addEventListener('blur', onVisibility);

    const interval = setInterval(async () => {
      if (pausedRef.current) return;
      if (progressPercentage <= 10) return;
      // If there are changes, save and reset idle counter
      if (isDirtyRef.current) {
        await autoSave();
        isDirtyRef.current = false;
        idleSavesRef.current = 0;
        return;
      }
      // No changes: allow limited idle autosaves, then pause until next change/focus
      if (idleSavesRef.current < MAX_IDLE_SAVES) {
        await autoSave();
        idleSavesRef.current += 1;
      }
    }, AUTOSAVE_INTERVAL_MS);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
      window.removeEventListener('blur', onVisibility);
    };
  }, [matchingScore, loading, getToken]);

  // Toast helper
  const showToast = (message, type = 'info', durationMs = 3000) => {
    setToast({ visible: true, message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(prev => ({ ...prev, visible: false })), durationMs);
  };

  const handleSubmit = async () => {
    try {
      // Publiceerbaar check
      if (!isPublishable) {
        alert('Je profiel is nog niet publiceerbaar. Vul a.u.b. de gemarkeerde verplichte velden aan.');
        return;
      }
      // Validatie: minderjarig (<=16) begeleiding verplicht
      const age = calculateAge(basicInfo.date_of_birth);
      if (age !== null && age <= 16) {
        if (basicInfo.parent_consent === null) {
          setCurrentStep(1);
          alert('Begeleiding: kies Ja of Nee.');
          return;
        }
        if (basicInfo.parent_consent === true) {
          const nameOk = !!(basicInfo.parent_contact_name && basicInfo.parent_contact_name.trim());
          const emailOk = !!(basicInfo.parent_contact_email && basicInfo.parent_contact_email.trim());
          if (!nameOk || !emailOk) {
            setCurrentStep(1);
            alert('Vul a.u.b. naam en e‑mail van de begeleider in.');
            return;
          }
        }
      }

      const api = createAPI(getToken);
      const apiData = transformProfileDataForAPI(profileData);
      await api.riderProfile.createOrUpdate(apiData);
      console.log('Rider profile saved successfully!');
      // Markeer onboarding als voltooid voor ruiter
      try {
        await api.user.completeOnboarding('rider');
      } catch (e) {
        console.warn('completeOnboarding faalde (non-blocking):', e?.message || e);
      }
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
      console.log('💾 Draft save payload address:', {
        street: apiData.street,
        city: apiData.city,
        postcode: apiData.postcode,
        house_number: apiData.house_number,
      });
      await api.riderProfile.createOrUpdate(apiData);
      showToast('Concept opgeslagen');
    } catch (error) {
      console.error('Error saving draft:', error);
      showToast('Opslaan concept mislukt', 'error');
    }
  };

  const transportOptions = ['auto', 'openbaar_vervoer', 'fiets', 'te_voet'];
  const weekDays = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
  const timeBlocks = ['ochtend', 'middag', 'avond'];
  const ridingGoals = ['recreatie', 'training', 'wedstrijden', 'therapie', 'sociale_contacten'];
  const disciplines = ['dressuur', 'springen', 'eventing', 'western', 'buitenritten', 'natural_horsemanship'];
  const availableTasks = ['uitrijden', 'voeren', 'poetsen', 'longeren', 'stalwerk', 'transport'];
  const healthRestrictions = ['hooikoorts', 'rugproblemen', 'knieproblemen', 'allergieën', 'medicatie'];
  const noGos = ['drukke_stallen', 'avond_afspraken', 'weekenden', 'slecht_weer', 'grote_groepen'];
  const personalityStyles = ['rustig', 'energiek', 'geduldig', 'assertief', 'flexibel', 'gestructureerd'];
  // Activiteiten keys (hergebruik voor filtering/reset)
  const careActivityKeys = ['verzorging','grondwerk','longeren','hand_walking','pasture_turnout','medical_assist'];
  const rideActivityKeys = ['buitenritten','dressuur_training','springen_training'];
  // Certificeringen (NL): FNRS, KNHS Dressuur en Springen
  const generalLevels = ['Beginner','Gevorderd beginner','Recreatieve ruiter','Hobby dressuur','Hobby springen'];
  const fnrsLevels = Array.from({ length: 12 }, (_, i) => `FNRS F${i + 1}`);
  const dressuurLevels = ['Dressuur B','Dressuur L1','Dressuur L2','Dressuur M1','Dressuur M2','Dressuur Z1','Dressuur Z2','Dressuur ZZ-Licht','Dressuur ZZ-Zwaar'];
  const springenLevels = ['Springen B','Springen L','Springen M','Springen Z','Springen ZZ'];
  const eventingLevels = ['Eventing B','Eventing L','Eventing M','Eventing Z'];
  const workingEquitationLevels = ['Working Equitation (WE)'];

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
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      {/* Toast */}
      {toast.visible && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm
          ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-white'}`}
        >
          {toast.message}
        </div>
      )}
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--role-primary)' }}>
                <span className="text-2xl">🏇</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Ruiter Profiel</h1>
              <p className="text-gray-600 mt-2">Vertel ons alles over jezelf voor de beste matches</p>
            </div>
          </div>

          {/* Progress (Matching score + Publiceerbaar badge) */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-600">Stap {currentStep} van {totalSteps}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">{matchingScore}% matching</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${isPublishable ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-yellow-50 border-yellow-400 text-yellow-700'}`}>
                  Publiceerbaar: {isPublishable ? 'Ja' : 'Nee'}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${matchingScore}%`, backgroundColor: 'var(--role-primary)' }}
              ></div>
            </div>
          </div>

          {/* Jump menu: snel naar stap */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Snel naar stap</label>
            <select
              className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={currentStep}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (!Number.isNaN(n)) setCurrentStep(n);
              }}
            >
              <option value={1}>1 — Basis Informatie</option>
              <option value={2}>2 — Beschikbaarheid</option>
              <option value={3}>3 — Budget</option>
              <option value={4}>4 — Gewenste paard/pony</option>
              <option value={5}>5 — Doelen & Disciplines</option>
              <option value={6}>6 — Taken</option>
              <option value={7}>7 — Ervaring & Activiteiten</option>
              <option value={8}>8 — Vaardigheden</option>
              <option value={9}>9 — Voorkeuren</option>
              <option value={10}>10 — Media & Voltooien</option>
            </select>
          </div>

          {/* Step 1: Basis Informatie */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm" style={{ backgroundColor: 'var(--role-primary-50)', color: 'var(--role-primary)' }}>1</span>
                Basis Informatie
                <span className={`text-xs px-2 py-0.5 rounded-full border ${step1MinOk ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-yellow-50 border-yellow-400 text-yellow-700'}`}>Vereist voor publiceren: {step1MinOk ? 'Voldaan' : 'Niet voldaan'}</span>
              </h2>
              {/* Profielfoto bovenaan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profielfoto <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
                <ImageUploader
                  value={(media.photos || []).slice(0,1)}
                  onChange={async (urls) => {
                    const one = (urls || []).slice(0,1);
                    setMedia({ ...media, photos: one });
                    try {
                      const api = createAPI(getToken);
                      await api.riderProfile.createOrUpdate({ photos: one });
                      // Notify listeners (e.g., Navbar) to refresh avatar
                      window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { role: 'rider' } }));
                    } catch (e) {
                      console.warn('Autosave profielfoto mislukt:', e?.message || e);
                    }
                  }}
                  api={createAPI(getToken)}
                  max={1}
                />
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-xs text-gray-500">Deze foto wordt gebruikt in je ruitersprofiel.</p>
                  {(Array.isArray(media.photos) && media.photos.length > 0) && (
                    <button
                      type="button"
                      onClick={async () => {
                        // Pauzeer autosave om race conditions te voorkomen
                        pausedRef.current = true;
                        const next = [];
                        setMedia({ ...media, photos: next });
                        try {
                          const api = createAPI(getToken);
                          await api.riderProfile.createOrUpdate({ photos: next });
                          // Markeer dat prefill niet meer mag gebeuren
                          try {
                            const me = await api.user.getMe();
                            const prefillKey = `rider_prefill_owner_avatar_done_${me?.id || 'anon'}`;
                            localStorage.setItem(prefillKey, '1');
                          } catch {}
                          // Refetch om UI te synchroniseren met server
                          try {
                            const fresh = await api.riderProfile.get();
                            const t = transformProfileDataFromAPI(fresh);
                            setMedia(t.media);
                          } catch {}
                          window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { role: 'rider' } }));
                        } catch (e) {
                          console.warn('Verwijderen profielfoto mislukt:', e?.message || e);
                          // rollback UI indien gewenst? Voor nu laten zoals is.
                        } finally {
                          // hervat autosave
                          pausedRef.current = false;
                        }
                      }}
                      className="text-xs px-2 py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
                      title="Profielfoto verwijderen"
                    >
                      Verwijderen
                    </button>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Voornaam <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
                  <input
                    type="text"
                    value={basicInfo.first_name}
                    onChange={(e) => setBasicInfo({...basicInfo, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Achternaam <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Geboortedatum <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
                <DatePicker
                  selected={(basicInfo.date_of_birth ? new Date(`${basicInfo.date_of_birth}T00:00:00`) : null)}
                  onChange={(date) => {
                    const iso = date ? formatDate(date, 'yyyy-MM-dd') : '';
                    setBasicInfo({ ...basicInfo, date_of_birth: iso });
                  }}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="dd-mm-jjjj"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  minDate={new Date(1930, 0, 1)}
                  maxDate={new Date()}
                  openToDate={(!basicInfo.date_of_birth ? new Date(1995, 0, 1) : undefined)}
                  scrollableYearDropdown
                />
                {(() => {
                  const age = calculateAge(basicInfo.date_of_birth);
                  if (age !== null && age <= 16) {
                    return (
                      <div className="mt-3">
                        <div className="text-sm text-gray-700 mb-2">Gaat er een volwassene mee als begeleiding?</div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setBasicInfo({ ...basicInfo, parent_consent: true })}
                            className={`px-3 py-2 rounded-full border text-sm ${basicInfo.parent_consent === true ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                          >Ja</button>
                          <button
                            type="button"
                            onClick={() => setBasicInfo({ ...basicInfo, parent_consent: false })}
                            className={`px-3 py-2 rounded-full border text-sm ${basicInfo.parent_consent === false ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                          >Nee</button>
                        </div>
                        {basicInfo.parent_consent === true && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Naam begeleider</label>
                              <input
                                type="text"
                                value={basicInfo.parent_contact_name}
                                onChange={(e) => setBasicInfo({ ...basicInfo, parent_contact_name: e.target.value })}
                                placeholder="Voor- en achternaam"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              {(!basicInfo.parent_contact_name?.trim()) && (
                                <p className="mt-1 text-xs text-red-600">Vul de naam van de begeleider in.</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">E‑mail begeleider</label>
                              <input
                                type="email"
                                value={basicInfo.parent_contact_email}
                                onChange={(e) => setBasicInfo({ ...basicInfo, parent_contact_email: e.target.value })}
                                placeholder="naam@voorbeeld.nl"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                              {(!basicInfo.parent_contact_email?.trim()) && (
                                <p className="mt-1 text-xs text-red-600">Vul het e‑mailadres van de begeleider in.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Lengte & Gewicht */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lengte (cm) <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
                  <input
                    type="number"
                    min={100}
                    max={220}
                    value={basicInfo.rider_height_cm}
                    onChange={(e) => setBasicInfo({ ...basicInfo, rider_height_cm: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    placeholder="bijv. 175"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gewicht (kg) <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
                  <input
                    type="number"
                    min={30}
                    max={150}
                    value={basicInfo.rider_weight_kg}
                    onChange={(e) => setBasicInfo({ ...basicInfo, rider_weight_kg: e.target.value === '' ? '' : parseInt(e.target.value) })}
                    placeholder="bijv. 68"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Over mij */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Over mij</label>
                <textarea
                  rows={4}
                  maxLength={1000}
                  value={basicInfo.rider_bio}
                  onChange={(e) => setBasicInfo({ ...basicInfo, rider_bio: e.target.value })}
                  placeholder="Vertel iets over jezelf, ervaring en wat je zoekt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Max. 1000 tekens</p>
              </div>

              {/* Adres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Adres <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
                <AddressPicker value={address} onChange={setAddress} />
                <p className="mt-1 text-xs text-gray-500">Vul land, postcode, huisnummer, straat en plaats in.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          ? 'border-role text-role bg-role-soft'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {option.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* (opgeruimd) geen placeholders meer hier */}
            </div>
          )}

          {/* Step 2: Beschikbaarheid */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm" style={{ backgroundColor: 'var(--role-primary-50)', color: 'var(--role-primary)' }}>2</span>
                Beschikbaarheid
                <span className={`text-xs px-2 py-0.5 rounded-full border ${step2MinOk ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-yellow-50 border-yellow-400 text-yellow-700'}`}>Vereist voor publiceren: {step2MinOk ? 'Voldaan' : 'Niet voldaan'}</span>
              </h2>

              {/* Min. dagen per week (algemeen) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wat is het minimale aantal dagen dat je wilt verzorgen/bijrijden of leasen?</label>
                <div className="flex flex-wrap gap-2">
                  {[1,2,3,4,5,6,7].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAvailability({ ...availability, min_days_per_week: n })}
                      className={`px-3 py-2 rounded-full border text-sm ${availability.min_days_per_week === n ? 'text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                      style={availability.min_days_per_week === n ? { backgroundColor: 'var(--role-primary)', borderColor: 'var(--role-primary)' } : undefined}
                    >
                      {n} dag{n>1?'en':''}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">Geldt voor rijden, verzorgen én lease.</p>
              </div>

              {/* Per-dag dagdelen (ochtend/middag/avond) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beschikbaarheid per dag <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
                <div className="space-y-2">
                  {weekDays.map((day) => {
                    const schedule = availability.available_schedule || {};
                    const dayBlocks = Array.isArray(schedule[day]) ? schedule[day] : [];

                    const updateFromSchedule = (nextSchedule) => {
                      const days = Object.keys(nextSchedule).filter(d => Array.isArray(nextSchedule[d]) && nextSchedule[d].length > 0);
                      const union = Array.from(new Set(days.flatMap(d => nextSchedule[d])));
                      setAvailability({
                        ...availability,
                        available_schedule: nextSchedule,
                        available_days: days,
                        available_time_blocks: union,
                      });
                    };

                    const toggleDay = () => {
                      const next = { ...schedule };
                      if (dayBlocks.length > 0) {
                        next[day] = [];
                      } else {
                        next[day] = [];
                      }
                      updateFromSchedule(next);
                    };

                    const toggleBlock = (block) => {
                      const next = { ...schedule };
                      const current = Array.isArray(next[day]) ? [...next[day]] : [];
                      const has = current.includes(block);
                      const updated = has ? current.filter(b => b !== block) : [...current, block];
                      next[day] = updated;
                      updateFromSchedule(next);
                    };

                    const active = dayBlocks.length > 0;
                    return (
                      <div key={day} className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={toggleDay}
                          className={`w-28 px-3 py-2 rounded-lg border text-sm text-left ${active ? 'border-role text-role bg-role-soft' : 'bg-white border-gray-300 text-gray-700'}`}
                        >
                          {day.charAt(0).toUpperCase() + day.slice(1)}
                        </button>
                        <div className="flex items-center gap-2">
                          {timeBlocks.map(block => (
                            <button
                              key={`${day}-${block}`}
                              type="button"
                              onClick={() => toggleBlock(block)}
                              className={`px-3 py-2 rounded-full border text-sm ${
                                dayBlocks.includes(block)
                                  ? 'text-white'
                                  : 'bg-white border-gray-300 text-gray-700'
                              } ${!active && !dayBlocks.includes(block) ? 'opacity-70' : ''}`}
                              style={dayBlocks.includes(block) ? { backgroundColor: 'var(--role-primary)', borderColor: 'var(--role-primary)' } : undefined}
                            >
                              {block}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
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
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm" style={{ backgroundColor: 'var(--role-primary-50)', color: 'var(--role-primary)' }}>3</span>
                Budget
                <span className={`text-xs px-2 py-0.5 rounded-full border ${step3MinOk ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-yellow-50 border-yellow-400 text-yellow-700'}`}>Vereist voor publiceren: {step3MinOk ? 'Voldaan' : 'Niet voldaan'}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum budget (€/maand) <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
                  <input
                    type="number"
                    value={budget.budget_min_euro}
                    onChange={(e) => setBudget({...budget, budget_min_euro: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum budget (€/maand) <span className="text-[10px] uppercase tracking-wide ml-2 px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">Vereist</span></label>
                  <input
                    type="number"
                    value={budget.budget_max_euro}
                    onChange={(e) => setBudget({...budget, budget_max_euro: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Budget type verwijderd: we hanteren per maand als standaard */}
            </div>
          )}

          {/* Step 7: Ervaring */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm" style={{ backgroundColor: 'var(--role-primary-50)', color: 'var(--role-primary)' }}>7</span>
                Ervaring
                <span className={`text-xs px-2 py-0.5 rounded-full border ${step7MinOk ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-yellow-50 border-yellow-400 text-yellow-700'}`}>Vereist voor publiceren: {step7MinOk ? 'Voldaan' : 'Niet voldaan'}</span>
              </h2>
              <p className="text-xs text-gray-600 -mt-2">Minimaal: vul <strong>jaren ervaring</strong> of kies een <strong>hoofdactiviteit</strong> of <strong>subactiviteit</strong>. Bij <strong>Uitsluitend mennen</strong> is <strong>niveau mennen</strong> vereist.</p>

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
                <label className="block text-sm font-medium text-gray-700 mb-2">Certificeringen (meerdere mogelijk)</label>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-gray-500">Algemeen</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {generalLevels.map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleArrayItem(experience.certifications, level, (items) => setExperience({...experience, certifications: items}))}
                          className={`px-2 py-1 text-xs rounded-full border ${experience.certifications.includes(level) ? 'border-role text-role bg-role-soft' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">FNRS</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {fnrsLevels.map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleArrayItem(experience.certifications, level, (items) => setExperience({...experience, certifications: items}))}
                          className={`px-2 py-1 text-xs rounded-full border ${experience.certifications.includes(level) ? 'border-role text-role bg-role-soft' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">KNHS Dressuur</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {dressuurLevels.map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleArrayItem(experience.certifications, level, (items) => setExperience({...experience, certifications: items}))}
                          className={`px-2 py-1 text-xs rounded-full border ${experience.certifications.includes(level) ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">KNHS Springen</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {springenLevels.map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleArrayItem(experience.certifications, level, (items) => setExperience({...experience, certifications: items}))}
                          className={`px-2 py-1 text-xs rounded-full border ${experience.certifications.includes(level) ? 'bg-purple-100 border-purple-500 text-purple-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Eventing</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {eventingLevels.map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleArrayItem(experience.certifications, level, (items) => setExperience({...experience, certifications: items}))}
                          className={`px-2 py-1 text-xs rounded-full border ${experience.certifications.includes(level) ? 'bg-orange-100 border-orange-500 text-orange-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Working Equitation</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {workingEquitationLevels.map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => toggleArrayItem(experience.certifications, level, (items) => setExperience({...experience, certifications: items}))}
                          className={`px-2 py-1 text-xs rounded-full border ${experience.certifications.includes(level) ? 'bg-rose-100 border-rose-500 text-rose-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Maat-categorieën (alternatief) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maat‑categorieën (alternatief voor schofthoogte)</label>
                  <span className="text-[11px] text-gray-500">Je kunt meerdere kiezen</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key:'shetlander', label:'Shetlander', hint:'~<107 cm' },
                    { key:'pony_a', label:'Pony A', hint:'~≤117 cm' },
                    { key:'pony_b', label:'Pony B', hint:'~117–127 cm' },
                    { key:'pony_c', label:'Pony C', hint:'~127–137 cm' },
                    { key:'pony_d', label:'Pony D', hint:'~137–148 cm' },
                    { key:'pony_e', label:'Pony E', hint:'~148–157 cm (niet overal gebruikt)' },
                    { key:'paard', label:'Paard', hint:'~≥148 cm' },
                  ].map(opt => {
                    const active = preferences.desired_horse.size_categories.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          const has = active;
                          const next = has ? preferences.desired_horse.size_categories.filter(x => x !== opt.key) : [...preferences.desired_horse.size_categories, opt.key];
                          setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, size_categories: next }});
                        }}
                        className={`px-3 py-2 rounded-full border text-sm ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                        title={opt.hint}
                      >{opt.label}</button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Hints zijn indicatief; categorie‑indeling is in de EU grotendeels gelijk (A‑D). “E‑pony” wordt niet overal gebruikt.</p>
              </div>

              {/* Rijstijl & uitrusting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rijstijl & uitrusting</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'bitloos', label: 'Bitloos' },
                    { key: 'hackamore', label: 'Hackamore' },
                    { key: 'sidepull', label: 'Sidepull' },
                    { key: 'kaptoom', label: 'Kaptoom' },
                    { key: 'western', label: 'Western (neck reining)' },
                    { key: 'natural_horsemanship', label: 'Natural Horsemanship' },
                    { key: 'rope_halter', label: 'Rope halter/rope work' },
                    { key: 'bareback', label: 'Bareback (zonder zadel)' },
                    { key: 'sporen_ok', label: 'Sporen OK' },
                  ].map(item => {
                    const active = preferences.riding_styles.includes(item.key);
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => {
                          const has = preferences.riding_styles.includes(item.key);
                          const next = has
                            ? preferences.riding_styles.filter(k => k !== item.key)
                            : [...preferences.riding_styles, item.key];
                          setPreferences({ ...preferences, riding_styles: next });
                        }}
                        className={`px-3 py-2 rounded-full border text-sm transition-colors ${
                          active ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Ik ben comfortabel met:</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    { key: 'traffic', label: '(Druk) verkeer' },
                    { key: 'trail_rides', label: 'Buitenritten' },
                    { key: 'nervous_horses', label: 'Nerveuze paarden' },
                    { key: 'young_horses', label: 'Jonge paarden' },
                    { key: 'stallions', label: 'Hengsten' },
                    { key: 'outdoor_solo', label: 'Alleen rijden' },
                  ].map(item => {
                    const active = !!experience.comfort_levels[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setExperience({
                          ...experience,
                          comfort_levels: { ...experience.comfort_levels, [item.key]: !active }
                        })}
                        className={`px-3 py-2 rounded-full border text-sm transition-colors ${
                          active
                            ? 'text-white shadow-sm'
                            : 'bg-white border-gray-300 text-gray-700'
                        }`}
                        style={active ? { backgroundColor: 'var(--role-primary)', borderColor: 'var(--role-primary)' } : undefined}
                      >
                        {item.label}
                      </button>
                    );
                  })}
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

          {/* Step 4: Gewenste paard */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm" style={{ backgroundColor: 'var(--role-primary-50)', color: 'var(--role-primary)' }}>4</span>
                Gewenste paard/pony
                <span className={`text-xs px-2 py-0.5 rounded-full border ${step4MinOk ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-yellow-50 border-yellow-400 text-yellow-700'}`}>Vereist voor publiceren: {step4MinOk ? 'Voldaan' : 'Niet voldaan'}</span>
              </h2>
              <p className="text-xs text-gray-600 -mt-2">Minimaal: kies <strong>Type</strong> én vul óf <strong>Schofthoogte</strong> (min/max) in óf selecteer één of meer <strong>Maat‑categorieën</strong>.</p>

              {/* Type en Schofthoogte */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['pony','paard'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const has = preferences.desired_horse.type.includes(t);
                          const next = has ? preferences.desired_horse.type.filter(x => x !== t) : [...preferences.desired_horse.type, t];
                          setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, type: next }});
                        }}
                        className={`px-3 py-2 rounded-full border text-sm ${preferences.desired_horse.type.includes(t) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                      >{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schofthoogte min (cm)</label>
                  <input
                    type="number"
                    min={80}
                    max={190}
                    value={preferences.desired_horse.schofthoogte_cm_min}
                    onChange={(e) => setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, schofthoogte_cm_min: e.target.value === '' ? '' : parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schofthoogte max (cm)</label>
                  <input
                    type="number"
                    min={80}
                    max={210}
                    value={preferences.desired_horse.schofthoogte_cm_max}
                    onChange={(e) => setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, schofthoogte_cm_max: e.target.value === '' ? '' : parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Maat-categorieën */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Maat‑categorieën</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key:'shetlander', label:'Shetlander', hint:'~<107 cm' },
                    { key:'pony_a', label:'Pony A', hint:'~≤117 cm' },
                    { key:'pony_b', label:'Pony B', hint:'~117–127 cm' },
                    { key:'pony_c', label:'Pony C', hint:'~127–137 cm' },
                    { key:'pony_d', label:'Pony D', hint:'~137–148 cm' },
                    { key:'pony_e', label:'Pony E', hint:'~148–157 cm (niet overal gebruikt)' },
                    { key:'paard', label:'Paard', hint:'~≥148 cm' },
                  ].map(opt => {
                    const active = preferences.desired_horse.size_categories.includes(opt.key);
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          const has = active;
                          const next = has ? preferences.desired_horse.size_categories.filter(x => x !== opt.key) : [...preferences.desired_horse.size_categories, opt.key];
                          setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, size_categories: next }});
                        }}
                        className={`px-3 py-2 rounded-full border text-sm ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                        title={opt.hint}
                      >{opt.label}</button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Hints zijn indicatief; categorie‑indeling is in de EU grotendeels gelijk (A‑D). “E‑pony” wordt niet overal gebruikt.</p>
              </div>

              {/* Geslacht en Leeftijd */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Geslacht</label>
                  <div className="flex flex-wrap gap-2">
                    {['merrie','ruin','hengst'].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => {
                          const has = preferences.desired_horse.geslacht.includes(g);
                          const next = has ? preferences.desired_horse.geslacht.filter(x => x !== g) : [...preferences.desired_horse.geslacht, g];
                          setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, geslacht: next }});
                        }}
                        className={`px-3 py-2 rounded-full border text-sm ${preferences.desired_horse.geslacht.includes(g) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                      >{g}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leeftijd min</label>
                  <input
                    type="number"
                    min={0}
                    max={40}
                    value={preferences.desired_horse.leeftijd_min}
                    onChange={(e) => setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, leeftijd_min: e.target.value === '' ? '' : parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leeftijd max</label>
                  <input
                    type="number"
                    min={0}
                    max={45}
                    value={preferences.desired_horse.leeftijd_max}
                    onChange={(e) => setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, leeftijd_max: e.target.value === '' ? '' : parseInt(e.target.value) } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Ras / Stamboek */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ras</label>
                  <input
                    type="text"
                    value={preferences.desired_horse.ras}
                    onChange={(e) => setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, ras: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stamboek</label>
                  <input
                    type="text"
                    value={preferences.desired_horse.stamboek}
                    onChange={(e) => setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, stamboek: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Disciplines paard */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Disciplines van het paard</label>
                <div className="flex flex-wrap gap-2">
                  {['dressuur','springen','eventing','western','buitenritten','mennen','voltige','endurance','working_equitation','trec'].map(d => {
                    const active = preferences.desired_horse.disciplines_paard.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          const has = active;
                          const next = has ? preferences.desired_horse.disciplines_paard.filter(x => x !== d) : [...preferences.desired_horse.disciplines_paard, d];
                          setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, disciplines_paard: next }});
                        }}
                        className={`px-3 py-2 rounded-full border text-sm ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                      >{d.replace('_',' ')}</button>
                    );
                  })}
                </div>
              </div>

              {/* Karakter/handling */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handgevoeligheid</label>
                  <div className="flex flex-wrap gap-2">
                    {['zachte_hand','neutraal','sterke_hand'].map(k => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, handgevoeligheid: preferences.desired_horse.handgevoeligheid === k ? '' : k } })}
                        className={`px-3 py-2 rounded-full border text-sm ${preferences.desired_horse.handgevoeligheid === k ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                      >{k.replace('_',' ')}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vergevingsgezindheid</label>
                  <div className="flex flex-wrap gap-2">
                    {['laag','gemiddeld','hoog'].map(k => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, vergevingsgezindheid: preferences.desired_horse.vergevingsgezindheid === k ? '' : k } })}
                        className={`px-3 py-2 rounded-full border text-sm ${preferences.desired_horse.vergevingsgezindheid === k ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                      >{k}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Temperament</label>
                <div className="flex flex-wrap gap-2">
                  {['rustig','koel_in_het_hoofd','gevoelig','heet','speels','dominant','voorwaarts'].map(t => {
                    const active = preferences.desired_horse.temperament.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const has = active;
                          const next = has ? preferences.desired_horse.temperament.filter(x => x !== t) : [...preferences.desired_horse.temperament, t];
                          setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, temperament: next }});
                        }}
                        className={`px-3 py-2 rounded-full border text-sm ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                      >{t.replace('_',' ')}</button>
                    );
                  })}
                </div>
              </div>

              {/* Vachtkleur */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vachtkleuren</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {['vos','zwart','bruin','donkerbruin','schimmel','bont','valk','palomino','roan','appaloosa'].map(k => {
                    const active = preferences.desired_horse.vachtkleuren.includes(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          const has = active;
                          const next = has ? preferences.desired_horse.vachtkleuren.filter(x => x !== k) : [...preferences.desired_horse.vachtkleuren, k];
                          setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, vachtkleuren: next }});
                        }}
                        className={`px-3 py-2 rounded-full border text-sm ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                      >{k}</button>
                    );
                  })}
                  {/* Niet belangrijk als pill-knop */}
                  <button
                    type="button"
                    onClick={() => setPreferences({ ...preferences, desired_horse: { ...preferences.desired_horse, niet_belangrijk_vachtkleur: !preferences.desired_horse.niet_belangrijk_vachtkleur } })}
                    className={`px-3 py-2 rounded-full border text-sm ${preferences.desired_horse.niet_belangrijk_vachtkleur ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                  >Niet belangrijk</button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Doelen */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center mr-2 text-sm" style={{ backgroundColor: 'var(--role-primary-50)', color: 'var(--role-primary)' }}>5</span>
                Doelen
                <span className={`text-xs px-2 py-0.5 rounded-full border ${step5MinOk ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-yellow-50 border-yellow-400 text-yellow-700'}`}>Vereist voor publiceren: {step5MinOk ? 'Voldaan' : 'Niet voldaan'}</span>
              </h2>
              <p className="text-xs text-gray-600 -mt-2">Minimaal vereist alleen als je rijden kiest: selecteer een <strong>Rijdoel</strong> of <strong>Discipline</strong>.</p>

              {/* Wat wil je doen? (verplaatst hierheen) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Wat wil je doen?</label>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {[
                    { key: 'care_only', label: 'Alleen verzorgen/grondwerk' },
                    { key: 'ride_or_care', label: 'Rijden of verzorgen' },
                    { key: 'ride_only', label: 'Uitsluitend rijden' },
                    { key: 'drive_only', label: 'Uitsluitend mennen' },
                  ].map(opt => {
                    const active = experience.activity_mode === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          // Reset/normaliseer afhankelijk van hoofdkeuze
                          if (opt.key === 'care_only') {
                            const filtered = (experience.activity_preferences || []).filter(k => careActivityKeys.includes(k));
                            setExperience({ ...experience, activity_mode: opt.key, activity_preferences: filtered, mennen_experience: null });
                            setGoals({ ...goals, riding_goals: [], discipline_preferences: [] });
                          } else if (opt.key === 'ride_or_care') {
                            // Laat subitems zoals ze zijn; wis mennen-niveau
                            setExperience({ ...experience, activity_mode: opt.key, mennen_experience: null });
                          } else if (opt.key === 'ride_only') {
                            setExperience({ ...experience, activity_mode: opt.key, activity_preferences: [], mennen_experience: null });
                            // riding goals/discipline blijven zichtbaar en behouden
                          } else if (opt.key === 'drive_only') {
                            setExperience({ ...experience, activity_mode: opt.key, activity_preferences: [] });
                            setGoals({ ...goals, riding_goals: [], discipline_preferences: [] });
                          }
                        }}
                        className={`px-3 py-2 rounded-full border text-sm ${active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                      >{opt.label}</button>
                    );
                  })}
                </div>

                {/* Subactiviteiten verzorgen */}
                <div className="text-xs text-gray-500 mb-1">Subactiviteiten verzorgen</div>

                {/* Activiteiten onder de modus, afhankelijk van keuze */}
                {(() => {
                  const careActivities = [
                    { key: 'verzorging', label: 'Verzorging' },
                    { key: 'grondwerk', label: 'Grondwerk' },
                    { key: 'longeren', label: 'Longeren' },
                    { key: 'hand_walking', label: 'Wandelen aan de hand' },
                    { key: 'pasture_turnout', label: 'Weidegang/uitzetten' },
                    { key: 'medical_assist', label: 'Medische verzorging assisteren' },
                  ];
                  let shown = [];
                  if (experience.activity_mode === 'care_only') shown = careActivities;
                  if (experience.activity_mode === 'ride_or_care') shown = careActivities; // geen rij-subactiviteiten meer tonen
                  if (experience.activity_mode === 'ride_only') shown = [];
                  if (experience.activity_mode === 'drive_only') shown = [];
                  if (shown.length === 0) return null;
                  return (
                    <div className="flex flex-wrap gap-2">
                      {shown.map(item => {
                        const active = experience.activity_preferences.includes(item.key);
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => {
                              const has = experience.activity_preferences.includes(item.key);
                              const next = has
                                ? experience.activity_preferences.filter(k => k !== item.key)
                                : [...experience.activity_preferences, item.key];
                              setExperience({ ...experience, activity_preferences: next });
                            }}
                            className={`px-3 py-2 rounded-full border text-sm ${
                              active ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-gray-700'
                            }`}
                          >{item.label}</button>
                        );
                      })}
                    </div>
                  );
                })()}

                {experience.activity_mode === 'drive_only' && (
                  <div className="mt-3 max-w-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau mennen</label>
                    <select
                      value={experience.mennen_experience || ''}
                      onChange={e => setExperience({ ...experience, mennen_experience: e.target.value || null })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Selecteer niveau...</option>
                      <option value="beginner">Beginner</option>
                      <option value="gevorderd">Gevorderd</option>
                      <option value="ervaren">Ervaren</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Lease - prominente sectie */}
              <div className="mt-6 p-4 rounded-xl border shadow-sm bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-base font-semibold text-emerald-800">Lease</label>
                  <span className="text-xs font-semibold text-white bg-emerald-500 px-2 py-0.5 rounded-full">Nieuw</span>
                </div>
                <p className="text-sm text-emerald-900/80 mb-3">Optioneel: sta open voor lease naast bijrijden/verzorgen. Je wordt dan óók gematcht op lease‑aanbiedingen.</p>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setLease({ ...lease, wants_lease: !lease.wants_lease })}
                    className={`px-4 py-2 rounded-full border text-sm transition-colors ${lease.wants_lease ? 'bg-emerald-600 border-emerald-600 text-white shadow' : 'bg-white border-gray-300 text-gray-700'}`}
                  >
                    {lease.wants_lease ? 'Lease gewenst' : 'Lease niet geselecteerd'}
                  </button>
                </div>
                {lease.wants_lease && (
                  <div className="grid grid-cols-1 gap-6">
                    {/* Type (opgesplitst in Locatie en Omvang) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Locatie</label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => setLease({ ...lease, location_preference: null })}
                          className={`px-3 py-2 rounded-full border text-sm ${lease.location_preference === null ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700'}`}
                        >In overleg</button>
                        {[
                          {key: 'Bij eigenaar op stal', val: 'on_site'},
                          {key: 'Op eigen stal', val: 'off_site'},
                        ].map(item => {
                          const selected = Array.isArray(lease.location_preference) && lease.location_preference.includes(item.val);
                          return (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => {
                                if (!Array.isArray(lease.location_preference)) {
                                  setLease({ ...lease, location_preference: [item.val] });
                                  return;
                                }
                                const has = lease.location_preference.includes(item.val);
                                const next = has ? lease.location_preference.filter(k => k !== item.val) : [...lease.location_preference, item.val];
                                setLease({ ...lease, location_preference: next.length ? next : null });
                              }}
                              className={`px-3 py-2 rounded-full border text-sm ${selected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                            >{item.key}</button>
                          );
                        })}
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Omvang</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setLease({ ...lease, scope_preference: null })}
                          className={`px-3 py-2 rounded-full border text-sm ${lease.scope_preference === null ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700'}`}
                        >In overleg</button>
                        {[
                          {key: 'Full lease', val: 'full'},
                          {key: 'Part lease', val: 'part'},
                        ].map(item => {
                          const selected = Array.isArray(lease.scope_preference) && lease.scope_preference.includes(item.val);
                          return (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => {
                                if (!Array.isArray(lease.scope_preference)) {
                                  setLease({ ...lease, scope_preference: [item.val] });
                                  return;
                                }
                                const has = lease.scope_preference.includes(item.val);
                                const next = has ? lease.scope_preference.filter(k => k !== item.val) : [...lease.scope_preference, item.val];
                                setLease({ ...lease, scope_preference: next.length ? next : null });
                              }}
                              className={`px-3 py-2 rounded-full border text-sm ${selected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                            >{item.key}</button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Duur */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duur</label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            {key: 'doorlopend', label: 'Doorlopend'},
                            {key: 'vaste_periode', label: 'Vaste periode'},
                          ].map(opt => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setLease({ ...lease, duration: { type: opt.key, months: opt.key === 'vaste_periode' ? (lease.duration?.months || 6) : null } })}
                              className={`px-3 py-2 rounded-full border text-sm ${lease.duration?.type === opt.key ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                            >{opt.label}</button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setLease({ ...lease, duration: { type: null, months: null } })}
                            className={`px-3 py-2 rounded-full border text-sm ${!lease.duration?.type ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700'}`}
                          >In overleg</button>
                        </div>
                      </div>
                      {lease.duration?.type === 'vaste_periode' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Aantal maanden</label>
                          <input
                            type="number"
                            min={1}
                            value={lease.duration?.months ?? ''}
                            onChange={(e) => setLease({ ...lease, duration: { type: 'vaste_periode', months: e.target.value === '' ? null : parseInt(e.target.value) } })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          />
                        </div>
                      )}
                    </div>

                    {/* Locatie & transport */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Eigen stalplek beschikbaar?</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setLease({ ...lease, eigen_stalplek_beschikbaar: null })}
                            className={`px-3 py-2 rounded-full border text-sm ${lease.eigen_stalplek_beschikbaar === null ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700'}`}
                          >In overleg</button>
                          {[
                            {key: true, label: 'Ja'},
                            {key: false, label: 'Nee'},
                          ].map(opt => (
                            <button
                              key={String(opt.key)}
                              type="button"
                              onClick={() => setLease({ ...lease, eigen_stalplek_beschikbaar: opt.key })}
                              className={`px-3 py-2 rounded-full border text-sm ${lease.eigen_stalplek_beschikbaar === opt.key ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                            >{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Kan je transporteren?</label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setLease({ ...lease, kan_transporteren: null })}
                            className={`px-3 py-2 rounded-full border text-sm ${lease.kan_transporteren === null ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700'}`}
                          >In overleg</button>
                          {[
                            {key: true, label: 'Ja'},
                            {key: false, label: 'Nee'},
                          ].map(opt => (
                            <button
                              key={String(opt.key)}
                              type="button"
                              onClick={() => setLease({ ...lease, kan_transporteren: opt.key })}
                              className={`px-3 py-2 rounded-full border text-sm ${lease.kan_transporteren === opt.key ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                            >{opt.label}</button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Lease budget (max €/maand)</label>
                        <input
                          type="number"
                          value={lease.budget_max_pm_lease ?? ''}
                          onChange={(e) => setLease({ ...lease, budget_max_pm_lease: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                          placeholder="bijv. 200"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setLease({ ...lease, budget_max_pm_lease: undefined })}
                            className={`px-3 py-2 rounded-full border text-xs ${lease.budget_max_pm_lease === undefined ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700'}`}
                          >In overleg</button>
                        </div>
                      </div>
                    </div>

                    {/* Verplicht inbegrepen */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Wat moet inbegrepen zijn in de leaseprijs?</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setLease({ ...lease, required_inclusions: null })}
                          className={`px-3 py-2 rounded-full border text-sm ${lease.required_inclusions === null ? 'bg-emerald-100 border-emerald-500 text-emerald-800' : 'bg-white border-gray-300 text-gray-700'}`}
                        >In overleg</button>
                        {[
                          'voer','stalplaats','zadel_en_toebehoren','les_optie','hoefsmid_inbegrepen','dierenarts_inbegrepen'
                        ].map(key => {
                          const selected = Array.isArray(lease.required_inclusions) && lease.required_inclusions.includes(key);
                          return (
                            <button
                              key={key}
                              type="button"
                              onClick={() => {
                                if (!Array.isArray(lease.required_inclusions)) {
                                  setLease({ ...lease, required_inclusions: [key] });
                                  return;
                                }
                                const has = lease.required_inclusions.includes(key);
                                const next = has ? lease.required_inclusions.filter(k => k !== key) : [...lease.required_inclusions, key];
                                setLease({ ...lease, required_inclusions: next.length ? next : null });
                              }}
                              className={`px-3 py-2 rounded-full border text-sm ${selected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                            >{key.replace(/_/g,' ')}</button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Rijdoelen alleen tonen als rijden onderdeel is */}
              {(['ride_or_care','ride_only'].includes(experience.activity_mode || '')) && (
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
              )}

              {(['ride_or_care','ride_only'].includes(experience.activity_mode || '')) && (
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
              )}

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
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">6</span>
                Taken
                <span className={`text-xs px-2 py-0.5 rounded-full border ${step6MinOk ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-yellow-50 border-yellow-400 text-yellow-700'}`}>Vereist voor publiceren: {step6MinOk ? 'Voldaan' : 'Niet voldaan'}</span>
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

          {/* Step 8: Vaardigheden */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">8</span>
                Vaardigheden
              </h2>

              {(() => {
                const groups = [
                  { title: 'Verzorging', items: [
                    { key: 'algemene_verzorging', label: 'Algemene verzorging' },
                    { key: 'poetsen', label: 'Poetsen' },
                    { key: 'wassen', label: 'Wassen' },
                    { key: 'invlechten', label: 'Invlechten' },
                    { key: 'wondverzorging_basis', label: 'Wondverzorging (basis)' },
                  ]},
                  { title: 'Grondwerk & longeren', items: [
                    { key: 'grondwerk', label: 'Grondwerk' },
                    { key: 'longeren_basis', label: 'Longeren – basis' },
                    { key: 'longeren_bijzet', label: 'Longeren – met bijzet' },
                  ]},
                  { title: 'Hanteren & laden', items: [
                    { key: 'veilig_leiden', label: 'Leidt paard veilig' },
                    { key: 'trailerladen', label: 'Trailerladen' },
                    { key: 'schriktraining', label: 'Schriktraining' },
                  ]},
                  { title: 'Buiten & omgeving', items: [
                    { key: 'wandelen_aan_de_hand', label: 'Wandelen aan de hand' },
                    { key: 'verkeersmak_training_basis', label: 'Verkeersmak (basis)' },
                  ]},
                  { title: 'Training & herstel', items: [
                    { key: 'conditietraining_basis', label: 'Conditietraining (basis)' },
                    { key: 'revalidatie_volgen', label: 'Revalidatie-oefeningen volgen' },
                  ]},
                  { title: 'Stal & voeren', items: [
                    { key: 'stalwerk', label: 'Stalwerk' },
                    { key: 'voeren', label: 'Voeren' },
                  ]},
                  { title: 'Mennen', items: [
                    { key: 'mennen_vaardigheid', label: 'Mennen (vaardigheid)' },
                  ]},
                ];
                return (
                  <div className="space-y-5">
                    {groups.map(group => (
                      <div key={group.title}>
                        <span className="text-xs text-gray-500">{group.title}</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {group.items.map(item => {
                            const active = skills.general_skills.includes(item.key);
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                  const has = skills.general_skills.includes(item.key);
                                  const next = has
                                    ? skills.general_skills.filter(k => k !== item.key)
                                    : [...skills.general_skills, item.key];
                                  setSkills({ ...skills, general_skills: next });
                                }}
                                className={`px-3 py-2 rounded-full border text-sm transition-colors ${
                                  active ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >{item.label}</button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step 9: Voorkeuren */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">9</span>
                Voorkeuren
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Materiaal voorkeuren</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'bitless_ok', label: 'Bitloos OK' },
                    { key: 'spurs', label: 'Sporen OK' },
                    { key: 'auxiliary_reins', label: 'Hulpteugels OK' },
                    { key: 'own_helmet', label: 'Eigen cap' },
                  ].map(item => {
                    const active = !!preferences.material_preferences[item.key];
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setPreferences({
                          ...preferences,
                          material_preferences: {
                            ...preferences.material_preferences,
                            [item.key]: !active
                          }
                        })}
                        className={`px-3 py-2 rounded-full border text-sm transition-colors ${
                          active ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zijn er gezondheidsbeperkingen die invloed hebben op het rijden?</label>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHasHealthRestrictions(true);
                    }}
                    className={`px-3 py-1.5 rounded-full border text-sm ${hasHealthRestrictions ? 'bg-red-100 border-red-500 text-red-700' : 'bg-white border-gray-300 text-gray-700'}`}
                  >Ja</button>
                  <button
                    type="button"
                    onClick={() => {
                      setHasHealthRestrictions(false);
                      // wis selectie indien Nee
                      setPreferences({ ...preferences, health_restrictions: [] });
                      setHealthOther('');
                    }}
                    className={`px-3 py-1.5 rounded-full border text-sm ${!hasHealthRestrictions ? 'bg-green-100 border-green-500 text-green-700' : 'bg-white border-gray-300 text-gray-700'}`}
                  >Nee</button>
                </div>

                {hasHealthRestrictions && (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-3">
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
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Anders, namelijk</label>
                      <input
                        type="text"
                        value={healthOther}
                        onChange={(e) => {
                          const val = e.target.value;
                          setHealthOther(val);
                          // update in array als 'anders: <text>'
                          const othersFiltered = (preferences.health_restrictions || []).filter(i => !(typeof i === 'string' && i.startsWith('anders:')));
                          const next = val && val.trim() !== '' ? [...othersFiltered, `anders: ${val.trim()}`] : othersFiltered;
                          setPreferences({ ...preferences, health_restrictions: next });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="bijv. astma, rughernia, etc."
                      />
                    </div>
                  </>
                )}
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

          {/* Step 10: Media & Voltooien */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-sm">10</span>
                Media & Voltooien
              </h2>

              <div className="space-y-8">
                {/* Overige foto's (exclusief profielfoto) */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Overige foto’s</label>
                    <span className="text-xs text-gray-500">De eerste foto (Stap 1) is je profielfoto</span>
                  </div>
                  <ImageUploader
                    value={(media.photos || []).slice(1)}
                    onChange={async (urls) => {
                      const avatar = (media.photos || [])[0];
                      const merged = avatar ? [avatar, ...urls] : urls;
                      setMedia({ ...media, photos: merged });
                      try {
                        const api = createAPI(getToken);
                        await api.riderProfile.createOrUpdate({ photos: merged });
                      } catch (e) {
                        console.warn('Autosave galerij mislukt:', e?.message || e);
                      }
                    }}
                    api={createAPI(getToken)}
                    max={8}
                  />
                </div>

                {/* Video’s (meerdere, ordenbaar) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video’s</label>
                  <VideosUploader
                    value={Array.isArray(media.videos) ? media.videos : []}
                    onChange={async (urls) => {
                      setMedia({ ...media, videos: urls });
                      try {
                        const api = createAPI(getToken);
                        await api.riderProfile.createOrUpdate({ videos: urls, video_intro_url: (urls && urls[0]) ? urls[0] : '' });
                      } catch (e) {
                        console.warn('Autosave video’s mislukt:', e?.message || e);
                      }
                    }}
                    api={createAPI(getToken)}
                    maxItems={5}
                  />
                  <p className="text-xs text-gray-500 mt-2">Eerste video wordt als hoofdvideo gebruikt.</p>
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
