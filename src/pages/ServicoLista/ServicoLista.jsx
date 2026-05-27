import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const fmtP = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

const minsToDuration = (mins) => {
  if (!mins && mins !== 0) return '';
  const m = Number(mins);
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
};

const durationToMins = (dur) => {
  if (!dur || !dur.includes(':')) return Number(dur) || 0;
  const [h, m] = dur.split(':').map(Number);
  return h * 60 + m;
};

const formatDuration = (v) => {
  const d = v.replace(/\D/g,'');
  if (d.length <= 2) return d;
  return `${d.slice(0,2)}:${d.slice(2,4)}`;
};

const displayDuration = (sv) => {
  const raw = sv.duration || sv.durationMinutes;
  if (!raw) return '—';
  if (String(raw).includes(':')) return raw;
  return minsToDuration(raw);
};

const FILTERS = [{ key: 'todos', label: 'Todos' }, { key: 'ativos', label: 'Ativos' }, { key: 'inativos', label: 'Inativos' }];

export default function ServicoLista() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('todos');
  const [editing,  setEditing]  = useState(null);
  const [editData, setEditData] = useState({ name: '', tipo: '', price: '', duration: '', ativo: true });
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/service?limit=200', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setServices(d.services || d.data || (Array.isArray(d) ? d : []));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = services.filter(sv => {
    if (filter === 'ativos'   && sv.ativo === false) return false;
    if (filter === 'inativos' && sv.ativo !== false) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (sv.name || '').toLowerCase().includes(q) || (sv.tipo || sv.description || '').toLowerCase().includes(q);
  });

  const startEdit = (sv) => {
    setEditing(sv);
    setEditData({
      name:     sv.name || '',
      tipo:     sv.tipo || sv.description || '',
      price:    String(sv.price || ''),
      duration: String(sv.duration || minsToDuration(sv.durationMinutes) || ''),
      ativo:    sv.ativo !== false,
    });
    setError('');
  };

  const setE = (k, v) => setEditData(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!editData.name.trim()) { setError('Nome obrigatório'); return; }
    const mins = durationToMins(editData.duration);
    if (editData.duration && (mins < 1 || mins > 1439)) { setError('Duração deve ser entre 00:01 e 23:59'); return; }
    const price = Number(editData.price);
    if (editData.price && price < 0) { setError('Preço inválido'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/service/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ name: editData.name, description: editData.tipo, price, duration: editData.duration, ativo: editData.ativo }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro'); }
      setServices(prev => prev.map(sv => sv.id === editing.id ? { ...sv, ...editData, price } : sv));
      setEditing(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (sv) => {
    try {
      await fetch(`/api/service/${sv.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
      setServices(prev => prev.filter(s => s.id !== sv.id));
    } finally { setConfirm(null); }
  };

  return (
    <Layout title="Lista de Serviços">
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
        <div className="search-wrap" style={{ flex: 1, minWidth: 180 }}>
          <FiSearch size={14} />
          <input className="search-input" placeholder="Buscar por nome ou tipo..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && filtered.length === 0 && <div className="empty-state"><p>Nenhum serviço encontrado</p></div>}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Nome</th><th>Tipo</th><th>Valor</th><th>Duração</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map(sv => (
                <tr key={sv.id}>
                  <td style={{ fontWeight: 600 }}>{sv.name}</td>
                  <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{sv.tipo || sv.description || '—'}</td>
                  <td style={{ color: '#fbbf24', fontWeight: 600 }}>{fmtP(sv.price)}</td>
                  <td style={{ fontSize: '0.85rem' }}>{displayDuration(sv)}</td>
                  <td><span className={`badge ${sv.ativo !== false ? 'badge-green' : 'badge-red'}`}>{sv.ativo !== false ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(sv)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirm(sv)}><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Editar Serviço</h3><button className="modal-close" onClick={() => setEditing(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group"><label className="form-label">Nome</label><input className="form-input" placeholder="Nome" value={editData.name} onChange={e => setE('name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Tipo</label><input className="form-input" placeholder="Tipo" value={editData.tipo} onChange={e => setE('tipo', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Valor (R$)</label><input className="form-input" type="number" step="0.01" min="0" placeholder="0,00" value={editData.price} onChange={e => setE('price', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Duração (HH:MM)</label><input className="form-input" placeholder="01:30" value={editData.duration} onChange={e => setE('duration', formatDuration(e.target.value))} maxLength={5} /></div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="ativo" checked={editData.ativo} onChange={e => setE('ativo', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                <label htmlFor="ativo" className="form-label" style={{ margin: 0 }}>Ativo</label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
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
            <div className="modal-header"><h3>Excluir serviço?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-muted)' }}>Deseja excluir <strong style={{ color: 'var(--color)' }}>{confirm.name}</strong>?</p>
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
