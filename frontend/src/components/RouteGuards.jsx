import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useActiveRole } from '../context/RoleContext';

export const RiderGuard = ({ children }) => {
  const { role, me } = useActiveRole();
  const loc = useLocation();

  // Geen data: laat verder gaan; App heeft RoleProvider bovenin die snel vult
  if (!me) return children;

  // Als gebruiker geen rider-profiel heeft: stuur naar owner omgeving indien beschikbaar of profile-choice
  if (!me.has_rider_profile) {
    if (me.has_owner_profile) return <Navigate to="/owner/profile" replace state={{ from: loc }} />;
    return <Navigate to="/profile-choice" replace state={{ from: loc }} />;
  }

  // Actieve rol is owner -> redirect naar owner profiel (correcte omgeving)
  if (role === 'owner') {
    return <Navigate to="/owner/profile" replace state={{ from: loc }} />;
  }

  return children;
};

export const OwnerGuard = ({ children }) => {
  const { role, me } = useActiveRole();
  const loc = useLocation();

  if (!me) return children;

  if (!me.has_owner_profile) {
    if (me.has_rider_profile) return <Navigate to="/rider-profile" replace state={{ from: loc }} />;
    return <Navigate to="/profile-choice" replace state={{ from: loc }} />;
  }

  if (role === 'rider') {
    return <Navigate to="/rider-profile" replace state={{ from: loc }} />;
  }

  return children;
};
