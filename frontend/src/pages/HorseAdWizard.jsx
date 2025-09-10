import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI } from '../utils/api';
import ImageUploader from '../components/ImageUploader';

const defaultSchedule = () => ({
  maandag: [],
  dinsdag: [],
  woensdag: [],
  donderdag: [],
  vrijdag: [],
  zaterdag: [],
  zondag: [],
});

export default function HorseAdWizard() {
  const navigate = useNavigate();
  const { isAuthenticated, getToken } = useKindeAuth();
  const api = createAPI(getToken);
  const { id } = useParams();

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const [step, setStep] = useState(1);
  const [horseId, setHorseId] = useState(id ? String(id) : null);
  const totalSteps = 5;

  // Stap 1: Titel/verhaal + basis + type + media
  const [basic, setBasic] = useState({
    title: '',
    description: '',
    ad_types: ['bijrijden'], // multi-select
    name: '',
    type: 'horse', // horse | pony
    gender: '',
    age: '',
    height: '',
    breed: '',
    photos: [],
    video_intro_url: '',
  });
  const [localFiles, setLocalFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Stap 2: Beschikbaarheid
  const [availability, setAvailability] = useState({
    available_days: defaultSchedule(),
    min_days_per_week: 1,
    session_duration_min: 60,
    session_duration_max: '',
    task_frequency: '',
  });

  const timeBlocks = ['ochtend', 'middag', 'avond'];
  const days = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];

  const toggleBlock = (day, block) => {
    const cur = availability.available_days[day] || [];
    const exists = cur.includes(block);
    const next = exists ? cur.filter(b => b !== block) : [...cur, block];
    setAvailability({
      ...availability,
      available_days: { ...availability.available_days, [day]: next },
    });
  };

  // Stap 3: Kosten
  const [cost, setCost] = useState({ cost_model: 'per_maand', cost_amount: '' });

  // Stap 4: Filters/competenties
  const [filters, setFilters] = useState({
    disciplines: [],
    temperament: [],
    coat_colors: [],
    level: '',
    max_jump_height: '',
    comfort_flags: { traffic: false, outdoor_solo: false, with_other_horses: false },
    activity_mode: 'ride_or_care',
  });

  // Stap 5: Verwachtingen & eisen
  const [expectations, setExpectations] = useState({
    required_tasks: [],
    optional_tasks: [],
    required_skills: [],
    desired_rider_personality: [],
    rules: { helmet_required: true, under_18_allowed: true, contract_required: false },
  });

  // Autosave (concept) — debounced
  const saveTimerRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const showToast = (msg, ms = 2000) => {
    setToast({ visible: true, message: msg });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ visible: false, message: '' }), ms);
  };
  const doAutoSave = async (showToast = false) => {
    // Vereist: titel moet ingevuld zijn voor (auto)save
    const hasTitle = !!(basic.title && basic.title.trim());
    if (!hasTitle) {
      if (showToast) {
        setToast({ visible: true, message: 'Vul eerst een titel in' });
        window.clearTimeout(doAutoSave._t);
        doAutoSave._t = window.setTimeout(() => setToast({ visible: false, message: '' }), 2000);
      }
      return;
    }
    // Bouw minimale payload; sla niet op als er echt niets is ingevoerd
    const payload = {};
    if (horseId) payload.id = Number(horseId);
    if (basic.title) payload.title = basic.title;
    if (Array.isArray(basic.ad_types) && basic.ad_types.length) {
      payload.ad_types = basic.ad_types;
      payload.ad_type = basic.ad_types[0];
    }
    if (basic.name) payload.name = basic.name;
    if (basic.type) payload.type = basic.type;
    if (basic.gender) payload.gender = basic.gender;
    if (basic.age !== '' && basic.age != null) payload.age = Number(basic.age);
    if (basic.height !== '' && basic.height != null) payload.height = Number(basic.height);
    if (basic.breed) payload.breed = basic.breed;
    if (basic.description) payload.description = basic.description;
    if (Array.isArray(basic.photos) && basic.photos.length) payload.photos = basic.photos;
    // Beschikbaarheid minimaal meesturen als er iets is gekozen
    if (Object.values(availability.available_days || {}).some(arr => Array.isArray(arr) && arr.length)) {
      payload.available_days = availability.available_days;
    }
    if (availability.session_duration_min !== '' && availability.session_duration_min != null) payload.session_duration_min = Number(availability.session_duration_min);
    if (availability.session_duration_max !== '' && availability.session_duration_max != null) payload.session_duration_max = Number(availability.session_duration_max);
    if (availability.min_days_per_week != null) payload.min_days_per_week = availability.min_days_per_week;
    if (availability.task_frequency) payload.task_frequency = availability.task_frequency;
    // Kosten
    if (cost.cost_model) payload.cost_model = cost.cost_model;
    if (cost.cost_amount !== '' && cost.cost_amount != null) payload.cost_amount = Number(cost.cost_amount);
    // Filters
    if (Array.isArray(filters.disciplines) && filters.disciplines.length) payload.disciplines = filters.disciplines;
    if (Array.isArray(filters.temperament) && filters.temperament.length) payload.temperament = filters.temperament;
    if (Array.isArray(filters.coat_colors) && filters.coat_colors.length) payload.coat_colors = filters.coat_colors;
    if (filters.level) payload.level = filters.level;
    if (filters.max_jump_height !== '' && filters.max_jump_height != null) payload.max_jump_height = Number(filters.max_jump_height);
    if (filters.comfort_flags && Object.keys(filters.comfort_flags).length) payload.comfort_flags = filters.comfort_flags;
    if (filters.activity_mode) payload.activity_mode = filters.activity_mode;
    // Expectations
    if (Array.isArray(expectations.required_tasks) && expectations.required_tasks.length) payload.required_tasks = expectations.required_tasks;
    if (Array.isArray(expectations.optional_tasks) && expectations.optional_tasks.length) payload.optional_tasks = expectations.optional_tasks;
    if (Array.isArray(expectations.required_skills) && expectations.required_skills.length) payload.required_skills = expectations.required_skills;
    if (Array.isArray(expectations.desired_rider_personality) && expectations.desired_rider_personality.length) payload.desired_rider_personality = expectations.desired_rider_personality;
    if (expectations.rules && Object.keys(expectations.rules).length) payload.rules = expectations.rules;
    // Guard: niets ingevuld -> skip
    if (Object.keys(payload).length === 0) return;
    try {
      setSaving(true);
      const res = await api.ownerHorses.createOrUpdate(payload);
      if (res && res.horse_id && !horseId) setHorseId(String(res.horse_id));
      if (showToast) {
        setToast({ visible: true, message: 'Concept opgeslagen' });
        window.clearTimeout(doAutoSave._t);
        doAutoSave._t = window.setTimeout(() => setToast({ visible: false, message: '' }), 2000);
      }
    } catch (e) {
      // stilhouden in UI; concept autosave mag stil falen
      console.warn('Autosave horse failed', e);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(doAutoSave, 1500);
    return () => window.clearTimeout(saveTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basic, availability, cost, filters, expectations]);

  // Prefill only when editing an existing horse (id present)
  useEffect(() => {
    if (!id) return; // new: no prefill
    (async () => {
      try {
        const res = await api.ownerHorses.list();
        const horses = Array.isArray(res?.horses) ? res.horses : [];
        const h = horses.find(x => String(x.id) === String(id));
        if (!h) return;
        setBasic(prev => ({
          ...prev,
          title: h.title || prev.title,
          description: prev.description,
          ad_types: Array.isArray(h.ad_types) && h.ad_types.length ? h.ad_types : prev.ad_types,
          name: h.name || prev.name,
          type: h.type || prev.type,
          gender: h.gender || prev.gender,
          age: h.age ?? prev.age,
          height: h.height ?? prev.height,
          breed: h.breed || prev.breed,
          photos: Array.isArray(h.photos) ? h.photos : prev.photos,
        }));
        setAvailability(prev => ({
          ...prev,
          available_days: (h.available_days && typeof h.available_days === 'object') ? h.available_days : prev.available_days,
          min_days_per_week: (typeof h.min_days_per_week === 'number') ? h.min_days_per_week : prev.min_days_per_week,
          task_frequency: h.task_frequency || prev.task_frequency,
        }));
        setFilters(prev => ({
          ...prev,
          disciplines: Array.isArray(h.disciplines) ? h.disciplines : prev.disciplines,
          level: h.level || prev.level,
          max_jump_height: h.max_jump_height ?? prev.max_jump_height,
          temperament: Array.isArray(h.temperament) ? h.temperament : prev.temperament,
          coat_colors: Array.isArray(h.coat_colors) ? h.coat_colors : prev.coat_colors,
          comfort_flags: (h.comfort_flags && typeof h.comfort_flags==='object') ? h.comfort_flags : prev.comfort_flags,
          activity_mode: h.activity_mode || prev.activity_mode,
        }));
        setExpectations(prev => ({
          ...prev,
          required_tasks: Array.isArray(h.required_tasks) ? h.required_tasks : prev.required_tasks,
          optional_tasks: Array.isArray(h.optional_tasks) ? h.optional_tasks : prev.optional_tasks,
        }));
        setCost(prev => ({
          ...prev,
          cost_model: h.cost_model || prev.cost_model,
          cost_amount: (h.cost_amount != null ? String(h.cost_amount) : prev.cost_amount),
        }));
      } catch (e) {
        console.warn('Prefill horse by id failed', e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    // Bouw payload conform backend HorsePayload
    const payload = {};
    // Basic validations
    if (!basic.title || !basic.title.trim()) {
      showToast('Titel is verplicht');
      setStep(1);
      return;
    }
    if (cost.cost_model && (cost.cost_amount === '' || Number(cost.cost_amount) <= 0)) {
      showToast('Vul een geldig bedrag in bij kosten');
      setStep(3);
      return;
    }
    if (basic.title) payload.title = basic.title;
    if (basic.description) payload.description = basic.description;
    if (Array.isArray(basic.ad_types)) {
      payload.ad_types = basic.ad_types;
      if (basic.ad_types.length) payload.ad_type = basic.ad_types[0]; // compat
    }
    if (basic.name) payload.name = basic.name;
    if (basic.type) payload.type = basic.type;
    if (basic.gender) payload.gender = basic.gender;
    if (basic.age !== '' && basic.age != null) payload.age = Number(basic.age);
    if (basic.height !== '' && basic.height != null) payload.height = Number(basic.height);
    if (basic.breed) payload.breed = basic.breed;
    if (Array.isArray(basic.photos) && basic.photos.length) payload.photos = basic.photos;
    if (basic.video_intro_url) payload.video_intro_url = basic.video_intro_url;

    // Beschikbaarheid
    payload.available_days = availability.available_days;
    if (availability.min_days_per_week != null) payload.min_days_per_week = availability.min_days_per_week;
    if (availability.session_duration_min !== '' && availability.session_duration_min != null) payload.session_duration_min = Number(availability.session_duration_min);
    if (availability.session_duration_max !== '' && availability.session_duration_max != null) payload.session_duration_max = Number(availability.session_duration_max);
    if (availability.task_frequency) payload.task_frequency = availability.task_frequency;

    // Kosten
    if (cost.cost_model) payload.cost_model = cost.cost_model;
    if (cost.cost_amount !== '' && cost.cost_amount != null) payload.cost_amount = Number(cost.cost_amount);

    // Filters
    if (Array.isArray(filters.disciplines)) payload.disciplines = filters.disciplines;
    if (Array.isArray(filters.temperament)) payload.temperament = filters.temperament;
    if (Array.isArray(filters.coat_colors)) payload.coat_colors = filters.coat_colors;
    if (filters.level) payload.level = filters.level;
    if (filters.max_jump_height !== '' && filters.max_jump_height != null) payload.max_jump_height = Number(filters.max_jump_height);
    if (filters.comfort_flags) payload.comfort_flags = filters.comfort_flags;
    if (filters.activity_mode) payload.activity_mode = filters.activity_mode;

    // Verwachtingen
    if (Array.isArray(expectations.required_tasks)) payload.required_tasks = expectations.required_tasks;
    if (Array.isArray(expectations.optional_tasks)) payload.optional_tasks = expectations.optional_tasks;
    if (Array.isArray(expectations.required_skills)) payload.required_skills = expectations.required_skills;
    if (Array.isArray(expectations.desired_rider_personality)) payload.desired_rider_personality = expectations.desired_rider_personality;
    if (expectations.rules) payload.rules = expectations.rules;

    try {
      if (horseId) payload.id = Number(horseId);
      const res = await api.ownerHorses.createOrUpdate(payload);
      if (res && res.horse_id) setHorseId(String(res.horse_id));
      showToast('Advertentie opgeslagen');
      navigate('/owner/horses');
    } catch (e) {
      showToast('Opslaan mislukt');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🐴</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{id ? 'Advertentie bewerken' : 'Nieuw Paard toevoegen'}</h1>
            <p className="text-gray-600 mt-2">Vul basis en beschikbaarheid in voor je advertentie.</p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-600">Stap {step} van {totalSteps}</span>
              <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-emerald-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">1</span>
                Titel, Verhaal & Basis
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Titel *</label>
                <input type="text" value={basic.title} onChange={(e)=>setBasic({...basic, title: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verhaal / beschrijving</label>
                <textarea value={basic.description} onChange={(e)=>setBasic({...basic, description: e.target.value})} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Advertentietype (meerdere mogelijk)</label>
                <div className="flex gap-3 flex-wrap">
                  {['bijrijden','verzorgen','lease'].map(t => {
                    const selected = basic.ad_types.includes(t);
                    return (
                      <button key={t} type="button" onClick={()=>{
                        const has = basic.ad_types.includes(t);
                        const next = has ? basic.ad_types.filter(x=>x!==t) : [...basic.ad_types, t];
                        setBasic({...basic, ad_types: next});
                      }}
                        className={`px-4 py-2 rounded-full border ${selected ? 'bg-emerald-100 border-emerald-500 text-emerald-700':'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{t}</button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Naam</label>
                  <input type="text" value={basic.name} onChange={(e)=>setBasic({...basic, name: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select value={basic.type} onChange={(e)=>setBasic({...basic, type: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="horse">Paard</option>
                    <option value="pony">Pony</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Geslacht</label>
                  <select value={basic.gender} onChange={(e)=>setBasic({...basic, gender: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Selecteer...</option>
                    <option value="merrie">Merrie</option>
                    <option value="hengst">Hengst</option>
                    <option value="ruin">Ruin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Leeftijd</label>
                  <input type="number" value={basic.age} onChange={(e)=>setBasic({...basic, age: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stokmaat (cm)</label>
                  <input type="number" value={basic.height} onChange={(e)=>setBasic({...basic, height: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ras</label>
                <input type="text" value={basic.breed} onChange={(e)=>setBasic({...basic, breed: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto's (max 5)</label>
                  <ImageUploader value={basic.photos} onChange={(urls)=>setBasic({...basic, photos: urls})} api={api} max={5} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                  <input type="url" value={basic.video_intro_url} onChange={(e)=>setBasic({...basic, video_intro_url: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">2</span>
                Beschikbaarheid
              </h2>

              <div className="space-y-4">
                {days.map(day => (
                  <div key={day}>
                    <div className="text-sm font-medium text-gray-700 mb-2 capitalize">{day}</div>
                    <div className="flex gap-2 flex-wrap">
                      {timeBlocks.map(block => {
                        const selected = (availability.available_days[day] || []).includes(block);
                        return (
                          <button
                            key={block}
                            type="button"
                            onClick={() => toggleBlock(day, block)}
                            className={`px-3 py-1 rounded-full border text-sm ${selected ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                          >
                            {block}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min. dagen per week</label>
                  <input type="number" min={0} value={availability.min_days_per_week}
                    onChange={(e)=>setAvailability({...availability, min_days_per_week: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sessieduur min (minuten)</label>
                  <input type="number" min={0} value={availability.session_duration_min}
                    onChange={(e)=>setAvailability({...availability, session_duration_min: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sessieduur max (minuten, optioneel)</label>
                  <input type="number" min={0} value={availability.session_duration_max}
                    onChange={(e)=>setAvailability({...availability, session_duration_max: e.target.value === '' ? '' : Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Taakfrequentie</label>
                  <input type="text" value={availability.task_frequency}
                    onChange={(e)=>setAvailability({...availability, task_frequency: e.target.value})}
                    placeholder="bijv. 2x per week verzorging"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">3</span>
                Kosten
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <div className="flex gap-3 flex-wrap">
                    {['per_maand','per_dag'].map(m => (
                      <button key={m} type="button" onClick={()=>setCost({...cost, cost_model: m})}
                        className={`px-4 py-2 rounded-full border ${cost.cost_model===m ? 'bg-emerald-100 border-emerald-500 text-emerald-700':'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{m.replace('_',' ')}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bedrag (€)</label>
                  <input type="number" min={0} value={cost.cost_amount}
                    onChange={(e)=>setCost({...cost, cost_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">4</span>
                Filters & Competenties
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Disciplines</label>
                  <div className="flex gap-2 flex-wrap">
                    {['dressuur','springen','eventing','western','recreatie'].map(d => (
                      <button key={d} type="button" onClick={()=>{
                        const has = filters.disciplines.includes(d);
                        setFilters({...filters, disciplines: has ? filters.disciplines.filter(x=>x!==d) : [...filters.disciplines, d]});
                      }} className={`px-3 py-1 rounded-full border text-sm ${filters.disciplines.includes(d) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Temperament</label>
                  <div className="flex gap-2 flex-wrap">
                    {['kalm','gevoelig','speels','nuchter','dominant','mensgericht'].map(t => (
                      <button key={t} type="button" onClick={()=>{
                        const has = filters.temperament.includes(t);
                        setFilters({...filters, temperament: has ? filters.temperament.filter(x=>x!==t) : [...filters.temperament, t]});
                      }} className={`px-3 py-1 rounded-full border text-sm ${filters.temperament.includes(t) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vachtkleuren</label>
                  <div className="flex gap-2 flex-wrap">
                    {['vos','zwart','bruin','schimmel','bont','valk','palomino','roan'].map(c => (
                      <button key={c} type="button" onClick={()=>{
                        const has = filters.coat_colors.includes(c);
                        setFilters({...filters, coat_colors: has ? filters.coat_colors.filter(x=>x!==c) : [...filters.coat_colors, c]});
                      }} className={`px-3 py-1 rounded-full border text-sm ${filters.coat_colors.includes(c) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{c}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                  <select value={filters.level} onChange={(e)=>setFilters({...filters, level: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="">Selecteer...</option>
                    {['L1','L2','M','Z'].map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max spronghoogte (cm)</label>
                  <input type="number" value={filters.max_jump_height} onChange={(e)=>setFilters({...filters, max_jump_height: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comfort</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      {k:'traffic', label:'Druk verkeer'},
                      {k:'outdoor_solo', label:'Buitenritten (solo)'},
                      {k:'with_other_horses', label:'Met andere paarden'},
                    ].map(opt => (
                      <button key={opt.k} type="button" onClick={()=>setFilters({...filters, comfort_flags: {...filters.comfort_flags, [opt.k]: !filters.comfort_flags[opt.k]}})}
                        className={`px-3 py-1 rounded-full border text-sm ${filters.comfort_flags[opt.k] ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{opt.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Activiteitstype</label>
                  <select value={filters.activity_mode} onChange={(e)=>setFilters({...filters, activity_mode: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                    <option value="ride_or_care">Rijden of verzorgen</option>
                    <option value="ride_only">Alleen rijden</option>
                    <option value="care_only">Alleen verzorgen</option>
                    <option value="ground_only">Alleen grondwerk</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-2 text-sm">5</span>
                Verwachtingen & Eisen
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taken (verplicht)</label>
                <div className="flex gap-2 flex-wrap">
                  {['stalwerk','poetsen','voeren','uitmesten','longeren'].map(t => (
                    <button key={t} type="button" onClick={()=>{
                      const has = expectations.required_tasks.includes(t);
                      setExpectations({...expectations, required_tasks: has ? expectations.required_tasks.filter(x=>x!==t) : [...expectations.required_tasks, t]});
                    }} className={`px-3 py-1 rounded-full border text-sm ${expectations.required_tasks.includes(t) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Taken (optioneel)</label>
                <div className="flex gap-2 flex-wrap">
                  {['wandelen','grondwerk','weide brengen','weide halen'].map(t => (
                    <button key={t} type="button" onClick={()=>{
                      const has = expectations.optional_tasks.includes(t);
                      setExpectations({...expectations, optional_tasks: has ? expectations.optional_tasks.filter(x=>x!==t) : [...expectations.optional_tasks, t]});
                    }} className={`px-3 py-1 rounded-full border text-sm ${expectations.optional_tasks.includes(t) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{t}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vereiste vaardigheden</label>
                <div className="flex gap-2 flex-wrap">
                  {['grondwerk_basis','longeren_basis','zadelmak_ervaring','springervaring_80cm','buitenritten_ervaring'].map(s => (
                    <button key={s} type="button" onClick={()=>{
                      const has = expectations.required_skills.includes(s);
                      setExpectations({...expectations, required_skills: has ? expectations.required_skills.filter(x=>x!==s) : [...expectations.required_skills, s]});
                    }} className={`px-3 py-1 rounded-full border text-sm ${expectations.required_skills.includes(s) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{s.replace('_',' ')}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gewenste ruiter persoonlijkheidsstijl</label>
                <div className="flex gap-2 flex-wrap">
                  {['geduldig','consistent','speels','doortastend','rustig'].map(p => (
                    <button key={p} type="button" onClick={()=>{
                      const has = expectations.desired_rider_personality.includes(p);
                      setExpectations({...expectations, desired_rider_personality: has ? expectations.desired_rider_personality.filter(x=>x!==p) : [...expectations.desired_rider_personality, p]});
                    }} className={`px-3 py-1 rounded-full border text-sm ${expectations.desired_rider_personality.includes(p) ? 'bg-emerald-100 border-emerald-500 text-emerald-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{p}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={expectations.rules.helmet_required} onChange={(e)=>setExpectations({...expectations, rules: {...expectations.rules, helmet_required: e.target.checked}})} /> Helm verplicht
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={expectations.rules.under_18_allowed} onChange={(e)=>setExpectations({...expectations, rules: {...expectations.rules, under_18_allowed: e.target.checked}})} /> Onder 18 toegestaan
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={expectations.rules.contract_required} onChange={(e)=>setExpectations({...expectations, rules: {...expectations.rules, contract_required: e.target.checked}})} /> Contract vereist
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => (step === 1 ? navigate('/dashboard') : setStep(step - 1))}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${step === 1 ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {step === 1 ? 'Annuleren' : 'Vorige'}
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => doAutoSave(true)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                title="Concept opslaan"
              >
                {saving ? 'Opslaan…' : 'Concept opslaan'}
              </button>
            {step < totalSteps ? (
              <button onClick={() => setStep(step + 1)} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                Volgende
              </button>
            ) : (
              <button onClick={handleSave} className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:from-emerald-700 hover:to-teal-700 transition-colors">
                Opslaan
              </button>
            )}
            </div>
          </div>
        </div>
      </div>
      {/* Toast */}
      <Toast visible={toast.visible} message={toast.message} />
    </div>
  );
}

// Simple toast UI
function Toast({ visible, message }) {
  if (!visible) return null;
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
      {message}
    </div>
  );
}
