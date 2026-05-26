import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const BASE = '/api';

const ALL_PERMS = [
  { key: 'canViewCustomers',       label: 'Ver clientes' },
  { key: 'canCreateCustomer',      label: 'Cadastrar clientes' },
  { key: 'canEditCustomer',        label: 'Editar clientes' },
  { key: 'canDeleteCustomer',      label: 'Excluir clientes' },
  { key: 'canViewAppointments',    label: 'Ver agendamentos' },
  { key: 'canCreateAppointment',   label: 'Criar agendamentos' },
  { key: 'canEditAppointment',     label: 'Editar agendamentos' },
  { key: 'canCancelAppointment',   label: 'Cancelar agendamentos' },
  { key: 'canViewServices',        label: 'Ver serviços' },
  { key: 'canCreateService',       label: 'Cadastrar serviços' },
  { key: 'canEditService',         label: 'Editar serviços' },
  { key: 'canDeleteService',       label: 'Excluir serviços' },
  { key: 'canViewUsers',           label: 'Ver usuários' },
  { key: 'canCreateUser',          label: 'Cadastrar usuários' },
  { key: 'canEditUser',            label: 'Editar usuários' },
  { key: 'canDeleteUser',          label: 'Excluir usuários' },
  { key: 'canViewGroups',          label: 'Ver grupos' },
  { key: 'canManageGroups',        label: 'Gerenciar grupos' },
  { key: 'canViewReports',         label: 'Ver relatórios' },
  { key: 'canViewPromotions',      label: 'Ver promoções' },
  { key: 'canManagePromotions',    label: 'Gerenciar promoções' },
  { key: 'canManageAccount',       label: 'Gerenciar conta' },
  { key: 'canManageAgenda',        label: 'Gerenciar agenda' },
  { key: 'canManageCustomerScreen',label: 'Tela do cliente' },
];

const emptyPerms = () => Object.fromEntries(ALL_PERMS.map(p => [p.key, false]));

export default function Grupo() {
  const [groups,  setGroups]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState({ name: '', permissions: emptyPerms() });
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/group`, { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setGroups(d.groups || d.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditing('new');
    setForm({ name: '', permissions: emptyPerms() });
    setError('');
  };

  const openEdit = (g) => {
    setEditing(g);
    const perms = { ...emptyPerms(), ...(g.permissions || {}) };
    setForm({ name: g.name || '', permissions: perms });
    setError('');
  };

  const togglePerm = (key) => setForm(p => ({ ...p, permissions: { ...p.permissions, [key]: !p.permissions[key] } }));

  const save = async () => {
    if (!form.name.trim()) { setError('Nome obrigatório'); return; }
    setSaving(true);
    try {
      const isNew = editing === 'new';
      const url   = isNew ? `${BASE}/group` : `${BASE}/group/${editing.id}`;
      const res   = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ name: form.name, permissions: form.permissions }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro ao salvar'); }
      await load();
      setEditing(null);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (g) => {
    try {
      await fetch(`${BASE}/group/${g.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
      setGroups(prev => prev.filter(gr => gr.id !== g.id));
    } finally { setConfirm(null); }
  };

  const permCount = (g) => Object.values(g.permissions || {}).filter(Boolean).length;

  return (
    <Layout title="Grupos de Permissão">
      <div style={{ marginBottom: '1rem' }}>
        <button className="btn btn-primary btn-sm" onClick={openCreate}><FiPlus size={14} style={{ marginRight: 4 }} />Novo Grupo</button>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && groups.length === 0 && <div className="empty-state"><p>Nenhum grupo cadastrado</p></div>}

      {!loading && groups.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Nome</th><th>Permissões ativas</th><th>Ações</th></tr></thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id}>
                  <td><span style={{ fontWeight: 600 }}>{g.name}</span></td>
                  <td><span className="badge badge-blue">{permCount(g)} de {ALL_PERMS.length}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(g)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => setConfirm(g)}><FiTrash2 size={14} /></button>
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
          <div className="modal-box" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing === 'new' ? 'Novo Grupo' : 'Editar Grupo'}</h3>
              <button className="modal-close" onClick={() => setEditing(null)}><FiX size={18} /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
              <div className="form-field"><label className="form-label">Nome do grupo</label><input className="form-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>

              <p style={{ fontWeight: 600, marginBottom: '0.75rem', marginTop: '0.5rem' }}>Permissões</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem', maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                {ALL_PERMS.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <input type="checkbox" checked={!!form.permissions[p.key]} onChange={() => togglePerm(p.key)} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
                    {p.label}
                  </label>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
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
            <div className="modal-header"><h3>Excluir grupo?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
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
