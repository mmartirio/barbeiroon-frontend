import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const fmtPhone = (p) => {
  if (!p) return '';
  const c = p.replace(/\D/g, '');
  if (c.length <= 2) return c;
  if (c.length <= 7) return `(${c.slice(0,2)}) ${c.slice(2)}`;
  return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`;
};

const toDisplay = (v) => {
  if (!v) return '';
  const s = String(v).split('T')[0];
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
};

const toApi = (v) => {
  if (!v) return null;
  if (v.includes('-')) return v;
  const [d, m, y] = v.split('/');
  if (!d || !m || !y) return null;
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
};

const formatBirthInput = (v) => {
  const d = v.replace(/\D/g, '');
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4,8)}`;
};

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
      const res = await fetch('/api/customer', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setClients(d.customers || d.data || (Array.isArray(d) ? d : []));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q)
      || (c.phone || '').includes(q)
      || (c.birthDate || '').includes(q);
  });

  const startEdit = (c) => {
    setEditing(c);
    setEditData({ name: c.name || '', phone: fmtPhone(c.phone || ''), birthDate: toDisplay(c.birthDate) });
    setError('');
  };

  const setE = (k, v) => setEditData(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!editData.name.trim()) { setError('Nome obrigatório'); return; }
    if (!editData.phone.trim()) { setError('Telefone obrigatório'); return; }
    setSaving(true);
    try {
      const phone = editData.phone.replace(/\D/g, '');
      const body  = { name: editData.name, phone, birthDate: toApi(editData.birthDate) };
      const res   = await fetch(`/api/customer/${editing.phone || phone}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro ao salvar'); }
      setClients(prev => prev.map(c => c.id === editing.id ? { ...c, ...body } : c));
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
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <FiSearch size={14} />
          <input className="search-input" placeholder="Buscar por nome, telefone ou aniversário..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && filtered.length === 0 && <div className="empty-state"><p>Nenhum cliente encontrado</p></div>}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Nome</th><th>Telefone</th><th>Aniversário</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td>{fmtPhone(c.phone)}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{toDisplay(c.birthDate) || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(c)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirm(c)}><FiTrash2 size={14} /></button>
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
            <div className="modal-header"><h3>Editar Cliente</h3><button className="modal-close" onClick={() => setEditing(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="form-group"><label className="form-label">Nome</label><input className="form-input" placeholder="Nome" value={editData.name} onChange={e => setE('name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Telefone</label><input className="form-input" placeholder="Telefone" value={editData.phone} onChange={e => setE('phone', fmtPhone(e.target.value))} maxLength={15} /></div>
              <div className="form-group"><label className="form-label">Data de nascimento</label><input className="form-input" placeholder="DD/MM/AAAA" value={editData.birthDate} onChange={e => setE('birthDate', formatBirthInput(e.target.value))} maxLength={10} /></div>
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
            <div className="modal-header"><h3>Excluir cliente?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-muted)' }}>Deseja excluir <strong style={{ color: 'var(--color)' }}>{confirm.name}</strong>? Esta ação não pode ser desfeita.</p>
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
