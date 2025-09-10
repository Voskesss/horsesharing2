import React, { useCallback, useRef, useState } from 'react';

export default function VideoUploader({ value = '', onChange, api, maxSizeMB = 100 }) {
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const maxBytes = maxSizeMB * 1024 * 1024;

  const handleFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith('video/')) {
      alert('Kies een videobestand.');
      return;
    }
    if (file.size > maxBytes) {
      alert(`Video is te groot (max ${maxSizeMB} MB).`);
      return;
    }
    try {
      setBusy(true);
      // Upload via bestaand media endpoint (nu uitgebreid voor video)
      const res = await api.media.uploadPhotos([file]);
      const urls = Array.isArray(res?.urls) ? res.urls : [];
      if (urls[0]) onChange(urls[0]);
    } catch (e) {
      const msg = (e && e.message) ? e.message : String(e || 'Onbekende fout');
      alert(`Upload mislukt: ${msg}`);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [api, maxBytes, maxSizeMB, onChange]);

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
          <strong>Sleep</strong> je video hierheen of
        </div>
        <div className="mt-2">
          <button
            type="button"
            onClick={()=>inputRef.current?.click()}
            disabled={busy}
            className={`px-3 py-2 rounded ${busy ? 'bg-gray-200 text-gray-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
          >
            {busy ? 'Uploaden...' : 'Kies video'}
          </button>
        </div>
        <input ref={inputRef} type="file" accept="video/*" onChange={onSelect} hidden />
        <div className="mt-2 text-xs text-gray-500">Max {maxSizeMB} MB. Ondersteund: mp4/mov/webm.</div>
      </div>

      {value && (
        <div className="mt-3">
          <video src={value} controls className="w-full max-h-64 rounded border" />
        </div>
      )}
    </div>
  );
}
