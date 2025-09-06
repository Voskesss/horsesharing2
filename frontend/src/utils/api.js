// API utility functions voor backend communicatie

const API_BASE_URL = 'http://localhost:8000';

// Helper functie voor API calls met authentication
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('kinde_token'); // Kinde token uit localStorage
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// Rider Profile API calls
export const riderProfileAPI = {
  // Haal rider profile op
  async get() {
    return apiCall('/rider-profile');
  },

  // Maak of update rider profile
  async createOrUpdate(profileData) {
    return apiCall('/rider-profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },
};

// User API calls
export const userAPI = {
  // Haal huidige user info op
  async getMe() {
    return apiCall('/auth/me');
  },

  // Voltooi onboarding
  async completeOnboarding(profileType) {
    return apiCall('/auth/complete-onboarding', {
      method: 'POST',
      body: JSON.stringify({ profile_type: profileType }),
    });
  },
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
export function transformAPIDataForProfile(apiData) {
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
