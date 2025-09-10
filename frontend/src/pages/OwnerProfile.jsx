import React, { useEffect, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useNavigate, Link } from 'react-router-dom';
import { createAPI } from '../utils/api';

const OwnerProfile = () => {
  const { isAuthenticated, getToken } = useKindeAuth();
  const navigate = useNavigate();
  const api = createAPI(getToken);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!isAuthenticated) { navigate('/'); return; }
        const resp = await api.ownerProfile.get();
        if (!mounted) return;
        setData(resp);
      } catch (e) {
        setError(e.message || 'Kon profiel niet laden');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center">Laden...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;

  const profile = data?.profile || {};
  const user = data?.user || {};
  const fullName = `${user.kinde_given_name || ''} ${user.kinde_family_name || ''}`.trim() || user.name || '';

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="profiel" className="w-20 h-20 rounded-full object-cover ring-2 ring-emerald-200" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-2xl">🐎</div>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{fullName || 'Mijn profiel'}</h1>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500">Telefoon</div>
            <div className="text-gray-900">{user.phone || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Geboortedatum</div>
            <div className="text-gray-900">{profile.date_of_birth || '-'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Adres</div>
            <div className="text-gray-900">{[profile.street, profile.house_number, profile.house_number_addition].filter(Boolean).join(' ')}{(profile.street||profile.house_number||profile.house_number_addition)?', ':''}{[profile.postcode, profile.city].filter(Boolean).join(' ')}{profile.country_code?` (${profile.country_code})`:''}</div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link to="/owner-onboarding" className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Bewerken</Link>
          <Link to="/owner/horses/new" className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Advertentie voor paard/pony plaatsen</Link>
          <Link to="/dashboard" className="px-5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200">Dashboard</Link>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;
