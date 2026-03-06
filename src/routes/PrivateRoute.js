import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PrivateRoute({ children, required }) {
  const { user, authReady } = useAuth();
  if (!authReady) {
    return null;
  }

  if (!user) {
    return <Navigate to="/admin" replace />;
  }

  if (required) {
    const permissions = user?.permissions || {};
    const allowed = Array.isArray(required)
      ? required.some((key) => !!permissions[key])
      : !!permissions[required];
    if (!allowed) {
      return <Navigate to="/perfil" replace />;
    }
  }

  return children;
}
