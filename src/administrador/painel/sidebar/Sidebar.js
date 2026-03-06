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
  FiPercent
} from 'react-icons/fi';
import ThemeModal from '../../../components/ThemeModal';
import { AuthContext } from '../../../context/AuthContext';
import { useTheme } from '../../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import defaultLogo from '../../../assets/user.png';

const Sidebar = () => {
  const [themeModalOpen, setThemeModalOpen] = useState(false);
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

  return (
    <div className="sidebar">
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
          <li>
            <Link to="/conta" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiBriefcase size={18} /> {t('sidebar.account', 'Conta')}
            </Link>
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
    </div>
  );
}

export default Sidebar;
