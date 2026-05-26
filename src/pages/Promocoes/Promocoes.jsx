import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const BASE = '/api';

const fmtDate = (v) => { if (!v) return ''; const [y, m, d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };
const fmtP    = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

const TYPES = [
  { value: 'desconto_percentual', label: 'Desconto percentual (%)' },
  { value: 'desconto_fixo',       label: 'Desconto fixo (R$)' },
  { value: 'brinde',              label: 'Brinde / serviço grátis' },
];

const CRITERIA = [
  { value: 'aniversariante',      label: 'Aniversariante do mês' },
  { value: 'frequencia',          label: 'Frequência de visitas' },
  { value: 'todos',               label: 'Todos os clientes' },
];

const emptyForm = () => ({
  name: '', type: 'desconto_percentual', discountValue: '', criteriaType: 'todos',
  minVisits: '', startDate: '', endDate: '', description: '', active: true,
});

export default function Promocoes() {
  const [promos,   setPromos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(emptyForm());
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/promotion`, { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setPromos(d.promotions || d.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const openCreate = () => { setEditing('new'); setForm(emptyForm()); setError(''); };
  const openEdit   = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '', type: p.type || 'desconto_percentual',
      discountValue: String(p.discountValue || ''), criteriaType: p.criteriaType || 'todos',
      minVisits: String(p.minVisits || ''), startDate: (p.startDate || '').split('T')[0],
      endDate: (p.endDate || '').split('T')[0], description: p.description || '', active: p.active !== false,
    });
    setError('');
  };

  const save = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const url   = isNew ? `${BASE}/promotion` : `${BASE}/promotion/${editing.id}`;
      const body  = {
        name: form.name, type: form.type, discountValue: Number(form.discountValue),
        criteriaType: form.criteriaType, minVisits: form.minVisits ? Number(form.minVisits) : undefined,
        startDate: form.startDate || undefined, endDate: form.endDate || undefined,
        description: form.description, active: form.active,
      };
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro ao salvar'); }
      await load();
      setEditing(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (p) => {
    try {
      await fetch(`${BASE}/promotion/${p.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
      setPromos(prev => prev.filter(pr => pr.id !== p.id));
    } finally { setConfirm(null); }
  };

  const typeLabel  = (v) => (TYPES.find(t => t.value === v) || {}).label || v;
  const criteriaLabel = (v) => (CRITERIA.find(c => c.value === v) || {}).label || v;

  return (
    <Layout title="Promoções">
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><FiPlus size={14} style={{ marginRight: 4 }} />Nova Promoção</button>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && promos.length === 0 && <div className="empty-state"><p>Nenhuma promoção cadastrada</p></div>}

      {!loading && promos.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Nome</th><th>Tipo</th><th>Desconto</th><th>Critério</th><th>Validade</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {promos.map(p => (
                <tr key={p.id}>
                  <td><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{typeLabel(p.type)}</td>
                  <td>{p.type === 'desconto_percentual' ? `${p.discountValue}%` : p.type === 'desconto_fixo' ? fmtP(p.discountValue) : '—'}</td>
                  <td style={{ fontSize: '0.8rem' }}>{criteriaLabel(p.criteriaType)}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{p.startDate || p.endDate ? `${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}` : 'Sem limite'}</td>
                  <td><span className={`badge ${p.active !== false ? 'badge-green' : 'badge-gray'}`}>{p.active !== false ? 'Ativa' : 'Inativa'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(p)}><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing === 'new' ? 'Nova Promoção' : 'Editar Promoção'}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><FiX size={18} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
              <div className="form-field"><label className="form-label">Nome *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div className="form-field">
                <label className="form-label">Tipo de promoção</label>
                <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              {form.type !== 'brinde' && (
                <div className="form-field">
                  <label className="form-label">{form.type === 'desconto_percentual' ? 'Desconto (%)' : 'Desconto (R$)'}</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={form.discountValue} onChange={e => set('discountValue', e.target.value)} />
                </div>
              )}
              <div className="form-field">
                <label className="form-label">Critério</label>
                <select className="form-input" value={form.criteriaType} onChange={e => set('criteriaType', e.target.value)}>
                  {CRITERIA.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              {form.criteriaType === 'frequencia' && (
                <div className="form-field"><label className="form-label">Mínimo de visitas</label><input className="form-input" type="number" min="1" value={form.minVisits} onChange={e => set('minVisits', e.target.value)} /></div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                <div className="form-field"><label className="form-label">Data início</label><input className="form-input" type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
                <div className="form-field"><label className="form-label">Data fim</label><input className="form-input" type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} /></div>
              </div>
              <div className="form-field"><label className="form-label">Descrição</label><textarea className="form-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} /></div>
              <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="active" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                <label htmlFor="active" className="form-label" style={{ margin: 0 }}>Promoção ativa</label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancelar</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Excluir promoção?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-muted)', marginBottom: '1.25rem' }}>Deseja excluir <strong style={{ color: 'var(--color)' }}>{confirm.name}</strong>?</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setConfirm(null)}>Cancelar</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => del(confirm)}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
