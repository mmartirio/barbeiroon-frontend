import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';
import { useTranslation } from 'react-i18next';


function Administrador() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        // Validações básicas
        if (!email.trim() || !password.trim()) {
            setErrorMsg('Preencha todos os campos');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) {
                setErrorMsg(data.message || t('login.error') || 'Erro ao fazer login');
                setLoading(false);
                return;
            }
            if (data.token) {
                await login(data.token);
                navigate('/dashboard');
            } else {
                setErrorMsg('Token não recebido');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            setErrorMsg(error.message || 'Erro de conexão. Verifique sua internet.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1 className="login-title">Bem-vindo</h1>
                        <p className="login-subtitle">Faça login para acessar o painel</p>
                    </div>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {errorMsg && (
                            <div className="alert alert-error login-alert">
                                <span className="alert-icon">⚠️</span>
                                <span className="alert-message">{errorMsg}</span>
                            </div>
                        )}

                        <div className="form-group login-input-group">
                            <label htmlFor="email" className="form-label">
                                E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="form-input login-input"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />

                            <label htmlFor="password" className="form-label">
                                Senha
                            </label>
                                                        <div className="password-input-group">
                                                            <input
                                                                id="password"
                                                                type={showPassword ? 'text' : 'password'}
                                                                className="form-input login-input"
                                                                placeholder="Sua senha"
                                                                value={password}
                                                                onChange={(e) => setPassword(e.target.value)}
                                                                required
                                                                disabled={loading}
                                                                style={{ width: '100%' }}
                                                            />
                                                                                                                        <button
                                                                                                                                type="button"
                                                                                                                                onClick={() => setShowPassword((v) => !v)}
                                                                                                                                className="show-password-btn"
                                                                                                                                tabIndex={0}
                                                                                                                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                                                                                                                        >
                                                                                                                                {showPassword ? (
                                                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.27-3.11-11-7.5a12.32 12.32 0 0 1 4.73-5.73"/><path d="M1 1l22 22"/><path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5a3.5 3.5 0 0 0 2.47-5.97"/></svg>
                                                                                                                                ) : (
                                                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="10" ry="7.5"/><circle cx="12" cy="12" r="3.5"/></svg>
                                                                                                                                )}
                                                                                                                        </button>
                                                        </div>

                            <button
                                type="submit"
                                className="btn btn-primary login-button"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading-spinner-small"></span>
                                        Entrando...
                                    </>
                                ) : 'Entrar'}
                            </button>
                        </div>
                    </form>

                    <div className="login-divider">
                        <span className="divider-text">ou</span>
                    </div>

                    <div className="login-links">
                        <div className="login-register">
                            <span className="text-muted">Não tem uma conta?</span>
                            <Link to="/cadastro-barbearia" className="login-link">
                                Cadastre-se
                            </Link>
                        </div>

                        <div className="login-forgot">
                            <Link to="/recuperar-senha" className="login-link">
                                Esqueceu sua senha?
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Administrador;