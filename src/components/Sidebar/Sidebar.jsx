import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate, useParams } from 'react-router-dom';
import s from './Sidebar.module.css';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiUsers, FiCalendar, FiScissors, FiBarChart2,
  FiUser, FiUserPlus, FiList, FiMonitor, FiBriefcase,
  FiSettings, FiLogOut, FiMenu, FiX,
  FiChevronDown, FiChevronRight, FiSmartphone, FiTag,
  FiPlusCircle, FiAlertCircle, FiClock,
} from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

function NavItem({ to, icon, label, onClick }) {
  if (onClick) {
    return (
      <li>
        <button className={s.navLink} onClick={onClick}>
          {icon} {label}
        </button>
      </li>
    );
  }
  return (
    <li>
      <NavLink to={to} className={({ isActive }) => `${s.navLink}${isActive ? ` ${s.active}` : ''}`}>
        {icon} {label}
      </NavLink>
    </li>
  );
}

function SubMenu({ icon, label, menuKey, open, onToggle, children }) {
  return (
    <li>
      <button className={`${s.submenuToggle}${open ? ` ${s.open}` : ''}`} onClick={() => onToggle(menuKey)}>
        <span className={s.submenuLabel}>{icon} {label}</span>
        {open ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
      </button>
      <ul className={`${s.submenu}${open ? ` ${s.open}` : ''}`}>
        {children}
      </ul>
    </li>
  );
}

function SubItem({ to, icon, label, onClick }) {
  if (onClick) {
    return (
      <li>
        <button className={s.navLink} style={{ paddingLeft: '2.25rem', fontSize: '0.84rem' }} onClick={onClick}>
          {icon} {label}
        </button>
      </li>
    );
  }
  return (
    <li>
      <NavLink to={to} className={({ isActive }) => `${s.navLink}${isActive ? ` ${s.active}` : ''}`} style={{ paddingLeft: '2.25rem', fontSize: '0.84rem' }}>
        {icon} {label}
      </NavLink>
    </li>
  );
}

export default function Sidebar({ onWhatsApp }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const slug = params.slug || user?.tenantSlug || '';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tenantLogo, setTenantLogo] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [openMenus, setOpenMenus] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('sb_menus') || '{}'); } catch { return {}; }
  });

  const p   = (k) => !!user?.permissions?.[k];
  const any = (...ks) => ks.some(k => p(k));

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    try { sessionStorage.setItem('sb_menus', JSON.stringify(openMenus)); } catch { /* noop */ }
  }, [openMenus]);

  useEffect(() => {
    if (!user) return;
    fetch('/api/tenant/settings', { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).catch(() => ({}))
      .then(d => {
        const t = d.tenant || d.settings || d;
        setTenantName(t.name || user?.name || 'Barbeiro On');
        setTenantLogo(t.logo || t.logoUrl || '');
      });
  }, [user]);

  const toggle = (k) => setOpenMenus(p => ({ ...p, [k]: !p[k] }));

  const canClients  = any('canViewCustomers','canCreateCustomer','canEditCustomer','canDeleteCustomer');
  const canUsers    = any('canViewUsers','canCreateUser','canEditUser','canDeleteUser','canManageGroups');
  const canServices = any('canViewServices','canManageServices','canViewAppointments');
  const canDash     = any('canViewAppointments','canViewAgenda','canViewCustomers','canViewServices','canViewReports');

  return (
    <>
      <button className={s.hamburger} onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
        <FiMenu size={20} />
      </button>

      <div className={`${s.overlay}${mobileOpen ? ` ${s.open}` : ''}`} onClick={() => setMobileOpen(false)} />

      <nav className={`${s.sidebar}${mobileOpen ? ` ${s.open}` : ''}`}>
        <div className={s.brand}>
          {tenantLogo
            ? <img src={tenantLogo} alt="" className={s.brandLogo} onError={e => { e.target.style.display = 'none'; }} />
            : <div className={s.brandLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700 }}>B</div>
          }
          <button className={s.closeBtn} onClick={() => setMobileOpen(false)} style={{ marginLeft: 'auto' }}><FiX size={18} /></button>
          <span className={s.brandName}>{tenantName}</span>
        </div>

        <ul className={s.nav}>
          {canDash && <NavItem to={`/${slug}/dashboard`} icon={<FiGrid size={15} />} label="Painel Principal" />}

          {canClients && (
            <SubMenu icon={<FiUsers size={15} />} label="Clientes" menuKey="clients" open={openMenus.clients} onToggle={toggle}>
              {p('canCreateCustomer') && <SubItem to={`/${slug}/cliente-cadastro`}   icon={<FiUserPlus size={14} />} label="Cadastro" />}
              {p('canViewCustomers')  && <SubItem to={`/${slug}/cliente-lista`}      icon={<FiList size={14} />}     label="Lista de Clientes" />}
              {p('canViewAppointments') && <SubItem to={`/${slug}/servico-agendados`} icon={<FiCalendar size={14} />} label="Clientes Agendados" />}
              {p('canViewCustomers')  && <SubItem to={`/${slug}/tela-cliente`}       icon={<FiMonitor size={14} />}  label="Tela do Cliente" />}
            </SubMenu>
          )}

          {canUsers && (
            <SubMenu icon={<FiUser size={15} />} label="Usuários" menuKey="users" open={openMenus.users} onToggle={toggle}>
              {p('canCreateUser')    && <SubItem to={`/${slug}/usuario-cadastro`} icon={<FiUserPlus size={14} />}  label="Cadastrar" />}
              {p('canViewUsers')     && <SubItem to={`/${slug}/usuario-lista`}    icon={<FiList size={14} />}      label="Lista de Usuários" />}
              {p('canManageGroups') && <SubItem to={`/${slug}/grupo`}             icon={<FiBriefcase size={14} />} label="Grupo" />}
            </SubMenu>
          )}

          {canServices && (
            <SubMenu icon={<FiScissors size={15} />} label="Serviços" menuKey="services" open={openMenus.services} onToggle={toggle}>
              {p('canManageServices') && <SubItem to={`/${slug}/servico-cadastro`} icon={<FiUserPlus size={14} />} label="Cadastrar Serviço" />}
              {p('canViewServices')   && <SubItem to={`/${slug}/servico-lista`}    icon={<FiList size={14} />}     label="Lista de Serviços" />}
            </SubMenu>
          )}

          {p('canViewAgenda') && (
            <SubMenu icon={<FiCalendar size={15} />} label="Agenda" menuKey="agenda" open={openMenus.agenda} onToggle={toggle}>
              <SubItem to={`/${slug}/agenda`}           icon={<FiClock size={14} />}     label="Expediente" />
              {p('canViewAppointments') && <SubItem to={`/${slug}/servico-agendados`} icon={<FiCalendar size={14} />} label="Agendados" />}
            </SubMenu>
          )}

          {p('canManageServices') && <NavItem to={`/${slug}/promocoes`}  icon={<FiTag size={15} />}      label="Promoções" />}
          {p('canViewReports')    && <NavItem to={`/${slug}/relatorios`} icon={<FiBarChart2 size={15} />} label="Relatórios" />}

          <li className={s.divider} />

          <NavItem to={`/${slug}/perfil`} icon={<FiUser size={15} />} label="Perfil" />

          {p('canManageTenant') && (
            <SubMenu icon={<FiBriefcase size={15} />} label="Conta" menuKey="account" open={openMenus.account} onToggle={toggle}>
              <SubItem to={`/${slug}/conta`}    icon={<FiSettings size={14} />}   label="Conta" />
              {onWhatsApp && <SubItem onClick={onWhatsApp} icon={<FiSmartphone size={14} />} label="QR Code WhatsApp" />}
            </SubMenu>
          )}
        </ul>

        <div className={s.bottom}>
          <button className={s.logoutBtn} onClick={logout}>
            <FiLogOut size={15} /> Sair
          </button>
        </div>
      </nav>
    </>
  );
}
