import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiSearch, FiX, FiUser } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const compressToBase64 = (file, maxBytes = 100_000) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 500;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
          else                { width  = Math.round((width  * MAX_DIM) / height); height = MAX_DIM; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas não suportado')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.7;
        let result;
        do {
          result = canvas.toDataURL('image/jpeg', quality);
          quality -= 0.1;
        } while (result.length > maxBytes * 1.37 && quality > 0.05);
        resolve(result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

export default function UsuarioLista() {
  const [users,    setUsers]    = useState([]);
  const [groups,   setGroups]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [editing,  setEditing]  = useState(null);
  const [editData, setEditData] = useState({ name: '', email: '', password: '', groupId: '', isBarber: false });
  const [saving,      setSaving]      = useState(false);
  const [confirm,     setConfirm]     = useState(null);
  const [error,       setError]       = useState('');
  const [editPhoto,   setEditPhoto]   = useState(null);
  const [editPreview, setEditPreview] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [uRes, gRes] = await Promise.all([
        fetch('/api/user/users', { headers: { Authorization: `Bearer ${tok()}` } }),
        fetch('/api/group?limit=100', { headers: { Authorization: `Bearer ${tok()}` } }),
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
    return (u.name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q);
  });

  const startEdit = (u) => {
    setEditing(u);
    setEditData({ name: u.name||'', email: u.email||'', password: '', groupId: String(u.groupId||''), isBarber: !!u.isBarber });
    setEditPhoto(null);
    setEditPreview('');
    setError('');
  };

  const setE = (k, v) => setEditData(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!editData.name.trim()) { setError('Nome obrigatório'); return; }
    if (editData.password && editData.password.length < 6) { setError('Senha deve ter mínimo 6 caracteres'); return; }
    setSaving(true);
    try {
      let photoFields = {};
      if (editPhoto) {
        const base64 = await compressToBase64(editPhoto);
        photoFields = { profileImageBase64: base64, profileImageContentType: editPhoto.type || 'image/jpeg' };
      }
      const body = { name: editData.name, email: editData.email, isBarber: editData.isBarber, ...(editData.groupId ? { groupId: Number(editData.groupId) } : {}), ...photoFields };
      const res  = await fetch(`/api/user/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro'); }
      if (editData.password) {
        await fetch(`/api/user/${editing.id}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify({ newPassword: editData.password }),
        });
      }
      const imageUrl = editPhoto ? editPreview : (editing.imageUrl || null);
      setUsers(prev => prev.map(u => u.id === editing.id ? { ...u, ...body, imageUrl } : u));
      setEditing(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (u) => {
    try {
      await fetch(`/api/user/${u.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } finally { setConfirm(null); }
  };

  const groupName = (id) => (groups.find(g => g.id === id || g.id === Number(id)) || {}).name || '—';

  const Avatar = ({ u }) => u.imageUrl || u.photo
    ? <img src={u.imageUrl || u.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
    : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{(u.name||'?')[0].toUpperCase()}</div>;

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
                      <Avatar u={u} />
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                  <td>{groupName(u.groupId)}</td>
                  <td><span className={`badge ${u.isBarber ? 'badge-blue' : 'badge-gray'}`}>{u.isBarber ? 'Sim' : 'Não'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(u)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirm(u)}><FiTrash2 size={14} /></button>
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
              {error && <div className="alert alert-error">{error}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: '1rem' }}>
                <label htmlFor="edit-photo" style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  {editPreview || editing.imageUrl || editing.photo
                    ? <img src={editPreview || editing.imageUrl || editing.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.5rem' }}>{(editing.name||'?')[0].toUpperCase()}</span>}
                </label>
                <input id="edit-photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  const f = e.target.files && e.target.files[0];
                  if (f) { setEditPhoto(f); setEditPreview(URL.createObjectURL(f)); }
                }} />
                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Clique na foto para alterar</span>
                {editPreview && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditPhoto(null); setEditPreview(''); }}>Remover nova foto</button>}
              </div>
              <div className="form-group"><label className="form-label">Nome</label><input className="form-input" value={editData.name} onChange={e => setE('name', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">E-mail</label><input className="form-input" type="email" value={editData.email} onChange={e => setE('email', e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Nova senha (deixe em branco para não alterar)</label><input className="form-input" type="password" placeholder="Mín. 6 caracteres" value={editData.password} onChange={e => setE('password', e.target.value)} /></div>
              <div className="form-group">
                <label className="form-label">Grupo</label>
                <select className="form-input" value={editData.groupId} onChange={e => setE('groupId', e.target.value)}>
                  <option value="">Sem grupo</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="isBarber" checked={editData.isBarber} onChange={e => setE('isBarber', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                <label htmlFor="isBarber" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>É barbeiro</label>
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
            <div className="modal-header"><h3>Excluir usuário?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
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
