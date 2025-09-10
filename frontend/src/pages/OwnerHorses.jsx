import React, { useEffect, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useNavigate, Link } from 'react-router-dom';
import { createAPI } from '../utils/api';

function Toast({ visible, message }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      {message}
    </div>
  );
}

const OwnerHorses = () => {
  const { isAuthenticated, getToken } = useKindeAuth();
  const api = createAPI(getToken);
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const showToast = (msg, ms = 2000) => {
    setToast({ visible: true, message: msg });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ visible: false, message: '' }), ms);
  };

  const setPublished = async (id, publish) => {
    try {
      await api.ownerHorses.createOrUpdate({ id, is_available: !!publish });
      setItems(prev => prev.map(x => x.id === id ? { ...x, is_available: !!publish } : x));
      showToast(publish ? 'Gepubliceerd' : 'Teruggezet naar concept');
    } catch (e) {
      showToast('Actie mislukt');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    (async () => {
      try {
        const res = await api.ownerHorses.list();
        setItems(Array.isArray(res?.horses) ? res.horses : []);
      } catch (e) {
        showToast('Laden mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated]);

  const onDelete = async (id) => {
    if (!window.confirm('Weet je zeker dat je deze advertentie wilt verwijderen?')) return;
    try {
      await api.ownerHorses.delete(id);
      setItems(prev => prev.filter(x => x.id !== id));
      showToast('Advertentie verwijderd');
    } catch (e) {
      showToast('Verwijderen mislukt');
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-emerald-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mijn Paarden</h1>
            <p className="text-gray-600">Beheer je concepten en advertenties</p>
          </div>
          <button onClick={() => navigate('/owner/horses/new')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold hover:from-emerald-700 hover:to-teal-700 shadow">
            Nieuwe advertentie
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow p-4 md:p-6">
          {loading ? (
            <div>Laden…</div>
          ) : items.length === 0 ? (
            <div className="text-gray-600">Nog geen paarden. Klik op "Nieuwe advertentie" om te beginnen.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {items.map(h => (
                <div key={h.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-500">#{h.id}</div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <span>{h.title || '(titel ontbreekt)'}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${h.is_available ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                          {h.is_available ? 'gepubliceerd' : 'concept'}
                        </span>
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        {(h.type === 'pony' ? 'Pony' : 'Paard')}{h.age ? ` · ${h.age} jaar` : ''}{h.height ? ` · ${h.height} cm` : ''}
                      </div>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {(Array.isArray(h.ad_types) ? h.ad_types : (h.ad_type ? [h.ad_type] : [])).map(t => (
                          <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{t}</span>
                        ))}
                      </div>
                    </div>
                    {Array.isArray(h.photos) && h.photos[0] ? (
                      <img src={h.photos[0]} alt="foto" className="w-20 h-20 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-100 border flex items-center justify-center">🐴</div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-3 flex-wrap">
                    <button onClick={() => navigate(`/ads/${h.id}`)} className="px-3 py-1.5 text-sm rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200">Bekijken</button>
                    <button onClick={() => navigate(`/owner/horses/${h.id}/edit`)} className="px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Bewerken</button>
                    {h.is_available ? (
                      <button onClick={() => setPublished(h.id, false)} className="px-3 py-1.5 text-sm rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">Naar concept</button>
                    ) : (
                      <button onClick={() => setPublished(h.id, true)} className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Publiceren</button>
                    )}
                    <button onClick={() => onDelete(h.id)} className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Verwijderen</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Toast visible={toast.visible} message={toast.message} />
    </div>
  );
};

export default OwnerHorses;
