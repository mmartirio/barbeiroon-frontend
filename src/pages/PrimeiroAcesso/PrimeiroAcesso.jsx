import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function PrimeiroAcesso() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(null); // email do novo admin após sucesso

  // Se não for o usuário bootstrap, redireciona
  useEffect(() => {
    if (user && user.email !== 'perfil@barbeiroon.com') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !email.trim() || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      // Busca o grupo Administrador
      const token = sessionStorage.getItem('token');
      const gRes  = await fetch('/api/groups', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const gData = await gRes.json().catch(() => ({}));
      const adminGroup = (gData.groups || gData || []).find(
        g => g.name === 'Administrador'
      );
      if (!adminGroup) throw new Error('Grupo Administrador não encontrado.');

      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.toLowerCase().trim(),
          password,
          groupId: adminGroup.id,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao criar usuário.');

      setDone(email.toLowerCase().trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem' }}>✅</div>
            <h2 style={{ margin: '0.5rem 0 0.25rem' }}>Acesso configurado!</h2>
            <p style={{ color: 'var(--color-muted)', margin: 0 }}>
              Seu usuário administrador foi criado com sucesso.
            </p>
          </div>
          <div style={styles.credBox}>
            <div>Email: <strong>{done}</strong></div>
            <div style={{ marginTop: 4 }}>Senha: <strong style={{ fontFamily: 'monospace' }}>a que você definiu</strong></div>
          </div>
          <p style={{ color: '#f59e0b', fontSize: '0.85rem', textAlign: 'center' }}>
            Anote suas credenciais. O acesso bootstrap foi desativado.
          </p>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => { logout(); navigate('/login', { replace: true }); }}
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0 }}>Primeiro acesso</h2>
          <p style={{ color: 'var(--color-muted)', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
            Crie o usuário administrador da sua barbearia.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Nome</label>
            <input
              className="form-input"
              placeholder="Seu nome completo"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <input
              className="form-input"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoCapitalize="none"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input
              className="form-input"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmar senha</label>
            <input
              className="form-input"
              type="password"
              placeholder="Repita a senha"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar meu acesso'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    padding: '1rem',
  },
  card: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    padding: '2rem',
    width: '100%',
    maxWidth: 420,
  },
  credBox: {
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.9rem',
  },
};
