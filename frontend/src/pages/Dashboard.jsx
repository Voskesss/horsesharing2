import React, { useEffect, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useNavigate, Link } from 'react-router-dom';
import { createAPI } from '../utils/api';

const Dashboard = () => {
  const { isAuthenticated, getToken } = useKindeAuth();
  const navigate = useNavigate();
  const api = createAPI(getToken);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            {me?.owner_photo_url ? (
              <img src={me.owner_photo_url} alt="profiel" className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">🐎</div>
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Welkom, {firstName}</h1>
              <p className="text-gray-600">Klaar om een advertentie te plaatsen of je profiel bij te werken?</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {me?.has_owner_profile && (
              <button
                onClick={() => navigate('/owner/horses/new')}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 shadow-lg"
              >
                Advertentie voor paard/pony plaatsen
              </button>
            )}
            {me?.has_owner_profile && (
              <button
                onClick={() => navigate('/owner/horses')}
                className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-medium hover:bg-gray-50"
              >
                Mijn paarden
              </button>
            )}
            <button
              onClick={() => navigate('/owner/profile')}
              className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-800 font-medium hover:bg-gray-50"
            >
              Mijn profiel
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">📣</div>
            <h3 className="font-semibold text-gray-900 mb-1">Advertentie plaatsen</h3>
            <p className="text-sm text-gray-600 mb-3">Maak een nieuwe advertentie voor je paard of pony.</p>
            <button onClick={()=>navigate('/owner/horses/new')} className="text-emerald-600 text-sm font-medium hover:text-emerald-700">Starten →</button>
          </div>

          <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">👤</div>
            <h3 className="font-semibold text-gray-900 mb-1">Mijn profiel</h3>
            <p className="text-sm text-gray-600 mb-3">Bekijk en bewerk je eigenaar- of rijdersprofiel.</p>
            <div className="flex gap-3">
              <button onClick={()=>navigate('/owner/profile')} className="text-blue-600 text-sm font-medium hover:text-blue-700">Eigenaar →</button>
              <button onClick={()=>navigate('/rider-profile')} className="text-blue-600 text-sm font-medium hover:text-blue-700">Rijder →</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center mb-3">🐴</div>
            <h3 className="font-semibold text-gray-900 mb-1">Mijn paarden</h3>
            <p className="text-sm text-gray-600 mb-3">Bekijk en beheer je concepten en advertenties.</p>
            <button onClick={()=>navigate('/owner/horses')} className="text-teal-600 text-sm font-medium hover:text-teal-700">Openen →</button>
          </div>

          <div className="bg-white rounded-xl shadow p-5 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">💬</div>
            <h3 className="font-semibold text-gray-900 mb-1">Berichten</h3>
            <p className="text-sm text-gray-600 mb-3">Chat met matches en plan afspraken.</p>
            <button className="text-purple-600 text-sm font-medium hover:text-purple-700" disabled>Binnenkort →</button>
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-10 bg-white border border-emerald-100 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-gray-900">Tip</h2>
          <p className="text-gray-600 text-sm mt-1">Zorg voor een duidelijke profielfoto en compleet adres voor betere reacties op je advertentie.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
