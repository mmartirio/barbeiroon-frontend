import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
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
const Landing            = lazy(() => import('./pages/Landing/Landing'));
const PrimeiroAcesso     = lazy(() => import('./pages/PrimeiroAcesso/PrimeiroAcesso'));
const AgendaRegras       = lazy(() => import('./pages/AgendaRegras/AgendaRegras'));
const PlanoServico       = lazy(() => import('./pages/PlanoServico/PlanoServico'));

const Fallback = () => <div className="app-loading">Carregando...</div>;

// Redirects old bookmarks (without slug) to the correct tenant URL
function LegacyRedirect({ path }) {
  const { user, authReady } = useAuth();
  if (!authReady) return <Fallback />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.tenantSlug) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.tenantSlug}/${path}`} replace />;
}

function AppRoutes() {
  const { user, authReady } = useAuth();
  const location = useLocation();

  useEffect(() => {
    document.title = 'Barbeiro ON';
  }, []);

  if (!authReady) return <Fallback />;

  const dashSlug = user?.tenantSlug;
  const mustSetup = user && /^cliente\..+@barbeiroon\.com$/.test(user.email);

  return (
    <>
      {user && <PendingNotifier />}
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Public */}
          <Route path="/"          element={dashSlug ? <Navigate to={`/${dashSlug}/dashboard`} replace /> : <Landing />} />
          <Route path="/login"     element={dashSlug ? <Navigate to={mustSetup ? `/${dashSlug}/primeiro-acesso` : `/${dashSlug}/dashboard`} replace /> : <Login />} />
          <Route path="/recuperar-senha" element={<RecuperaSenha />} />
          <Route path="/agendar/:slug"   element={<AgendamentoPublico />} />
          <Route path="/registrar"       element={<Registrar />} />
          <Route path="/gestor/*"        element={<GestorApp />} />

          {/* Tenant-scoped private routes */}
          <Route path="/:slug/dashboard"              element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/:slug/cliente-lista"          element={<PrivateRoute perm="canViewCustomers"><ClienteLista /></PrivateRoute>} />
          <Route path="/:slug/cliente-cadastro"       element={<PrivateRoute perm="canCreateCustomer"><ClienteCadastro /></PrivateRoute>} />
          <Route path="/:slug/servico-agendados"      element={<PrivateRoute perm="canViewAppointments"><ClientesAgendados /></PrivateRoute>} />
          <Route path="/:slug/novo-agendamento"       element={<PrivateRoute perm="canCreateAppointment"><NovoAgendamento /></PrivateRoute>} />
          <Route path="/:slug/solicitacoes-pendentes" element={<PrivateRoute perm="canViewAppointments"><SolicitacoesPendentes /></PrivateRoute>} />
          <Route path="/:slug/servico-lista"          element={<PrivateRoute perm="canViewServices"><ServicoLista /></PrivateRoute>} />
          <Route path="/:slug/servico-cadastro"       element={<PrivateRoute perm="canManageServices"><ServicoCadastro /></PrivateRoute>} />
          <Route path="/:slug/usuario-lista"          element={<PrivateRoute perm="canViewUsers"><UsuarioLista /></PrivateRoute>} />
          <Route path="/:slug/usuario-cadastro"       element={<PrivateRoute perm="canCreateUser"><UsuarioCadastro /></PrivateRoute>} />
          <Route path="/:slug/grupo"                  element={<PrivateRoute perm="canManageGroups"><Grupo /></PrivateRoute>} />
          <Route path="/:slug/agenda"                 element={<PrivateRoute perm="canViewAgenda"><Agenda /></PrivateRoute>} />
          <Route path="/:slug/agenda-regras"          element={<PrivateRoute perm="canViewAgenda"><AgendaRegras /></PrivateRoute>} />
          <Route path="/:slug/promocoes"              element={<PrivateRoute perm="canManageServices"><Promocoes /></PrivateRoute>} />
          <Route path="/:slug/planos-servico"         element={<PrivateRoute perm="canManageServices"><PlanoServico /></PrivateRoute>} />
          <Route path="/:slug/relatorios"             element={<PrivateRoute perm="canViewReports"><Relatorios /></PrivateRoute>} />
          <Route path="/:slug/perfil"                 element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/:slug/conta"                  element={<PrivateRoute perm="canManageTenant"><Conta /></PrivateRoute>} />
          <Route path="/:slug/tela-cliente"           element={<PrivateRoute perm="canViewCustomers"><TelaCliente /></PrivateRoute>} />
          <Route path="/:slug/primeiro-acesso"        element={<PrivateRoute><PrimeiroAcesso /></PrivateRoute>} />

          {/* Legacy redirects — keep old bookmarks working */}
          <Route path="/dashboard"              element={<LegacyRedirect path="dashboard" />} />
          <Route path="/cliente-lista"          element={<LegacyRedirect path="cliente-lista" />} />
          <Route path="/cliente-cadastro"       element={<LegacyRedirect path="cliente-cadastro" />} />
          <Route path="/servico-agendados"      element={<LegacyRedirect path="servico-agendados" />} />
          <Route path="/novo-agendamento"       element={<LegacyRedirect path="novo-agendamento" />} />
          <Route path="/solicitacoes-pendentes" element={<LegacyRedirect path="solicitacoes-pendentes" />} />
          <Route path="/servico-lista"          element={<LegacyRedirect path="servico-lista" />} />
          <Route path="/servico-cadastro"       element={<LegacyRedirect path="servico-cadastro" />} />
          <Route path="/usuario-lista"          element={<LegacyRedirect path="usuario-lista" />} />
          <Route path="/usuario-cadastro"       element={<LegacyRedirect path="usuario-cadastro" />} />
          <Route path="/grupo"                  element={<LegacyRedirect path="grupo" />} />
          <Route path="/agenda"                 element={<LegacyRedirect path="agenda" />} />
          <Route path="/promocoes"              element={<LegacyRedirect path="promocoes" />} />
          <Route path="/relatorios"             element={<LegacyRedirect path="relatorios" />} />
          <Route path="/perfil"                 element={<LegacyRedirect path="perfil" />} />
          <Route path="/conta"                  element={<LegacyRedirect path="conta" />} />
          <Route path="/tela-cliente"           element={<LegacyRedirect path="tela-cliente" />} />
          <Route path="/primeiro-acesso"        element={<LegacyRedirect path="primeiro-acesso" />} />

          <Route path="*" element={<Navigate to={dashSlug ? `/${dashSlug}/dashboard` : '/login'} replace />} />
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
