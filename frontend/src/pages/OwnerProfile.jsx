import React, { useEffect, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useNavigate, Link } from 'react-router-dom';
import { createAPI } from '../utils/api';
import { format as formatDate } from 'date-fns';

const OwnerProfile = () => {
  const { isAuthenticated, getToken } = useKindeAuth();
  const navigate = useNavigate();
  const api = createAPI(getToken);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [horses, setHorses] = useState([]);
  const [horsesLoading, setHorsesLoading] = useState(true);

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
    // Fetch horses list (condensed view under profile)
    (async () => {
      try {
        const res = await api.ownerHorses.list();
        if (!mounted) return;
        setHorses(Array.isArray(res?.horses) ? res.horses : []);
      } catch (e) {
        // stilhouden; dit is extra info, geen blocker
      } finally {
        setHorsesLoading(false);
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
  const dobIso = profile.date_of_birth || '';
  const dobFormatted = (() => {
    if (!dobIso) return '-';
    try {
      return formatDate(new Date(dobIso), 'dd-MM-yyyy');
    } catch { return dobIso; }
  })();

  return (
    <div className="min-h-screen bg-role-soft py-10 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4">
          {profile.photo_url ? (
            <img src={profile.photo_url} alt="profiel" className="w-20 h-20 rounded-full object-cover ring-2 border-role" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-role-soft flex items-center justify-center text-2xl">🐎</div>
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
            <div className="text-gray-900">{dobFormatted}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Leeftijd</div>
            <div className="text-gray-900">{(profile.age ?? '-') }</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Minderjarig</div>
            <div className="text-gray-900">{profile.is_minor === true ? 'Ja' : (profile.is_minor === false ? 'Nee' : '-')}</div>
          </div>
          {profile.is_minor === true && (
            <>
              <div>
                <div className="text-xs text-gray-500">Toestemming ouder/voogd</div>
                <div className="text-gray-900">{profile.parent_consent ? 'Ja' : 'Nee'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Ouder/voogd</div>
                <div className="text-gray-900">{[profile.parent_name, profile.parent_email].filter(Boolean).join(' · ') || '-'}</div>
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <div className="text-xs text-gray-500">Adres</div>
            <div className="text-gray-900">{[profile.street, profile.house_number, profile.house_number_addition].filter(Boolean).join(' ')}{(profile.street||profile.house_number||profile.house_number_addition)?', ':''}{[profile.postcode, profile.city].filter(Boolean).join(' ')}{profile.country_code?` (${profile.country_code})`:''}</div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <Link to="/owner-onboarding" className="btn-role">Bewerken</Link>
          <Link to="/owner/horses/new" className="px-5 py-2 rounded-lg bg-white border border-role text-role hover:bg-role-soft">Advertentie voor paard/pony plaatsen</Link>
          <Link to="/dashboard" className="px-5 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200">Dashboard</Link>
        </div>

        {/* Mijn Paarden (embedded overzicht) */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-semibold text-gray-900">Mijn paarden</h2>
            <Link to="/owner/horses" className="text-role hover:underline text-sm">Bekijk alle</Link>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            {horsesLoading ? (
              <div className="text-gray-600">Laden…</div>
            ) : horses.length === 0 ? (
              <div className="text-gray-600">Nog geen paarden. <Link to="/owner/horses/new" className="text-role underline">Plaats je eerste advertentie</Link>.</div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {horses.slice(0,4).map(h => (
                  <div key={h.id} className="bg-white border border-gray-200 rounded-lg p-4 flex gap-3">
                    {Array.isArray(h.photos) && h.photos[0] ? (
                      <img src={h.photos[0]} alt="foto" className="w-20 h-20 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 border flex items-center justify-center">🐴</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500">#{h.id}</div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">{h.title || '(titel ontbreekt)'}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${h.is_available ? 'chip-role' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{h.is_available ? 'gepubliceerd' : 'concept'}</span>
                      </div>
                      <div className="text-sm text-gray-600 mt-0.5 truncate">{(h.type === 'pony' ? 'Pony' : 'Paard')}{h.age ? ` · ${h.age} jaar` : ''}{h.height ? ` · ${h.height} cm` : ''}</div>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {(Array.isArray(h.ad_types) ? h.ad_types : (h.ad_type ? [h.ad_type] : [])).map(t => (
                          <span key={t} className="chip-role">{t}</span>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Link to={`/ads/${h.id}`} className="px-3 py-1.5 text-sm rounded-lg border border-role text-role bg-role-soft hover:brightness-95">Bekijken</Link>
                        <Link to={`/owner/horses/${h.id}/edit`} className="btn-role text-sm">Bewerken</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;
