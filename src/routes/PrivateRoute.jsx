import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, perm }) {
  const { user, authReady } = useAuth();
  const { slug } = useParams();

  if (!authReady) return <div className="app-loading">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  // Redirect to the user's correct tenant if slug in URL doesn't match
  if (slug && user.tenantSlug && slug !== user.tenantSlug) {
    return <Navigate to={`/${user.tenantSlug}/dashboard`} replace />;
  }

  if (perm && !user.permissions?.[perm]) {
    return <Navigate to={`/${user.tenantSlug || slug}/dashboard`} replace />;
  }

  return children;
}
