import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI } from '../utils/api';

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

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const [step, setStep] = useState(1);
  const totalSteps = 2;

  // Stap 1: Basis info
  const [basic, setBasic] = useState({
    name: '',
    type: 'horse', // horse | pony
    gender: '',
    age: '',
    height: '',
    breed: '',
  });

  // Stap 2: Beschikbaarheid
  const [availability, setAvailability] = useState({
    available_days: defaultSchedule(),
    min_days_per_week: 1,
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

  const handleSave = async () => {
    // Bouw payload conform backend HorsePayload
    const payload = {};
    if (basic.name) payload.name = basic.name;
    if (basic.type) payload.type = basic.type;
    if (basic.gender) payload.gender = basic.gender;
    if (basic.age !== '' && basic.age != null) payload.age = Number(basic.age);
    if (basic.height !== '' && basic.height != null) payload.height = Number(basic.height);
    if (basic.breed) payload.breed = basic.breed;

    // Beschikbaarheid
    payload.available_days = availability.available_days;
    if (availability.min_days_per_week != null) payload.min_days_per_week = availability.min_days_per_week;
    if (availability.task_frequency) payload.task_frequency = availability.task_frequency;

    try {
      await api.ownerHorses.createOrUpdate(payload);
      navigate('/dashboard');
    } catch (e) {
      alert(`Opslaan mislukt: ${e.message}`);
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
            <h1 className="text-3xl font-bold text-gray-900">Nieuw Paard toevoegen</h1>
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
                Basis informatie
              </h2>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min. dagen per week</label>
                  <input type="number" min={0} value={availability.min_days_per_week}
                    onChange={(e)=>setAvailability({...availability, min_days_per_week: Number(e.target.value)})}
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

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => (step === 1 ? navigate('/dashboard') : setStep(step - 1))}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${step === 1 ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            >
              {step === 1 ? 'Annuleren' : 'Vorige'}
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
  );
}
