// Utility functies voor rider profile progress berekening
// Doel: twee aparte metrics bieden
// 1) publishableReady(profileData): boolean – minimale set ingevuld om te publiceren
// 2) calculateMatchingScore(profileData): number (0-100) – bijdrage aan betere matching

// Helper: veilige getters
const safeArrLen = (x) => Array.isArray(x) ? x.length : 0;
const calcAge = (dobStr) => {
  if (!dobStr) return null;
  try {
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  } catch {
    return null;
  }
};

// 1) Minimaal publiceerbaar (sectie-criteria)
export const publishableReady = (profileData = {}) => {
  const {
    basicInfo = {},
    address = {},
    availability = {},
    budget = {},
    experience = {},
    goals = {},
    tasks = {},
    preferences = {},
    media = {},
  } = profileData;

  // Basis: voornaam + achternaam + adres + 1 profielfoto + lengte/gewicht + geboortedatum (+ minderjarigenlogica)
  const hasName = !!(basicInfo.first_name && String(basicInfo.first_name).trim());
  const hasLastName = !!(basicInfo.last_name && String(basicInfo.last_name).trim());
  const hasAddress = !!(address && address.postcode && address.house_number);
  const hasAvatar = Array.isArray(media.photos) && media.photos.length >= 1;
  const heightOk = Number(basicInfo.rider_height_cm) > 0;
  const weightOk = Number(basicInfo.rider_weight_kg) > 0;
  const age = calcAge(basicInfo.date_of_birth);
  const hasDob = age !== null; // geldig datumformaat vereist
  // Minderjarig (<=16): consent vereist; bij consent true ook naam+email begeleider
  let minorOk = true;
  if (hasDob && age <= 16) {
    const consent = basicInfo.parent_consent;
    const ifConsentThenContacts = consent === true ? (
      !!(basicInfo.parent_contact_name && String(basicInfo.parent_contact_name).trim()) &&
      !!(basicInfo.parent_contact_email && String(basicInfo.parent_contact_email).trim())
    ) : true;
    minorOk = (consent === true || consent === false) && ifConsentThenContacts;
  }
  const basisOk = hasName && hasLastName && hasAddress && hasAvatar && heightOk && weightOk && hasDob && minorOk;

  // Beschikbaarheid: min. 1 dag met 1 blok via schedule of fallback
  const schedule = availability.available_schedule || {};
  const hasSchedule = !!schedule && Object.values(schedule).some(arr => Array.isArray(arr) && arr.length > 0);
  const availOk = hasSchedule || (safeArrLen(availability.available_days) > 0 && safeArrLen(availability.available_time_blocks) > 0);

  // Budget: >0 en min <= max
  const minB = Number(budget.budget_min_euro);
  const maxB = Number(budget.budget_max_euro);
  const budgetOk = (minB > 0 && maxB > 0 && minB <= maxB);

  // Gewenste paard/pony: type én (hoogte-range of maat-categorie)
  const dh = (preferences && preferences.desired_horse) || {};
  const hasType = Array.isArray(dh.type) && dh.type.length > 0;
  const hasHeight = (dh.schofthoogte_cm_min !== '' && dh.schofthoogte_cm_min != null) || (dh.schofthoogte_cm_max !== '' && dh.schofthoogte_cm_max != null);
  const hasSizeCats = Array.isArray(dh.size_categories) && dh.size_categories.length > 0;
  const desiredHorseOk = hasType && (hasHeight || hasSizeCats);

  // Ervaring: algemene criteria of specifiek mennen
  const yearsOk = Number(experience.experience_years) > 0;
  const modeOk = !!experience.activity_mode;
  const prefsOk = Array.isArray(experience.activity_preferences) && experience.activity_preferences.length > 0;
  const isDriveOnly = experience.activity_mode === 'drive_only';
  const mennenOk = isDriveOnly ? !!experience.mennen_experience : true;
  const experienceOk = mennenOk && (yearsOk || modeOk || prefsOk);

  // Doelen: alleen verplicht als rijden in scope
  const rideInScope = experience.activity_mode === 'ride_only' || experience.activity_mode === 'ride_or_care';
  const goalsOk = !rideInScope || (safeArrLen(goals.riding_goals) > 0 || safeArrLen(goals.discipline_preferences) > 0);

  // Taken: minstens 1 taak of frequentie
  const tasksOk = (safeArrLen(tasks.willing_tasks) > 0) || !!tasks.task_frequency;

  return !!(basisOk && availOk && budgetOk && desiredHorseOk && experienceOk && goalsOk && tasksOk);
};

// 2) Matching score (sectie-gewogen)
// Voorstel weging (totaal 100):
// Basis 18, Beschikbaarheid 15, Budget 12, Ervaring 15, Gewenste paard 12,
// Doelen 10 (alleen als rijden in scope), Taken 6, Vaardigheden 6, Voorkeuren 3, Extra media 3
export const calculateMatchingScore = (profileData = {}) => {
  const {
    basicInfo = {},
    address = {},
    availability = {},
    budget = {},
    experience = {},
    goals = {},
    tasks = {},
    skills = {},
    preferences = {},
    media = {},
  } = profileData;

  let score = 0;

  // Basis (18): naam + adres + avatar (zoals publiceerbaar)
  const hasName = !!(basicInfo.first_name && String(basicInfo.first_name).trim());
  const hasAddress = !!(address && address.postcode && address.house_number);
  const hasAvatar = Array.isArray(media.photos) && media.photos.length >= 1;
  if (hasName && hasAddress && hasAvatar) score += 18;

  // Beschikbaarheid (15)
  const schedule = availability.available_schedule || {};
  const hasSchedule = !!schedule && Object.values(schedule).some(arr => Array.isArray(arr) && arr.length > 0);
  if (hasSchedule || (safeArrLen(availability.available_days) > 0 && safeArrLen(availability.available_time_blocks) > 0)) score += 15;

  // Budget (12)
  const minB = Number(budget.budget_min_euro);
  const maxB = Number(budget.budget_max_euro);
  if (minB > 0 && maxB > 0 && minB <= maxB) score += 12;

  // Ervaring (15)
  const yearsOk = Number(experience.experience_years) > 0;
  const modeOk = !!experience.activity_mode;
  const prefsOk = Array.isArray(experience.activity_preferences) && experience.activity_preferences.length > 0;
  const isDriveOnly = experience.activity_mode === 'drive_only';
  const mennenOk = isDriveOnly ? !!experience.mennen_experience : true;
  if (mennenOk && (yearsOk || modeOk || prefsOk)) score += 15;

  // Gewenste paard (12)
  const dh = (preferences && preferences.desired_horse) || {};
  const hasType = Array.isArray(dh.type) && dh.type.length > 0;
  const hasHeight = (dh.schofthoogte_cm_min !== '' && dh.schofthoogte_cm_min != null) || (dh.schofthoogte_cm_max !== '' && dh.schofthoogte_cm_max != null);
  if (hasType || hasHeight) score += 12;

  // Doelen (10) – alleen als rijden in scope
  const rideInScope = experience.activity_mode === 'ride_only' || experience.activity_mode === 'ride_or_care';
  if (rideInScope && (safeArrLen(goals.riding_goals) > 0 || safeArrLen(goals.discipline_preferences) > 0)) score += 10;

  // Taken (6)
  if (safeArrLen(tasks.willing_tasks) > 0 || !!tasks.task_frequency) score += 6;

  // Vaardigheden (6)
  if (safeArrLen(skills.general_skills) > 0) score += 6;

  // Voorkeuren (3) – iets ingevuld
  const hasHealth = safeArrLen(preferences.health_restrictions) > 0;
  const hasNoGos = safeArrLen(preferences.no_gos) > 0;
  const hasMat = preferences.material_preferences && Object.keys(preferences.material_preferences).some(k => preferences.material_preferences[k] === true);
  if (hasHealth || hasNoGos || hasMat) score += 3;

  // Extra media (3) – bovenop avatar (meer foto’s of video)
  const extraPhotos = Array.isArray(media.photos) && media.photos.length > 1;
  const hasVideos = Array.isArray(media.videos) && media.videos.length > 0;
  const hasIntro = !!media.video_intro_url;
  if (extraPhotos || hasVideos || hasIntro) score += 3;

  return Math.max(0, Math.min(100, Math.round(score)));
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

  // 4: Gewenste paard/pony (type én (hoogte of maat-categorie))
  {
    const dh = (preferences && preferences.desired_horse) || {};
    const hasType = Array.isArray(dh.type) && dh.type.length > 0;
    const hasHeight = (dh.schofthoogte_cm_min !== '' && dh.schofthoogte_cm_min != null) || (dh.schofthoogte_cm_max !== '' && dh.schofthoogte_cm_max != null);
    const hasSizeCats = Array.isArray(dh.size_categories) && dh.size_categories.length > 0;
    const desiredOk = hasType && (hasHeight || hasSizeCats);
    if (!desiredOk) incompleteSteps.push({ step: 4, title: 'Gewenste paard/pony' });
  }

  // 5: Doelen & Disciplines (alleen verplicht als rijden in scope)
  {
    const rideInScope = experience.activity_mode === 'ride_only' || experience.activity_mode === 'ride_or_care';
    const goalsOk = (Array.isArray(goals.riding_goals) && goals.riding_goals.length>0) || (Array.isArray(goals.discipline_preferences) && goals.discipline_preferences.length>0);
    if (rideInScope && !goalsOk) incompleteSteps.push({ step: 5, title: 'Doelen & Disciplines' });
  }

  // 6: Taken
  if (!((Array.isArray(tasks.willing_tasks) && tasks.willing_tasks.length>0) || !!tasks.task_frequency)) incompleteSteps.push({ step: 6, title: 'Taken' });

  // 7: Ervaring & Activiteiten
  if (!((Number(experience.experience_years)>0) || !!experience.activity_mode || (Array.isArray(experience.activity_preferences) && experience.activity_preferences.length>0))) incompleteSteps.push({ step: 7, title: 'Ervaring & Activiteiten' });

  // 8: Vaardigheden
  if (!(Array.isArray(skills.general_skills) && skills.general_skills.length>0)) incompleteSteps.push({ step: 8, title: 'Vaardigheden' });

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
export const isProfileMinimallyComplete = (profileData) => publishableReady(profileData);

// Geef volgende stap die ingevuld moet worden
export const getNextIncompleteStep = (profileData) => {
  const incompleteSteps = getIncompleteSteps(profileData);
  return incompleteSteps.length > 0 ? incompleteSteps[0].step : null;
};

// Backward compatibility: oude naam blijft werken, verwijst naar matching score
export const calculateRiderProfileProgress = (profileData) => calculateMatchingScore(profileData);
