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
        // Prefill foto vanuit owner indien rider nog leeg heeft
        try {
          const me = await api.user.getMe();
          const ownerUrl = me?.owner_photo_url || '';
          if ((!Array.isArray(transformedData.media.photos) || transformedData.media.photos.length === 0) && ownerUrl) {
            transformedData.media.photos = [ownerUrl];
          }
        } catch {}
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

        

        {/* Media Section */}
        {(profileData.media.photos.length > 0 || profileData.media.video_intro_url) && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Media</h3>
            
            {/* Foto's */}
            {profileData.media.photos.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Profiel foto's</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {profileData.media.photos.map((photo, index) => (
                    <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-2xl mb-1 block">📷</span>
                        <span className="text-xs text-gray-500">{photo}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {profileData.media.video_intro_url && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Video introductie</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🎥</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Video introductie</p>
                      <a 
                        href={profileData.media.video_intro_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Bekijk video
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Profile Sections */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basis Informatie */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basis Informatie</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Naam:</span>
                <p className="font-medium">
                  {profileData.basicInfo.first_name} {profileData.basicInfo.last_name}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Telefoon:</span>
                <p className="font-medium">{profileData.basicInfo.phone || 'Niet ingevuld'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Postcode:</span>
                <p className="font-medium">{profileData.basicInfo.postcode || 'Niet ingevuld'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Max reisafstand:</span>
                <p className="font-medium">{profileData.basicInfo.max_travel_distance_km} km</p>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Budget range:</span>
                <p className="font-medium">
                  €{profileData.budget.budget_min_euro} - €{profileData.budget.budget_max_euro}
                </p>
              </div>
            </div>
          </div>

          {/* Ervaring */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ervaring</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Jaren ervaring:</span>
                <p className="font-medium">{profileData.experience.experience_years} jaar</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Niveau:</span>
                <p className="font-medium">
                  {profileData.experience.certification_level || 'Niet ingevuld'}
                </p>
              </div>
              {Array.isArray(profileData.experience.certifications) && profileData.experience.certifications.length > 0 && (
                <div>
                  <span className="text-sm text-gray-500">Certificeringen:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profileData.experience.certifications.map(cert => (
                      <span key={cert} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Max spronghoogte:</span>
                <p className="font-medium">{profileData.experience.comfort_levels.jumping_height} cm</p>
              </div>
            </div>
          </div>

          {/* Beschikbaarheid */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Beschikbaarheid</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Dagen:</span>
                <p className="font-medium">
                  {profileData.availability.available_days.length > 0 
                    ? profileData.availability.available_days.join(', ')
                    : 'Niet ingevuld'
                  }
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Tijdsblokken:</span>
                <p className="font-medium">
                  {profileData.availability.available_time_blocks.length > 0 
                    ? profileData.availability.available_time_blocks.join(', ')
                    : 'Niet ingevuld'
                  }
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Sessie duur:</span>
                <p className="font-medium">
                  {profileData.availability.session_duration_min} - {profileData.availability.session_duration_max} min
                </p>
              </div>
            </div>
          </div>

          {/* Doelen */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Doelen & Disciplines</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Rijdoelen:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profileData.goals.riding_goals.length > 0 ? (
                    profileData.goals.riding_goals.map(goal => (
                      <span key={goal} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {goal.replace('_', ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Niet ingevuld</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Disciplines:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profileData.goals.discipline_preferences.length > 0 ? (
                    profileData.goals.discipline_preferences.map(discipline => (
                      <span key={discipline} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {discipline.replace('_', ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Niet ingevuld</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Taken */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bereid te Helpen</h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Taken:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profileData.tasks.willing_tasks.length > 0 ? (
                    profileData.tasks.willing_tasks.map(task => (
                      <span key={task} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {task.replace('_', ' ')}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">Niet ingevuld</span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Frequentie:</span>
                <p className="font-medium">
                  {profileData.tasks.task_frequency || 'Niet ingevuld'}
                </p>
              </div>
            </div>
          </div>
        </div>

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
