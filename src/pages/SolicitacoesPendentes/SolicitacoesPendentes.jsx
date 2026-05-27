import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';

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
  const [y, m, d] = v.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
};

export default function SolicitacoesPendentes() {
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [acting,   setActing]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointment/requests/pending/own', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setRequests(d.requests || d.data || []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (id, action) => {
    setActing(id);
    try {
      await fetch(`/api/appointment/requests/${id}/${action}`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` } });
      setRequests(prev => prev.filter(r => r.id !== id));
    } finally { setActing(null); }
  };

  return (
    <Layout title="Solicitações Pendentes">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          <FiRefreshCw size={14} /> Atualizar
        </button>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && requests.length === 0 && (
        <div className="empty-state"><p>Nenhuma solicitação pendente</p></div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {requests.map(r => (
          <div key={r.id} className="card" style={{ borderColor: 'var(--warning)', borderWidth: 1 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <span className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>AGUARDANDO APROVAÇÃO</span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem 1.5rem', marginTop: '0.25rem' }}>
                    <div><p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Telefone</p><p style={{ fontWeight: 600 }}>{fmtPhone(r.customerPhone)}</p></div>
                    <div><p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Serviço</p><p style={{ fontWeight: 600 }}>{r.serviceName || '—'}</p></div>
                    <div><p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Data</p><p>{fmtDate(r.appointmentDate)}</p></div>
                    <div><p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>Hora</p><p>{r.appointmentTime?.slice(0,5) || '—'}</p></div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button className="btn btn-success btn-sm" onClick={() => act(r.id, 'approve')} disabled={acting === r.id}>
                    <FiCheck size={14} /> Aprovar
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => act(r.id, 'reject')} disabled={acting === r.id}>
                    <FiX size={14} /> Recusar
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
