import React from 'react';
import { Link } from 'react-router-dom';
import { useActiveRole } from '../context/RoleContext';

// Gebruik: <RoleAwareLink toRider="/rider-profile" toOwner="/owner/profile">Naar mijn profiel</RoleAwareLink>
const RoleAwareLink = ({ toRider, toOwner, children, ...rest }) => {
  const { role } = useActiveRole();
  const to = role === 'owner' ? (toOwner || '/owner/profile') : (toRider || '/rider-profile');
  return <Link to={to} {...rest}>{children}</Link>;
};

export default RoleAwareLink;
