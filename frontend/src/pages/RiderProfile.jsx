import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI, transformProfileDataFromAPI } from '../utils/api';
import { calculateRiderProfileProgress, getIncompleteSteps } from '../utils/riderProfileProgress';

const RiderProfile = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, getToken } = useKindeAuth();
  const [profileData, setProfileData] = useState(null);
  const api = createAPI(getToken);
  const [loading, setLoading] = useState(true);

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const apiData = await api.riderProfile.get();
        const transformedData = transformProfileDataFromAPI(apiData);
        setProfileData(transformedData);
      } catch (error) {
        console.error('Error fetching rider profile:', error);
        // Als er geen profiel is, gebruik default data
        const defaultProfileData = {
          basicInfo: {
            first_name: user?.given_name || '',
            last_name: user?.family_name || '',
            phone: '',
            date_of_birth: '',
            postcode: '',
            max_travel_distance_km: 25,
            transport_options: []
          },
          availability: {
            available_days: [],
            available_time_blocks: [],
            session_duration_min: 60,
            session_duration_max: 120,
            start_date: '',
            arrangement_duration: 'ongoing'
          },
          budget: {
            budget_min_euro: 150,
            budget_max_euro: 250,
            budget_type: 'monthly'
          },
          experience: {
            experience_years: 0,
            certification_level: '',
            comfort_levels: {
              traffic: false,
              outdoor_solo: false,
              nervous_horses: false,
              young_horses: false,
              jumping_height: 0
            }
          },
          goals: {
            riding_goals: [],
            discipline_preferences: [],
            personality_style: []
          },
          tasks: {
            willing_tasks: [],
            task_frequency: ''
          },
          preferences: {
            material_preferences: {
              bitless_ok: false,
              spurs: false,
              auxiliary_reins: false,
              own_helmet: true
            },
            health_restrictions: [],
            insurance_coverage: false,
            no_gos: []
          },
          media: {
            photos: [],
            video_intro_url: ''
          }
        };
        setProfileData(defaultProfileData);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Profiel laden...</p>
        </div>
      </div>
    );
  }

  const progressPercentage = calculateRiderProfileProgress(profileData);
  const incompleteSteps = getIncompleteSteps(profileData);

  const handleEditProfile = () => {
    navigate('/rider-onboarding');
  };

  

  const handleCompleteStep = (stepNumber) => {
    navigate(`/rider-onboarding?step=${stepNumber}`);
  };

  // Helpers voor tegel-status en samenvatting
  const humanizeActivityMode = (mode) => {
    switch (mode) {
      case 'care_only': return 'Verzorging';
      case 'ride_only': return 'Rijden';
      case 'ride_or_care': return 'Rijden of verzorgen';
      case 'drive_only': return 'Mennen';
      default: return null;
    }
  };

  const availabilitySummaryLines = (() => {
    const sched = profileData.availability?.available_schedule || {};
    const days = Object.keys(sched).filter(d => Array.isArray(sched[d]) && sched[d].length>0);
    if (days.length === 0) {
      // fallback naar oude velden
      const daysText = (profileData.availability?.available_days || []).slice(0,3).join(', ') || 'n.v.t.';
      const blocksText = (profileData.availability?.available_time_blocks || []).slice(0,3).join(', ') || 'n.v.t.';
      return [`Dagen: ${daysText}`, `Blokken: ${blocksText}`];
    }
    // Compact per dag: "Ma: ochtend/middag"
    return days.slice(0,4).map(d => `${d.slice(0,2)}: ${(sched[d]||[]).join('/')}`);
  })();

  const tiles = [
    {
      step: 1,
      title: 'Basisinformatie',
      complete: !!(profileData.basicInfo.first_name && profileData.basicInfo.postcode),
      summary: [
        `${profileData.basicInfo.first_name || ''} ${profileData.basicInfo.last_name || ''}`.trim() || 'Naam: n.v.t.',
        profileData.basicInfo.postcode ? `Postcode: ${profileData.basicInfo.postcode}` : 'Postcode: n.v.t.',
        profileData.basicInfo.city ? `Plaats: ${profileData.basicInfo.city}` : 'Plaats: n.v.t.',
        (Array.isArray(profileData.media.photos) && profileData.media.photos.length>0) ? 'Profielfoto: aanwezig' : 'Profielfoto: ontbreekt',
      ],
    },
    {
      step: 2,
      title: 'Beschikbaarheid',
      complete: (() => {
        const sched = profileData.availability?.available_schedule || {};
        const hasSched = Object.values(sched).some(arr => Array.isArray(arr) && arr.length>0);
        return hasSched || (profileData.availability.available_days?.length>0 && profileData.availability.available_time_blocks?.length>0);
      })(),
      summary: availabilitySummaryLines,
    },
    {
      step: 3,
      title: 'Budget',
      complete: (typeof profileData.budget.budget_min_euro==='number' && typeof profileData.budget.budget_max_euro==='number'),
      summary: [
        `€${profileData.budget.budget_min_euro} - €${profileData.budget.budget_max_euro}`,
      ],
    },
    {
      step: 4,
      title: 'Ervaring & Activiteiten',
      complete: (typeof profileData.experience.experience_years==='number' && profileData.experience.experience_years>0) || (Array.isArray(profileData.experience.activity_preferences) && profileData.experience.activity_preferences.length>0) || !!profileData.experience.activity_mode,
      summary: [
        `Ervaring: ${profileData.experience.experience_years || 0} jaar`,
        (() => {
          const label = humanizeActivityMode(profileData.experience.activity_mode);
          return label ? `Modus: ${label}` : 'Modus: n.v.t.';
        })(),
      ],
    },
    {
      step: 5,
      title: 'Doelen & Disciplines',
      complete: (profileData.goals.riding_goals?.length>0 || profileData.goals.discipline_preferences?.length>0),
      summary: [
        `Doelen: ${(profileData.goals.riding_goals||[]).slice(0,3).join(', ') || 'n.v.t.'}`,
        `Disciplines: ${(profileData.goals.discipline_preferences||[]).slice(0,3).join(', ') || 'n.v.t.'}`,
      ],
    },
    {
      step: 6,
      title: 'Vaardigheden',
      complete: (profileData.skills?.general_skills?.length>0),
      summary: [
        `Skills: ${(profileData.skills?.general_skills||[]).slice(0,4).join(', ') || 'n.v.t.'}`,
      ],
    },
    {
      step: 7,
      title: 'Lease-voorkeuren',
      complete: !!profileData.lease?.wants_lease || (profileData.lease && Object.keys(profileData.lease).length>0),
      summary: [
        profileData.lease?.wants_lease ? 'Lease: ja' : 'Lease: n.v.t.',
        (profileData.lease?.budget_max_pm_lease!=null) ? `Max: €${profileData.lease.budget_max_pm_lease}/mnd` : 'Budget: n.v.t.',
      ],
    },
    {
      step: 8,
      title: 'Taken',
      complete: (profileData.tasks.willing_tasks?.length>0 || !!profileData.tasks.task_frequency),
      summary: [
        `Taken: ${(profileData.tasks.willing_tasks||[]).slice(0,4).join(', ') || 'n.v.t.'}`,
        `Frequentie: ${profileData.tasks.task_frequency || 'n.v.t.'}`,
      ],
    },
    {
      step: 9,
      title: 'Voorkeuren',
      complete: (Array.isArray(profileData.preferences.health_restrictions) && profileData.preferences.health_restrictions.length>0) || (Array.isArray(profileData.preferences.no_gos) && profileData.preferences.no_gos.length>0) || (profileData.preferences.material_preferences && Object.keys(profileData.preferences.material_preferences).length>0),
      summary: [
        `No-go's: ${(profileData.preferences.no_gos||[]).slice(0,3).join(', ') || 'n.v.t.'}`,
      ],
    },
    {
      step: 10,
      title: 'Media',
      complete: (profileData.media.photos?.length>0 || (Array.isArray(profileData.media.videos) && profileData.media.videos.length>0) || !!profileData.media.video_intro_url),
      summary: [
        `Foto's: ${profileData.media.photos?.length || 0}`,
        `Video's: ${(Array.isArray(profileData.media.videos)? profileData.media.videos.length : (profileData.media.video_intro_url?1:0))}`,
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-role-soft py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mr-4" style={{ backgroundColor: 'var(--role-primary)' }}>
                <span className="text-2xl">🏇</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profileData.basicInfo.first_name} {profileData.basicInfo.last_name}
                </h1>
                <p className="text-gray-600">Ruiter Profiel</p>
              </div>
            </div>
            <button
              onClick={handleEditProfile}
              className="btn-role"
            >
              Profiel Bewerken
            </button>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Profiel Volledigheid</h2>
            <span className="text-2xl font-bold text-role">{progressPercentage}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div 
              className="h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%`, backgroundColor: 'var(--role-primary)' }}
            ></div>
          </div>

          {incompleteSteps.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-medium text-yellow-800 mb-2">
                Nog {incompleteSteps.length} stap{incompleteSteps.length > 1 ? 'pen' : ''} te voltooien:
              </h3>
              <div className="space-y-2">
                {incompleteSteps.map(step => (
                  <button
                    key={step.step}
                    onClick={() => handleCompleteStep(step.step)}
                    className="flex items-center text-sm text-yellow-700 hover:text-yellow-900 transition-colors"
                  >
                    <span className="w-5 h-5 bg-yellow-200 rounded-full flex items-center justify-center mr-2 text-xs">
                      {step.step}
                    </span>
                    {step.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {progressPercentage === 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <span className="text-green-600 mr-2">✅</span>
                <span className="text-green-800 font-medium">Profiel is compleet!</span>
              </div>
            </div>
          )}
        </div>

        

        {/* Media Section (foto's en video's zichtbaar) */}
        {(profileData.media.photos.length > 0 || profileData.media.video_intro_url || (Array.isArray(profileData.media.videos) && profileData.media.videos.length>0)) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>

            {/* Foto's */}
            {profileData.media.photos.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Foto's</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {profileData.media.photos.map((photo, index) => (
                    <img key={index} src={photo} alt={`foto-${index}`} className="aspect-square object-cover rounded-lg border" />
                  ))}
                </div>
              </div>
            )}

            {/* Video's */}
            {(() => {
              const videos = Array.isArray(profileData.media.videos) ? profileData.media.videos : [];
              const legacy = profileData.media.video_intro_url && !videos.includes(profileData.media.video_intro_url) ? [profileData.media.video_intro_url] : [];
              const all = [...videos, ...legacy];
              if (all.length === 0) return null;
              return (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Video's</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {all.map((url, idx) => (
                      url.match(/\.(mp4|mov|webm)(\?|$)/i) ? (
                        <video key={idx} src={url} controls className="w-full rounded-lg border bg-black/5" />
                      ) : (
                        <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block p-3 rounded-lg border hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded bg-gray-200 flex items-center justify-center">🎥</div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">Externe video</div>
                              <div className="text-xs text-blue-600 underline break-all">{url}</div>
                            </div>
                          </div>
                        </a>
                      )
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tegel-overzicht per onboarding stap */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Jouw profielonderdelen</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {tiles.map(t => (
              <div key={t.step} className="border rounded-lg p-4 hover:shadow-sm transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 text-xs rounded-full flex items-center justify-center text-white" style={{ backgroundColor: 'var(--role-primary)' }}>{t.step}</span>
                    <h4 className="font-medium text-gray-900">{t.title}</h4>
                  </div>
                  {t.complete ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Compleet</span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">Aanvullen</span>
                  )}
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-3">
                  {t.summary.map((line, i) => (
                    <li key={i}>• {line}</li>
                  ))}
                </ul>
                <button onClick={() => handleCompleteStep(t.step)} className="text-sm text-role font-medium hover:underline">
                  Bewerken →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* (Legacy detailblokken verwijderd; tegels zijn nu de waarheid) */}

        {/* Action Buttons */}
        <div className="mt-8 flex justify-center space-x-4">
          <button
            onClick={handleEditProfile}
            className="btn-role"
          >
            Profiel Bewerken
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiderProfile;
