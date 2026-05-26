import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiSearch, FiX, FiUser } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const BASE = '/api';

export default function UsuarioLista() {
  const [users,    setUsers]    = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', password: '', groupId: '', isBarber: false });
  const [saving,   setSaving]   = useState(false);
  const [confirm,  setConfirm]  = useState(null);
  const [error,    setError]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, gRes] = await Promise.all([
        fetch(`${BASE}/user/users?limit=200`, { headers: { Authorization: `Bearer ${tok()}` } }),
        fetch(`${BASE}/group`, { headers: { Authorization: `Bearer ${tok()}` } }),
      ]);
      const uData = await uRes.json().catch(() => ({}));
      const gData = await gRes.json().catch(() => ({}));
      setUsers(uData.users || uData.data || []);
      setGroups(gData.groups || gData.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  const startEdit = (u) => {
    setEditing(u);
    setEditData({ name: u.name || '', email: u.email || '', password: '', groupId: String(u.groupId || ''), isBarber: !!u.isBarber });
    setError('');
  };

  const save = async () => {
    if (!editData.name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const body = { name: editData.name, email: editData.email, groupId: editData.groupId ? Number(editData.groupId) : undefined, isBarber: editData.isBarber };
      if (editData.password) body.password = editData.password;
      const res = await fetch(`${BASE}/user/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro ao salvar'); }
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...body } : u));
      setEditing(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (user) => {
    try {
      await fetch(`${BASE}/user/${user.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } finally { setConfirm(null); }
  };

  const groupName = (id) => (groups.find(g => g.id === id || g.id === Number(id)) || {}).name || '—';

  return (
    <Layout title="Lista de Usuários">
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
        <div className="search-wrap" style={{ flex: 1 }}>
          <FiSearch size={14} />
          <input className="search-input" placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && filtered.length === 0 && <div className="empty-state"><p>Nenhum usuário encontrado</p></div>}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Usuário</th><th>E-mail</th><th>Grupo</th><th>Barbeiro</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {u.photo
                        ? <img src={u.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                        : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--background)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiUser size={16} color="var(--color-muted)" /></div>
                      }
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-muted)' }}>{u.email}</td>
                  <td>{groupName(u.groupId)}</td>
                  <td><span className={`badge ${u.isBarber ? 'badge-blue' : 'badge-gray'}`}>{u.isBarber ? 'Sim' : 'Não'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(u)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(u)}><FiTrash2 size={14} /></button>
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
            <div className="modal-header"><h3>Editar Usuário</h3><button className="modal-close" onClick={() => setEditing(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
              <div className="form-field"><label className="form-label">Nome</label><input className="form-input" value={editData.name} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="form-field"><label className="form-label">E-mail</label><input className="form-input" type="email" value={editData.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} /></div>
              <div className="form-field"><label className="form-label">Nova Senha (opcional)</label><input className="form-input" type="password" placeholder="Deixe em branco para manter" value={editData.password} onChange={e => setEditData(p => ({ ...p, password: e.target.value }))} /></div>
              <div className="form-field">
                <label className="form-label">Grupo</label>
                <select className="form-input" value={editData.groupId} onChange={e => setEditData(p => ({ ...p, groupId: e.target.value }))}>
                  <option value="">Sem grupo</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="isBarber" checked={editData.isBarber} onChange={e => setEditData(p => ({ ...p, isBarber: e.target.checked }))} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                <label htmlFor="isBarber" className="form-label" style={{ margin: 0 }}>É barbeiro</label>
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
            <div className="modal-header"><h3>Excluir usuário?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-muted)', marginBottom: '1.25rem' }}>Deseja excluir <strong style={{ color: 'var(--color)' }}>{confirm.name}</strong>? Esta ação não pode ser desfeita.</p>
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
