import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';

const tok = () => sessionStorage.getItem('token');

const fmtPhone = (v) => {
  const c = v.replace(/\D/g, '');
  if (c.length <= 2) return c;
  if (c.length <= 7) return `(${c.slice(0,2)}) ${c.slice(2)}`;
  return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`;
};

const formatBirthInput = (v) => {
  const d = v.replace(/\D/g, '');
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4,8)}`;
};

const toApi = (v) => {
  if (!v || !v.includes('/')) return null;
  const [d, m, y] = v.split('/');
  if (!d || !m || !y || y.length < 4) return null;
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
};

export default function ClienteCadastro() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();
  const tenantSlug = slug || user?.tenantSlug || '';
  const [form,    setForm]    = useState({ name: '', phone: '', birthDate: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name.trim())  { setError('Nome obrigatório'); return; }
    if (!form.phone.trim()) { setError('Telefone obrigatório'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ name: form.name, phone: form.phone.replace(/\D/g,''), birthDate: toApi(form.birthDate) }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.status === 409 && d.duplicate) {
        setError(d.message);
        return;
      }
      if (!res.ok) throw new Error(d.message || 'Erro ao cadastrar');
      setSuccess('Cliente cadastrado com sucesso!');
      setForm({ name: '', phone: '', birthDate: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Cadastrar Cliente">
      <div style={{ maxWidth: 480 }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
            {error.includes('já pertence') && (
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: '0.75rem' }} onClick={() => navigate(`/${tenantSlug}/cliente-lista`)}>
                Ver na lista
              </button>
            )}
          </div>
        )}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nome completo *</label>
              <input className="form-input" placeholder="Nome completo" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Telefone *</label>
              <input className="form-input" placeholder="(11) 99999-9999" value={form.phone} onChange={e => set('phone', fmtPhone(e.target.value))} maxLength={15} />
            </div>
            <div className="form-group">
              <label className="form-label">Data de nascimento</label>
              <input className="form-input" placeholder="DD/MM/AAAA" value={form.birthDate} onChange={e => set('birthDate', formatBirthInput(e.target.value))} maxLength={10} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate(`/${tenantSlug}/cliente-lista`)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar'}</button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
