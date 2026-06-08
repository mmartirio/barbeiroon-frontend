import { useState, useEffect, useCallback } from 'react';
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiCloseLine, RiSearchLine, RiShieldUserLine } from 'react-icons/ri';
import { useGestorAuth } from '../../context/GestorAuthContext';

const EMPTY_FORM = { name: '', email: '', password: '', isActive: true };

export default function Admins() {
  const { authFetch } = useGestorAuth();
  const [admins,  setAdmins]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [modal,   setModal]   = useState(null); // null | { mode: 'create' | 'edit', data }
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [confirm, setConfirm] = useState(null); // admin to delete

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/gestor/admin-users');
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setModal({ mode: 'create' });
  }

  function openEdit(admin) {
    setForm({ name: admin.name, email: admin.email, password: '', isActive: admin.isActive });
    setError('');
    setModal({ mode: 'edit', id: admin.id });
  }

  function set(field) { return e => setForm(f => ({ ...f, [field]: field === 'isActive' ? e.target.value === 'true' : e.target.value })); }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = { name: form.name, email: form.email, isActive: form.isActive };
      if (form.password) body.password = form.password;
      if (modal.mode === 'create') {
        if (!form.password) { setError('Senha obrigatória para novo administrador.'); setSaving(false); return; }
        body.password = form.password;
      }
      const url    = modal.mode === 'create' ? '/api/gestor/admin-users' : `/api/gestor/admin-users/${modal.id}`;
      const method = modal.mode === 'create' ? 'POST' : 'PUT';
      const res    = await authFetch(url, { method, body: JSON.stringify(body) });
      const data   = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar.');
      setModal(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm) return;
    try {
      const res  = await authFetch(`/api/gestor/admin-users/${confirm.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao excluir.');
      setConfirm(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = admins.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <RiShieldUserLine size={20} color="var(--accent)" />
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Administradores</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <RiAddLine size={15} /> Novo admin
        </button>
      </div>

      <div className="search-wrap" style={{ maxWidth: 320 }}>
        <RiSearchLine size={15} />
        <input className="search-input" placeholder="Buscar por nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="empty-state">Nenhum administrador encontrado.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Status</th>
                <th>Tipo</th>
                <th>Criado em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(admin => (
                <tr key={admin.id}>
                  <td data-label="Nome" style={{ fontWeight: 500 }}>{admin.name}</td>
                  <td data-label="E-mail" style={{ color: 'var(--color-muted)' }}>{admin.email}</td>
                  <td data-label="Status">
                    <span className={`badge ${admin.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {admin.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td data-label="Tipo">
                    {admin.isBootstrap
                      ? <span className="badge badge-amber">Bootstrap</span>
                      : <span className="badge badge-blue">Admin</span>}
                  </td>
                  <td data-label="Criado em" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                    {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td data-label="">
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-icon btn-xs" title="Editar" onClick={() => openEdit(admin)}>
                        <RiEditLine size={14} />
                      </button>
                      <button className="btn btn-danger btn-icon btn-xs" title="Excluir" onClick={() => setConfirm(admin)}>
                        <RiDeleteBinLine size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box">
            <div className="modal-header">
              <h3>{modal.mode === 'create' ? 'Novo administrador' : 'Editar administrador'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><RiCloseLine size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Nome</label>
                  <input className="form-input" type="text" value={form.name} onChange={set('name')} required placeholder="Nome completo" />
                </div>
                <div className="form-group">
                  <label className="form-label">E-mail</label>
                  <input className="form-input" type="email" value={form.email} onChange={set('email')} required placeholder="email@exemplo.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">{modal.mode === 'create' ? 'Senha' : 'Nova senha (deixe em branco para manter)'}</label>
                  <input className="form-input" type="password" value={form.password} onChange={set('password')} placeholder="Mínimo 6 caracteres" required={modal.mode === 'create'} />
                </div>
                {modal.mode === 'edit' && (
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={String(form.isActive)} onChange={set('isActive')}>
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>Excluir administrador</h3>
              <button className="modal-close" onClick={() => setConfirm(null)}><RiCloseLine size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem' }}>
                Tem certeza que deseja excluir <strong>{confirm.name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancelar</button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
