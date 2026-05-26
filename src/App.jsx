import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import PrivateRoute from './routes/PrivateRoute';
import PendingNotifier from './components/PendingNotifier';

// Auth pages
import Login from './pages/Login/Login';
import RecuperaSenha from './pages/RecuperaSenha/RecuperaSenha';

// Lazy-loaded private pages
const Dashboard        = lazy(() => import('./pages/Dashboard/Dashboard'));
const NovoAgendamento  = lazy(() => import('./pages/NovoAgendamento/NovoAgendamento'));
const ClientesAgendados= lazy(() => import('./pages/ClientesAgendados/ClientesAgendados'));
const SolicitacoesPendentes = lazy(() => import('./pages/SolicitacoesPendentes/SolicitacoesPendentes'));
const ClienteLista     = lazy(() => import('./pages/ClienteLista/ClienteLista'));
const ClienteCadastro  = lazy(() => import('./pages/ClienteCadastro/ClienteCadastro'));
const ServicoLista     = lazy(() => import('./pages/ServicoLista/ServicoLista'));
const ServicoCadastro  = lazy(() => import('./pages/ServicoCadastro/ServicoCadastro'));
const UsuarioLista     = lazy(() => import('./pages/UsuarioLista/UsuarioLista'));
const UsuarioCadastro  = lazy(() => import('./pages/UsuarioCadastro/UsuarioCadastro'));
const Grupo            = lazy(() => import('./pages/Grupo/Grupo'));
const Promocoes        = lazy(() => import('./pages/Promocoes/Promocoes'));
const Relatorios       = lazy(() => import('./pages/Relatorios/Relatorios'));
const Perfil           = lazy(() => import('./pages/Perfil/Perfil'));
const Conta            = lazy(() => import('./pages/Conta/Conta'));
const Agenda           = lazy(() => import('./pages/Agenda/Agenda'));
const TelaCliente      = lazy(() => import('./pages/TelaCliente/TelaCliente'));

// Public pages
const CustomerPortal   = lazy(() => import('./components/customer-portal/CustomerPortal'));
const BarbeariaRegister= lazy(() => import('./components/register/BarbeariaRegister'));

// Gestor panel
const GestorLogin      = lazy(() => import('./gestor/GestorLogin'));
const GestorDashboard  = lazy(() => import('./gestor/dashboard/GestorDashboard'));
const EmpresasList     = lazy(() => import('./gestor/empresas/EmpresasList'));
const PlanosList       = lazy(() => import('./gestor/planos/PlanosList'));
const PagamentosList   = lazy(() => import('./gestor/pagamentos/PagamentosList'));
const Relatorios2      = lazy(() => import('./gestor/relatorios/Relatorios'));
const GestorSetup      = lazy(() => import('./gestor/setup/GestorSetup'));
const AdminsList       = lazy(() => import('./gestor/admins/AdminsList'));

import { GestorGuard } from './gestor/GestorLayout';

const Fallback = () => <div className="app-loading">Carregando...</div>;

function AppRoutes() {
  const { user, authReady } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.title = user?.name ? `${user.name} — Barbeiro On` : 'Barbeiro On';
  }, [user?.name]);

  if (!authReady) return <div className="app-loading">Carregando...</div>;

  return (
    <>
      {user && <PendingNotifier />}
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/admin/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/recuperar-senha" element={<RecuperaSenha />} />
          <Route path="/cadastro-barbearia" element={<BarbeariaRegister />} />
          <Route path="/agendar/:slug" element={<CustomerPortal />} />

          {/* Private */}
          <Route path="/dashboard"             element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/novo-agendamento"      element={<PrivateRoute perm="canViewAppointments"><NovoAgendamento /></PrivateRoute>} />
          <Route path="/servico-agendados"     element={<PrivateRoute perm="canViewAppointments"><ClientesAgendados /></PrivateRoute>} />
          <Route path="/solicitacoes-pendentes" element={<PrivateRoute perm="canViewAppointments"><SolicitacoesPendentes /></PrivateRoute>} />
          <Route path="/cliente-lista"         element={<PrivateRoute perm="canViewCustomers"><ClienteLista /></PrivateRoute>} />
          <Route path="/cliente-cadastro"      element={<PrivateRoute perm="canCreateCustomer"><ClienteCadastro /></PrivateRoute>} />
          <Route path="/servico-lista"         element={<PrivateRoute perm="canViewServices"><ServicoLista /></PrivateRoute>} />
          <Route path="/servico-cadastro"      element={<PrivateRoute perm="canManageServices"><ServicoCadastro /></PrivateRoute>} />
          <Route path="/usuario-lista"         element={<PrivateRoute perm="canViewUsers"><UsuarioLista /></PrivateRoute>} />
          <Route path="/usuario"               element={<PrivateRoute perm="canCreateUser"><UsuarioCadastro /></PrivateRoute>} />
          <Route path="/grupo"                 element={<PrivateRoute perm="canManageGroups"><Grupo /></PrivateRoute>} />
          <Route path="/promocoes"             element={<PrivateRoute perm="canManageServices"><Promocoes /></PrivateRoute>} />
          <Route path="/relatorios"            element={<PrivateRoute perm="canViewReports"><Relatorios /></PrivateRoute>} />
          <Route path="/perfil"                element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/conta"                 element={<PrivateRoute perm="canManageTenant"><Conta /></PrivateRoute>} />
          <Route path="/agenda"                element={<PrivateRoute perm="canViewAgenda"><Agenda /></PrivateRoute>} />
          <Route path="/tela-cliente"          element={<PrivateRoute perm="canViewCustomers"><TelaCliente /></PrivateRoute>} />

          {/* Gestor */}
          <Route path="/gestor"                element={<GestorLogin />} />
          <Route path="/gestor/setup"          element={<GestorGuard><GestorSetup /></GestorGuard>} />
          <Route path="/gestor/dashboard"      element={<GestorGuard><GestorDashboard /></GestorGuard>} />
          <Route path="/gestor/empresas"       element={<GestorGuard><EmpresasList /></GestorGuard>} />
          <Route path="/gestor/planos"         element={<GestorGuard><PlanosList /></GestorGuard>} />
          <Route path="/gestor/pagamentos"     element={<GestorGuard><PagamentosList /></GestorGuard>} />
          <Route path="/gestor/relatorios"     element={<GestorGuard><Relatorios2 /></GestorGuard>} />
          <Route path="/gestor/administradores" element={<GestorGuard><AdminsList /></GestorGuard>} />

          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
