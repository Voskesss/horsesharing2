import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI } from '../utils/api';

const Navbar = () => {
  const { login, logout, isAuthenticated, user, getToken } = useKindeAuth();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [meLoaded, setMeLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [riderPhotoUrl, setRiderPhotoUrl] = useState(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const menuRef = useRef(null);
  const api = useMemo(() => createAPI(getToken), [getToken]);

  useEffect(() => {
    let mounted = true;
    const loadMe = async () => {
      try {
        if (!isAuthenticated) return;
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
  }, [isAuthenticated, api]);

  // Actieve rol afleiden en op body zetten voor theming
  const currentRole = useMemo(() => {
    if (!me) return null;
    if (me.profile_type_chosen) return me.profile_type_chosen;
    if (me.has_owner_profile) return 'owner';
    if (me.has_rider_profile) return 'rider';
    return null;
  }, [me]);

  useEffect(() => {
    if (currentRole) {
      document.body.dataset.role = currentRole;
    } else {
      delete document.body.dataset.role;
    }
  }, [currentRole]);

  // Wanneer rol 'rider' actief is, laad de eerste rider-foto als avatar
  useEffect(() => {
    let mounted = true;
    const loadRiderPhoto = async () => {
      try {
        if (!isAuthenticated) return;
        if (currentRole !== 'rider') { setRiderPhotoUrl(null); return; }
        const rp = await api.riderProfile.get();
        const arr = Array.isArray(rp?.photos) ? rp.photos : (Array.isArray(rp?.media?.photos) ? rp.media.photos : []);
        if (mounted) setRiderPhotoUrl(arr && arr.length ? arr[0] : null);
      } catch {
        if (mounted) setRiderPhotoUrl(null);
      }
    };
    loadRiderPhoto();
    return () => { mounted = false; };
  }, [api, isAuthenticated, currentRole, avatarVersion]);

  // Luister naar globale event om avatar te verversen na upload
  useEffect(() => {
    const onUpdated = (e) => {
      const role = e?.detail?.role;
      if (!role || role === currentRole) {
        setAvatarVersion(v => v + 1);
      }
    };
    window.addEventListener('profilePhotoUpdated', onUpdated);
    return () => window.removeEventListener('profilePhotoUpdated', onUpdated);
  }, [currentRole]);

  const switchRole = async (role) => {
    try {
      await api.user.setRole(role);
      const data = await api.user.getMe();
      setMe(data);
      setOpen(false);
      // Navigeer naar primaire profielpagina van nieuwe rol
      if (role === 'owner') navigate('/owner/profile');
      else navigate('/rider-profile');
    } catch (e) {
      // noop; kan mislukken als profiel nog niet bestaat
    }
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Rol-afhankelijke kleuren voor branding
  const brandGradient = currentRole === 'owner' ? 'from-amber-600 to-orange-600' : 'from-emerald-600 to-blue-600';
  const avatarRing = currentRole === 'owner' ? 'ring-amber-200 group-hover:ring-amber-400' : 'ring-emerald-200 group-hover:ring-emerald-400';
  const welcomeHover = currentRole === 'owner' ? 'group-hover:text-amber-700' : 'group-hover:text-emerald-700';

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className={`w-10 h-10 bg-gradient-to-br ${brandGradient} rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <span className="text-white font-bold text-lg">🐎</span>
              </div>
              <h1 className={`text-2xl font-bold bg-gradient-to-r ${brandGradient} bg-clip-text text-transparent`}>
                HorseSharing
              </h1>
            </Link>
          </div>
          
          <div className="flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {/* Inline rol-indicatie en toggle */}
                <div className="hidden md:flex items-center gap-3">
                  {currentRole && (
                    <span className="text-sm text-gray-600">Profiel: <strong className={currentRole==='owner' ? 'text-amber-700' : 'text-emerald-700'}>
                      {currentRole === 'owner' ? 'Eigenaar' : 'Rijder'}</strong></span>
                  )}
                  {me?.has_rider_profile && me?.has_owner_profile && (
                    <div className="flex bg-gray-100 rounded-full p-1">
                      <button onClick={()=>switchRole('rider')} className={`px-3 py-1 text-xs rounded-full ${currentRole==='rider' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-800'}`}>Rijder</button>
                      <button onClick={()=>switchRole('owner')} className={`px-3 py-1 text-xs rounded-full ${currentRole==='owner' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-800'}`}>Eigenaar</button>
                    </div>
                  )}
                </div>
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setOpen(v => !v)} className="flex items-center space-x-3 group">
                    {currentRole === 'owner' && me?.owner_photo_url ? (
                      <img src={me.owner_photo_url} alt="profiel" className={`w-8 h-8 rounded-full object-cover ring-2 ${avatarRing}`} />
                    ) : currentRole === 'rider' && riderPhotoUrl ? (
                      <img src={riderPhotoUrl} alt="profiel" className={`w-8 h-8 rounded-full object-cover ring-2 ${avatarRing}`} />
                    ) : (
                      <div className={`w-8 h-8 bg-gradient-to-br ${brandGradient} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-semibold text-sm">
                          {(me?.name?.charAt(0)) || user?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                    )}
                    <span className={`text-gray-700 font-medium ${welcomeHover}`}>
                      {meLoaded ? (
                        (() => {
                          const first = (me?.name || '').split(' ')[0] || (me?.name || '');
                          return `Welkom, ${first}`;
                        })()
                      ) : (
                        'Welkom'
                      )}
                    </span>
                    {/* Altijd roltekst ook in het menu-button cluster voor mobile */}
                    <span className="md:hidden text-xs text-gray-500">
                      {currentRole ? (currentRole==='owner' ? 'Eigenaar' : 'Rijder') : ''}
                    </span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {open && (
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50">
                      {/* Role toggle: alleen tonen als beide profielen bestaan */}
                      {me?.has_rider_profile && me?.has_owner_profile && (
                        <div className="px-2 py-2 border-b border-gray-100">
                          <div className="text-xs text-gray-500 mb-1">Weergave</div>
                          <div className="flex bg-gray-100 rounded-lg p-1">
                            <button onClick={()=>switchRole('rider')} className={`flex-1 px-2 py-1 text-xs rounded-md ${currentRole==='rider' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-800'}`}>Rijder</button>
                            <button onClick={()=>switchRole('owner')} className={`flex-1 px-2 py-1 text-xs rounded-md ${currentRole==='owner' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-800'}`}>Eigenaar</button>
                          </div>
                        </div>
                      )}
                      <button onClick={()=>{navigate('/dashboard'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Dashboard</button>
                      {/* Menu-items gefilterd op actieve rol */}
                      {currentRole === 'owner' && me?.has_owner_profile && (
                        <>
                          <button onClick={()=>{navigate('/owner/profile'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Eigenaar profiel</button>
                          <button onClick={()=>{navigate('/owner/horses'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Mijn paarden</button>
                          <button onClick={()=>{navigate('/owner/horses/new'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Advertentie plaatsen</button>
                        </>
                      )}
                      {currentRole === 'rider' && me?.has_rider_profile && (
                        <>
                          <button onClick={()=>{navigate('/rider-profile'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Rijder profiel</button>
                          <button onClick={()=>{navigate('/rider-onboarding'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Onboarding aanpassen</button>
                        </>
                      )}
                      {/* Profiel aanmaken voor ontbrekende rol (max 1 per rol) */}
                      {!me?.has_owner_profile && (
                        <button onClick={()=>{navigate('/owner-onboarding'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Eigenaar profiel aanmaken</button>
                      )}
                      {!me?.has_rider_profile && (
                        <button onClick={()=>{navigate('/rider-onboarding'); setOpen(false);}} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Rijder profiel aanmaken</button>
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
