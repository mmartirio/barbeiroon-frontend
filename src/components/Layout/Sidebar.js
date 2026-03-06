import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const menu = [
  { label: 'Agendar', path: '/agendamento/calendarComponent' },
  { label: 'Profissionais', path: '/profissional' },
  { label: 'Serviços', path: '/servico' },
  { label: 'Dashboard', path: '/dashboard' },
];

export default function Sidebar() {
  const location = useLocation();
  const { theme } = useTheme();
  // Log para depuração
  console.log('Sidebar theme.name:', theme.name);
  // Aplica cor #adadad no tema claro, nada no escuro (aceita variações de maiúsculas)
  const isLight = theme.name && theme.name.toLowerCase() === 'light';
  const sidebarStyle = isLight
    ? { background: '#adadad' }
    : { background: '#252525' };
  return (
    <nav className="sidebar" style={sidebarStyle}>
      <ul>
        {menu.map(item => (
          <li key={item.path} className={location.pathname === item.path ? 'active' : ''}>
            <Link to={item.path}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
