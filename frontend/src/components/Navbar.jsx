import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI } from '../utils/api';

const Navbar = () => {
  const { login, logout, isAuthenticated, user, getToken } = useKindeAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

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

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">🐎</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                HorseSharing
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setOpen(v => !v)} className="flex items-center space-x-3 group">
                    {me?.owner_photo_url ? (
                      <img src={me.owner_photo_url} alt="profiel" className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-200 group-hover:ring-emerald-400" />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {(me?.name?.charAt(0)) || user?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <span className="text-gray-700 font-medium group-hover:text-emerald-700">
                      {meLoaded ? (
                        (() => {
                          const first = (me?.name || '').split(' ')[0] || (me?.name || '');
                          return `Welkom, ${first}`;
                        })()
                      ) : (
                        'Welkom'
                      )}
                    </span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {open && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                      <button onClick={()=>{navigate('/dashboard'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</button>
                      {me?.has_owner_profile && (
                        <button onClick={()=>{navigate('/owner/profile'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Eigenaar profiel</button>
                      )}
                      {me?.has_owner_profile && (
                        <button onClick={()=>{navigate('/owner/horses'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mijn paarden</button>
                      )}
                      {me?.has_rider_profile && (
                        <button onClick={()=>{navigate('/rider-profile'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Rijder profiel</button>
                      )}
                      {me?.has_owner_profile && (
                        <button onClick={()=>{navigate('/owner/horses/new'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Advertentie plaatsen</button>
                      )}
                      <div className="my-1 border-t border-gray-100" />
                      <button onClick={()=>{setOpen(false); logout();}} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Uitloggen</button>
                    </div>
                  )}
                </div>
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
