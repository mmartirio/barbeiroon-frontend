import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';

const tok = () => sessionStorage.getItem('token');

const formatDuration = (v) => {
  const d = v.replace(/\D/g,'');
  if (d.length <= 2) return d;
  return `${d.slice(0,2)}:${d.slice(2,4)}`;
};

export default function ServicoCadastro() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();
  const tenantSlug = slug || user?.tenantSlug || '';
  const [form,    setForm]    = useState({ name: '', tipo: '', price: '', duration: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ name: form.name, description: form.tipo, price: Number(form.price) || 0, duration: form.duration || '00:30', ativo: true }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao cadastrar');
      setSuccess('Serviço cadastrado com sucesso!');
      setForm({ name: '', tipo: '', price: '', duration: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Cadastrar Serviço">
      <div style={{ maxWidth: 480 }}>
        {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" placeholder="Ex: Corte Masculino" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Tipo</label><input className="form-input" placeholder="Ex: Corte, Barba..." value={form.tipo} onChange={e => set('tipo', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Valor (R$)</label><input className="form-input" type="number" step="0.01" min="0" placeholder="0,00" value={form.price} onChange={e => set('price', e.target.value)} /></div>
            <div className="form-group"><label className="form-label">Duração (HH:MM)</label><input className="form-input" placeholder="00:30" value={form.duration} onChange={e => set('duration', formatDuration(e.target.value))} maxLength={5} /></div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate(`/${tenantSlug}/servico-lista`)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar'}</button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
