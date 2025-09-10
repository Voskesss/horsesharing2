import React, { useCallback, useMemo, useState } from 'react';

// Simple EU countries subset to start with
const EU_COUNTRIES = [
  { code: 'NL', name: 'Nederland' },
  { code: 'BE', name: 'België' },
  { code: 'DE', name: 'Duitsland' },
  { code: 'FR', name: 'Frankrijk' },
  { code: 'LU', name: 'Luxemburg' },
  { code: 'ES', name: 'Spanje' },
  { code: 'IT', name: 'Italië' },
];

export default function AddressPicker({ value, onChange, apiBase = 'http://localhost:8000' }) {
  const v = value || {};
  const [status, setStatus] = useState({ state: 'idle', message: '' });

  const setField = useCallback((field, val) => {
    onChange?.({ ...(v || {}), [field]: val });
  }, [onChange, v]);

  const doLookup = useCallback(async () => {
    const country = (v.country_code || 'NL').toUpperCase();
    const postcode = (v.postcode || '').trim();
    const number = (v.house_number || '').trim();
    const addition = (v.house_number_addition || '').trim();
    if (!postcode || !number) {
      setStatus({ state: 'error', message: 'Vul postcode en huisnummer in' });
      return;
    }
    try {
      setStatus({ state: 'loading', message: 'Zoeken…' });
      const url = new URL('/geo/lookup', apiBase);
      url.searchParams.set('country', country);
      url.searchParams.set('postcode', postcode);
      url.searchParams.set('number', number);
      if (addition) url.searchParams.set('addition', addition);
      const resp = await fetch(url.toString());
      if (!resp.ok) throw new Error('Lookup failed');
      const data = await resp.json();
      onChange?.({
        ...(v || {}),
        country_code: data.country_code || country,
        postcode: data.postcode || postcode,
        house_number: data.house_number || number,
        house_number_addition: data.addition || addition || '',
        street: data.street || v.street || '',
        city: data.city || v.city || '',
        lat: data.lat ?? v.lat ?? null,
        lon: data.lon ?? v.lon ?? null,
        geocode_confidence: data.confidence ?? 0.0,
        needs_review: false,
      });
      setStatus({ state: 'ok', message: 'Adres bevestigd' });
    } catch (e) {
      setStatus({ state: 'error', message: 'Adres niet gevonden, controleer invoer of typ handmatig' });
      onChange?.({ ...(v || {}), needs_review: true });
    }
  }, [apiBase, onChange, v]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Land</label>
          <select
            value={v.country_code || 'NL'}
            onChange={(e)=> setField('country_code', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          >
            {EU_COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
          <input
            type="text"
            value={v.postcode || ''}
            onChange={(e)=> setField('postcode', e.target.value.toUpperCase().replace(/\s+/g, ''))}
            placeholder={v.country_code === 'NL' ? '1234AB' : ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-5 gap-2 items-end">
          <div className="col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Huisnummer</label>
            <input
              type="text"
              value={v.house_number || ''}
              onChange={(e)=> setField('house_number', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Toevoeging</label>
            <input
              type="text"
              value={v.house_number_addition || ''}
              onChange={(e)=> setField('house_number_addition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center">
        <button type="button" onClick={doLookup} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Zoek adres</button>
        {status.state === 'loading' && <span className="text-sm text-gray-600">{status.message}</span>}
        {status.state === 'ok' && <span className="text-sm text-emerald-700">{status.message}</span>}
        {status.state === 'error' && <span className="text-sm text-red-600">{status.message}</span>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Straat (handmatig aanpasbaar)</label>
          <input
            type="text"
            value={v.street || ''}
            onChange={(e)=> setField('street', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plaats (handmatig aanpasbaar)</label>
          <input
            type="text"
            value={v.city || ''}
            onChange={(e)=> setField('city', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Hidden coords for parent save */}
      <input type="hidden" value={v.lat || ''} readOnly />
      <input type="hidden" value={v.lon || ''} readOnly />
    </div>
  );
}
