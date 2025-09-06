import React from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { isAuthenticated, user } = useKindeAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welkom, {user?.given_name || 'Gebruiker'}!
          </h1>
          <p className="text-gray-600 mt-2">
            Je dashboard wordt binnenkort beschikbaar. We werken hard aan het voltooien van alle functies.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🏇</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mijn Profiel</h3>
            <p className="text-gray-600 text-sm mb-4">
              Bekijk en bewerk je profiel informatie
            </p>
            <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
              Bekijk profiel →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💕</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Matches</h3>
            <p className="text-gray-600 text-sm mb-4">
              Ontdek potentiële matches in je buurt
            </p>
            <button className="text-emerald-600 text-sm font-medium hover:text-emerald-700">
              Bekijk matches →
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Berichten</h3>
            <p className="text-gray-600 text-sm mb-4">
              Chat met je matches en maak afspraken
            </p>
            <button className="text-purple-600 text-sm font-medium hover:text-purple-700">
              Bekijk berichten →
            </button>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            🚀 Platform in ontwikkeling
          </h2>
          <p className="text-gray-600">
            We bouwen hard aan alle functies van HorseSharing. Binnenkort kun je hier je matches bekijken, 
            berichten versturen en afspraken maken. Bedankt voor je geduld!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
