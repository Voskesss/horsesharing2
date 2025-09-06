import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI } from '../utils/api';

const ProfileChoice = () => {
  const navigate = useNavigate();
  const { isAuthenticated, getToken } = useKindeAuth();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReset, setShowReset] = useState(false);

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  // Maak API instance met token functie
  const api = createAPI(getToken);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userData = await api.user.getMe();
        setUserInfo(userData);
        
        // Als user al een profile type heeft gekozen, redirect naar juiste onboarding
        if (userData.profile_type_chosen) {
          if (userData.profile_type_chosen === 'rider') {
            if (userData.onboarding_completed) {
              navigate('/rider-profile');
            } else {
              navigate('/rider-onboarding');
            }
          } else if (userData.profile_type_chosen === 'owner') {
            navigate('/owner-onboarding');
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate, api.user]);

  const handleChoice = async (type) => {
    try {
      await api.user.setProfileType(type);
      if (type === 'rider') {
        navigate('/rider-onboarding');
      } else if (type === 'owner') {
        navigate('/owner-onboarding');
      }
    } catch (error) {
      console.error('Error setting profile type:', error);
      alert('Er ging iets mis. Probeer het opnieuw.');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Weet je zeker dat je je profiel wilt resetten? Alle gegevens worden verwijderd.')) {
      try {
        await api.user.resetProfile();
        setUserInfo({...userInfo, profile_type_chosen: null, onboarding_completed: false});
        setShowReset(false);
        alert('Profiel succesvol gereset!');
      } catch (error) {
        console.error('Error resetting profile:', error);
        alert('Er ging iets mis bij het resetten. Probeer het opnieuw.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 py-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 py-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Welkom bij HorseSharing!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Kies je profiel om te beginnen met het vinden van je perfecte match
          </p>
          
          {/* Reset knop als user al een keuze heeft gemaakt */}
          {userInfo?.profile_type_chosen && (
            <div className="mt-6">
              <button
                onClick={() => setShowReset(!showReset)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Verkeerde keuze gemaakt? Reset je profiel
              </button>
              
              {showReset && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                  <p className="text-sm text-yellow-800 mb-3">
                    Dit verwijdert al je profiel gegevens permanent.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={handleReset}
                      className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                    >
                      Ja, reset profiel
                    </button>
                    <button
                      onClick={() => setShowReset(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-400"
                    >
                      Annuleren
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Ruiter Card */}
          <div 
            onClick={() => handleChoice('rider')}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 p-8 border-2 border-transparent hover:border-blue-200"
          >
            <div className="text-center">
              <div className="text-6xl mb-6">🏇</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ik ben een Ruiter</h2>
              <p className="text-gray-600 mb-6">
                Ik zoek een paard om mee te rijden en te verzorgen
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• Vind paarden in jouw buurt</li>
                  <li>• Stel je eigen schema in</li>
                  <li>• Bouw een band met paarden</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Eigenaar Card */}
          <div 
            onClick={() => handleChoice('owner')}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 p-8 border-2 border-transparent hover:border-emerald-200"
          >
            <div className="text-center">
              <div className="text-6xl mb-6">🐴</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Ik ben een Eigenaar</h2>
              <p className="text-gray-600 mb-6">
                Ik heb een paard en zoek iemand om mee te delen
              </p>
              <div className="bg-emerald-50 rounded-lg p-4">
                <ul className="text-sm text-emerald-800 space-y-2">
                  <li>• Vind betrouwbare ruiters</li>
                  <li>• Deel de zorg voor je paard</li>
                  <li>• Verdien bij met sharing</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Je profiel keuze wordt automatisch onthouden
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileChoice;
