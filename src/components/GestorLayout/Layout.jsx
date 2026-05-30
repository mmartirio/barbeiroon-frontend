import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine,
  RiBuildingLine,
  RiPriceTag3Line,
  RiBankCardLine,
  RiUserSettingsLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiCloseLine,
  RiComputerLine,
  RiCustomerService2Line,
} from 'react-icons/ri';
import { useGestorAuth } from '../../context/GestorAuthContext';
import './Layout.css';

const NAV = [
  { to: '/gestor',                icon: RiDashboardLine,   label: 'Dashboard' },
  { to: '/gestor/empresas',       icon: RiBuildingLine,    label: 'Empresas' },
  { to: '/gestor/monitoramento',  icon: RiComputerLine,    label: 'Monitoramento' },
  { to: '/gestor/planos',         icon: RiPriceTag3Line,   label: 'Planos' },
  { to: '/gestor/cobrancas',      icon: RiBankCardLine,    label: 'Cobranças' },
  { to: '/gestor/admins',         icon: RiUserSettingsLine,     label: 'Admins' },
  { to: '/gestor/suporte',        icon: RiCustomerService2Line, label: 'Chamados' },
];

export default function Layout() {
  const { user, logout } = useGestorAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/gestor');
  }

  return (
    <div className="layout">
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/icon.png" alt="Barbeiro ON" style={{ height: 32 }} />
          <span>Painel Gestor</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/gestor'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.email?.[0]?.toUpperCase() ?? 'G'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name ?? 'Gestor'}</span>
              <span className="sidebar-user-role">Superadmin</span>
            </div>
          </div>
          <button className="nav-item nav-item--logout" onClick={handleLogout}>
            <RiLogoutBoxLine size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <div className="layout-main">
        <header className="layout-header">
          <button className="btn-menu" onClick={() => setOpen(o => !o)}>
            {open ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
          </button>
          <span className="header-title">Painel Gestor</span>
        </header>

        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
