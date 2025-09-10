import React from 'react';
import { KindeProvider } from '@kinde-oss/kinde-auth-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ProfileChoice from './pages/ProfileChoice';
import RiderOnboarding from './pages/RiderOnboarding';
import RiderProfile from './pages/RiderProfile';
import OwnerOnboarding from './pages/OwnerOnboarding';
import HorseAdWizard from './pages/HorseAdWizard';
import Dashboard from './pages/Dashboard';
import OwnerProfile from './pages/OwnerProfile';
import OwnerHorses from './pages/OwnerHorses';
import AdDetail from './pages/AdDetail';

function App() {
  return (
    <KindeProvider
      clientId="d80a119a2a8a453a899f05af988a592b"
      domain="https://horsesharing.kinde.com"
      redirectUri={window.location.origin}
      logoutUri={window.location.origin}
    >
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/callback" element={<div className="min-h-screen flex items-center justify-center">Loading...</div>} />
            <Route path="/profile-choice" element={<ProfileChoice />} />
            <Route path="/rider-onboarding" element={<RiderOnboarding />} />
            <Route path="/rider-profile" element={<RiderProfile />} />
            <Route path="/owner-onboarding" element={<OwnerOnboarding />} />
            <Route path="/owner/horses/new" element={<HorseAdWizard />} />
            <Route path="/owner/horses/:id/edit" element={<HorseAdWizard />} />
            <Route path="/owner/horses" element={<OwnerHorses />} />
            <Route path="/owner/profile" element={<OwnerProfile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ads/:id" element={<AdDetail />} />
          </Routes>
        </div>
      </Router>
    </KindeProvider>
  );
}

export default App;
