import { NavLink, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiGrid, FiCalendar, FiUsers, FiScissors, FiMenu,
} from 'react-icons/fi';
import s from './BottomNav.module.css';

export default function BottomNav({ onOpenMenu }) {
  const { user } = useAuth();
  const params = useParams();
  const slug = params.slug || user?.tenantSlug || '';

  const p   = (k) => !!user?.permissions?.[k];
  const any = (...ks) => ks.some(k => p(k));

  const canDash     = any('canViewAppointments','canViewAgenda','canViewCustomers','canViewServices','canViewReports');
  const canAgenda   = p('canViewAgenda');
  const canClients  = any('canViewCustomers','canCreateCustomer','canEditCustomer','canDeleteCustomer');
  const canServices = any('canViewServices','canManageServices','canViewAppointments');

  const item = (to, icon, label) => (
    <NavLink
      to={to}
      className={({ isActive }) => `${s.item}${isActive ? ` ${s.active}` : ''}`}
    >
      <span className={s.icon}>{icon}</span>
      <span className={s.label}>{label}</span>
    </NavLink>
  );

  return (
    <nav className={s.bar}>
      {canDash     && item(`/${slug}/dashboard`,       <FiGrid size={20} />,     'Painel')}
      {canAgenda   && item(`/${slug}/agenda`,           <FiCalendar size={20} />, 'Agenda')}
      {canClients  && item(`/${slug}/cliente-lista`,    <FiUsers size={20} />,    'Clientes')}
      {canServices && item(`/${slug}/servico-lista`,    <FiScissors size={20} />, 'Serviços')}

      <button className={s.item} onClick={onOpenMenu} aria-label="Menu">
        <span className={s.icon}><FiMenu size={20} /></span>
        <span className={s.label}>Menu</span>
      </button>
    </nav>
  );
}
