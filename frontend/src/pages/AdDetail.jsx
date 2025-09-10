import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function AdDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, getToken } = useKindeAuth();

  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/'); return; }
    (async () => {
      try {
        setLoading(true);
        setError('');
        const token = await getToken();
        const res = await fetch(`${API_BASE}/ads/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `HTTP ${res.status}`);
        }
        const data = await res.json();
        setAd(data);
        setPhotoIdx(0);
      } catch (e) {
        setError(e?.message || 'Laden mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAuthenticated, getToken, navigate]);

  const photos = useMemo(() => Array.isArray(ad?.photos) ? ad.photos : [], [ad]);
  const videos = useMemo(() => Array.isArray(ad?.videos) ? ad.videos : (ad?.video ? [ad.video] : []), [ad]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-emerald-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-4">
          <button onClick={()=>navigate(-1)} className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">← Terug</button>
        </div>

        {loading && (
          <div className="bg-white rounded-xl shadow p-6">Laden…</div>
        )}
        {(!loading && error) && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">{error}</div>
        )}
        {(!loading && ad) && (
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {/* Media */}
            <div className="grid md:grid-cols-3 gap-0">
              <div className="md:col-span-2">
                {photos[photoIdx] ? (
                  <img src={photos[photoIdx]} alt="" className="w-full h-80 object-cover" />
                ) : (
                  <div className="w-full h-80 bg-gray-100 flex items-center justify-center text-3xl">🐴</div>
                )}
              </div>
              <div className="p-3 space-y-2 overflow-auto">
                {photos.map((p, i) => (
                  <img key={p+i} onClick={()=>setPhotoIdx(i)} src={p} alt="thumb" className={`w-full h-20 object-cover rounded cursor-pointer border ${photoIdx===i ? 'border-emerald-500' : 'border-gray-200'}`} />
                ))}
                {videos.map((v, i) => (
                  <video key={v+i} src={v} controls className="w-full h-24 rounded border" />
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{ad.title || '(titel ontbreekt)'}</h1>
                  <div className="text-gray-600 mt-1">
                    {(ad.type === 'pony' ? 'Pony' : 'Paard')}{ad.age ? ` · ${ad.age} jaar` : ''}{ad.height ? ` · ${ad.height} cm` : ''}{ad.breed ? ` · ${ad.breed}` : ''}
                  </div>
                </div>
                <div className="px-3 py-1 rounded-full text-sm border bg-emerald-50 text-emerald-700 border-emerald-200 h-fit">
                  {Array.isArray(ad.ad_types) && ad.ad_types.length ? ad.ad_types.join(' · ') : (ad.ad_type || 'advertentie')}
                </div>
              </div>

              {ad.description && (
                <div className="mt-6 whitespace-pre-wrap leading-relaxed text-gray-800">{ad.description}</div>
              )}

              {/* Faciliteiten */}
              <div className="mt-6">
                <div className="text-sm text-gray-600 mb-2">Faciliteiten</div>
                <div className="flex flex-wrap gap-2">
                  {ad.indoor_arena && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Binnenbak</span>}
                  {ad.outdoor_arena && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Buitenbak</span>}
                  {ad.longe_circle && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Longeercirkel</span>}
                  {ad.horse_walker && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Molen</span>}
                  {ad.toilet_available && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Toilet</span>}
                  {ad.locker_available && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Zadel-/locker-kast</span>}
                </div>
              </div>

              {/* Locatie */}
              {(ad.stable_city || ad.stable_street) && (
                <div className="mt-6">
                  <div className="text-sm text-gray-600 mb-1">Locatie</div>
                  <div className="text-gray-800">
                    {ad.stable_street ? `${ad.stable_street}` : ''}
                    {ad.stable_city ? `${ad.stable_street ? ', ' : ''}${ad.stable_city}` : ''}
                  </div>
                </div>
              )}

              {/* Kosten */}
              {(ad.cost_model && ad.cost_amount!=null) && (
                <div className="mt-6">
                  <div className="text-sm text-gray-600 mb-1">Kosten</div>
                  <div className="text-gray-800">{ad.cost_model.replace('_',' ')}: € {ad.cost_amount}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
