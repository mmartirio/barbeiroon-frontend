import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';
import { useNavigate } from 'react-router-dom';

const tok = () => sessionStorage.getItem('token');

export default function ServicoCadastro() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState({ name: '', price: '', durationMinutes: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ name: form.name, price: Number(form.price), durationMinutes: Number(form.durationMinutes), description: form.description }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao cadastrar');
      setSuccess('Serviço cadastrado com sucesso!');
      setForm({ name: '', price: '', durationMinutes: '', description: '' });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Cadastrar Serviço">
      <div style={{ maxWidth: 480 }}>
        {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div className="form-field"><label className="form-label">Nome *</label><input className="form-input" placeholder="Ex: Corte Masculino" value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div className="form-field"><label className="form-label">Preço (R$)</label><input className="form-input" type="number" step="0.01" min="0" placeholder="0,00" value={form.price} onChange={e => set('price', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Duração (min)</label><input className="form-input" type="number" min="1" placeholder="30" value={form.durationMinutes} onChange={e => set('durationMinutes', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Descrição</label><textarea className="form-input" rows={3} placeholder="Descrição opcional..." value={form.description} onChange={e => set('description', e.target.value)} /></div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/servico-lista')}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar'}</button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
