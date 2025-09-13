import React from 'react';
import { KindeProvider } from '@kinde-oss/kinde-auth-react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import { RoleProvider } from './context/RoleContext';
import MyProfileRedirect from './components/MyProfileRedirect';
import { RiderGuard, OwnerGuard } from './components/RouteGuards';
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
      <RoleProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/callback" element={<div className="min-h-screen flex items-center justify-center">Loading...</div>} />
              <Route path="/profile-choice" element={<ProfileChoice />} />
              <Route path="/rider-onboarding" element={<RiderGuard><RiderOnboarding /></RiderGuard>} />
              <Route path="/rider-profile" element={<RiderGuard><RiderProfile /></RiderGuard>} />
              <Route path="/owner-onboarding" element={<OwnerOnboarding />} />
              <Route path="/owner/horses/new" element={<OwnerGuard><HorseAdWizard /></OwnerGuard>} />
              <Route path="/owner/horses/:id/edit" element={<OwnerGuard><HorseAdWizard /></OwnerGuard>} />
              <Route path="/owner/horses" element={<OwnerGuard><OwnerHorses /></OwnerGuard>} />
              <Route path="/owner/profile" element={<OwnerGuard><OwnerProfile /></OwnerGuard>} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ads/:id" element={<AdDetail />} />
              <Route path="/my-profile" element={<MyProfileRedirect />} />
            </Routes>
          </div>
        </Router>
      </RoleProvider>
    </KindeProvider>
  );
}

export default App;
