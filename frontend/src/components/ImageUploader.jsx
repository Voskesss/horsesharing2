import React, { useCallback, useMemo, useRef, useState } from 'react';
import { compressImage } from '../utils/image';

export default function ImageUploader({ value = [], onChange, api, max = 5 }) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const remaining = Math.max(0, max - value.length);

  const handleFiles = useCallback(async (fileList) => {
    if (!fileList || remaining <= 0) return;
    const selected = Array.from(fileList).slice(0, remaining);
    console.log('[ImageUploader] selected files:', selected.map(f => ({ name: f.name, size: f.size, type: f.type })));
    try {
      setBusy(true);
      // compress images client-side
      const compressed = await Promise.all(selected.map((f) => compressImage(f)));
      console.log('[ImageUploader] compressed blobs:', compressed.map((b, i) => ({ i, size: b?.size })));
      const res = await api.media.uploadPhotos(compressed);
      console.log('[ImageUploader] upload response:', res);
      const urls = Array.isArray(res.urls) ? res.urls : [];
      onChange([...(value || []), ...urls].slice(0, max));
    } catch (e) {
      console.error('[ImageUploader] upload error:', e);
      const msg = (e && e.message) ? e.message : String(e || 'Onbekende fout');
      alert(`Upload mislukt: ${msg}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [api, max, onChange, remaining, value]);

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

  const borderCls = dragOver ? 'border-role bg-role-soft' : 'border-gray-300 bg-white';

  return (
    <div>
      <div
        onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={onDrop}
        className={`w-full p-4 border-2 ${borderCls} rounded-lg text-center transition-colors`}
      >
        <div className="text-sm text-gray-700">
          <strong>Sleep</strong> je foto's hierheen of
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={()=>inputRef.current?.click()}
            disabled={busy || remaining<=0}
            className={`px-3 py-2 rounded ${busy || remaining<=0 ? 'bg-gray-200 text-gray-500' : 'btn-role'}`}
          >
            {busy ? 'Uploaden...' : `Kies bestanden (${remaining} over)`}
          </button>
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={onSelect} hidden />
        <div className="mt-2 text-xs text-gray-500">Max {max} afbeeldingen. We comprimeren automatisch voor snelle uploads.</div>
      </div>

      {Array.isArray(value) && value.length > 0 && (
        <div className="mt-3 flex gap-3 flex-wrap">
          {value.map((url, idx) => (
            <div key={url+idx} className="relative">
              {/* badge hoofdfoto */}
              {idx === 0 && (
                <span className="absolute -top-2 left-0 z-10 text-[10px] px-2 py-0.5 rounded-full text-white shadow" style={{ backgroundColor: 'var(--role-primary)' }}>Hoofdfoto</span>
              )}
              <img src={url} alt="uploaded" className="w-24 h-24 object-cover rounded border" />
              <div className="absolute -top-2 -right-2 flex gap-1">
                <button type="button" onClick={()=>removeAt(idx)} title="Verwijderen" className="bg-white border rounded-full w-6 h-6 leading-none">×</button>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1">
                <button type="button" onClick={()=>move(idx, -1)} disabled={idx===0} title="Naar links" className={`px-2 py-0.5 text-xs rounded border ${idx===0 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}>←</button>
                <button type="button" onClick={()=>makeCover(idx)} disabled={idx===0} title="Maak hoofdfoto" className={`px-2 py-0.5 text-xs rounded border ${idx===0 ? 'text-gray-400 border-gray-200' : 'text-role border-role bg-role-soft hover:brightness-95'}`}>Hoofd</button>
                <button type="button" onClick={()=>move(idx, 1)} disabled={idx===value.length-1} title="Naar rechts" className={`px-2 py-0.5 text-xs rounded border ${idx===value.length-1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}>→</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
