import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';
import { useNavigate } from 'react-router-dom';

const tok = () => sessionStorage.getItem('token');
const fmtPhone = (v) => { const c = v.replace(/\D/g,''); if (c.length<=2) return c; if (c.length<=7) return `(${c.slice(0,2)}) ${c.slice(2)}`; return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`; };

export default function ClienteCadastro() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: '', phone: '', birthDate: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name.trim() || !form.phone.trim()) { setError('Nome e telefone são obrigatórios'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ name: form.name, phone: form.phone.replace(/\D/g,''), birthDate: form.birthDate || null }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao cadastrar');
      setSuccess('Cliente cadastrado com sucesso!');
      setForm({ name: '', phone: '', birthDate: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Cadastrar Cliente">
      <div style={{ maxWidth: 480 }}>
        {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className="form-field"><label className="form-label">Nome *</label><input className="form-input" placeholder="Nome completo" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div className="form-field"><label className="form-label">Telefone *</label><input className="form-input" placeholder="(11) 99999-9999" value={form.phone} onChange={e => set('phone', fmtPhone(e.target.value))} maxLength={15} required /></div>
            <div className="form-field"><label className="form-label">Data de Nascimento</label><input className="form-input" type="date" value={form.birthDate} onChange={e => set('birthDate', e.target.value)} /></div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/cliente-lista')}>Cancelar</button>
              <button type="submit"  className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar'}</button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
