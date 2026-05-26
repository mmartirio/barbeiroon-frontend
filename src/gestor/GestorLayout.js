import React, { useState } from 'react';
import { NavLink, useNavigate, Navigate } from 'react-router-dom';
import './GestorLayout.css';

const TOKEN_KEY = 'gestor_token';

const NAV = [
    { to: '/gestor/dashboard',       icon: '📊', label: 'Dashboard' },
    { to: '/gestor/empresas',        icon: '✂️',  label: 'Empresas' },
    { to: '/gestor/planos',          icon: '📋', label: 'Planos' },
    { to: '/gestor/pagamentos',      icon: '💳', label: 'Pagamentos' },
    { to: '/gestor/relatorios',      icon: '📈', label: 'Relatórios' },
    { to: '/gestor/administradores', icon: '👤', label: 'Administradores' },
];

export function gestorApi(path, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    return fetch(`/api/gestor${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
}

export function GestorGuard({ children }) {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return <Navigate to="/gestor" replace />;
    return children;
}

export default function GestorLayout({ title, children }) {
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem(TOKEN_KEY);
        navigate('/gestor');
    };

    const closeSidebar = () => setSidebarOpen(false);

    return (
        <div className="sa-layout">
            {/* Overlay mobile */}
            {sidebarOpen && <div className="sa-sidebar-overlay" onClick={closeSidebar} />}

            <aside className={`sa-sidebar${sidebarOpen ? ' open' : ''}`}>
                <div className="sa-sidebar-brand">
                    <h2>✂️ Gestor</h2>
                    <span>Barbeiro On</span>
                </div>
                <nav className="sa-sidebar-nav">
                    {NAV.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={closeSidebar}
                            className={({ isActive }) => `sa-nav-item${isActive ? ' active' : ''}`}
                        >
                            <span className="sa-nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="sa-sidebar-footer">
                    <button className="sa-logout-btn" onClick={handleLogout}>
                        <span>🚪</span> Sair
                    </button>
                </div>
            </aside>

            <main className="sa-main">
                <div className="sa-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button className="sa-hamburger" onClick={() => setSidebarOpen(o => !o)}>☰</button>
                        <h1>{title}</h1>
                    </div>
                    <span className="sa-topbar-badge">Painel Gestor</span>
                </div>
                <div className="sa-content">{children}</div>
            </main>
        </div>
    );
}
