import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './RecuperaSenha.module.css';

export default function RecuperaSenha() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');
  const navigate              = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage('');
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Erro ao enviar e-mail'); return; }
      setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      setTimeout(() => navigate('/admin'), 3000);
    } catch {
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <button className={s.back} onClick={() => navigate('/admin')}>← Voltar</button>
        <h1 className={s.title}>Recuperar Senha</h1>
        <p className={s.sub}>Informe seu e-mail e enviaremos as instruções para redefinir sua senha.</p>

        {message && <div className="alert alert-success">{message}</div>}
        {error   && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem' }}>
          <div className="form-field">
            <label className="form-label">E-mail</label>
            <input className="form-input" type="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.875rem' }}>
            {loading ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>
    </div>
  );
}
