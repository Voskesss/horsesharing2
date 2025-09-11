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
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState({ open: false, src: '', isVideo: false });

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
        setActiveIdx(0);
      } catch (e) {
        setError(e?.message || 'Laden mislukt');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isAuthenticated, getToken, navigate]);

  const photos = useMemo(() => Array.isArray(ad?.photos) ? ad.photos : [], [ad]);
  const videos = useMemo(() => Array.isArray(ad?.videos) ? ad.videos : (ad?.video ? [ad.video] : []), [ad]);
  const media = useMemo(() => {
    const p = (photos || []).map(src => ({ type: 'image', src }));
    const v = (videos || []).map(src => ({ type: 'video', src }));
    return [...p, ...v];
  }, [photos, videos]);

  const active = media[activeIdx];

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-role-gradient py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <button onClick={()=>navigate(-1)} className="px-3 py-1.5 rounded-lg bg-white border border-role text-role hover:bg-role-soft">← Terug</button>
        </div>

        {loading && (
          <div className="bg-white rounded-xl shadow p-6">Laden…</div>
        )}
        {(!loading && error) && (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl p-4">{error}</div>
        )}
        {(!loading && ad) && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Media */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="relative w-full aspect-video bg-black">
                  {active ? (
                    active.type === 'image' ? (
                      <img
                        src={active.src}
                        alt="media"
                        className="w-full h-full object-cover cursor-zoom-in"
                        onClick={()=>setLightbox({ open:true, src:active.src, isVideo:false })}
                      />
                    ) : (
                      <video src={active.src} controls className="w-full h-full object-contain bg-black" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl text-white/70">Geen media</div>
                  )}
                </div>

                {/* Thumbnails row */}
                {media.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto p-3 bg-white">
                    {media.map((m, i) => (
                      <div key={m.src+i} className={`relative flex-none w-28 h-16 rounded border cursor-pointer ${i===activeIdx ? 'border-role' : 'border-gray-200'}`} onClick={()=>setActiveIdx(i)}>
                        {m.type==='image' ? (
                          <img src={m.src} alt="thumb" className="w-full h-full object-cover rounded" />
                        ) : (
                          <div className="w-full h-full bg-black rounded relative">
                            <video src={m.src} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="inline-flex w-8 h-8 items-center justify-center bg-white/80 text-black rounded-full">▶</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sticky info */}
            <div className="md:sticky md:top-6 h-fit">
              <div className="bg-white rounded-2xl shadow p-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{ad.title || '(titel ontbreekt)'}</h1>
                <div className="text-gray-600 mt-1">
                  {(ad.type === 'pony' ? 'Pony' : 'Paard')}{ad.age ? ` · ${ad.age} jaar` : ''}{ad.height ? ` · ${ad.height} cm` : ''}{ad.breed ? ` · ${ad.breed}` : ''}
                </div>
                {Array.isArray(ad.ad_types) && ad.ad_types.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ad.ad_types.map(t => (
                      <span key={t} className="chip-role">{t}</span>
                    ))}
                  </div>
                )}

                {ad.description && (
                  <div className="mt-6 whitespace-pre-wrap leading-relaxed text-gray-800 border-t pt-4">{ad.description}</div>
                )}

                {/* Faciliteiten */}
                <div className="mt-6 border-t pt-4">
                  <div className="text-sm text-gray-600 mb-2">Faciliteiten</div>
                  <div className="flex flex-wrap gap-2">
                    {ad.indoor_arena && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Binnenbak</span>}
                    {ad.outdoor_arena && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Buitenbak</span>}
                    {ad.longe_circle && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Longeercirkel</span>}
                    {ad.horse_walker && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Molen</span>}
                    {ad.toilet_available && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Toilet</span>}
                    {ad.locker_available && <span className="px-2 py-1 text-xs bg-gray-100 rounded border">Zadel-/locker-kast</span>}
                    {!ad.indoor_arena && !ad.outdoor_arena && !ad.longe_circle && !ad.horse_walker && !ad.toilet_available && !ad.locker_available && (
                      <span className="text-sm text-gray-500">Geen opgegeven faciliteiten</span>
                    )}
                  </div>
                </div>

                {/* Locatie */}
                {(ad.stable_city || ad.stable_street) && (
                  <div className="mt-6 border-t pt-4">
                    <div className="text-sm text-gray-600 mb-1">Locatie</div>
                    <div className="text-gray-800">
                      {ad.stable_street ? `${ad.stable_street}` : ''}
                      {ad.stable_city ? `${ad.stable_street ? ', ' : ''}${ad.stable_city}` : ''}
                    </div>
                  </div>
                )}

                {/* Kosten */}
                {(ad.cost_model && ad.cost_amount!=null) && (
                  <div className="mt-6 border-t pt-4">
                    <div className="text-sm text-gray-600 mb-1">Kosten</div>
                    <div className="text-gray-800">{ad.cost_model.replace('_',' ')}: € {ad.cost_amount}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox.open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={()=>setLightbox({ open:false, src:'', isVideo:false })}>
          <div className="max-w-5xl w-full p-4" onClick={(e)=>e.stopPropagation()}>
            <button className="mb-3 px-3 py-1.5 rounded bg-white/90 text-gray-800" onClick={()=>setLightbox({ open:false, src:'', isVideo:false })}>Sluiten</button>
            <img src={lightbox.src} alt="fullscreen" className="w-full max-h-[80vh] object-contain rounded" />
          </div>
        </div>
      )}
    </div>
  );
}
