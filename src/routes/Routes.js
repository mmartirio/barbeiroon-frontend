import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Admin from '../administrador/loginAdmin/Login';
import AdminDashboard from '../administrador/painel/AdminDashboard';
import Usuario from '../administrador/components/usuario/Usuario';
import Servicos from '../administrador/components/servicos/Services';
import Agendados from '../administrador/components/servicos/Agendados';
import Agenda from '../administrador/components/agenda/Agenda';
import Relatorio from '../administrador/components/relatorios/Relatorio';
import TelaCliente from '../administrador/components/tela-cliente/TelaCliente';
import Perfil from '../administrador/painel/Perfil';
import Conta from '../administrador/painel/Conta';
import RecuperarSenha from '../administrador/loginAdmin/RecuperaSenha';
import BarbeariaRegister from '../components/register/BarbeariaRegister';
import CustomerPortal from '../components/customer-portal/CustomerPortal';
import PrivateRoute from './PrivateRoute';
import Grupo from '../administrador/components/usuario/Grupo';

import GestorLogin from '../gestor/GestorLogin';
import { GestorGuard } from '../gestor/GestorLayout';

const GestorDashboard  = lazy(() => import('../gestor/dashboard/GestorDashboard'));
const EmpresasList     = lazy(() => import('../gestor/empresas/EmpresasList'));
const PlanosList       = lazy(() => import('../gestor/planos/PlanosList'));
const PagamentosList   = lazy(() => import('../gestor/pagamentos/PagamentosList'));
const Relatorios       = lazy(() => import('../gestor/relatorios/Relatorios'));
const GestorSetup      = lazy(() => import('../gestor/setup/GestorSetup'));
const AdminsList       = lazy(() => import('../gestor/admins/AdminsList'));

const UsuarioLista = lazy(() => import('../administrador/painel/pages/UsuarioLista'));
const ClienteCadastro = lazy(() => import('../administrador/painel/pages/ClienteCadastro'));
const ClienteLista = lazy(() => import('../administrador/painel/pages/ClienteLista'));
const ServicoLista = lazy(() => import('../administrador/painel/pages/ServicoLista'));
const Promocoes = lazy(() => import('../administrador/components/promocoes/Promocoes'));


const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/admin/login" element={<Admin />} />
      <Route path="/recuperar-senha" element={<RecuperarSenha />} />
      <Route path="/cadastro-barbearia" element={<BarbeariaRegister />} />
      <Route path="/agendar/:slug" element={<CustomerPortal />} />
      
      {/* Rotas Privadas */}
      <Route path="/dashboard" element={<PrivateRoute required={['canViewAppointments', 'canViewAgenda', 'canViewCustomers', 'canViewServices', 'canViewReports']}><AdminDashboard /></PrivateRoute>} />
      <Route path="/usuario" element={<PrivateRoute required="canCreateUser"><Usuario /></PrivateRoute>} />
      <Route path="/servicos" element={<PrivateRoute required="canManageServices"><Servicos /></PrivateRoute>} />
      <Route path="/servico-agendados" element={<PrivateRoute required="canViewAppointments"><Agendados /></PrivateRoute>} />
      <Route path="/agenda" element={<PrivateRoute required="canViewAgenda"><Agenda /></PrivateRoute>} />
      <Route path="/relatorios" element={<PrivateRoute required="canViewReports"><Relatorio /></PrivateRoute>} />
      <Route path="/tela-cliente" element={<PrivateRoute required="canViewCustomers"><TelaCliente /></PrivateRoute>} />
      <Route path="/perfil" element={<PrivateRoute><Perfil /></PrivateRoute>} />
      <Route path="/conta" element={<PrivateRoute required="canManageTenant"><Conta /></PrivateRoute>} />
      <Route path="/usuario-lista" element={<PrivateRoute required="canViewUsers"><Suspense fallback={<div>Carregando...</div>}><UsuarioLista /></Suspense></PrivateRoute>} />
      <Route path="/cliente-cadastro" element={<PrivateRoute required="canCreateCustomer"><Suspense fallback={<div>Carregando...</div>}><ClienteCadastro /></Suspense></PrivateRoute>} />
      <Route path="/cliente-lista" element={<PrivateRoute required="canViewCustomers"><Suspense fallback={<div>Carregando...</div>}><ClienteLista /></Suspense></PrivateRoute>} />
      <Route path="/servico-cadastro" element={<PrivateRoute required="canManageServices"><Servicos /></PrivateRoute>} />
      <Route path="/servico-lista" element={<PrivateRoute required="canViewServices"><Suspense fallback={<div>Carregando...</div>}><ServicoLista /></Suspense></PrivateRoute>} />
      <Route path="/promocoes" element={<PrivateRoute required="canManageServices"><Suspense fallback={<div>Carregando...</div>}><Promocoes /></Suspense></PrivateRoute>} />
      <Route path="/grupo" element={<PrivateRoute required="canManageGroups"><Grupo /></PrivateRoute>} />

      {/* ── Painel Gestor ── */}
      <Route path="/gestor" element={<GestorLogin />} />
      <Route path="/gestor/setup" element={
        <GestorGuard><Suspense fallback={<div>Carregando...</div>}><GestorSetup /></Suspense></GestorGuard>
      } />
      <Route path="/gestor/dashboard" element={
        <GestorGuard><Suspense fallback={<div>Carregando...</div>}><GestorDashboard /></Suspense></GestorGuard>
      } />
      <Route path="/gestor/empresas" element={
        <GestorGuard><Suspense fallback={<div>Carregando...</div>}><EmpresasList /></Suspense></GestorGuard>
      } />
      <Route path="/gestor/planos" element={
        <GestorGuard><Suspense fallback={<div>Carregando...</div>}><PlanosList /></Suspense></GestorGuard>
      } />
      <Route path="/gestor/pagamentos" element={
        <GestorGuard><Suspense fallback={<div>Carregando...</div>}><PagamentosList /></Suspense></GestorGuard>
      } />
      <Route path="/gestor/relatorios" element={
        <GestorGuard><Suspense fallback={<div>Carregando...</div>}><Relatorios /></Suspense></GestorGuard>
      } />
      <Route path="/gestor/administradores" element={
        <GestorGuard><Suspense fallback={<div>Carregando...</div>}><AdminsList /></Suspense></GestorGuard>
      } />
    </Routes>
  );
};

export default AppRoutes;
