import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const fmtP = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v||0));

const FILTERS = [{ key: 'todos', label: 'Todos' }, { key: 'ativos', label: 'Ativos' }, { key: 'inativos', label: 'Inativos' }];

export default function ServicoLista() {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('todos');
  const [editing,  setEditing]  = useState(null);
  const [editData, setEditData] = useState({ name: '', price: '', durationMinutes: '', ativo: true });
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/service/services?limit=200', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setServices(d.services || d.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = services.filter(sv => {
    if (filter === 'ativos'   && !sv.ativo)  return false;
    if (filter === 'inativos' && sv.ativo)   return false;
    if (!search) return true;
    return (sv.name||'').toLowerCase().includes(search.toLowerCase());
  });

  const startEdit = (sv) => { setEditing(sv); setEditData({ name: sv.name||'', price: String(sv.price||''), durationMinutes: String(sv.durationMinutes||sv.duration||''), ativo: sv.ativo !== false }); setError(''); };

  const save = async () => {
    if (!editData.name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/service/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ name: editData.name, price: Number(editData.price), durationMinutes: Number(editData.durationMinutes), ativo: editData.ativo }),
      });
      if (!res.ok) { const d = await res.json().catch(()=>({})); throw new Error(d.message||'Erro'); }
      setServices(prev => prev.map(sv => sv.id === editing.id ? { ...sv, ...editData, price: Number(editData.price), durationMinutes: Number(editData.durationMinutes) } : sv));
      setEditing(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (sv) => {
    try { await fetch(`/api/service/${sv.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } }); setServices(prev => prev.filter(s => s.id !== sv.id)); }
    finally { setConfirm(null); }
  };

  return (
    <Layout title="Lista de Serviços">
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.key)}>{f.label}</button>
        ))}
        <div className="search-wrap" style={{ flex: 1, minWidth: 180 }}>
          <FiSearch size={14} />
          <input className="search-input" placeholder="Buscar serviço..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && filtered.length === 0 && <div className="empty-state"><p>Nenhum serviço encontrado</p></div>}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Nome</th><th>Preço</th><th>Duração</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map(sv => (
                <tr key={sv.id}>
                  <td><span style={{ fontWeight: 600 }}>{sv.name}</span></td>
                  <td>{fmtP(sv.price)}</td>
                  <td>{sv.durationMinutes || sv.duration || '—'} min</td>
                  <td><span className={`badge ${sv.ativo !== false ? 'badge-green' : 'badge-gray'}`}>{sv.ativo !== false ? 'Ativo' : 'Inativo'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(sv)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(sv)}><FiTrash2 size={14} /></button>
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
              {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
              <div className="form-field"><label className="form-label">Nome</label><input className="form-input" value={editData.name} onChange={e => setEditData(p=>({...p,name:e.target.value}))} /></div>
              <div className="form-field"><label className="form-label">Preço (R$)</label><input className="form-input" type="number" step="0.01" value={editData.price} onChange={e => setEditData(p=>({...p,price:e.target.value}))} /></div>
              <div className="form-field"><label className="form-label">Duração (min)</label><input className="form-input" type="number" value={editData.durationMinutes} onChange={e => setEditData(p=>({...p,durationMinutes:e.target.value}))} /></div>
              <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="ativo" checked={editData.ativo} onChange={e => setEditData(p=>({...p,ativo:e.target.checked}))} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                <label htmlFor="ativo" className="form-label" style={{ margin: 0 }}>Ativo</label>
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
            <div className="modal-header"><h3>Excluir serviço?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
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
