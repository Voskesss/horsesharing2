import React from 'react';
import { Link } from 'react-router-dom';

const SampleCard = ({ photo, name, role, meta, to }) => (
  <Link to={to} className="group block rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-emerald-200 shadow-sm hover:shadow-md transition">
    <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
      <img src={photo} alt={name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
    </div>
    <div className="p-4">
      <div className="text-xs uppercase tracking-wide text-emerald-600 font-semibold mb-1">{role}</div>
      <div className="text-gray-900 font-semibold">{name}</div>
      <div className="text-sm text-gray-600 mt-1">{meta}</div>
    </div>
  </Link>
);

const HomeSampleProfiles = () => {
  // Placeholder foto's (vervang later): gebruik bestaande uploads of stock placeholders
  const samples = [
    { id: 'r1', role: 'Ruiter', name: 'Sanne (24)', meta: '3 jaar ervaring • 2x p/w • Gelderland', to: '/rider-profile', photo: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?q=80&w=1200&auto=format&fit=crop' },
    { id: 'r2', role: 'Ruiter', name: 'Lotte (16)', meta: 'Beginnend • 1-2x p/w • Utrecht', to: '/rider-profile', photo: 'https://images.unsplash.com/photo-1522012411659-c38a6c226edc?q=80&w=1200&auto=format&fit=crop' },
    { id: 'o1', role: 'Eigenaar', name: 'Fjord "Nora"', meta: 'Braaf • Buitenritten • 145 cm • Arnhem', to: '/owner/horses', photo: 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?q=80&w=1200&auto=format&fit=crop' },
  ];

  return (
    <section id="samples" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Voorbeeldprofielen</h2>
            <p className="text-gray-600">Een indruk van het type ruiters en paarden dat je vindt.</p>
          </div>
          <Link to="/profile-choice" className="hidden sm:inline-flex text-emerald-700 hover:text-emerald-800 font-semibold">Alle profielen →</Link>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {samples.map(s => (
            <SampleCard key={s.id} {...s} />
          ))}
        </div>
        <div className="text-center sm:hidden mt-6">
          <Link to="/profile-choice" className="text-emerald-700 hover:text-emerald-800 font-semibold">Alle profielen →</Link>
        </div>
      </div>
    </section>
  );
};

export default HomeSampleProfiles;
