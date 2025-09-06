import React, { useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { login, isAuthenticated } = useKindeAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile-choice');
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient */}
      <div className="relative bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 overflow-hidden">
        <div className="absolute inset-0 bg-white/70"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 leading-tight">
              Verbind Paarden
              <br />
              <span className="text-gray-800">met Ruiters</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto leading-relaxed">
              Het eerste centrale platform voor bijrijders en paardeneigenaren. 
              <span className="font-semibold text-emerald-600"> Betere matching, meer bereik, minder moeite.</span>
            </p>
            {!isAuthenticated && (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={login}
                  className="group bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center">
                    Begin met matchen
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
                <p className="text-sm text-gray-600">
                  ✨ Gratis tot je eerste succesvolle match
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-emerald-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-blue-200 rounded-full opacity-60 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-purple-200 rounded-full opacity-60 animate-pulse delay-2000"></div>
      </div>

      {/* Why HorseSharing Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Waarom HorseSharing?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Er zijn veel platforms voor bijrijders, maar er is geen centraal punt. 
              <span className="font-semibold text-emerald-600"> Wij veranderen dat.</span>
            </p>
          </div>
          
          {/* Problems vs Solutions */}
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
            {/* Problems */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-red-600 mb-8 flex items-center">
                <span className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">❌</span>
                Huidige Problemen
              </h3>
              
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-2xl border border-red-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🔍</span>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Versnipperde markt</h4>
                    <p className="text-gray-700">
                      Bijrijders en eigenaren zoeken op verschillende platforms. Veel moeite, weinig resultaat.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-2xl border border-red-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">💰</span>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Stijgende kosten</h4>
                    <p className="text-gray-700">
                      De paardensport wordt steeds duurder. Voor veel mensen wordt het lastig om het aan te houden.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-2xl border border-red-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">😞</span>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Slechte matches</h4>
                    <p className="text-gray-700">
                      Advertenties geven weinig informatie. Veel tijd verspild aan verkeerde matches.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Solutions */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-emerald-600 mb-8 flex items-center">
                <span className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-3">✅</span>
                Onze Oplossing
              </h3>
              
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-2xl border border-emerald-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🌟</span>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Centraal platform</h4>
                    <p className="text-gray-700">
                      Alle bijrijders en eigenaren op één plek. Meer bereik, betere kansen op de perfecte match.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-2xl border border-emerald-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🧠</span>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Slimme matching</h4>
                    <p className="text-gray-700">
                      Ons algoritme matcht op basis van ervaring, doelen, karakter en locatie. Net als dating, maar dan beter.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-2xl border border-emerald-100 hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <span className="text-3xl mr-4">🤝</span>
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Kosten delen</h4>
                    <p className="text-gray-700">
                      Door kosten te delen wordt paardrijden toegankelijker. Meer mensen kunnen van de sport genieten.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Perfecte Matches</h3>
              <p className="text-gray-600">
                Ons algoritme zorgt voor matches die echt bij je passen, gebaseerd op ervaring en doelen.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Veilige Communicatie</h3>
              <p className="text-gray-600">
                Veilig chatten en kennismaken voordat je elkaar ontmoet. Privacy staat voorop.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gemakkelijk Beheer</h3>
              <p className="text-gray-600">
                Beheer je matches, afspraken en betalingen allemaal op één plek. Simpel en overzichtelijk.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Klaar om te beginnen?
          </h2>
          <p className="text-xl text-emerald-100 mb-10 leading-relaxed">
            Maak een account aan en vind jouw perfecte match. 
            <span className="font-semibold text-white"> Gratis tot je eerste succesvolle match.</span>
          </p>
          {!isAuthenticated && (
            <button
              onClick={login}
              className="group bg-white text-emerald-600 hover:text-emerald-700 font-bold py-4 px-10 rounded-full text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300"
            >
              <span className="flex items-center">
                Gratis account aanmaken
                <svg className="ml-3 w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
