import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gestorApi } from '../GestorLayout';
import '../GestorLogin.css';

export default function GestorSetup() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name || !form.email || !form.password) {
            setError('Preencha todos os campos.');
            return;
        }
        if (form.password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        if (form.password !== form.confirm) {
            setError('As senhas não coincidem.');
            return;
        }
        setLoading(true);
        try {
            const res = await gestorApi('/admin-users', {
                method: 'POST',
                body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.message || 'Erro ao criar administrador.'); return; }
            navigate('/gestor/dashboard');
        } catch {
            setError('Erro de conexão. Verifique o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sa-login-page">
            <div className="sa-login-card" style={{ maxWidth: 480 }}>
                <div className="sa-login-logo">
                    <h1>✂️ Primeiro Acesso</h1>
                    <span>Crie sua conta de administrador</span>
                </div>

                <div style={{
                    background: '#1e3a5f', border: '1px solid #1d4ed8', borderRadius: 8,
                    padding: '12px 16px', marginBottom: 24, fontSize: 13, color: '#93c5fd',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}>
                    Você está usando o acesso temporário. Crie um administrador permanente para continuar.
                    O usuário <strong>admin@barbeiroon.com</strong> será desativado automaticamente.
                </div>

                {error && <div className="sa-error">{error}</div>}

                <form className="sa-login-form" onSubmit={handleSubmit}>
                    <div className="sa-field">
                        <label>Nome completo</label>
                        <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                            placeholder="Seu nome" autoFocus />
                    </div>
                    <div className="sa-field">
                        <label>Email</label>
                        <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                            placeholder="seu@email.com" />
                    </div>
                    <div className="sa-field">
                        <label>Senha</label>
                        <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                            placeholder="Mínimo 6 caracteres" />
                    </div>
                    <div className="sa-field">
                        <label>Confirmar senha</label>
                        <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                            placeholder="Repita a senha" />
                    </div>
                    <button className="sa-login-btn" type="submit" disabled={loading}>
                        {loading ? 'Criando conta...' : 'Criar Administrador e Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
