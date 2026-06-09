import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, perm, feature }) {
  const { user, authReady } = useAuth();
  const { slug } = useParams();

  if (!authReady) return <div className="app-loading">Carregando...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const dest = `/${user.tenantSlug || slug}/dashboard`;

  if (slug && user.tenantSlug && slug !== user.tenantSlug) {
    return <Navigate to={`/${user.tenantSlug}/dashboard`} replace />;
  }

  if (perm && !user.permissions?.[perm]) {
    return <Navigate to={dest} replace />;
  }

  if (feature) {
    const planFeatures = user.planFeatures || [];
    if (planFeatures.length > 0 && !planFeatures.includes(feature)) {
      sessionStorage.setItem('featureFlash', `"${feature}" não está disponível no seu plano atual.`);
      return <Navigate to={dest} replace />;
    }
  }

  return children;
}
