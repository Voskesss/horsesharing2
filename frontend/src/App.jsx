import React from 'react';
import { KindeProvider } from '@kinde-oss/kinde-auth-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import ProfileChoice from './pages/ProfileChoice';
import RiderOnboarding from './pages/RiderOnboarding';
import OwnerOnboarding from './pages/OwnerOnboarding';
import Dashboard from './pages/Dashboard';

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
            <Route path="/owner-onboarding" element={<OwnerOnboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </KindeProvider>
  );
}

export default App;
