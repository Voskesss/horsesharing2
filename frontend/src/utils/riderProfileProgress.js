// Utility functies voor rider profile progress berekening
// Kan gebruikt worden in onboarding en dashboard

// Definieer welke velden verplicht zijn per stap
export const REQUIRED_FIELDS = {
  1: { // Basis informatie
    fields: ['first_name', 'last_name', 'phone', 'date_of_birth', 'postcode'],
    weight: 1
  },
  2: { // Beschikbaarheid
    fields: ['available_days', 'available_time_blocks'],
    weight: 1
  },
  3: { // Budget
    fields: ['budget_min_euro', 'budget_max_euro'],
    weight: 1
  },
  4: { // Ervaring
    fields: ['experience_years', 'certification_level'],
    weight: 1
  },
  5: { // Doelen
    fields: ['riding_goals', 'discipline_preferences'],
    weight: 1
  },
  6: { // Taken
    fields: ['willing_tasks'],
    weight: 1
  },
  7: { // Voorkeuren
    fields: ['health_restrictions', 'insurance_coverage'],
    weight: 0.5 // Optioneel, lagere weight
  },
  8: { // Media
    fields: [], // Geen verplichte velden
    weight: 0.5 // Optioneel
  }
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
    preferences = {},
    media = {}
  } = profileData;

  let totalWeight = 0;
  let completedWeight = 0;

  // Stap 1: Basis informatie
  const step1Required = REQUIRED_FIELDS[1].fields;
  const step1Completed = step1Required.every(field => {
    const value = basicInfo[field];
    return value !== '' && value !== null && value !== undefined;
  });
  totalWeight += REQUIRED_FIELDS[1].weight;
  if (step1Completed) completedWeight += REQUIRED_FIELDS[1].weight;

  // Stap 2: Beschikbaarheid
  const step2Completed = 
    availability.available_days?.length > 0 && 
    availability.available_time_blocks?.length > 0;
  totalWeight += REQUIRED_FIELDS[2].weight;
  if (step2Completed) completedWeight += REQUIRED_FIELDS[2].weight;

  // Stap 3: Budget
  const step3Completed = 
    budget.budget_min_euro > 0 && 
    budget.budget_max_euro > 0;
  totalWeight += REQUIRED_FIELDS[3].weight;
  if (step3Completed) completedWeight += REQUIRED_FIELDS[3].weight;

  // Stap 4: Ervaring
  const step4Completed = 
    experience.experience_years >= 0 && 
    experience.certification_level !== '';
  totalWeight += REQUIRED_FIELDS[4].weight;
  if (step4Completed) completedWeight += REQUIRED_FIELDS[4].weight;

  // Stap 5: Doelen
  const step5Completed = 
    goals.riding_goals?.length > 0 && 
    goals.discipline_preferences?.length > 0;
  totalWeight += REQUIRED_FIELDS[5].weight;
  if (step5Completed) completedWeight += REQUIRED_FIELDS[5].weight;

  // Stap 6: Taken
  const step6Completed = tasks.willing_tasks?.length > 0;
  totalWeight += REQUIRED_FIELDS[6].weight;
  if (step6Completed) completedWeight += REQUIRED_FIELDS[6].weight;

  // Stap 7: Voorkeuren (optioneel, lagere weight)
  const step7Completed = 
    preferences.health_restrictions !== undefined && 
    preferences.insurance_coverage !== undefined;
  totalWeight += REQUIRED_FIELDS[7].weight;
  if (step7Completed) completedWeight += REQUIRED_FIELDS[7].weight;

  // Stap 8: Media (optioneel, lagere weight)
  // Geen verplichte velden, maar telt mee voor volledigheid
  totalWeight += REQUIRED_FIELDS[8].weight;
  if (media.photos?.length > 0 || media.video_intro_url !== '') {
    completedWeight += REQUIRED_FIELDS[8].weight;
  }

  return Math.round((completedWeight / totalWeight) * 100);
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
    preferences = {},
    media = {}
  } = profileData;

  const incompleteSteps = [];

  // Check elke stap
  const step1Required = REQUIRED_FIELDS[1].fields;
  const step1Completed = step1Required.every(field => {
    const value = basicInfo[field];
    return value !== '' && value !== null && value !== undefined;
  });
  if (!step1Completed) incompleteSteps.push({ step: 1, title: 'Basis Informatie' });

  const step2Completed = 
    availability.available_days?.length > 0 && 
    availability.available_time_blocks?.length > 0;
  if (!step2Completed) incompleteSteps.push({ step: 2, title: 'Beschikbaarheid' });

  const step3Completed = 
    budget.budget_min_euro > 0 && 
    budget.budget_max_euro > 0;
  if (!step3Completed) incompleteSteps.push({ step: 3, title: 'Budget' });

  const step4Completed = 
    experience.experience_years >= 0 && 
    experience.certification_level !== '';
  if (!step4Completed) incompleteSteps.push({ step: 4, title: 'Ervaring' });

  const step5Completed = 
    goals.riding_goals?.length > 0 && 
    goals.discipline_preferences?.length > 0;
  if (!step5Completed) incompleteSteps.push({ step: 5, title: 'Doelen' });

  const step6Completed = tasks.willing_tasks?.length > 0;
  if (!step6Completed) incompleteSteps.push({ step: 6, title: 'Taken' });

  return incompleteSteps;
};

// Check of profiel minimaal compleet is (verplichte stappen)
export const isProfileMinimallyComplete = (profileData) => {
  const progress = calculateRiderProfileProgress(profileData);
  return progress >= 75; // 75% van verplichte velden ingevuld
};

// Geef volgende stap die ingevuld moet worden
export const getNextIncompleteStep = (profileData) => {
  const incompleteSteps = getIncompleteSteps(profileData);
  return incompleteSteps.length > 0 ? incompleteSteps[0].step : null;
};
