import React, { useState, useCallback } from 'react';
import { FiScissors, FiGrid, FiUsers, FiPackage, FiCreditCard, FiLogOut, FiShield, FiEye, FiEyeOff, FiActivity } from 'react-icons/fi';
import styles from './AdminPanel.module.css';
import GestorDashboard from '../../components/AdminPanel/GestorDashboard';
import GestorCompanies from '../../components/AdminPanel/GestorCompanies';
import GestorPlans from '../../components/AdminPanel/GestorPlans';
import GestorBilling from '../../components/AdminPanel/GestorBilling';
import GestorMonitor from '../../components/AdminPanel/GestorMonitor';

const STORAGE_KEY = 'gestorToken';

export const gestorApi = async (path, options = {}, token) => {
    const res = await fetch(`/api/gestor${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Erro na requisição');
    return data;
};

const SECTIONS = [
    { key: 'dashboard', label: 'Dashboard',      icon: FiGrid },
    { key: 'monitor',   label: 'Monitoramento',  icon: FiActivity },
    { key: 'companies', label: 'Empresas',        icon: FiUsers },
    { key: 'plans',     label: 'Planos',          icon: FiPackage },
    { key: 'billing',   label: 'Cobranças',       icon: FiCreditCard },
];

export default function AdminPanel() {
    const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
    const [active, setActive] = useState('dashboard');
    const [form, setForm] = useState({ email: '', password: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loading, setLoading] = useState(false);

    const api = useCallback((path, options = {}) => gestorApi(path, options, token), [token]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoading(true);
        try {
            const res = await fetch('/api/gestor/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const d = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(d.message || 'Credenciais inválidas');
            localStorage.setItem(STORAGE_KEY, d.token);
            setToken(d.token);
        } catch (err) {
            setLoginError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem(STORAGE_KEY);
        setToken('');
        setActive('dashboard');
    };

    if (!token) {
        return (
            <div className={styles.loginPage}>
                <div className={styles.loginCard}>
                    <div className={styles.loginBrand}>
                        <FiShield size={36} />
                        <h1>Painel Gestor</h1>
                        <p>Acesso restrito ao administrador</p>
                    </div>
                    <form onSubmit={handleLogin} className={styles.loginForm}>
                        {loginError && <div className={styles.loginError}>{loginError}</div>}
                        <div className="form-group">
                            <label className="form-label">E-mail</label>
                            <input className="form-input" type="email" placeholder="admin@barbeiroon.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required autoFocus />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Senha</label>
                            <div style={{ position: 'relative' }}>
                                <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Sua senha" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required style={{ paddingRight: '2.5rem' }} />
                                <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer' }}>
                                    {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: 6 }}>
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <div className={styles.sidebarBrand}>
                    <FiScissors size={18} />
                    <span>Barbeiro <em style={{ fontStyle: 'normal', color: '#00FF00' }}>ON</em></span>
                </div>
                <nav className={styles.nav}>
                    {SECTIONS.map(({ key, label, icon: Icon }) => (
                        <button key={key} className={active === key ? styles.navBtnActive : styles.navBtn} onClick={() => setActive(key)}>
                            <Icon size={15} />
                            <span>{label}</span>
                        </button>
                    ))}
                </nav>
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <FiLogOut size={14} />
                    <span>Sair</span>
                </button>
            </aside>
            <main className={styles.content}>
                {active === 'dashboard' && <GestorDashboard api={api} />}
                {active === 'monitor'   && <GestorMonitor   api={api} />}
                {active === 'companies' && <GestorCompanies api={api} />}
                {active === 'plans'     && <GestorPlans     api={api} />}
                {active === 'billing'   && <GestorBilling   api={api} />}
            </main>
        </div>
    );
}
