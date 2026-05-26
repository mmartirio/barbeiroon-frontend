import React, { useState, useContext, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import {
  FiSettings,
  FiUsers,
  FiCalendar,
  FiScissors,
  FiBarChart2,
  FiChevronDown,
  FiChevronRight,
  FiUser,
  FiUserPlus,
  FiList,
  FiMonitor,
  FiBriefcase,
  FiTrash2,
  FiPercent,
  FiSmartphone,
  FiMenu,
  FiX,
  FiPlusCircle,
  FiAlertCircle
} from 'react-icons/fi';
import ThemeModal from '../../../components/ThemeModal';
import WhatsAppModal from '../WhatsAppModal';
import { AuthContext } from '../../../context/AuthContext';
import { useTheme } from '../../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import defaultLogo from '../../../assets/user.png';

const Sidebar = () => {
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState(() => {
    try {
      const stored = sessionStorage.getItem('sidebarOpenMenus');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  });
  const { logout, user } = useContext(AuthContext);
  const { logo } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const showTenantLogo = location.pathname.startsWith('/agendar');
  const resolvedLogo = showTenantLogo ? logo : '';

  const can = (perm) => !!user?.permissions?.[perm];
  const canAny = (perms) => perms.some((perm) => can(perm));

  const canSeeDashboard = canAny([
    'canViewAppointments',
    'canViewAgenda',
    'canViewCustomers',
    'canViewServices',
    'canViewReports'
  ]);
  const canSeeClients = canAny([
    'canViewCustomers',
    'canCreateCustomer',
    'canEditCustomer',
    'canDeleteCustomer'
  ]);
  const canSeeUsers = canAny([
    'canViewUsers',
    'canCreateUser',
    'canEditUser',
    'canDeleteUser',
    'canManageGroups'
  ]);
  const canSeeServices = canAny([
    'canViewServices',
    'canManageServices',
    'canViewAppointments'
  ]);
  const canSeeAgenda = can('canViewAgenda');
  const canSeeReports = can('canViewReports');
  const canSeeAccount = can('canManageTenant');

  const toggleMenu = (menuName) => {
    setOpenMenus(prev => ({
      ...prev,
      [menuName]: !prev[menuName]
    }));
  };

  useEffect(() => {
    try {
      sessionStorage.setItem('sidebarOpenMenus', JSON.stringify(openMenus));
    } catch (error) {
      // Ignore storage errors (private mode or storage disabled).
    }
  }, [openMenus]);

  // Fecha sidebar mobile ao navegar
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <>
    <button
      className="sidebar-hamburger"
      onClick={() => setMobileOpen(true)}
      aria-label="Abrir menu"
    >
      <FiMenu size={22} />
    </button>
    <div
      className={`sidebar-overlay${mobileOpen ? ' open' : ''}`}
      onClick={() => setMobileOpen(false)}
    />
    <div className={`sidebar${mobileOpen ? ' open' : ''}`}>
      <button
        className="sidebar-close"
        onClick={() => setMobileOpen(false)}
        aria-label="Fechar menu"
      >
        <FiX size={22} />
      </button>
      <div className="sidebar-logo">
        <img 
          src={resolvedLogo || defaultLogo} 
          alt="Logo da Empresa" 
          className="sidebar-logo-img"
          onError={(e) => { e.target.src = defaultLogo; }}
        />
      </div>
      <h2>{user?.name || t('sidebar.title', 'Navegação')}</h2>
      <ul className="sidebar-menu">
        {canSeeDashboard && (
          <li><Link to="/dashboard">{t('sidebar.dashboard', 'Dashboard')}</Link></li>
        )}
        
        {/* Menu Clientes com submenu */}
        {canSeeClients && (
        <li className={`has-submenu ${openMenus.clients ? 'open' : ''}`}>
          <div className="menu-item-with-submenu" onClick={() => toggleMenu('clients')}>
            <span className="menu-item-content">
              <FiUsers size={18} />
              <span>{t('sidebar.clients', 'Clientes')}</span>
            </span>
            {openMenus.clients ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
          </div>
          <ul className="submenu">
            {can('canCreateCustomer') && (
              <li><Link to="/cliente-cadastro"><FiUserPlus size={16} /> {t('sidebar.registerClient', 'Cadastro')}</Link></li>
            )}
            {can('canViewCustomers') && (
              <li><Link to="/cliente-lista"><FiList size={16} /> {t('sidebar.clientList', 'Lista de Clientes')}</Link></li>
            )}
            {can('canViewCustomers') && (
              <li><Link to="/tela-cliente"><FiMonitor size={16} /> {t('sidebar.clientScreen', 'Tela do Cliente')}</Link></li>
            )}
          </ul>
        </li>
        )}

        {/* Menu Usuários com submenu */}
        {canSeeUsers && (
        <li className={`has-submenu ${openMenus.users ? 'open' : ''}`}>
          <div className="menu-item-with-submenu" onClick={() => toggleMenu('users')}>
            <span className="menu-item-content">
              <FiUser size={18} />
              <span>{t('sidebar.users', 'Usuários')}</span>
            </span>
            {openMenus.users ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
          </div>
          <ul className="submenu">
            {can('canCreateUser') && (
              <li><Link to="/usuario"><FiUserPlus size={16} /> {t('sidebar.registerUser', 'Cadastrar')}</Link></li>
            )}
            {can('canViewUsers') && (
              <li><Link to="/usuario-lista"><FiList size={16} /> {t('sidebar.userList', 'Lista de Usuários')}</Link></li>
            )}
            {can('canManageGroups') && (
              <li><Link to="/grupo"><FiBriefcase size={16} /> {t('sidebar.group', 'Grupo')}</Link></li>
            )}
          </ul>
        </li>
        )}

        {/* Menu Serviços com submenu */}
        {canSeeServices && (
        <li className={`has-submenu ${openMenus.services ? 'open' : ''}`}>
          <div className="menu-item-with-submenu" onClick={() => toggleMenu('services')}>
            <span className="menu-item-content">
              <FiScissors size={18} />
              <span>{t('sidebar.services', 'Serviços')}</span>
            </span>
            {openMenus.services ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
          </div>
          <ul className="submenu">
            {can('canManageServices') && (
              <li><Link to="/servico-cadastro"><FiUserPlus size={16} /> {t('sidebar.registerService', 'Cadastrar Serviço')}</Link></li>
            )}
            {can('canViewServices') && (
              <li><Link to="/servico-lista"><FiList size={16} /> {t('sidebar.serviceList', 'Lista de Serviços')}</Link></li>
            )}
            {can('canViewAppointments') && (
              <li><Link to="/servico-agendados"><FiCalendar size={16} /> Agendados</Link></li>
            )}
            {can('canViewAppointments') && (
              <li><Link to="/novo-agendamento"><FiPlusCircle size={16} /> Novo Agendamento</Link></li>
            )}
            {can('canViewAppointments') && (
              <li><Link to="/solicitacoes-pendentes"><FiAlertCircle size={16} /> Solicitações Pendentes</Link></li>
            )}
            {can('canManageServices') && (
              <li>
                <Link to="/promocoes" state={{ directComponent: true }}><FiPercent size={16} /> {t('sidebar.promotions', 'Promoções')}</Link>
              </li>
            )}
          </ul>
        </li>
        )}

        {canSeeAgenda && (
          <li><Link to="/agenda"><FiCalendar size={18} /> {t('sidebar.schedule', 'Agenda')}</Link></li>
        )}
        {canSeeReports && (
          <li><Link to="/relatorios"><FiBarChart2 size={18} /> {t('sidebar.reports', 'Relatórios')}</Link></li>
        )}
        
        <li className="menu-divider"></li>
        
        <li><Link to="/perfil"><FiUser size={18} /> {t('sidebar.profile', 'Perfil')}</Link></li>
        {canSeeAccount && (
          <li className={`has-submenu ${openMenus.account ? 'open' : ''}`}>
            <div className="menu-item-with-submenu" onClick={() => toggleMenu('account')}>
              <span className="menu-item-content">
                <FiBriefcase size={18} />
                <span>{t('sidebar.account', 'Conta')}</span>
              </span>
              {openMenus.account ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
            </div>
            <ul className="submenu">
              <li>
                <Link to="/conta"><FiBriefcase size={16} /> {t('sidebar.account', 'Conta')}</Link>
              </li>
              <li>
                <button
                  onClick={() => setWhatsappModalOpen(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', padding: '0.5rem 1rem 0.5rem 3rem', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', textAlign: 'left', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#007aff'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.transform = 'none'; }}
                >
                  <FiSmartphone size={16} /> QR Code WhatsApp
                </button>
              </li>
            </ul>
          </li>
        )}
        <li style={{ marginBottom: 0 }}>
          <button
            className="sidebar-btn sidebar-btn-logout sidebar-btn-compact"
            style={{ width: '100%', background: 'linear-gradient(90deg,#e74c3c,#ff7675)', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 0', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 0, boxShadow: '0 1px 4px #e74c3c22', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 32, minWidth: 0 }}
            onClick={() => { logout(); window.location.href = '/admin/login'; }}
          >
            <FiTrash2 size={15} style={{ marginRight: 4 }} /> Sair
          </button>
        </li>
      </ul>
      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <button className="sidebar-btn sidebar-btn-compact" style={{ minHeight: 32, minWidth: 0, padding: '6px 0', fontSize: 14 }} onClick={() => setThemeModalOpen(true)}>
          <FiSettings style={{ marginRight: 4 }} /> {t('sidebar.theme', 'Tema')}
        </button>
      </div>
      <ThemeModal isOpen={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
      {whatsappModalOpen && <WhatsAppModal onClose={() => setWhatsappModalOpen(false)} />}
    </div>
    </>
  );
}

export default Sidebar;
