import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import s from './ClienteLista.module.css';

const tok = () => sessionStorage.getItem('token');
const fmtPhone = (p) => { if (!p) return ''; const c = p.replace(/\D/g,''); if (c.length<=2) return c; if (c.length<=7) return `(${c.slice(0,2)}) ${c.slice(2)}`; return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`; };
const fmtDate  = (v) => { if (!v) return ''; const [y,m,d] = String(v).split('-'); return `${d}/${m}/${y}`; };

export default function ClienteLista() {
  const [clients,  setClients]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState(null);
  const [editData, setEditData] = useState({ name: '', phone: '', birthDate: '' });
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/customer/customers?limit=500', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setClients(d.customers || d.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name||'').toLowerCase().includes(q) || (c.phone||'').includes(q);
  });

  const startEdit = (c) => { setEditing(c); setEditData({ name: c.name||'', phone: c.phone||'', birthDate: c.birthDate||'' }); setError(''); };

  const save = async () => {
    if (!editData.name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/customer/${editing.phone || editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(editData),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro ao salvar'); }
      setClients(prev => prev.map(c => (c.id === editing.id ? { ...c, ...editData } : c)));
      setEditing(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (client) => {
    try {
      await fetch(`/api/customer/${client.phone || client.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
      setClients(prev => prev.filter(c => c.id !== client.id));
    } finally { setConfirm(null); }
  };

  return (
    <Layout title="Lista de Clientes">
      <div className={s.toolbar}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <FiSearch size={14} />
          <input className="search-input" placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state"><p>Nenhum cliente encontrado</p></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Nome</th><th>Telefone</th><th>Aniversário</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td><span style={{ fontWeight: 600 }}>{c.name}</span></td>
                  <td>{fmtPhone(c.phone)}</td>
                  <td>{fmtDate(c.birthDate) || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(c)}><FiTrash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Cliente</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><FiX size={18} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
              <div className="form-field"><label className="form-label">Nome</label><input className="form-input" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-field"><label className="form-label">Telefone</label><input className="form-input" value={editData.phone} onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="form-field"><label className="form-label">Data de Nascimento</label><input className="form-input" type="date" value={editData.birthDate} onChange={e => setEditData(p => ({ ...p, birthDate: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setEditing(null)}>Cancelar</button>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: '380px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Excluir cliente?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-muted)', marginBottom: '1.25rem' }}>Tem certeza que deseja excluir <strong style={{ color: 'var(--color)' }}>{confirm.name}</strong>? Esta ação não pode ser desfeita.</p>
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
