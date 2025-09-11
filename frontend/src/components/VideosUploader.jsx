import React, { useCallback, useRef, useState } from 'react';

export default function VideosUploader({ value = [], onChange, api, maxItems = 3, maxSizeMB = 100 }) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const maxBytes = maxSizeMB * 1024 * 1024;
  const remaining = Math.max(0, maxItems - (Array.isArray(value) ? value.length : 0));

  const handleFiles = useCallback(async (fileList) => {
    if (!fileList || remaining <= 0) return;
    const selected = Array.from(fileList).slice(0, remaining);
    const bad = selected.find(f => !f.type.startsWith('video/'));
    if (bad) { alert('Alleen videobestanden zijn toegestaan.'); return; }
    const tooBig = selected.find(f => f.size > maxBytes);
    if (tooBig) { alert(`Een video is te groot (max ${maxSizeMB} MB).`); return; }
    try {
      setBusy(true);
      const res = await api.media.uploadPhotos(selected);
      const urls = Array.isArray(res?.urls) ? res.urls : [];
      onChange([...(value || []), ...urls].slice(0, maxItems));
    } catch (e) {
      const msg = (e && e.message) ? e.message : String(e || 'Onbekende fout');
      alert(`Upload mislukt: ${msg}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [api, maxBytes, maxItems, onChange, remaining, value]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const files = e.dataTransfer?.files;
    handleFiles(files);
  }, [handleFiles]);

  const onSelect = useCallback((e) => {
    const files = e.target?.files;
    handleFiles(files);
  }, [handleFiles]);

  const removeAt = useCallback((idx) => {
    const next = (value || []).filter((_, i) => i !== idx);
    onChange(next);
  }, [onChange, value]);

  const addUrl = useCallback(() => {
    const url = prompt('Plak een video-URL');
    if (!url) return;
    onChange([...(value || []), url].slice(0, maxItems));
  }, [onChange, value, maxItems]);

  const makeCover = useCallback((idx) => {
    if (!Array.isArray(value) || idx < 0 || idx >= value.length) return;
    const arr = [...value];
    const [item] = arr.splice(idx, 1);
    arr.unshift(item);
    onChange(arr);
  }, [onChange, value]);

  const move = useCallback((idx, dir) => {
    if (!Array.isArray(value) || idx < 0 || idx >= value.length) return;
    const target = idx + dir;
    if (target < 0 || target >= value.length) return;
    const arr = [...value];
    const tmp = arr[target];
    arr[target] = arr[idx];
    arr[idx] = tmp;
    onChange(arr);
  }, [onChange, value]);

  const borderCls = dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 bg-white';

  return (
    <div>
      <div
        onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={onDrop}
        className={`w-full p-4 border-2 ${borderCls} rounded-lg text-center transition-colors`}
      >
        <div className="text-sm text-gray-700">
          <strong>Sleep</strong> je video's hierheen of
        </div>
        <div className="mt-2 flex gap-2 justify-center">
          <button
            type="button"
            onClick={()=>inputRef.current?.click()}
            disabled={busy || remaining<=0}
            className={`px-3 py-2 rounded ${busy || remaining<=0 ? 'bg-gray-200 text-gray-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            {busy ? 'Uploaden...' : `Kies video's (${remaining} over)`}
          </button>
          <button
            type="button"
            onClick={addUrl}
            className="px-3 py-2 rounded border border-gray-300 bg-white hover:bg-gray-50"
          >
            URL toevoegen
          </button>
        </div>
        <input ref={inputRef} type="file" accept="video/*" multiple onChange={onSelect} hidden />
        <div className="mt-2 text-xs text-gray-500">Max {maxItems} video's, elk max {maxSizeMB} MB. Ondersteund: mp4/mov/webm.</div>
      </div>

      {Array.isArray(value) && value.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          {value.map((url, idx) => (
            <div key={url+idx} className="flex items-center gap-3">
              <div className="relative">
                {idx === 0 && (
                  <span className="absolute -top-2 left-0 z-10 text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow">Hoofdvideo</span>
                )}
                <video src={url} controls className="w-48 h-28 object-cover rounded border" />
              </div>
              <div className="flex-1 truncate text-sm text-gray-700">{url}</div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={()=>move(idx,-1)} disabled={idx===0} title="Naar boven" className={`px-2 py-1 text-sm rounded border ${idx===0 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}>↑</button>
                <button type="button" onClick={()=>makeCover(idx)} disabled={idx===0} title="Maak hoofdvideo" className={`px-2 py-1 text-sm rounded border ${idx===0 ? 'text-gray-400 border-gray-200' : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'}`}>Hoofd</button>
                <button type="button" onClick={()=>move(idx,1)} disabled={idx===value.length-1} title="Naar beneden" className={`px-2 py-1 text-sm rounded border ${idx===value.length-1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}>↓</button>
                <button type="button" onClick={()=>removeAt(idx)} className="px-2 py-1 text-sm border rounded hover:bg-gray-50">Verwijderen</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
