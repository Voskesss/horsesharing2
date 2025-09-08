import React, { useEffect, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI } from '../utils/api';

const Navbar = () => {
  const { login, logout, isAuthenticated, user, getToken } = useKindeAuth();
  const [me, setMe] = useState(null);
  const [meLoaded, setMeLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadMe = async () => {
      try {
        if (!isAuthenticated) return;
        const api = createAPI(getToken);
        const data = await api.user.getMe();
        if (mounted) {
          setMe(data);
          setMeLoaded(true);
        }
      } catch (e) {
        // stil houden; we hebben fallbacks
      }
    };
    loadMe();
    return () => { mounted = false; };
  }, [isAuthenticated, getToken]);

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🐎</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                HorseSharing
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {(me?.name?.charAt(0)) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <span className="text-gray-700 font-medium">
                    {meLoaded ? (
                      // Gebruik DB-naam uit /auth/me, toon voornaam (eerste deel)
                      (() => {
                        const first = (me?.name || '').split(' ')[0] || (me?.name || '');
                        return `Welkom, ${first}`;
                      })()
                    ) : (
                      // nog niet geladen: geen flicker met SDK-naam
                      'Welkom'
                    )}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={login}
                  className="text-gray-700 hover:text-emerald-600 px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200"
                >
                  Inloggen
                </button>
                <button
                  onClick={login}
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Registreren
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
