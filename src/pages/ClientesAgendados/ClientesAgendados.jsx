import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiRefreshCw, FiSearch, FiX } from 'react-icons/fi';
import s from './ClientesAgendados.module.css';

const tok = () => sessionStorage.getItem('token');
const fmtD = (v) => { if (!v) return ''; const [y,m,d] = String(v).split('-'); return `${d}/${m}/${y}`; };

const STATUS = [
  { key: 'agendado',  label: 'Agendados',  cls: 'badge-blue'  },
  { key: 'concluido', label: 'Concluídos', cls: 'badge-green' },
  { key: 'cancelado', label: 'Cancelados', cls: 'badge-red'   },
];

export default function ClientesAgendados() {
  const [appointments, setAppointments]  = useState([]);
  const [loading,      setLoading]       = useState(true);
  const [refreshing,   setRefreshing]    = useState(false);
  const [search,       setSearch]        = useState('');
  const [status,       setStatus]        = useState('agendado');
  const [updatingId,   setUpdatingId]    = useState(null);
  const [cancelModal,  setCancelModal]   = useState({ open: false, item: null });
  const [cancelReason, setCancelReason]  = useState('');
  const [error,        setError]         = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch('/api/appointment/own?includeAll=true&includeTenant=true', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setAppointments(d.appointments || []);
    } catch { setError('Erro ao carregar agendamentos'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = appointments.filter(a => {
    const st = (a.status || 'agendado').toLowerCase();
    if (st !== status) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (a.customer?.name||'').toLowerCase().includes(q) || (a.customer?.phone||'').includes(q);
  });

  const close = async (id) => {
    setUpdatingId(id);
    try {
      await fetch(`/api/appointment/own/${id}/close`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` } });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido' } : a));
    } finally { setUpdatingId(null); }
  };

  const cancel = async () => {
    const { item } = cancelModal;
    if (!item) return;
    setUpdatingId(item.id);
    try {
      await fetch(`/api/appointment/own/${item.id}/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ reason: cancelReason }),
      });
      setAppointments(prev => prev.map(a => a.id === item.id ? { ...a, status: 'cancelado' } : a));
    } finally { setUpdatingId(null); setCancelModal({ open: false, item: null }); setCancelReason(''); }
  };

  return (
    <Layout title="Clientes Agendados">
      <div className={s.toolbar}>
        <div className={s.filters}>
          {STATUS.map(({ key, label, cls }) => (
            <button key={key} type="button" className={`${s.filterBtn} ${status === key ? s.filterActive : ''}`}
              style={status === key ? { background: `var(--${cls.replace('badge-','')})`, borderColor: 'transparent' } : {}}
              onClick={() => setStatus(key)}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <FiSearch size={14} />
            <input className="search-input" placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={refreshing}>
            <FiRefreshCw size={14} className={refreshing ? s.spin : ''} />
          </button>
        </div>
      </div>

      {error   && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {loading && <div className="empty-state"><p>Carregando...</p></div>}

      {!loading && filtered.length === 0 && (
        <div className="empty-state"><p>Nenhum agendamento {STATUS.find(x=>x.key===status)?.label.toLowerCase()}</p></div>
      )}

      {!loading && filtered.length > 0 && (
        <div className={s.list}>
          {filtered.map(a => (
            <div key={a.id} className="card" style={{ marginBottom: '0.75rem' }}>
              <div className={s.cardBody}>
                <div className={s.cardTop}>
                  <div>
                    <span className={s.clientName}>{a.customer?.name || 'Cliente'}</span>
                    <span className={s.clientPhone}>{a.customer?.phone || ''}</span>
                  </div>
                  <span className={`badge ${STATUS.find(x=>x.key===(a.status||'agendado'))?.cls || 'badge-gray'}`}>
                    {STATUS.find(x=>x.key===(a.status||'agendado'))?.label || a.status}
                  </span>
                </div>
                <div className={s.cardDetails}>
                  <span>✂️ {a.service?.name || '—'}</span>
                  <span>👤 {a.professional?.name || a.professionalName || '—'}</span>
                  <span>📅 {fmtD(a.appointmentDate)} às {a.appointmentTime || '—'}</span>
                </div>
                {(a.status === 'agendado' || a.status === 'pending' || !a.status) && (
                  <div className={s.cardActions}>
                    <button className="btn btn-success btn-sm" onClick={() => close(a.id)} disabled={updatingId === a.id}>Concluir</button>
                    <button className="btn btn-danger btn-sm"  onClick={() => setCancelModal({ open: true, item: a })} disabled={updatingId === a.id}>Cancelar</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelModal.open && (
        <div className="modal-overlay" onClick={() => setCancelModal({ open: false, item: null })}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancelar Agendamento</h3>
              <button className="modal-close" onClick={() => setCancelModal({ open: false, item: null })}><FiX size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="form-field">
                <label className="form-label">Motivo do cancelamento</label>
                <textarea className="form-input" rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Informe o motivo..." />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setCancelModal({ open: false, item: null })}>Voltar</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={cancel} disabled={updatingId === cancelModal.item?.id}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
