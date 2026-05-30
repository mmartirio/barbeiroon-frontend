import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';

export default function RecuperaSenha() {
  const [step, setStep] = useState(1); // 1=email 2=código 3=nova senha
  const [email,       setEmail]       = useState('');
  const [code,        setCode]        = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPwd,  setConfirmPwd]  = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [msg,         setMsg]         = useState({ type: '', text: '' });

  const post = async (path, body) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(d.message || 'Erro inesperado');
    return d;
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setMsg({ type: 'error', text: 'Informe seu e-mail' }); return; }
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      await post('/api/auth/forgot-password', { email });
      setMsg({ type: 'success', text: 'Código enviado! Verifique sua caixa de entrada.' });
      setStep(2);
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    finally { setLoading(false); }
  };

  const handleCode = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 6) { setMsg({ type: 'error', text: 'O código deve ter 6 dígitos' }); return; }
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      await post('/api/auth/verify-reset-code', { email, code });
      setStep(3);
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) { setMsg({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres' }); return; }
    if (newPassword !== confirmPwd) { setMsg({ type: 'error', text: 'As senhas não coincidem' }); return; }
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      await post('/api/auth/reset-password', { email, code, newPassword });
      setMsg({ type: 'success', text: 'Senha alterada com sucesso! Redirecionando...' });
      setTimeout(() => window.location.href = '/login', 2000);
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    finally { setLoading(false); }
  };

  const card = {
    width: '100%', maxWidth: 400,
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '2.25rem 2rem', boxShadow: 'var(--shadow)',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '1rem' }}>
      <div style={card}>
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          <FiArrowLeft size={15} /> Voltar ao login
        </Link>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {step === 1 && (
          <>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem' }}>Recuperar Senha</h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Informe seu e-mail e enviaremos um código de verificação.
            </p>
            <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-input" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem' }}>Código de verificação</h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Digite o código de 6 dígitos enviado para <strong style={{ color: 'var(--color)' }}>{email}</strong>.
            </p>
            <form onSubmit={handleCode} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
              <div className="form-group">
                <label className="form-label">Código</label>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  style={{ fontSize: '1.5rem', letterSpacing: '0.5rem', textAlign: 'center' }}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar código'}
              </button>
              <button type="button" className="btn btn-ghost" style={{ fontSize: '0.82rem' }} onClick={() => { setStep(1); setMsg({ type: '', text: '' }); setCode(''); }}>
                Reenviar código
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.4rem' }}>Nova senha</h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Crie uma nova senha para sua conta.
            </p>
            <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}
              <div className="form-group">
                <label className="form-label">Nova senha</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ paddingRight: '2.5rem' }} autoFocus />
                  <button type="button" onClick={() => setShowPwd(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }}>
                    {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar nova senha</label>
                <input className="form-input" type={showPwd ? 'text' : 'password'} placeholder="Repita a senha" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
