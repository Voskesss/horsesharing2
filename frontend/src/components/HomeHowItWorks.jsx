import React from 'react';
import { Link } from 'react-router-dom';

const Step = ({ icon, title, children }) => (
  <div className="rounded-2xl p-6 bg-white/70 backdrop-blur border border-gray-100 shadow-sm hover:shadow-md transition">
    <div className="text-3xl mb-3">{icon}</div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-sm text-gray-600 leading-relaxed">{children}</p>
  </div>
);

const HomeHowItWorks = () => {
  return (
    <section id="how" className="py-16 sm:py-20 bg-gradient-to-b from-white to-emerald-50/40">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Hoe werkt het?</h2>
          <p className="text-gray-600 mt-2">In drie stappen van profiel naar perfecte match.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Step icon="📝" title="1. Vul je profiel">
            Vertel over jezelf of je paard: ervaring, doelen, beschikbaarheid en voorkeuren. Hoe beter het profiel, hoe beter de match.
          </Step>
          <Step icon="✨" title="2. Slimme matching">
            Ons model matcht op ervaring, doelen, karakter, locatie en beschikbaarheid. Je ziet direct passende profielen en advertenties.
          </Step>
          <Step icon="🤝" title="3. Kennismaken">
            Kom in contact, plan een proefafspraak en kijk of het klikt. Jij houdt de regie, wij maken het makkelijk.
          </Step>
        </div>
        <div className="text-center mt-8">
          <Link to="/info/matching" className="text-emerald-700 hover:text-emerald-800 font-semibold">Lees meer over matching →</Link>
        </div>
      </div>
    </section>
  );
};

export default HomeHowItWorks;
