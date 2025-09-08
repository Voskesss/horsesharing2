// API utility functions voor backend communicatie

const API_BASE_URL = 'http://localhost:8000';

// Helper functie voor API calls met authentication
// Deze functie verwacht dat de token wordt meegegeven
async function apiCall(endpoint, options = {}, token = null) {
  if (!token) {
    throw new Error('Not authenticated');
  }
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 403 || response.status === 401) {
      throw new Error('Not authenticated');
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    console.error('Detailed API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: error,
      endpoint: endpoint,
      method: config.method
    });
    const errorMessage = error.detail || error.message || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return response.json();
}

// Maak API object dat token gebruikt
export const createAPI = (getToken) => ({
  // Rider Profile API calls
  riderProfile: {
    // Haal rider profile op
    async get() {
      const token = await getToken();
      return apiCall('/rider-profile', {}, token);
    },

    // Maak of update rider profile
    async createOrUpdate(profileData) {
      const token = await getToken();
      return apiCall('/rider-profile', {
        method: 'POST',
        body: JSON.stringify(profileData),
      }, token);
    },
  },

  // User API calls
  user: {
    // Haal huidige user info op
    async getMe() {
      const token = await getToken();
      return apiCall('/auth/me', {}, token);
    },

    // Stel profile type in
    async setProfileType(profileType) {
      const token = await getToken();
      return apiCall('/auth/set-profile-type', {
        method: 'POST',
        body: JSON.stringify({ profile_type: profileType }),
      }, token);
    },

    // Reset profiel
    async resetProfile() {
      const token = await getToken();
      return apiCall('/auth/reset-profile', {
        method: 'POST',
      }, token);
    },

    // Voltooi onboarding
    async completeOnboarding(profileType) {
      const token = await getToken();
      return apiCall('/auth/complete-onboarding', {
        method: 'POST',
        body: JSON.stringify({ profile_type: profileType }),
      }, token);
    },
  },
});

// Legacy exports voor backwards compatibility
export const riderProfileAPI = {
  get: () => { throw new Error('Use createAPI with token instead'); },
  createOrUpdate: () => { throw new Error('Use createAPI with token instead'); },
};

export const userAPI = {
  getMe: () => { throw new Error('Use createAPI with token instead'); },
  setProfileType: () => { throw new Error('Use createAPI with token instead'); },
  resetProfile: () => { throw new Error('Use createAPI with token instead'); },
  completeOnboarding: () => { throw new Error('Use createAPI with token instead'); },
};

// Transform frontend profile data naar backend format
export function transformProfileDataForAPI(profileData) {
  const {
    basicInfo = {},
    availability = {},
    budget = {},
    experience = {},
    goals = {},
    tasks = {},
    preferences = {},
    media = {},
  } = profileData || {};

  // Helper: voeg veld toe als het betekenisvol is
  const out = {};
  const add = (key, value, { allowFalse = false } = {}) => {
    const isArray = Array.isArray(value);
    const isString = typeof value === 'string';
    const isNumber = typeof value === 'number';
    const isBool = typeof value === 'boolean';
    const isObject = value && typeof value === 'object' && !isArray;

    if (value === undefined || value === null) return;
    if (isArray && value.length === 0) return;
    if (isString && value.trim() === '') return;
    if (isNumber && Number.isNaN(value)) return;
    if (isBool && !allowFalse && value === false) return;
    if (isObject && Object.keys(value).length === 0) return;
    out[key] = value;
  };

  // Basis informatie
  add('first_name', basicInfo.first_name);
  add('last_name', basicInfo.last_name);
  add('phone', basicInfo.phone);
  add('date_of_birth', basicInfo.date_of_birth);
  add('postcode', basicInfo.postcode);
  add('max_travel_distance_km', basicInfo.max_travel_distance_km);
  add('transport_options', Array.isArray(basicInfo.transport_options) ? basicInfo.transport_options : []);

  // Beschikbaarheid
  add('available_days', Array.isArray(availability.available_days) ? availability.available_days : []);
  add('available_time_blocks', Array.isArray(availability.available_time_blocks) ? availability.available_time_blocks : []);
  add('session_duration_min', availability.session_duration_min);
  add('session_duration_max', availability.session_duration_max);
  add('start_date', availability.start_date);
  add('arrangement_duration', availability.arrangement_duration);

  // Budget (per maand)
  add('budget_min_euro', budget.budget_min_euro);
  add('budget_max_euro', budget.budget_max_euro);

  // Ervaring
  add('experience_years', experience.experience_years);
  add('certification_level', experience.certification_level); // legacy compat
  add('certifications', Array.isArray(experience.certifications) ? experience.certifications : []);
  add('comfort_levels', experience.comfort_levels);

  // Doelen
  add('riding_goals', Array.isArray(goals.riding_goals) ? goals.riding_goals : []);
  add('discipline_preferences', Array.isArray(goals.discipline_preferences) ? goals.discipline_preferences : []);
  add('personality_style', Array.isArray(goals.personality_style) ? goals.personality_style : []);

  // Taken
  add('willing_tasks', Array.isArray(tasks.willing_tasks) ? tasks.willing_tasks : []);
  add('task_frequency', tasks.task_frequency);

  // Voorkeuren
  add('material_preferences', preferences.material_preferences);
  add('health_restrictions', preferences.health_restrictions);
  // insurance_coverage: false is betekenisvol, dus allowFalse: true
  add('insurance_coverage', preferences.insurance_coverage, { allowFalse: true });
  add('no_gos', Array.isArray(preferences.no_gos) ? preferences.no_gos : []);
  // Rijstijl & uitrusting
  add('riding_styles', Array.isArray(preferences.riding_styles) ? preferences.riding_styles : []);

  // Media
  add('photos', Array.isArray(media.photos) ? media.photos : []);
  add('video_intro_url', media.video_intro_url);

  return out;
}

// Helper functie om JSON strings te parsen naar arrays
function parseJSONArray(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

// Transform backend data naar frontend format
export function transformProfileDataFromAPI(apiData) {
  return {
    basicInfo: {
      first_name: apiData.first_name || '',
      last_name: apiData.last_name || '',
      phone: apiData.phone || '',
      date_of_birth: apiData.date_of_birth || '',
      postcode: apiData.postcode || '',
      max_travel_distance_km: apiData.max_travel_distance || apiData.max_travel_distance_km || 25,
      transport_options: parseJSONArray(apiData.transport_options)
    },
    availability: {
      available_days: parseJSONArray(apiData.available_days),
      available_time_blocks: parseJSONArray(apiData.available_time_blocks),
      session_duration_min: apiData.session_duration_min || 60,
      session_duration_max: apiData.session_duration_max || 120,
      start_date: apiData.start_date || '',
      arrangement_duration: apiData.duration_preference || apiData.arrangement_duration || 'ongoing'
    },
    budget: {
      budget_min_euro: apiData.budget_min || apiData.budget_min_euro || 150,
      budget_max_euro: apiData.budget_max || apiData.budget_max_euro || 250
    },
    experience: {
      experience_years: apiData.years_experience || apiData.experience_years || 0,
      certification_level: apiData.fnrs_level || apiData.certification_level || '',
      certifications: Array.isArray(apiData.certifications) ? apiData.certifications : [],
      comfort_levels: apiData.comfort_levels ? {
        traffic: !!apiData.comfort_levels.traffic,
        outdoor_solo: !!apiData.comfort_levels.outdoor_solo,
        nervous_horses: !!apiData.comfort_levels.nervous_horses,
        young_horses: !!apiData.comfort_levels.young_horses,
        stallions: !!apiData.comfort_levels.stallions,
        trail_rides: !!apiData.comfort_levels.trail_rides,
        jumping_height: apiData.comfort_levels.jumping_height || 0,
      } : {
        traffic: apiData.comfortable_with_traffic || false,
        outdoor_solo: apiData.comfortable_solo_outside || false,
        nervous_horses: false,
        young_horses: false,
        stallions: false,
        trail_rides: Array.isArray(apiData.discipline_preferences) ? apiData.discipline_preferences.includes('buitenritten') : false,
        jumping_height: apiData.max_jump_height || 0,
      }
    },
    goals: {
      riding_goals: parseJSONArray(apiData.goals || apiData.riding_goals),
      discipline_preferences: parseJSONArray(apiData.discipline_preferences),
      personality_style: parseJSONArray(apiData.personality_style)
    },
    tasks: {
      willing_tasks: parseJSONArray(apiData.willing_tasks),
      task_frequency: apiData.task_frequency || ''
    },
    preferences: {
      material_preferences: {
        bitless_ok: apiData.bitless_ok || false,
        spurs: false,
        auxiliary_reins: apiData.training_aids_ok || false,
        own_helmet: true,
      },
      health_restrictions: parseJSONArray(apiData.health_limitations),
      insurance_coverage: apiData.has_insurance || false,
      no_gos: parseJSONArray(apiData.no_gos),
      riding_styles: parseJSONArray(apiData.riding_styles)
    },
    media: {
      photos: parseJSONArray(apiData.photos),
      video_intro_url: apiData.video_intro || apiData.video_intro_url || ''
    }
  };
}
