import { useState } from 'react';
import { RiShieldLine, RiAlertLine } from 'react-icons/ri';
import { useGestorAuth } from '../context/GestorAuthContext';

export default function Setup() {
  const { authFetch, clearSetup, logout } = useGestorAuth();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [done,    setDone]    = useState(false);

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('As senhas não coincidem.'); return; }
    if (form.password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);
    try {
      const res = await authFetch('/api/gestor/admin-users', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao criar administrador.');
      setDone(true);
      clearSetup();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--bg)' }}>
        <div className="card" style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(22,163,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', fontSize: '1.5rem' }}>✓</div>
            <h2 style={{ fontWeight: 700 }}>Conta criada com sucesso!</h2>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
              O usuário bootstrap foi desativado. Faça login com as novas credenciais.
            </p>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={logout}>
              Ir para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'var(--bg)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
              <RiShieldLine size={22} />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Configuração inicial</h2>
          </div>

          <div className="alert alert-warning" style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <RiAlertLine size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>Você está usando a conta bootstrap. Crie um administrador permanente — a conta bootstrap será desativada automaticamente.</span>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Nome completo</label>
              <input className="form-input" type="text" placeholder="Seu nome" value={form.name} onChange={set('name')} required />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" type="email" placeholder="novo@admin.com" value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={set('password')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar senha</label>
              <input className="form-input" type="password" placeholder="Repita a senha" value={form.confirm} onChange={set('confirm')} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', marginTop: '0.25rem' }}>
              {loading ? 'Criando...' : 'Criar administrador e continuar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
