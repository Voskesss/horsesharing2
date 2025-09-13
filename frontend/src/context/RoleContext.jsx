import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { createAPI } from '../utils/api';

const RoleContext = createContext({ role: null, me: null, setActiveRole: async () => {}, reloadMe: async () => {} });

export const RoleProvider = ({ children }) => {
  const { isAuthenticated, getToken } = useKindeAuth();
  const api = useMemo(() => createAPI(getToken), [getToken]);
  const [me, setMe] = useState(null);
  const [role, setRole] = useState(null);

  const deriveRole = (m) => {
    if (!m) return null;
    if (m.profile_type_chosen) return m.profile_type_chosen;
    if (m.has_owner_profile) return 'owner';
    if (m.has_rider_profile) return 'rider';
    return null;
  };

  const loadMe = async () => {
    try {
      if (!isAuthenticated) { setMe(null); setRole(null); return; }
      const data = await api.user.getMe();
      setMe(data);
      setRole(deriveRole(data));
    } catch {
      setMe(null); setRole(null);
    }
  };

  useEffect(() => { loadMe(); /* eslint-disable-next-line */ }, [isAuthenticated]);

  useEffect(() => {
    if (role) document.body.dataset.role = role; else delete document.body.dataset.role;
  }, [role]);

  const setActiveRole = async (r) => {
    try {
      await api.user.setRole(r);
      await loadMe();
    } catch {}
  };

  return (
    <RoleContext.Provider value={{ role, me, setActiveRole, reloadMe: loadMe }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useActiveRole = () => useContext(RoleContext);
