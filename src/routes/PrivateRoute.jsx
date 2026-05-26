import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PrivateRoute({ children, perm }) {
  const { user, authReady } = useAuth();

  if (!authReady) return <div className="app-loading">Carregando...</div>;
  if (!user) return <Navigate to="/admin" replace />;
  if (perm && !user.permissions?.[perm]) return <Navigate to="/dashboard" replace />;

  return children;
}
