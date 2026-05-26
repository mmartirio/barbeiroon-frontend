import React, { useState, useEffect, useCallback, useRef } from 'react';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { FiRefreshCw, FiClock, FiCheck, FiX } from 'react-icons/fi';
import s from './SolicitacoesPendentes.module.css';

const tok = () => sessionStorage.getItem('token');
const fmtD = (v) => { if (!v) return ''; const [y,m,d] = String(v).split('-'); return `${d}/${m}/${y}`; };

export default function SolicitacoesPendentes() {
  const { user } = useAuth();
  const [requests,    setRequests]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [processingId,setProcessingId]= useState(null);
  const [feedback,    setFeedback]    = useState(null);
  const timerRef = useRef(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const isAdmin = !!user?.permissions?.canViewAppointments;
      const url = isAdmin ? '/api/appointment/requests/pending' : '/api/appointment/requests/pending/own';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      if (res.ok) setRequests(d.requests || []);
    } finally { setLoading(false); setRefreshing(false); }
  }, [user?.permissions?.canViewAppointments]);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 15000);
    return () => clearInterval(id);
  }, [load]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFeedback(null), 3000);
  };

  const decide = async (reqId, approve) => {
    setProcessingId(reqId);
    try {
      await fetch(`/api/appointment/requests/${reqId}/${approve ? 'approve' : 'reject'}`, {
        method: 'POST', headers: { Authorization: `Bearer ${tok()}` },
      });
      setRequests(prev => prev.filter(r => r.id !== reqId));
      showFeedback(approve ? 'success' : 'info', approve ? 'Agendamento aprovado!' : 'Agendamento recusado.');
    } catch { showFeedback('error', 'Erro ao processar solicitação.'); }
    finally { setProcessingId(null); }
  };

  return (
    <Layout title="Solicitações Pendentes" subtitle="Agendamentos fora do expediente aguardando aprovação">
      <div className={s.toolbar}>
        {feedback && <div className={`alert alert-${feedback.type === 'success' ? 'success' : feedback.type === 'error' ? 'error' : 'warning'}`}>{feedback.message}</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => load(true)} disabled={refreshing}>
            <FiRefreshCw size={14} className={refreshing ? s.spin : ''} /> Atualizar
          </button>
        </div>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}

      {!loading && requests.length === 0 && (
        <div className="empty-state">
          <FiClock size={36} style={{ opacity: 0.4 }} />
          <p>Nenhuma solicitação pendente</p>
        </div>
      )}

      {!loading && requests.length > 0 && (
        <div className={s.list}>
          {requests.map(r => (
            <div key={r.id} className={s.card}>
              <div className={s.badge}><FiClock size={12} /> AGUARDANDO APROVAÇÃO</div>
              <div className={s.body}>
                {[
                  ['Cliente',      r.customerPhone || r.customerName || '—'],
                  ['Serviço',      r.serviceName    || '—'],
                  ['Profissional', r.professionalName|| '—'],
                  ['Data',         fmtD(r.appointmentDate)],
                  ['Horário',      r.appointmentTime || '—'],
                  ['Duração',      r.durationMinutes ? `${r.durationMinutes} min` : '—'],
                ].map(([label, val]) => (
                  <div key={label} className={s.row}>
                    <span className={s.rowLabel}>{label}</span>
                    <span className={s.rowVal}>{val}</span>
                  </div>
                ))}
              </div>
              <div className={s.actions}>
                <button className={`btn btn-danger ${s.actBtn}`} onClick={() => decide(r.id, false)} disabled={processingId === r.id}><FiX size={15} /> Recusar</button>
                <button className={`btn btn-success ${s.actBtn}`} onClick={() => decide(r.id, true)}  disabled={processingId === r.id}><FiCheck size={15} /> Aprovar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
