import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GestorLogin.css';

export default function GestorLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) { setError('Preencha todos os campos.'); return; }
        setLoading(true);
        try {
            const res = await fetch('/api/gestor/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Credenciais inválidas.'); return; }
            localStorage.setItem('gestor_token', data.token);
            navigate(data.mustSetup ? '/gestor/setup' : '/gestor/dashboard');
        } catch {
            setError('Erro de conexão. Verifique o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sa-login-page">
            <div className="sa-login-card">
                <div className="sa-login-logo">
                    <h1>✂️ Gestor</h1>
                    <span>Barbeiro On — Painel de Gestão</span>
                </div>
                {error && <div className="sa-error">{error}</div>}
                <form className="sa-login-form" onSubmit={handleSubmit}>
                    <div className="sa-field">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="gestor@barbeiroon.com" autoFocus />
                    </div>
                    <div className="sa-field">
                        <label>Senha</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" />
                    </div>
                    <button className="sa-login-btn" type="submit" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
