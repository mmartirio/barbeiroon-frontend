import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import PrivateRoute from './routes/PrivateRoute';
import PendingNotifier from './components/PendingNotifier';

const Login              = lazy(() => import('./pages/Login/Login'));
const RecuperaSenha      = lazy(() => import('./pages/RecuperaSenha/RecuperaSenha'));
const Dashboard          = lazy(() => import('./pages/Dashboard/Dashboard'));
const ClienteLista       = lazy(() => import('./pages/ClienteLista/ClienteLista'));
const ClienteCadastro    = lazy(() => import('./pages/ClienteCadastro/ClienteCadastro'));
const ClientesAgendados  = lazy(() => import('./pages/ClientesAgendados/ClientesAgendados'));
const ServicoLista       = lazy(() => import('./pages/ServicoLista/ServicoLista'));
const ServicoCadastro    = lazy(() => import('./pages/ServicoCadastro/ServicoCadastro'));
const NovoAgendamento    = lazy(() => import('./pages/NovoAgendamento/NovoAgendamento'));
const SolicitacoesPendentes = lazy(() => import('./pages/SolicitacoesPendentes/SolicitacoesPendentes'));
const UsuarioLista       = lazy(() => import('./pages/UsuarioLista/UsuarioLista'));
const UsuarioCadastro    = lazy(() => import('./pages/UsuarioCadastro/UsuarioCadastro'));
const Grupo              = lazy(() => import('./pages/Grupo/Grupo'));
const Agenda             = lazy(() => import('./pages/Agenda/Agenda'));
const Promocoes          = lazy(() => import('./pages/Promocoes/Promocoes'));
const Relatorios         = lazy(() => import('./pages/Relatorios/Relatorios'));
const Perfil             = lazy(() => import('./pages/Perfil/Perfil'));
const Conta              = lazy(() => import('./pages/Conta/Conta'));
const TelaCliente        = lazy(() => import('./pages/TelaCliente/TelaCliente'));
const AgendamentoPublico = lazy(() => import('./pages/AgendamentoPublico/AgendamentoPublico'));
const GestorApp          = lazy(() => import('./pages/Gestor/GestorApp'));
const Registrar          = lazy(() => import('./pages/Registrar/Registrar'));

const Fallback = () => <div className="app-loading">Carregando...</div>;

function AppRoutes() {
  const { user, authReady } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Barbeiro On';
  }, []);

  if (!authReady) return <Fallback />;

  return (
    <>
      {user && <PendingNotifier />}
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/"          element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
          <Route path="/login"     element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/recuperar-senha" element={<RecuperaSenha />} />
          <Route path="/agendar/:slug"  element={<AgendamentoPublico />} />
          <Route path="/registrar"      element={<Registrar />} />

          <Route path="/dashboard"             element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/cliente-lista"         element={<PrivateRoute perm="canViewCustomers"><ClienteLista /></PrivateRoute>} />
          <Route path="/cliente-cadastro"      element={<PrivateRoute perm="canCreateCustomer"><ClienteCadastro /></PrivateRoute>} />
          <Route path="/servico-agendados"     element={<PrivateRoute perm="canViewAppointments"><ClientesAgendados /></PrivateRoute>} />
          <Route path="/novo-agendamento"      element={<PrivateRoute perm="canCreateAppointment"><NovoAgendamento /></PrivateRoute>} />
          <Route path="/solicitacoes-pendentes" element={<PrivateRoute perm="canViewAppointments"><SolicitacoesPendentes /></PrivateRoute>} />
          <Route path="/servico-lista"         element={<PrivateRoute perm="canViewServices"><ServicoLista /></PrivateRoute>} />
          <Route path="/servico-cadastro"      element={<PrivateRoute perm="canManageServices"><ServicoCadastro /></PrivateRoute>} />
          <Route path="/usuario-lista"         element={<PrivateRoute perm="canViewUsers"><UsuarioLista /></PrivateRoute>} />
          <Route path="/usuario-cadastro"      element={<PrivateRoute perm="canCreateUser"><UsuarioCadastro /></PrivateRoute>} />
          <Route path="/grupo"                 element={<PrivateRoute perm="canManageGroups"><Grupo /></PrivateRoute>} />
          <Route path="/agenda"                element={<PrivateRoute perm="canViewAgenda"><Agenda /></PrivateRoute>} />
          <Route path="/promocoes"             element={<PrivateRoute perm="canManageServices"><Promocoes /></PrivateRoute>} />
          <Route path="/relatorios"            element={<PrivateRoute perm="canViewReports"><Relatorios /></PrivateRoute>} />
          <Route path="/perfil"                element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/conta"                 element={<PrivateRoute perm="canManageTenant"><Conta /></PrivateRoute>} />
          <Route path="/tela-cliente"          element={<PrivateRoute perm="canViewCustomers"><TelaCliente /></PrivateRoute>} />
          <Route path="/gestor/*"              element={<GestorApp />} />

          <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
