import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const fmtPhone = (p) => {
  if (!p) return '';
  const c = p.replace(/\D/g,'');
  if (c.length <= 2) return c;
  if (c.length <= 7) return `(${c.slice(0,2)}) ${c.slice(2)}`;
  return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`;
};

const fmtDate = (v) => {
  if (!v) return '—';
  try { const d = new Date(v + (v.includes('T') ? '' : 'T12:00:00')); return d.toLocaleDateString('pt-BR'); } catch { return v; }
};

const normalize = (a) => ({
  ...a,
  status: (a.status || '').toLowerCase().replace('concluido','completed').replace('cancelado','canceled').replace('agendado','scheduled').replace('pendente','pending'),
  customerName:   a.customerName   || a.customer?.name  || '—',
  customerPhone:  a.customerPhone  || a.customer?.phone || '',
  serviceName:    a.serviceName    || a.service?.name   || '—',
  professionalName: a.professionalName || a.professional?.name || '—',
  appointmentDate: a.appointmentDate || a.date || '',
  appointmentTime: a.appointmentTime || a.time || '',
});

const FILTERS = [
  { key: 'scheduled', label: 'Agendados',  badgeClass: 'badge-blue'  },
  { key: 'completed', label: 'Concluídos', badgeClass: 'badge-green' },
  { key: 'canceled',  label: 'Cancelados', badgeClass: 'badge-red'   },
];

const STATUS_BADGE = { scheduled: 'badge-blue', completed: 'badge-green', canceled: 'badge-red', pending: 'badge-amber' };
const STATUS_LABEL = { scheduled: 'Agendado', completed: 'Concluído', canceled: 'Cancelado', pending: 'Pendente' };

export default function ClientesAgendados() {
  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('scheduled');
  const [search,   setSearch]   = useState('');
  const [acting,   setActing]   = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [reason,   setReason]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointment/own?includeAll=true&includeTenant=true', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      const raw = d.appointments || d.data || [];
      setAll(raw.map(normalize).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = all.filter(a => {
    if (a.status !== filter && !(filter === 'scheduled' && a.status === 'pending')) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.customerName.toLowerCase().includes(q)
      || a.customerPhone.includes(q)
      || a.serviceName.toLowerCase().includes(q)
      || a.professionalName.toLowerCase().includes(q);
  });

  const conclude = async (a) => {
    setActing(a.id);
    try {
      await fetch(`/api/appointment/own/${a.id}/close`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` } });
      setAll(prev => prev.map(x => x.id === a.id ? { ...x, status: 'completed' } : x));
    } finally { setActing(null); }
  };

  const openCancel = (a) => { setCancelModal(a); setReason(''); };
  const confirmCancel = async () => {
    setActing(cancelModal.id);
    try {
      await fetch(`/api/appointment/own/${cancelModal.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ reason }),
      });
      setAll(prev => prev.map(x => x.id === cancelModal.id ? { ...x, status: 'canceled' } : x));
      setCancelModal(null);
    } finally { setActing(null); }
  };

  return (
    <Layout title="Clientes Agendados">
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <FiSearch size={14} />
          <input className="search-input" placeholder="Buscar cliente, serviço, profissional..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={load} title="Atualizar"><FiRefreshCw size={14} /></button>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && filtered.length === 0 && <div className="empty-state"><p>Nenhum agendamento encontrado</p></div>}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Cliente</th><th>Telefone</th><th>Serviço</th><th>Profissional</th><th>Data</th><th>Hora</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.customerName}</td>
                  <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{fmtPhone(a.customerPhone)}</td>
                  <td>{a.serviceName}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{a.professionalName}</td>
                  <td style={{ fontSize: '0.85rem' }}>{fmtDate(a.appointmentDate)}</td>
                  <td style={{ fontSize: '0.85rem' }}>{a.appointmentTime?.slice(0,5) || '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>{STATUS_LABEL[a.status] || a.status}</span></td>
                  <td>
                    {(a.status === 'scheduled' || a.status === 'pending') && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-success btn-sm" onClick={() => conclude(a)} disabled={acting === a.id}>Concluir</button>
                        <button className="btn btn-danger btn-sm"  onClick={() => openCancel(a)} disabled={acting === a.id}>Cancelar</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Cancelar agendamento</h3><button className="modal-close" onClick={() => setCancelModal(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Cancelar agendamento de <strong style={{ color: 'var(--color)' }}>{cancelModal.customerName}</strong>?</p>
              <div className="form-group">
                <label className="form-label">Motivo do cancelamento</label>
                <textarea className="form-input" rows={3} placeholder="Ex: Profissional indisponível..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setCancelModal(null)}>Desistir</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmCancel} disabled={acting === cancelModal?.id}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
