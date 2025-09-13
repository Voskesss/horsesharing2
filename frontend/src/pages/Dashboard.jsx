import React, { useEffect, useMemo, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useNavigate, Link } from 'react-router-dom';
import { createAPI } from '../utils/api';
import { useActiveRole } from '../context/RoleContext';
import RoleAwareLink from '../components/RoleAwareLink';

const Dashboard = () => {
  const { isAuthenticated, getToken } = useKindeAuth();
  const navigate = useNavigate();
  const api = createAPI(getToken);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderPhotoUrl, setRiderPhotoUrl] = useState(null);
  const [riderAvatarLoading, setRiderAvatarLoading] = useState(false);
  const [riderAvatarLoaded, setRiderAvatarLoaded] = useState(false);
  const { role: activeRole, setActiveRole } = useActiveRole();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isAuthenticated) { navigate('/'); return; }
        const info = await api.user.getMe();
        if (!mounted) return;
        setMe(info);
      } finally { setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const firstName = (me?.name || '').split(' ')[0] || 'Gebruiker';
  const isOwner = activeRole === 'owner';
  const isRider = activeRole === 'rider';
  const gradientFrom = isOwner ? 'from-amber-50 via-orange-50 to-rose-50' : 'from-emerald-50 via-teal-50 to-blue-50';
  const accentRing = isOwner ? 'ring-amber-200' : 'ring-emerald-200';
  const ctaPrimary = isOwner ? 'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700' : 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700';
  const linkColor = isOwner ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700';

  // Laad rider avatar wanneer rol 'rider' is
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isAuthenticated) return;
        if (!isRider) { setRiderPhotoUrl(null); return; }
        setRiderAvatarLoading(true);
        setRiderAvatarLoaded(false);
        const rp = await api.riderProfile.get();
        const arr = Array.isArray(rp?.photos) ? rp.photos : (Array.isArray(rp?.media?.photos) ? rp.media.photos : []);
        if (mounted) setRiderPhotoUrl(arr && arr.length ? arr[0] : null);
      } catch {
        if (mounted) setRiderPhotoUrl(null);
      } finally {
        if (mounted) setRiderAvatarLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated, isRider]);

  // Helper: wissel rol indien nodig en navigeer
  const go = async (targetRole, path) => {
    try {
      if (targetRole && targetRole !== activeRole) {
        await setActiveRole(targetRole);
      }
      navigate(path);
    } catch {
      navigate(path);
    }
  };

  // Reset fade-in wanneer URL verandert
  useEffect(() => {
    setRiderAvatarLoaded(false);
  }, [riderPhotoUrl]);

  return (
    <div className={`min-h-screen bg-gradient-to-br ${gradientFrom} py-8 md:py-12`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero (mobile-first) */}
        <div className="bg-white rounded-2xl shadow-xl p-5 md:p-8 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            {isRider ? (
              riderAvatarLoading ? (
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-200 animate-pulse`} />
              ) : riderPhotoUrl ? (
                <img
                  src={riderPhotoUrl}
                  alt="profiel"
                  onLoad={() => setRiderAvatarLoaded(true)}
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ring-2 ${accentRing} transition-opacity duration-300 ${riderAvatarLoaded ? 'opacity-100' : 'opacity-0'}`}
                />
              ) : (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🐎</div>
              )
            ) : isOwner ? (
              me?.owner_photo_url ? (
                <img src={me.owner_photo_url} alt="profiel" className={`w-14 h-14 md:w-16 md:h-16 rounded-full object-cover ring-2 ${accentRing}`} />
              ) : (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🐎</div>
              )
            ) : (
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🐎</div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">Welkom, {firstName}</h1>
              <div className="text-sm text-gray-600">
                Actief profiel: <span className={isOwner ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'}>{isOwner ? 'Eigenaar' : 'Rijder'}</span>
              </div>
            </div>
          </div>

          {/* Primair CTA-blok per rol */}
          {isOwner && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => go('owner','/owner/horses/new')}
                className={`px-5 py-3 rounded-xl bg-gradient-to-r ${ctaPrimary} text-white font-semibold shadow-lg`}
              >
                Advertentie plaatsen
              </button>
              <button onClick={() => go('owner','/owner/horses')} className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-medium hover:bg-gray-50">Mijn paarden</button>
              <button onClick={() => go('owner','/owner/profile')} className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-medium hover:bg-gray-50">Mijn eigenaar profiel</button>
            </div>
          )}
          {isRider && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => go('rider','/rider-profile')} className={`px-5 py-3 rounded-xl bg-gradient-to-r ${ctaPrimary} text-white font-semibold shadow-lg`}>Mijn rijdersprofiel</button>
              <button onClick={() => navigate('/search') } className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-medium hover:bg-gray-50" disabled>Zoek advertenties (binnenkort)</button>
              {!me?.has_owner_profile && (
                <button onClick={() => navigate('/owner-onboarding')} className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-medium hover:bg-gray-50">Eigenaar profiel aanmaken</button>
              )}
            </div>
          )}
        </div>

        {/* Quick actions per rol (mobile-first grid) */}
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {isOwner && (
            <>
              <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mb-3">📣</div>
                <h3 className="font-semibold text-gray-900 mb-1">Advertentie plaatsen</h3>
                <p className="text-sm text-gray-600 mb-3">Maak een nieuwe advertentie voor je paard of pony.</p>
                <button onClick={()=>go('owner','/owner/horses/new')} className={`text-sm font-medium ${linkColor}`}>Starten →</button>
              </div>
              <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
                <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center mb-3">🐴</div>
                <h3 className="font-semibold text-gray-900 mb-1">Mijn paarden</h3>
                <p className="text-sm text-gray-600 mb-3">Beheer concepten en advertenties.</p>
                <button onClick={()=>go('owner','/owner/horses')} className={`text-sm font-medium ${linkColor}`}>Openen →</button>
              </div>
            </>
          )}
          {isRider && (
            <>
              <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">👤</div>
                <h3 className="font-semibold text-gray-900 mb-1">Rijdersprofiel</h3>
                <p className="text-sm text-gray-600 mb-3">Bekijk en werk je rijdersprofiel bij.</p>
                <button onClick={()=>go('rider','/rider-profile')} className={`text-sm font-medium ${linkColor}`}>Openen →</button>
              </div>
              <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">🔎</div>
                <h3 className="font-semibold text-gray-900 mb-1">Zoek advertenties</h3>
                <p className="text-sm text-gray-600 mb-3">Vind paarden die bij je passen.</p>
                <button className="text-sm font-medium text-gray-400" disabled>Binnenkort →</button>
              </div>
            </>
          )}
          {/* Altijd aanwezig: profielen beheren */}
          <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">⚙️</div>
            <h3 className="font-semibold text-gray-900 mb-1">Profielen</h3>
            <p className="text-sm text-gray-600 mb-3">Beheer je {isOwner ? 'eigenaar' : 'rijders'}profiel.
              {!me?.has_owner_profile || !me?.has_rider_profile ? ' Maak ook het andere profiel aan.' : ''}
            </p>
            <div className="flex gap-3">
              {me?.has_owner_profile && <button onClick={()=>go('owner','/owner/profile')} className="text-blue-600 text-sm font-medium hover:text-blue-700">Eigenaar →</button>}
              {me?.has_rider_profile && <button onClick={()=>go('rider','/rider-profile')} className="text-blue-600 text-sm font-medium hover:text-blue-700">Rijder →</button>}
              {!me?.has_owner_profile && <button onClick={()=>navigate('/owner-onboarding')} className="text-blue-600 text-sm font-medium hover:text-blue-700">Eigenaar aanmaken →</button>}
              {!me?.has_rider_profile && <button onClick={()=>navigate('/rider-onboarding')} className="text-blue-600 text-sm font-medium hover:text-blue-700">Rijder aanmaken →</button>}
            </div>
          </div>
        </div>

        {/* Info banner met rol-kleur rand */}
        <div className={`mt-8 md:mt-10 bg-white border ${isOwner ? 'border-amber-100' : 'border-emerald-100'} rounded-xl p-5`}>
          <h2 className="text-lg font-semibold text-gray-900">Tip</h2>
          <p className="text-gray-600 text-sm mt-1">Zorg voor een duidelijke profielfoto en compleet adres voor betere reacties.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
