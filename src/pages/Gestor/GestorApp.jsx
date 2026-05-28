import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { GestorAuthProvider, useGestorAuth } from '../../context/GestorAuthContext';
import GestorLayout from '../../components/GestorLayout/Layout';

const GestorLogin     = lazy(() => import('./GestorLogin'));
const GestorSetup     = lazy(() => import('./GestorSetup'));
const GestorDashboard = lazy(() => import('./GestorDashboard'));
const GestorAdmins    = lazy(() => import('./GestorAdmins'));
const GestorPlans     = lazy(() => import('./GestorPlans'));
const GestorCompanies = lazy(() => import('./GestorCompanies'));
const GestorMonitor   = lazy(() => import('./GestorMonitor'));
const GestorBilling   = lazy(() => import('./GestorBilling'));

const Fallback = () => <div className="app-loading">Carregando...</div>;

function GestorRoutes() {
  const { token, mustSetup } = useGestorAuth();

  if (!token) return <Suspense fallback={<Fallback />}><GestorLogin /></Suspense>;
  if (mustSetup) return <Suspense fallback={<Fallback />}><GestorSetup /></Suspense>;

  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<GestorLayout />}>
          <Route index element={<GestorDashboard />} />
          <Route path="empresas"      element={<GestorCompanies />} />
          <Route path="monitoramento" element={<GestorMonitor />} />
          <Route path="planos"        element={<GestorPlans />} />
          <Route path="cobrancas"     element={<GestorBilling />} />
          <Route path="admins"        element={<GestorAdmins />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default function GestorApp() {
  return (
    <GestorAuthProvider>
      <GestorRoutes />
    </GestorAuthProvider>
  );
}
