import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { FiEye, FiEyeOff, FiScissors } from 'react-icons/fi';
import s from './Login.module.css';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError('Preencha todos os campos'); return; }
    setLoading(true);
    try {
      const doReq = () => fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      let res = await doReq();
      if (res.status === 502) { await new Promise(r => setTimeout(r, 1500)); res = await doReq(); }
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Erro ao fazer login'); return; }
      if (data.token) { login(data.token); navigate('/dashboard'); }
      else setError('Token não recebido');
    } catch (err) {
      setError(err.message || 'Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.brand}>
          <div className={s.brandIcon}><FiScissors size={28} /></div>
          <h1 className={s.title}>Barbeiro On</h1>
          <p className={s.sub}>Faça login para acessar o painel</p>
        </div>

        <form className={s.form} onSubmit={handleSubmit}>
          {error && <div className={`alert alert-error ${s.alert}`}>{error}</div>}

          <div className="form-field">
            <label className="form-label">E-mail</label>
            <input className="form-input" type="email" placeholder="seu@email.com"
              value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required />
          </div>

          <div className="form-field">
            <label className="form-label">Senha</label>
            <div className={s.pwWrap}>
              <input className="form-input" type={showPw ? 'text' : 'password'}
                placeholder="Sua senha" value={password}
                onChange={e => setPassword(e.target.value)} disabled={loading} required />
              <button type="button" className={s.eyeBtn} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                {showPw ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className={`btn btn-primary ${s.submitBtn}`} disabled={loading}>
            {loading ? <><span className={s.spinner} /> Entrando...</> : 'Entrar'}
          </button>
        </form>

        <div className={s.links}>
          <Link to="/recuperar-senha" className={s.link}>Esqueceu sua senha?</Link>
          <div className={s.register}>
            <span>Sem conta?</span>
            <Link to="/cadastro-barbearia" className={s.link}>Cadastre-se</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
