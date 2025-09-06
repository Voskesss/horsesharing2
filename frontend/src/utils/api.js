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
    const errorMessage = error.detail || error.message || `HTTP ${response.status}`;
    console.error('API Error:', errorMessage, error);
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
    basicInfo,
    availability,
    budget,
    experience,
    goals,
    tasks,
    preferences,
    media
  } = profileData;

  return {
    // Basis informatie
    first_name: basicInfo.first_name || '',
    last_name: basicInfo.last_name || '',
    phone: basicInfo.phone || null,
    date_of_birth: basicInfo.date_of_birth || null,
    postcode: basicInfo.postcode || '',
    max_travel_distance_km: basicInfo.max_travel_distance_km || 25,
    transport_options: basicInfo.transport_options || [],
    
    // Beschikbaarheid
    available_days: availability.available_days || [],
    available_time_blocks: availability.available_time_blocks || [],
    session_duration_min: availability.session_duration_min || 60,
    session_duration_max: availability.session_duration_max || 120,
    start_date: availability.start_date || null,
    arrangement_duration: availability.arrangement_duration || 'ongoing',
    
    // Budget
    budget_min_euro: budget.budget_min_euro || 0,
    budget_max_euro: budget.budget_max_euro || 0,
    budget_type: budget.budget_type || 'monthly',
    
    // Ervaring
    experience_years: experience.experience_years || 0,
    certification_level: experience.certification_level || '',
    comfort_levels: experience.comfort_levels || {},
    
    // Doelen
    riding_goals: goals.riding_goals || [],
    discipline_preferences: goals.discipline_preferences || [],
    personality_style: goals.personality_style || [],
    
    // Taken
    willing_tasks: tasks.willing_tasks || [],
    task_frequency: tasks.task_frequency || null,
    
    // Voorkeuren
    material_preferences: preferences.material_preferences || {},
    health_restrictions: preferences.health_restrictions || [],
    insurance_coverage: preferences.insurance_coverage || false,
    no_gos: preferences.no_gos || [],
    
    // Media
    photos: media.photos || [],
    video_intro_url: media.video_intro_url || null,
  };
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
      max_travel_distance_km: apiData.max_travel_distance_km || 25,
      transport_options: apiData.transport_options || []
    },
    availability: {
      available_days: apiData.available_days || [],
      available_time_blocks: apiData.available_time_blocks || [],
      session_duration_min: apiData.session_duration_min || 60,
      session_duration_max: apiData.session_duration_max || 120,
      start_date: apiData.start_date || '',
      arrangement_duration: apiData.arrangement_duration || 'ongoing'
    },
    budget: {
      budget_min_euro: apiData.budget_min_euro || 150,
      budget_max_euro: apiData.budget_max_euro || 250,
      budget_type: apiData.budget_type || 'monthly'
    },
    experience: {
      experience_years: apiData.experience_years || 0,
      certification_level: apiData.certification_level || '',
      comfort_levels: apiData.comfort_levels || {
        traffic: false,
        outdoor_solo: false,
        nervous_horses: false,
        young_horses: false,
        jumping_height: 0
      }
    },
    goals: {
      riding_goals: apiData.riding_goals || [],
      discipline_preferences: apiData.discipline_preferences || [],
      personality_style: apiData.personality_style || []
    },
    tasks: {
      willing_tasks: apiData.willing_tasks || [],
      task_frequency: apiData.task_frequency || ''
    },
    preferences: {
      material_preferences: apiData.material_preferences || {
        bitless_ok: false,
        spurs: false,
        auxiliary_reins: false,
        own_helmet: true
      },
      health_restrictions: apiData.health_restrictions || [],
      insurance_coverage: apiData.insurance_coverage || false,
      no_gos: apiData.no_gos || []
    },
    media: {
      photos: apiData.photos || [],
      video_intro_url: apiData.video_intro_url || ''
    }
  };
}
