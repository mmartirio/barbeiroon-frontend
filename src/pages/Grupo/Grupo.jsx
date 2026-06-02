import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiRefreshCw, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const PERMISSOES = [
  { categoria: 'Usuário', perms: [
    { key: 'canViewUsers',   label: 'Visualizar' },
    { key: 'canCreateUser',  label: 'Criar' },
    { key: 'canEditUser',    label: 'Editar' },
    { key: 'canDeleteUser',  label: 'Excluir' },
  ]},
  { categoria: 'Grupos', perms: [
    { key: 'canManageGroups', label: 'Gerenciar grupos' },
  ]},
  { categoria: 'Clientes', perms: [
    { key: 'canViewCustomers',   label: 'Visualizar' },
    { key: 'canCreateCustomer',  label: 'Criar' },
    { key: 'canEditCustomer',    label: 'Editar' },
    { key: 'canDeleteCustomer',  label: 'Excluir' },
  ]},
  { categoria: 'Agendamento', perms: [
    { key: 'canViewAppointments',    label: 'Visualizar' },
    { key: 'canCreateAppointment',   label: 'Criar' },
    { key: 'canEditAppointment',     label: 'Permitir editar agendados' },
    { key: 'canCancelAppointment',   label: 'Permitir cancelar agendamentos' },
    { key: 'canDeleteAppointment',   label: 'Excluir (remover permanentemente)' },
    { key: 'maxAppointmentsPerDay',  label: 'Limite de agendamentos por dia por profissional', type: 'number', placeholder: 'Sem limite' },
  ]},
  { categoria: 'Conta', perms: [
    { key: 'canManageTenant', label: 'Gerenciar conta' },
  ]},
  { categoria: 'Relatório', perms: [
    { key: 'canViewReports', label: 'Visualizar relatórios' },
  ]},
  { categoria: 'Serviços', perms: [
    { key: 'canViewServices',    label: 'Visualizar' },
    { key: 'canManageServices',  label: 'Gerenciar' },
  ]},
  { categoria: 'Profissionais', perms: [
    { key: 'canViewProfessionals',    label: 'Visualizar' },
    { key: 'canManageProfessionals',  label: 'Gerenciar' },
  ]},
  { categoria: 'Agenda', perms: [
    { key: 'canViewAgenda',    label: 'Visualizar' },
    { key: 'canManageAgenda',  label: 'Gerenciar' },
  ]},
  { categoria: 'Dashboard', perms: [
    { key: 'canViewDashboard', label: 'Visualizar dashboard' },
  ]},
];

const emptyPerms = () => {
  const p = {};
  PERMISSOES.forEach(cat => cat.perms.forEach(perm => {
    p[perm.key] = perm.type === 'number' ? '' : false;
  }));
  return p;
};

export default function Grupo() {
  const [groups,      setGroups]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [confirm,     setConfirm]     = useState(null);
  const [groupName,   setGroupName]   = useState('');
  const [perms,       setPerms]       = useState(emptyPerms());
  const [editingId,   setEditingId]   = useState(null);

  const selectedCount = useMemo(() => {
    let count = 0;
    PERMISSOES.forEach(cat => cat.perms.forEach(perm => {
      if (perm.type !== 'number' && perms[perm.key]) count++;
    }));
    return count;
  }, [perms]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/group?limit=50', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setGroups(d.groups || d.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const togglePerm = (key) => setPerms(p => ({ ...p, [key]: !p[key] }));

  const resetForm = () => {
    setGroupName('');
    setPerms(emptyPerms());
    setEditingId(null);
    setError('');
    setSuccess('');
  };

  const startEdit = (g) => {
    setEditingId(g.id);
    setGroupName(g.name || '');
    const next = emptyPerms();
    PERMISSOES.forEach(cat => cat.perms.forEach(perm => {
      if (perm.type === 'number') {
        next[perm.key] = g[perm.key] != null ? String(g[perm.key]) : '';
      } else {
        next[perm.key] = !!g[perm.key];
      }
    }));
    setPerms(next);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    if (!groupName.trim()) { setError('Nome do grupo obrigatório'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      // Converte campos numéricos de string para number|null antes de enviar
      const payload = { name: groupName.trim(), description: `Grupo ${groupName.trim()}` };
      PERMISSOES.forEach(cat => cat.perms.forEach(perm => {
        if (perm.type === 'number') {
          const v = String(perms[perm.key] || '').trim();
          payload[perm.key] = v === '' ? null : Number(v);
        } else {
          payload[perm.key] = perms[perm.key];
        }
      }));

      const url = editingId ? `/api/group/${editingId}` : '/api/group';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(payload),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao salvar');
      setSuccess(editingId ? 'Grupo atualizado com sucesso!' : 'Grupo criado com sucesso!');
      resetForm();
      await load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const del = async (g) => {
    try {
      await fetch(`/api/group/${g.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
      setGroups(prev => prev.filter(x => x.id !== g.id));
      if (editingId === g.id) resetForm();
    } finally { setConfirm(null); }
  };

  return (
    <Layout title="Grupos de Permissões">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left: form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-body">
              <h3 style={{ marginBottom: '1rem' }}>{editingId ? 'Editar Grupo' : 'Criar Grupo'}</h3>
              {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
              {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
              <div className="form-group">
                <label className="form-label">Nome do Grupo *</label>
                <input className="form-input" placeholder="Ex: Atendente, Barbeiro, Gerente" value={groupName} onChange={e => setGroupName(e.target.value)} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>{selectedCount} permissão(ões) selecionada(s)</p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {editingId && <button className="btn btn-ghost" style={{ flex: 1 }} onClick={resetForm}>Cancelar</button>}
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={save} disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Atualizar Grupo' : 'Criar Grupo'}</button>
              </div>
            </div>
          </div>

          {/* Permission categories */}
          {PERMISSOES.map(cat => (
            <div key={cat.categoria} className="card" style={{ borderColor: 'var(--accent)', borderWidth: 1 }}>
              <div className="card-body">
                <h4 style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>{cat.categoria}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {cat.perms.map(perm => (
                    perm.type === 'number' ? (
                      <div key={perm.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.875rem', flex: 1 }}>{perm.label}</span>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          placeholder={perm.placeholder}
                          value={perms[perm.key]}
                          onChange={e => setPerms(p => ({ ...p, [perm.key]: e.target.value }))}
                          style={{ width: 90, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0.3rem 0.5rem', color: 'var(--color)', fontSize: '0.875rem', textAlign: 'center' }}
                        />
                      </div>
                    ) : (
                      <label key={perm.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '0.4rem 0' }}>
                        <span style={{ fontSize: '0.875rem' }}>{perm.label}</span>
                        <input type="checkbox" checked={!!perms[perm.key]} onChange={() => togglePerm(perm.key)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                      </label>
                    )
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: list */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Grupos Criados</h3>
              <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}><FiRefreshCw size={14} /></button>
            </div>

            {loading && <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>}
            {!loading && groups.length === 0 && <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Nenhum grupo encontrado</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {groups.map(g => (
                <div key={g.id} style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', padding: '0.75rem', borderLeft: '3px solid var(--accent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 700 }}>{g.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.1rem' }}>ID: {g.id}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(g)}><FiEdit2 size={14} /></button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirm(g)}><FiTrash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Excluir grupo?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-muted)' }}>Excluir <strong style={{ color: 'var(--color)' }}>{confirm.name}</strong>?</p>
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
