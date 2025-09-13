import React, { useEffect, useRef, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useNavigate, Link } from 'react-router-dom';
import { createAPI } from '../utils/api';
import heroVideo from '../assets/twee_vrouwen_homepage.mp4';

const HomePage = () => {
  const { login, isAuthenticated, getToken } = useKindeAuth();
  const [roleIndex, setRoleIndex] = useState(0);
  const roles = ['bijrijder', 'leaser', 'verzorger'];
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const videoRef = useRef(null);

  // Laad optioneel user info, maar niet automatisch redirecten
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (!isAuthenticated) return;
        const api = createAPI(getToken);
        const data = await api.user.getMe();
        if (mounted) setMe(data);
      } catch {}
    };
    load();
    return () => { mounted = false; };
  }, [isAuthenticated, getToken]);

  useEffect(() => {
    const t = setInterval(() => {
      setRoleIndex((i) => (i + 1) % roles.length);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Cinematic Video Background (clipPath) */}
      <section className="relative overflow-hidden">

        {/* Video achtergrond zonder vervorming (object-cover) + masker voor vloeiende rechterzijde */}
        <div className="absolute inset-0 hidden sm:block">
          <div
            className="absolute inset-0"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, white 70%, transparent 98%)',
              maskImage: 'linear-gradient(to right, white 70%, transparent 98%)',
            }}
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              src={heroVideo}
              autoPlay
              muted
              playsInline
              preload="metadata"
              onEnded={() => {
                try {
                  const v = videoRef.current;
                  if (v && !v.loop) {
                    // Zorg dat het laatste frame zichtbaar blijft
                    const end = Math.max(0, (v.duration || 0) - 0.01);
                    if (!isNaN(end) && isFinite(end)) {
                      v.currentTime = end;
                    }
                    v.pause();
                  }
                } catch {}
              }}
            />
            {/* Vignet overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/45 pointer-events-none" />
          </div>
        </div>

        {/* Gradient fallback for XS screens */}
        <div className="absolute inset-0 sm:hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center md:text-left md:pl-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)]">HorseSharing</span>
              <br />
              <span className="text-white sm:text-gray-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">e‑Matching tussen paard en </span>
              <span className="inline-block min-w-[10ch]">
                <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent animate-pulse drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
                  {roles[roleIndex]}
                </span>
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-white/95 sm:text-gray-100 mb-12 max-w-3xl md:max-w-xl md:ml-0 mx-auto leading-relaxed drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]">
              Het eerste centrale platform voor bijrijders en paardeneigenaren. 
              <span className="font-semibold text-emerald-200 sm:text-emerald-600"> Betere matching, meer bereik, minder moeite.</span>
            </p>
            {!isAuthenticated ? (
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 md:justify-start justify-center items-center">
                {/* Primair */}
                <button
                  onClick={login}
                  className="group bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-bold py-3.5 px-7 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center">
                    Begin met matchen
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
                {/* Secundair wit */}
                <a
                  href="#why"
                  className="py-3.5 px-7 rounded-full text-lg font-semibold bg-white/95 hover:bg-white text-gray-800 shadow-md hover:shadow-lg transition-all"
                >
                  Meer lezen
                </a>
                <p className="text-sm text-white/90 sm:text-gray-200">✨ Gratis tot je eerste succesvolle match</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 md:justify-start justify-center items-center">
                {/* Primair */}
                <Link
                  to="/profile-choice"
                  className="group bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-bold py-3.5 px-7 rounded-full text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  <span className="flex items-center">
                    Ga verder met onboarding
                    <svg className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
                {/* Secundair wit */}
                {me?.has_rider_profile && (
                  <Link
                    to="/rider-profile"
                    className="py-3.5 px-7 rounded-full text-lg font-semibold bg-white/95 hover:bg-white text-gray-800 shadow-md hover:shadow-lg transition-all"
                  >
                    Naar mijn profiel
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zachte blob-overlay links voor extra diepte (alleen desktop) */}
        <div
          className="hidden md:block absolute -left-24 top-10 w-[480px] h-[480px] rounded-full opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(closest-side, rgba(16,185,129,0.30), rgba(59,130,246,0.18), transparent 70%)',
            filter: 'blur(6px)'
          }}
        />

        {/* Gelaagde golf-divider aan onderkant voor vloeiende overgang */}
        <div className="absolute pointer-events-none left-0 right-0 bottom-[-48px] sm:bottom-[-56px] md:bottom-[-64px]">
          <svg className="w-full h-12 sm:h-16 md:h-20" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
            <path fill="rgba(255,255,255,0.85)" d="M0,224L60,224C120,224,240,224,360,186.7C480,149,600,75,720,64C840,53,960,107,1080,138.7C1200,171,1320,181,1380,186.7L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
          </svg>
          <svg className="w-full h-10 sm:h-14 md:h-16 -mt-8" viewBox="0 0 1440 320" preserveAspectRatio="none" aria-hidden="true">
            <path fill="white" d="M0,256L60,245.3C120,235,240,213,360,213.3C480,213,600,235,720,229.3C840,224,960,192,1080,170.7C1200,149,1320,139,1380,133.3L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
          </svg>
        </div>
      </section>

      {/* Why HorseSharing Section */}
      <div id="why" className="py-20 bg-white">
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
