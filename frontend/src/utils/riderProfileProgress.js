// Utility functies voor rider profile progress berekening
// Kan gebruikt worden in onboarding en dashboard

// Nieuwe 10-staps indeling en weging (telt op tot 10 voor eenvoud)
export const REQUIRED_FIELDS = {
  1: { weight: 1 }, // Basisinformatie
  2: { weight: 1 }, // Beschikbaarheid
  3: { weight: 1 }, // Budget
  4: { weight: 1 }, // Ervaring & Activiteiten
  5: { weight: 1 }, // Doelen & Disciplines
  6: { weight: 1 }, // Vaardigheden
  7: { weight: 1 }, // Lease-voorkeuren
  8: { weight: 1 }, // Taken
  9: { weight: 1 }, // Voorkeuren
 10: { weight: 1 }, // Media
};

// Bereken progress percentage gebaseerd op ingevulde verplichte velden
export const calculateRiderProfileProgress = (profileData) => {
  const {
    basicInfo = {},
    availability = {},
    budget = {},
    experience = {},
    goals = {},
    tasks = {},
    skills = {},
    lease = {},
    preferences = {},
    media = {}
  } = profileData;

  const w = (n) => REQUIRED_FIELDS[n].weight;
  const sumWeights = Object.values(REQUIRED_FIELDS).reduce((a,b)=>a+b.weight,0);
  let score = 0;

  // 1: Basisinformatie (relaxed)
  const step1Completed = !!(basicInfo.first_name && basicInfo.postcode);
  if (step1Completed) score += w(1);

  // 2: Beschikbaarheid: min. 1 dag met 1 blok (liefst via available_schedule)
  const schedule = availability.available_schedule || {};
  const hasSchedule = !!schedule && Object.values(schedule).some(arr => Array.isArray(arr) && arr.length>0);
  const step2Completed = hasSchedule || (availability.available_days?.length>0 && availability.available_time_blocks?.length>0);
  if (step2Completed) score += w(2);

  // 3: Budget: beide > 0
  const step3Completed = (Number(budget.budget_min_euro)>0 && Number(budget.budget_max_euro)>0);
  if (step3Completed) score += w(3);

  // 4: Ervaring & Activiteiten: enige van (years>0 | activity_mode | activity_preferences>0)
  const step4Completed = (Number(experience.experience_years)>0) || !!experience.activity_mode || (Array.isArray(experience.activity_preferences) && experience.activity_preferences.length>0);
  if (step4Completed) score += w(4);

  // 5: Doelen & Disciplines: minstens 1 ingevuld
  const step5Completed = (Array.isArray(goals.riding_goals) && goals.riding_goals.length>0) || (Array.isArray(goals.discipline_preferences) && goals.discipline_preferences.length>0);
  if (step5Completed) score += w(5);

  // 6: Vaardigheden
  const step6Completed = Array.isArray(skills.general_skills) && skills.general_skills.length>0;
  if (step6Completed) score += w(6);

  // 7: Lease-voorkeuren (iets ingevuld)
  const leaseKeys = lease && typeof lease==='object' ? Object.keys(lease).filter(k=> lease[k]!==null && lease[k]!==undefined && lease[k]!=='' ) : [];
  const step7Completed = leaseKeys.length>0;
  if (step7Completed) score += w(7);

  // 8: Taken
  const step8Completed = (Array.isArray(tasks.willing_tasks) && tasks.willing_tasks.length>0) || !!tasks.task_frequency;
  if (step8Completed) score += w(8);

  // 9: Voorkeuren (iets ingevuld)
  const hasHealth = Array.isArray(preferences.health_restrictions) && preferences.health_restrictions.length>0;
  const hasNoGos = Array.isArray(preferences.no_gos) && preferences.no_gos.length>0;
  const hasMat = preferences.material_preferences && Object.keys(preferences.material_preferences).some(k=> preferences.material_preferences[k]===true);
  const step9Completed = hasHealth || hasNoGos || hasMat;
  if (step9Completed) score += w(9);

  // 10: Media
  const hasVideos = Array.isArray(media.videos) && media.videos.length>0;
  const hasPhotos = Array.isArray(media.photos) && media.photos.length>0;
  const hasIntro = !!media.video_intro_url;
  const step10Completed = hasPhotos || hasVideos || hasIntro;
  if (step10Completed) score += w(10);

  return Math.round((score / sumWeights) * 100);
};

// Geef terug welke stappen nog niet compleet zijn
export const getIncompleteSteps = (profileData) => {
  const {
    basicInfo = {},
    availability = {},
    budget = {},
    experience = {},
    goals = {},
    tasks = {},
    skills = {},
    lease = {},
    preferences = {},
    media = {}
  } = profileData;

  const incompleteSteps = [];

  // 1: Basisinformatie
  if (!(basicInfo.first_name && basicInfo.postcode)) incompleteSteps.push({ step: 1, title: 'Basisinformatie' });

  // 2: Beschikbaarheid
  const schedule = availability.available_schedule || {};
  const hasSchedule = !!schedule && Object.values(schedule).some(arr => Array.isArray(arr) && arr.length>0);
  if (!(hasSchedule || (availability.available_days?.length>0 && availability.available_time_blocks?.length>0))) incompleteSteps.push({ step: 2, title: 'Beschikbaarheid' });

  // 3: Budget
  if (!(Number(budget.budget_min_euro)>0 && Number(budget.budget_max_euro)>0)) incompleteSteps.push({ step: 3, title: 'Budget' });

  // 4: Ervaring & Activiteiten
  if (!((Number(experience.experience_years)>0) || !!experience.activity_mode || (Array.isArray(experience.activity_preferences) && experience.activity_preferences.length>0))) incompleteSteps.push({ step: 4, title: 'Ervaring & Activiteiten' });

  // 5: Doelen & Disciplines
  if (!((Array.isArray(goals.riding_goals) && goals.riding_goals.length>0) || (Array.isArray(goals.discipline_preferences) && goals.discipline_preferences.length>0))) incompleteSteps.push({ step: 5, title: 'Doelen & Disciplines' });

  // 6: Vaardigheden
  if (!(Array.isArray(skills.general_skills) && skills.general_skills.length>0)) incompleteSteps.push({ step: 6, title: 'Vaardigheden' });

  // 7: Lease-voorkeuren
  const leaseKeys = lease && typeof lease==='object' ? Object.keys(lease).filter(k=> lease[k]!==null && lease[k]!==undefined && lease[k]!=='' ) : [];
  if (!(leaseKeys.length>0)) incompleteSteps.push({ step: 7, title: 'Lease-voorkeuren' });

  // 8: Taken
  if (!((Array.isArray(tasks.willing_tasks) && tasks.willing_tasks.length>0) || !!tasks.task_frequency)) incompleteSteps.push({ step: 8, title: 'Taken' });

  // 9: Voorkeuren
  const hasHealth = Array.isArray(preferences.health_restrictions) && preferences.health_restrictions.length>0;
  const hasNoGos = Array.isArray(preferences.no_gos) && preferences.no_gos.length>0;
  const hasMat = preferences.material_preferences && Object.keys(preferences.material_preferences).some(k=> preferences.material_preferences[k]===true);
  if (!(hasHealth || hasNoGos || hasMat)) incompleteSteps.push({ step: 9, title: 'Voorkeuren' });

  // 10: Media
  const hasVideos = Array.isArray(media.videos) && media.videos.length>0;
  const hasPhotos = Array.isArray(media.photos) && media.photos.length>0;
  const hasIntro = !!media.video_intro_url;
  if (!(hasPhotos || hasVideos || hasIntro)) incompleteSteps.push({ step: 10, title: 'Media' });

  return incompleteSteps;
};

// Check of profiel minimaal compleet is (verplichte stappen)
export const isProfileMinimallyComplete = (profileData) => {
  const progress = calculateRiderProfileProgress(profileData);
  return progress >= 70; // iets relaxter drempel
};

// Geef volgende stap die ingevuld moet worden
export const getNextIncompleteStep = (profileData) => {
  const incompleteSteps = getIncompleteSteps(profileData);
  return incompleteSteps.length > 0 ? incompleteSteps[0].step : null;
};
