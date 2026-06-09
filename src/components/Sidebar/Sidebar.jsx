import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import s from './Sidebar.module.css';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiUsers, FiCalendar, FiScissors, FiBarChart2,
  FiUser, FiUserPlus, FiList, FiMonitor, FiBriefcase,
  FiSettings, FiLogOut, FiMenu, FiX,
  FiChevronDown, FiChevronRight, FiSmartphone, FiTag,
  FiPlusCircle, FiAlertCircle, FiClock, FiHelpCircle,
  FiSun, FiMoon, FiSliders, FiPackage, FiDollarSign,
  FiTrendingUp, FiTrendingDown, FiAward, FiActivity, FiShoppingCart,
  FiCheckSquare, FiLink,
} from 'react-icons/fi';

function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return [theme, toggle];
}

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

function FinSubItem({ to, icon, label, tabValue }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentTab = params.get('tab') || 'resumo';
  const isActive = location.pathname.includes('/financeiro') && currentTab === tabValue;
  return (
    <li>
      <Link to={to} className={`${s.navLink}${isActive ? ` ${s.active}` : ''}`} style={{ paddingLeft: '2.25rem', fontSize: '0.84rem' }}>
        {icon} {label}
      </Link>
    </li>
  );
}

export default function Sidebar({ onWhatsApp, onSupport, externalOpen, onExternalClose }) {
  const { user, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const slug = params.slug || user?.tenantSlug || '';
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (externalOpen) setMobileOpen(true);
  }, [externalOpen]);

  const handleClose = () => {
    setMobileOpen(false);
    onExternalClose?.();
  };
  const [tenantLogo, setTenantLogo] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [pendingPlanCount, setPendingPlanCount] = useState(0);
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

  useEffect(() => {
    if (!user) return;
    const loadPendingPlanCount = async () => {
      try {
        const params = new URLSearchParams({ status: 'pending_payment', page: '1', limit: '1' });
        const res = await fetch(`/api/service-plans/client-plans/list?${params.toString()}`, { headers: { Authorization: `Bearer ${tok()}` } });
        const data = await res.json().catch(() => ({}));
        const count = Number(data.total ?? (Array.isArray(data.items) ? data.items.length : 0)) || 0;
        setPendingPlanCount(count);
      } catch {
        setPendingPlanCount(0);
      }
    };

    loadPendingPlanCount();
    const interval = setInterval(loadPendingPlanCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const toggle = (k) => setOpenMenus(p => {
    const isOpen = !!p[k];
    // Fecha todos e abre apenas o clicado (ou fecha se já estava aberto)
    const closed = Object.fromEntries(Object.keys(p).map(key => [key, false]));
    return isOpen ? closed : { ...closed, [k]: true };
  });

  const canClients  = any('canViewCustomers','canCreateCustomer','canEditCustomer','canDeleteCustomer');
  const canUsers    = any('canViewUsers','canCreateUser','canEditUser','canDeleteUser','canManageGroups');
  const canServices = any('canViewServices','canManageServices','canViewAppointments');
  const canDash     = any('canViewAppointments','canViewAgenda','canViewCustomers','canViewServices','canViewReports');

  return (
    <>
      <button className={s.hamburger} onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
        <FiMenu size={20} />
      </button>

      <div className={`${s.overlay}${mobileOpen ? ` ${s.open}` : ''}`} onClick={handleClose} />

      <nav className={`${s.sidebar}${mobileOpen ? ` ${s.open}` : ''}`}>
        <div className={s.brand}>
          {tenantLogo
            ? <img src={tenantLogo} alt="" className={s.brandLogo} onError={e => { e.target.style.display = 'none'; }} />
            : <div className={s.brandLogo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700 }}>B</div>
          }
          <button className={s.closeBtn} onClick={handleClose} style={{ marginLeft: 'auto' }}><FiX size={18} /></button>
          <span className={s.brandName}>{tenantName}</span>
        </div>

        <ul className={s.nav}>
          {canDash && <NavItem to={`/${slug}/dashboard`} icon={<FiGrid size={15} />} label="Painel Principal" />}
          {p('canViewCustomers') && <NavItem to={`/${slug}/tela-cliente`} icon={<FiLink size={15} />} label="Meu Link" />}

          {canClients && (
            <SubMenu icon={<FiUsers size={15} />} label="Clientes" menuKey="clients" open={openMenus.clients} onToggle={toggle}>
              {p('canCreateCustomer') && <SubItem to={`/${slug}/cliente-cadastro`}   icon={<FiUserPlus size={14} />} label="Cadastro" />}
              {p('canViewCustomers')  && <SubItem to={`/${slug}/cliente-lista`}      icon={<FiList size={14} />}     label="Lista de Clientes" />}
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

          <NavItem to={`/${slug}/vendas`} icon={<FiShoppingCart size={15} />} label="Vendas" />

          {p('canViewAgenda') && (
            <SubMenu icon={<FiCalendar size={15} />} label="Agenda" menuKey="agenda" open={openMenus.agenda} onToggle={toggle}>
              <SubItem to={`/${slug}/agenda`}           icon={<FiClock size={14} />}     label="Expediente" />
              {p('canViewAppointments') && <SubItem to={`/${slug}/servico-agendados`} icon={<FiCalendar size={14} />} label="Agendados" />}
              {p('canCreateAppointment') && <SubItem to={`/${slug}/disponibilidade`}  icon={<FiCheckSquare size={14} />} label="Disponibilidade" />}
              <SubItem to={`/${slug}/agenda-regras`}    icon={<FiSliders size={14} />}   label="Regras" />
            </SubMenu>
          )}

          <SubMenu icon={<FiPackage size={15} />} label="Produtos" menuKey="produtos" open={openMenus.produtos} onToggle={toggle}>
            <SubItem to={`/${slug}/produtos-cadastro`} icon={<FiPlusCircle size={14} />} label="Cadastrar" />
            <SubItem to={`/${slug}/produtos-lista`}    icon={<FiList size={14} />}       label="Listar" />
          </SubMenu>

          {p('canManageServices') && <NavItem to={`/${slug}/planos-servico`} icon={<FiPackage size={15} />}  label={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span>Planos</span>
              {pendingPlanCount > 0 && (
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 99, background: '#f59e0b', color: '#000', fontWeight: 700 }}>
                  {pendingPlanCount}
                </span>
              )}
            </span>
          } />}
          {p('canManageServices') && <NavItem to={`/${slug}/promocoes`} icon={<FiTag size={15} />} label="Promoções" />}
          {p('canViewReports') && <NavItem to={`/${slug}/financeiro`} icon={<FiDollarSign size={15} />} label="Financeiro" />}
          {p('canViewReports') && <NavItem to={`/${slug}/relatorios`} icon={<FiBarChart2 size={15} />} label="Relatórios" />}

          <li className={s.divider} />

          <NavItem onClick={onSupport} icon={<FiHelpCircle size={15} />} label="Suporte" />

          <NavItem to={`/${slug}/perfil`} icon={<FiUser size={15} />} label="Perfil" />

          {p('canManageTenant') && (
            <SubMenu icon={<FiBriefcase size={15} />} label="Conta" menuKey="account" open={openMenus.account} onToggle={toggle}>
              <SubItem to={`/${slug}/conta`}    icon={<FiSettings size={14} />}   label="Conta" />
              {onWhatsApp && <SubItem onClick={onWhatsApp} icon={<FiSmartphone size={14} />} label="QR Code WhatsApp" />}
            </SubMenu>
          )}
        </ul>

        <div className={s.bottom}>
          <button className={s.themeBtn} onClick={toggleTheme} title={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>
            {theme === 'dark' ? <FiSun size={15} /> : <FiMoon size={15} />}
            {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
          </button>
          <button className={s.logoutBtn} onClick={logout}>
            <FiLogOut size={15} /> Sair
          </button>
        </div>
      </nav>
    </>
  );
}
