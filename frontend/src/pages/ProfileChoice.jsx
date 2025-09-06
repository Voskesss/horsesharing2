import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

const ProfileChoice = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useKindeAuth();

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleChoice = (type) => {
    if (type === 'rider') {
      navigate('/rider-onboarding');
    } else if (type === 'owner') {
      navigate('/owner-onboarding');
    }
  };

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
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Ruiter Card */}
          <div 
            onClick={() => handleChoice('rider')}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🏇</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ik ben een Ruiter
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Ik zoek een paard om mee te rijden en wil graag bijdragen aan de verzorging en kosten.
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Zoek paarden in je buurt
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Deel kosten en verantwoordelijkheden
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  Vind je ideale rijpartner
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 group-hover:scale-105">
                Start als Ruiter
              </button>
            </div>
          </div>

          {/* Eigenaar Card */}
          <div 
            onClick={() => handleChoice('owner')}
            className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:-translate-y-2 border border-gray-100"
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🐎</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Ik ben een Eigenaar
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Ik heb een paard en zoek een betrouwbare bijrijder om kosten en verzorging te delen.
              </p>
              <div className="space-y-2 text-sm text-gray-500 mb-6">
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                  Vind betrouwbare bijrijders
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                  Deel kosten en verzorging
                </div>
                <div className="flex items-center justify-center">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                  Meer tijd voor je paard
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 group-hover:scale-105">
                Start als Eigenaar
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-500 text-sm">
            Je kunt later altijd een tweede profiel aanmaken als je beide rollen hebt
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileChoice;
