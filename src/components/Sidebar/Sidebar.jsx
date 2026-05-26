import React, { useState, useContext, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import s from './Sidebar.module.css';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import {
  FiGrid, FiUsers, FiCalendar, FiScissors, FiBarChart2,
  FiUser, FiUserPlus, FiList, FiMonitor, FiBriefcase,
  FiSettings, FiLogOut, FiMenu, FiX, FiChevronDown, FiChevronRight,
  FiSmartphone, FiTag,
} from 'react-icons/fi';
import defaultAvatar from '../../assets/user.png';
import WhatsAppModal from '../../administrador/painel/WhatsAppModal';

const NavItem = ({ to, icon, label }) => (
  <li className={s.navItem}>
    <NavLink to={to} className={({ isActive }) => isActive ? s.active : undefined}>
      {icon} {label}
    </NavLink>
  </li>
);

const SubMenu = ({ icon, label, children, menuKey, open, onToggle }) => (
  <li>
    <button className={s.submenuToggle} onClick={() => onToggle(menuKey)}>
      <span className={s.submenuLabel}>{icon} {label}</span>
      {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
    </button>
    <ul className={`${s.submenu} ${open ? s.open : ''}`}>
      {children}
    </ul>
  </li>
);

const SubItem = ({ to, icon, label }) => (
  <li>
    <NavLink to={to} className={({ isActive }) => isActive ? s.active : undefined}>
      {icon} {label}
    </NavLink>
  </li>
);

export default function Sidebar() {
  const { user, logout } = useContext(AuthContext);
  const { logo } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('sidebarMenus') || '{}'); }
    catch { return {}; }
  });

  const p = (perm) => !!user?.permissions?.[perm];
  const any = (...perms) => perms.some(p);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    try { sessionStorage.setItem('sidebarMenus', JSON.stringify(openMenus)); } catch { /* noop */ }
  }, [openMenus]);

  const toggle = (key) => setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));

  const canDashboard = any('canViewAppointments','canViewAgenda','canViewCustomers','canViewServices','canViewReports');
  const canClients   = any('canViewCustomers','canCreateCustomer','canEditCustomer','canDeleteCustomer');
  const canUsers     = any('canViewUsers','canCreateUser','canEditUser','canDeleteUser','canManageGroups');
  const canServices  = any('canViewServices','canManageServices','canViewAppointments');

  return (
    <>
      <button className={s.hamburger} onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
        <FiMenu size={20} />
      </button>

      <div className={`${s.overlay} ${mobileOpen ? s.open : ''}`} onClick={() => setMobileOpen(false)} />

      <nav className={`${s.sidebar} ${mobileOpen ? s.open : ''}`}>
        <button className={s.closeBtn} onClick={() => setMobileOpen(false)} aria-label="Fechar">
          <FiX size={20} />
        </button>

        <div className={s.logo}>
          <img src={logo || defaultAvatar} alt="logo" className={s.logoImg} onError={e => { e.target.src = defaultAvatar; }} />
          <span className={s.logoName}>{user?.name || 'Barbeiro On'}</span>
        </div>

        <ul className={s.nav}>
          {canDashboard && <NavItem to="/dashboard" icon={<FiGrid size={16} />} label="Dashboard" />}

          {canClients && (
            <SubMenu icon={<FiUsers size={16} />} label="Clientes" menuKey="clients" open={openMenus.clients} onToggle={toggle}>
              {p('canCreateCustomer') && <SubItem to="/cliente-cadastro" icon={<FiUserPlus size={14} />} label="Cadastrar" />}
              {p('canViewCustomers')  && <SubItem to="/cliente-lista"    icon={<FiList size={14} />}     label="Lista de Clientes" />}
              {p('canViewAppointments') && <SubItem to="/servico-agendados" icon={<FiCalendar size={14} />} label="Clientes Agendados" />}
              {p('canViewCustomers')  && <SubItem to="/tela-cliente"     icon={<FiMonitor size={14} />}  label="Tela do Cliente" />}
            </SubMenu>
          )}

          {canUsers && (
            <SubMenu icon={<FiUser size={16} />} label="Usuários" menuKey="users" open={openMenus.users} onToggle={toggle}>
              {p('canCreateUser')    && <SubItem to="/usuario"       icon={<FiUserPlus size={14} />} label="Cadastrar" />}
              {p('canViewUsers')     && <SubItem to="/usuario-lista" icon={<FiList size={14} />}     label="Lista de Usuários" />}
              {p('canManageGroups') && <SubItem to="/grupo"          icon={<FiBriefcase size={14} />} label="Grupos" />}
            </SubMenu>
          )}

          {canServices && (
            <SubMenu icon={<FiScissors size={16} />} label="Serviços" menuKey="services" open={openMenus.services} onToggle={toggle}>
              {p('canManageServices') && <SubItem to="/servico-cadastro" icon={<FiUserPlus size={14} />} label="Cadastrar Serviço" />}
              {p('canViewServices')   && <SubItem to="/servico-lista"    icon={<FiList size={14} />}     label="Lista de Serviços" />}
            </SubMenu>
          )}

          {p('canViewAgenda') && (
            <SubMenu icon={<FiCalendar size={16} />} label="Agenda" menuKey="agenda" open={openMenus.agenda} onToggle={toggle}>
              <SubItem to="/agenda"            icon={<FiSettings size={14} />}   label="Expediente" />
              {p('canViewAppointments') && <SubItem to="/servico-agendados" icon={<FiCalendar size={14} />} label="Agendados" />}
            </SubMenu>
          )}

          {p('canManageServices') && <NavItem to="/promocoes"  icon={<FiTag size={16} />}      label="Promoções" />}
          {p('canViewReports')    && <NavItem to="/relatorios" icon={<FiBarChart2 size={16} />} label="Relatórios" />}

          <li className={s.divider} />

          <NavItem to="/perfil" icon={<FiUser size={16} />} label="Perfil" />

          {p('canManageTenant') && (
            <SubMenu icon={<FiBriefcase size={16} />} label="Conta" menuKey="account" open={openMenus.account} onToggle={toggle}>
              <SubItem to="/conta" icon={<FiSettings size={14} />} label="Conta" />
              <li>
                <button className={s.navBtn} onClick={() => setWhatsappOpen(true)}>
                  <FiSmartphone size={14} style={{ marginLeft: '1.5rem' }} /> QR Code WhatsApp
                </button>
              </li>
            </SubMenu>
          )}
        </ul>

        <div className={s.bottomActions}>
          <button className={s.logoutBtn} onClick={() => { logout(); }}>
            <FiLogOut size={15} /> Sair
          </button>
        </div>
      </nav>

      {whatsappOpen && <WhatsAppModal onClose={() => setWhatsappOpen(false)} />}
    </>
  );
}
