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
    skills = {},
    lease = {},
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
  add('house_number', basicInfo.house_number);
  add('city', basicInfo.city);
  add('max_travel_distance_km', basicInfo.max_travel_distance_km);
  add('transport_options', Array.isArray(basicInfo.transport_options) ? basicInfo.transport_options : []);
  // Lichaamskenmerken & bio
  if (basicInfo.rider_height_cm !== '' && basicInfo.rider_height_cm != null) add('rider_height_cm', basicInfo.rider_height_cm);
  if (basicInfo.rider_weight_kg !== '' && basicInfo.rider_weight_kg != null) add('rider_weight_kg', basicInfo.rider_weight_kg);
  if (typeof basicInfo.rider_bio === 'string') add('rider_bio', basicInfo.rider_bio);
  // Minderjarigen begeleiding
  add('parent_consent', basicInfo.parent_consent, { allowFalse: true });
  if (basicInfo.parent_contact_name || basicInfo.parent_contact_email) {
    const name = (basicInfo.parent_contact_name || '').trim();
    const email = (basicInfo.parent_contact_email || '').trim();
    const combined = email ? `${name}${name ? ' ' : ''}<${email}>` : name;
    add('parent_contact', combined);
  }

  // Beschikbaarheid
  const hasScheduleObj = availability.available_schedule && typeof availability.available_schedule === 'object' && Object.keys(availability.available_schedule).length > 0;
  if (hasScheduleObj) {
    add('available_schedule', availability.available_schedule);
  } else {
    add('available_days', Array.isArray(availability.available_days) ? availability.available_days : []);
    add('available_time_blocks', Array.isArray(availability.available_time_blocks) ? availability.available_time_blocks : []);
  }
  add('session_duration_min', availability.session_duration_min);
  add('session_duration_max', availability.session_duration_max);
  add('start_date', availability.start_date);
  add('arrangement_duration', availability.arrangement_duration);
  add('min_days_per_week', availability.min_days_per_week);

  // Budget (per maand)
  add('budget_min_euro', budget.budget_min_euro);
  add('budget_max_euro', budget.budget_max_euro);

  // Ervaring
  add('experience_years', experience.experience_years);
  add('certification_level', experience.certification_level); // legacy compat
  add('certifications', Array.isArray(experience.certifications) ? experience.certifications : []);
  add('comfort_levels', experience.comfort_levels);
  // Activiteiten
  add('activity_mode', experience.activity_mode);
  add('activity_preferences', Array.isArray(experience.activity_preferences) ? experience.activity_preferences : []);
  add('mennen_experience', experience.mennen_experience);

  // Doelen
  add('riding_goals', Array.isArray(goals.riding_goals) ? goals.riding_goals : []);
  add('discipline_preferences', Array.isArray(goals.discipline_preferences) ? goals.discipline_preferences : []);
  add('personality_style', Array.isArray(goals.personality_style) ? goals.personality_style : []);

  // Vaardigheden
  add('general_skills', Array.isArray(skills.general_skills) ? skills.general_skills : []);

  // Lease voorkeuren (alles onder lease_preferences)
  const leasePrefs = {};
  if (lease && typeof lease === 'object') {
    if (lease.wants_lease) leasePrefs.wants_lease = true;
    if (typeof lease.budget_max_pm_lease === 'number' && !Number.isNaN(lease.budget_max_pm_lease)) {
      leasePrefs.budget_max_pm_lease = lease.budget_max_pm_lease;
    }
    // multi-selects of null
    if (Array.isArray(lease.location_preference) && lease.location_preference.length) {
      leasePrefs.location_preference = lease.location_preference;
    } else if (lease.location_preference === null) {
      leasePrefs.location_preference = null;
    }
    if (Array.isArray(lease.scope_preference) && lease.scope_preference.length) {
      leasePrefs.scope_preference = lease.scope_preference;
    } else if (lease.scope_preference === null) {
      leasePrefs.scope_preference = null;
    }
    // duration
    if (lease.duration && typeof lease.duration === 'object') {
      const d = {
        type: lease.duration.type ?? null,
        months: typeof lease.duration.months === 'number' && !Number.isNaN(lease.duration.months)
          ? lease.duration.months
          : (lease.duration.months === null ? null : undefined)
      };
      // only add if any key defined (including null to indicate 'any')
      if (d.type !== undefined || d.months !== undefined) {
        leasePrefs.duration = d;
      }
    }
    // booleans of null
    if (lease.eigen_stalplek_beschikbaar === true || lease.eigen_stalplek_beschikbaar === false || lease.eigen_stalplek_beschikbaar === null) {
      leasePrefs.eigen_stalplek_beschikbaar = lease.eigen_stalplek_beschikbaar;
    }
    if (lease.kan_transporteren === true || lease.kan_transporteren === false || lease.kan_transporteren === null) {
      leasePrefs.kan_transporteren = lease.kan_transporteren;
    }
    // inclusies verplicht
    if (Array.isArray(lease.required_inclusions) && lease.required_inclusions.length) {
      leasePrefs.required_inclusions = lease.required_inclusions;
    } else if (lease.required_inclusions === null) {
      leasePrefs.required_inclusions = null;
    }
  }
  if (Object.keys(leasePrefs).length > 0) add('lease_preferences', leasePrefs);

  // Taken
  add('willing_tasks', Array.isArray(tasks.willing_tasks) ? tasks.willing_tasks : []);
  add('task_frequency', tasks.task_frequency);

  // Voorkeuren
  add('material_preferences', preferences.material_preferences);
  add('health_restrictions', preferences.health_restrictions);
  // insurance_coverage: false is betekenisvol, dus allowFalse: true
  add('insurance_coverage', preferences.insurance_coverage, { allowFalse: true });
  // Gewenste paard-kenmerken
  if (preferences.desired_horse && typeof preferences.desired_horse === 'object') {
    const dh = preferences.desired_horse;
    const clean = { ...dh };
    // normaliseer lege strings naar null voor numerieke velden
    ['schofthoogte_cm_min','schofthoogte_cm_max','leeftijd_min','leeftijd_max'].forEach(k => {
      if (clean[k] === '') clean[k] = null;
    });
    add('desired_horse', clean);
  }
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
      house_number: apiData.house_number || '',
      city: apiData.city || '',
      max_travel_distance_km: apiData.max_travel_distance_km || apiData.max_travel_distance || 25,
      transport_options: Array.isArray(apiData.transport_options) ? apiData.transport_options : [],
      rider_height_cm: (typeof apiData.rider_height_cm === 'number') ? apiData.rider_height_cm : (apiData.rider_height_cm || ''),
      rider_weight_kg: (typeof apiData.rider_weight_kg === 'number') ? apiData.rider_weight_kg : (apiData.rider_weight_kg || ''),
      rider_bio: apiData.rider_bio || '',
      parent_consent: (apiData.parent_consent === true || apiData.parent_consent === false) ? apiData.parent_consent : null,
      ...(() => {
        const raw = apiData.parent_contact || '';
        const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
        if (m) {
          return { parent_contact_name: m[1] || '', parent_contact_email: m[2] || '' };
        }
        return { parent_contact_name: raw || '', parent_contact_email: '' };
      })()
    },
    availability: {
      available_days: parseJSONArray(apiData.available_days),
      available_time_blocks: parseJSONArray(apiData.available_time_blocks),
      available_schedule: apiData.available_schedule && typeof apiData.available_schedule === 'object'
        ? apiData.available_schedule
        : (() => {
            // Fallback: bouw schedule op basis van arrays
            const days = parseJSONArray(apiData.available_days);
            const blocks = parseJSONArray(apiData.available_time_blocks);
            const obj = {};
            days.forEach(d => { obj[d] = blocks; });
            return obj;
          })(),
      session_duration_min: apiData.session_duration_min || 60,
      session_duration_max: apiData.session_duration_max || 120,
      start_date: apiData.start_date || '',
      arrangement_duration: apiData.duration_preference || apiData.arrangement_duration || 'ongoing',
      min_days_per_week: (apiData.min_days_per_week !== undefined && apiData.min_days_per_week !== null)
        ? apiData.min_days_per_week
        : 1
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
      ,
      // Activiteiten
      activity_mode: apiData.activity_mode || null,
      activity_preferences: parseJSONArray(apiData.activity_preferences),
      mennen_experience: apiData.mennen_experience || null
    },
    goals: {
      riding_goals: parseJSONArray(apiData.goals || apiData.riding_goals),
      discipline_preferences: parseJSONArray(apiData.discipline_preferences),
      personality_style: parseJSONArray(apiData.personality_style)
    },
    skills: {
      general_skills: parseJSONArray(apiData.general_skills)
    },
    lease: (() => {
      const lp = apiData.lease_preferences || {};
      const out = {
        wants_lease: !!lp.wants_lease,
        budget_max_pm_lease: typeof lp.budget_max_pm_lease === 'number' ? lp.budget_max_pm_lease : undefined,
        location_preference: Array.isArray(lp.location_preference) ? lp.location_preference : null,
        scope_preference: Array.isArray(lp.scope_preference) ? lp.scope_preference : null,
        duration: {
          type: (lp.duration && (lp.duration.type === 'doorlopend' || lp.duration.type === 'vaste_periode')) ? lp.duration.type : null,
          months: lp.duration && typeof lp.duration.months === 'number' ? lp.duration.months : null,
        },
        eigen_stalplek_beschikbaar: [true,false,null].includes(lp.eigen_stalplek_beschikbaar) ? lp.eigen_stalplek_beschikbaar : null,
        kan_transporteren: [true,false,null].includes(lp.kan_transporteren) ? lp.kan_transporteren : null,
        required_inclusions: Array.isArray(lp.required_inclusions) ? lp.required_inclusions : null,
      };
      return out;
    })(),
    tasks: {
      willing_tasks: parseJSONArray(apiData.willing_tasks),
      task_frequency: apiData.task_frequency || ''
    },
    preferences: {
      material_preferences: apiData.material_preferences ? {
        bitless_ok: !!apiData.material_preferences.bitless_ok,
        spurs: !!apiData.material_preferences.spurs,
        auxiliary_reins: !!apiData.material_preferences.auxiliary_reins,
        own_helmet: apiData.material_preferences.own_helmet !== undefined ? !!apiData.material_preferences.own_helmet : true,
      } : {
        // Fallback op oudere top-level velden
        bitless_ok: !!apiData.bitless_ok,
        spurs: !!apiData.spurs_ok,
        auxiliary_reins: !!apiData.training_aids_ok,
        own_helmet: true,
      },
      health_restrictions: parseJSONArray(apiData.health_restrictions) || parseJSONArray(apiData.health_limitations),
      insurance_coverage: !!apiData.insurance_coverage,
      no_gos: parseJSONArray(apiData.no_gos),
      desired_horse: (() => {
        const dh = apiData.desired_horse || {};
        return {
          type: Array.isArray(dh.type) ? dh.type : [],
          schofthoogte_cm_min: (typeof dh.schofthoogte_cm_min === 'number') ? dh.schofthoogte_cm_min : '',
          schofthoogte_cm_max: (typeof dh.schofthoogte_cm_max === 'number') ? dh.schofthoogte_cm_max : '',
          geslacht: Array.isArray(dh.geslacht) ? dh.geslacht : [],
          leeftijd_min: (typeof dh.leeftijd_min === 'number') ? dh.leeftijd_min : '',
          leeftijd_max: (typeof dh.leeftijd_max === 'number') ? dh.leeftijd_max : '',
          ras: dh.ras || '',
          stamboek: dh.stamboek || '',
          disciplines_paard: Array.isArray(dh.disciplines_paard) ? dh.disciplines_paard : [],
          handgevoeligheid: dh.handgevoeligheid || '',
          temperament: Array.isArray(dh.temperament) ? dh.temperament : [],
          vergevingsgezindheid: dh.vergevingsgezindheid || '',
          ervaring_rijder_nodig: dh.ervaring_rijder_nodig || '',
          vachtkleuren: Array.isArray(dh.vachtkleuren) ? dh.vachtkleuren : [],
          niet_belangrijk_vachtkleur: !!dh.niet_belangrijk_vachtkleur,
        };
      })(),
      riding_styles: parseJSONArray(apiData.riding_styles)
    },
    media: {
      photos: parseJSONArray(apiData.photos),
      video_intro_url: apiData.video_intro || apiData.video_intro_url || ''
    }
  };
}
