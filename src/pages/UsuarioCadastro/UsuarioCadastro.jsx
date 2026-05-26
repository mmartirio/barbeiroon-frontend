import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { useNavigate } from 'react-router-dom';

const tok = () => sessionStorage.getItem('token');
const BASE = '/api';

export default function UsuarioCadastro() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: '', email: '', password: '', groupId: '', isBarber: false });
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`${BASE}/group`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).catch(() => ({}))
      .then(d => setGroups(d.groups || d.data || []));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) { setError('Nome, e-mail e senha são obrigatórios'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          groupId: form.groupId ? Number(form.groupId) : undefined,
          isBarber: form.isBarber,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao cadastrar');
      setSuccess('Usuário cadastrado com sucesso!');
      setForm({ name: '', email: '', password: '', groupId: '', isBarber: false });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Cadastrar Usuário">
      <div style={{ maxWidth: 480 }}>
        {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className="form-field"><label className="form-label">Nome *</label><input className="form-input" placeholder="Nome completo" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div className="form-field"><label className="form-label">E-mail *</label><input className="form-input" type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
            <div className="form-field"><label className="form-label">Senha *</label><input className="form-input" type="password" placeholder="Mínimo 6 caracteres" value={form.password} onChange={e => set('password', e.target.value)} required /></div>
            <div className="form-field">
              <label className="form-label">Grupo</label>
              <select className="form-input" value={form.groupId} onChange={e => set('groupId', e.target.value)}>
                <option value="">Sem grupo</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem', marginTop: '0.25rem' }}>
              <input type="checkbox" id="isBarber" checked={form.isBarber} onChange={e => set('isBarber', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
              <label htmlFor="isBarber" className="form-label" style={{ margin: 0 }}>É barbeiro</label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/usuario-lista')}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar'}</button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
