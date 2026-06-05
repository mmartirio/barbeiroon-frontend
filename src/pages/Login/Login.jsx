import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiEye, FiEyeOff, FiZap } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { BiometricService } from '../../services/biometricService';
import s from './Login.module.css';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [disabled, setDisabled] = useState(false);

  // Biometria
  const [bioSupported, setBioSupported] = useState(false);
  const [bioEnabled,   setBioEnabled]   = useState(false);
  const [bioLoading,   setBioLoading]   = useState(false);
  const [showBioOffer, setShowBioOffer] = useState(false);
  const [pendingData,  setPendingData]  = useState(null); // {token, slug, mustSetup, email, password, name}

  // ─── Verificação inicial de biometria ─────────────────────────────────────

  useEffect(() => {
    const supported = BiometricService.isSupported();
    const enabled   = BiometricService.isEnabled();
    setBioSupported(supported);
    setBioEnabled(enabled);
    // Biometria habilitada: exibe o botão na tela — sem auto-login.
    // O usuário deve clicar para autenticar.
  }, []);

  // ─── Login biométrico (Credential Management API) ─────────────────────────

  const handleBiometricLogin = async () => {
    setBioLoading(true);
    setError('');
    try {
      const creds = await BiometricService.authenticate();
      if (!creds) { setBioLoading(false); return; } // cancelado pelo usuário

      // Usa as credenciais recuperadas para autenticar
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: creds.email, password: creds.password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Credencial inválida — força senha manualmente
        BiometricService.clear();
        setBioEnabled(false);
        setError('Sessão expirada. Faça login com sua senha.');
        setBioLoading(false);
        return;
      }
      login(d.token);
      const slug = d.tenant?.slug;
      navigate(d.mustSetup ? `/${slug}/primeiro-acesso` : `/${slug}/dashboard`, { replace: true });
    } catch (err) {
      setError('Falha na autenticação biométrica. Use sua senha.');
    } finally {
      setBioLoading(false);
    }
  };

  // ─── Login com senha ───────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDisabled(false);
    if (!email.trim() || !password) { setError('Preencha e-mail e senha'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.accountDisabled) setDisabled(true);
        throw new Error(d.message || 'Credenciais inválidas');
      }

      // Oferece biometria se suportado e ainda não configurado
      if (bioSupported && !bioEnabled) {
        setPendingData({ token: d.token, slug: d.tenant?.slug, mustSetup: d.mustSetup, email, password, name: d.user?.name });
        setShowBioOffer(true);
        setLoading(false);
        return;
      }

      // Se já estava habilitada, atualiza credencial salva
      if (bioSupported && bioEnabled) {
        await BiometricService.saveCredentials({ email: email.toLowerCase().trim(), password, name: d.user?.name, token: d.token });
      }

      login(d.token);
      const slug = d.tenant?.slug;
      navigate(d.mustSetup ? `/${slug}/primeiro-acesso` : `/${slug}/dashboard`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── Resposta à oferta de biometria ───────────────────────────────────────

  const handleBioAccept = async () => {
    if (!pendingData) return;
    await BiometricService.saveCredentials({
      email:    pendingData.email.toLowerCase().trim(),
      password: pendingData.password,
      name:     pendingData.name,
      token:    pendingData.token,
    });
    setBioEnabled(true);
    login(pendingData.token);
    navigate(pendingData.mustSetup ? `/${pendingData.slug}/primeiro-acesso` : `/${pendingData.slug}/dashboard`, { replace: true });
  };

  const handleBioDecline = () => {
    if (!pendingData) return;
    login(pendingData.token);
    navigate(pendingData.mustSetup ? `/${pendingData.slug}/primeiro-acesso` : `/${pendingData.slug}/dashboard`, { replace: true });
  };

  // ─── Modal de oferta de biometria ─────────────────────────────────────────

  if (showBioOffer) {
    return (
      <div className={s.page}>
        <div className={s.card} style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
          <h2 style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color)' }}>
            Entrar mais rápido
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Deseja usar <strong style={{ color: 'var(--color)' }}>biometria</strong> (Face ID, Touch ID ou impressão digital)
            para entrar sem precisar digitar a senha nas próximas vezes?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleBioAccept}>
              Ativar biometria
            </button>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={handleBioDecline}>
              Agora não
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tela principal de login ───────────────────────────────────────────────

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.brand}>
          <img src="/icon.png" alt="Barbeiro ON" style={{ height: 64, marginBottom: '1rem' }} />
          <h1 className={s.brandTitle}>Barbeiro <em>ON</em></h1>
          <p className={s.brandSub}>Bem-vindo</p>
        </div>

        {/* Botão biométrico */}
        {bioSupported && bioEnabled && (
          <>
            <button
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '0.75rem', gap: '0.5rem', fontWeight: 700 }}
              onClick={handleBiometricLogin}
              disabled={bioLoading}
            >
              <FiZap size={16} />
              {bioLoading ? 'Verificando...' : 'Entrar com biometria'}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ color: 'var(--color-muted)', fontSize: '0.78rem' }}>ou use sua senha</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className={s.form}>
          {error && (
            <div className={`alert ${disabled ? 'alert-warning' : 'alert-error'}`} style={disabled ? { textAlign: 'center', lineHeight: 1.5 } : undefined}>
              {error}
              {disabled && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.82rem', opacity: 0.85 }}>
                  Para reativar, entre em contato: <strong>suporte@barbeiroon.com</strong>
                </div>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              className="form-input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoCapitalize="none"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-input"
                type={showPwd ? 'text' : 'password'}
                placeholder="Sua senha"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}
              >
                {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className={s.links}>
          <Link to="/recuperar-senha" className={s.link}>Esqueceu sua senha?</Link>
          <Link to="/registrar" className={s.link} style={{ fontWeight: '600' }}>Registre-se</Link>
        </div>
      </div>
    </div>
  );
}
