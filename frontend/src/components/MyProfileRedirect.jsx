import React from 'react';
import { Navigate } from 'react-router-dom';
import { useActiveRole } from '../context/RoleContext';

// Route element: beslist naar juiste profielroute op basis van actieve rol en beschikbare profielen
const MyProfileRedirect = () => {
  const { role, me } = useActiveRole();

  // Geen profiel? Stuur naar keuze/onboarding
  if (!me) return <Navigate to="/profile-choice" replace />;

  // Als beide profielen ontbreken -> keuze
  if (!me.has_owner_profile && !me.has_rider_profile) {
    return <Navigate to="/profile-choice" replace />;
  }

  // Als rol niet bekend, afleiden uit beschikbare profielen
  const effectiveRole = role || (me.has_owner_profile ? 'owner' : 'rider');

  if (effectiveRole === 'owner' && me.has_owner_profile) {
    return <Navigate to="/owner/profile" replace />;
  }
  if (effectiveRole === 'rider' && me.has_rider_profile) {
    return <Navigate to="/rider-profile" replace />;
  }

  // Fallbacks: ga naar bestaand profiel als gekozen rol nog niet bestaat
  if (me.has_owner_profile) return <Navigate to="/owner/profile" replace />;
  if (me.has_rider_profile) return <Navigate to="/rider-profile" replace />;

  return <Navigate to="/profile-choice" replace />;
};

export default MyProfileRedirect;
