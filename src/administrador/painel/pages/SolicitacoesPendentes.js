import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import { useAuth } from '../../../hooks/useAuth';
import './SolicitacoesPendentes.css';
import { FiCheck, FiX, FiRefreshCw, FiClock } from 'react-icons/fi';

const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const SolicitacoesPendentes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [feedback, setFeedback] = useState(null);
  const pollingRef = useRef(null);

  const token = () => sessionStorage.getItem('token');

  const loadRequests = useCallback(async () => {
    try {
      const isAdmin = !!user?.permissions?.canViewAppointments;
      const url = isAdmin
        ? '/api/appointment/requests/pending'
        : '/api/appointment/requests/pending/own';
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setRequests(data.requests || []);
      }
    } catch {
      // ignore polling errors
    } finally {
      setLoading(false);
    }
  }, [user?.permissions?.canViewAppointments]);

  useEffect(() => {
    loadRequests();
    pollingRef.current = setInterval(loadRequests, 15000);
    return () => clearInterval(pollingRef.current);
  }, [loadRequests]);

  const handleDecision = async (requestId, approve) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      const endpoint = approve ? 'approve' : 'reject';
      await fetch(`/api/appointment/requests/${requestId}/${endpoint}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token()}` },
      });
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setFeedback({ type: approve ? 'success' : 'info', message: approve ? 'Agendamento aprovado!' : 'Agendamento recusado.' });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({ type: 'error', message: 'Erro ao processar solicitação.' });
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified">
        <div className="solicit-container">
          <div className="solicit-header">
            <div>
              <button type="button" className="solicit-back" onClick={() => navigate(-1)}>← Voltar</button>
              <h1 className="solicit-title">Solicitações Pendentes</h1>
            </div>
            <button
              type="button"
              className="solicit-refresh"
              onClick={() => { setLoading(true); loadRequests(); }}
              title="Atualizar"
            >
              <FiRefreshCw size={16} />
            </button>
          </div>

          {feedback && (
            <div className={`solicit-feedback solicit-feedback--${feedback.type}`}>
              {feedback.message}
            </div>
          )}

          {loading ? (
            <div className="solicit-loading">Carregando solicitações...</div>
          ) : requests.length === 0 ? (
            <div className="solicit-empty">
              <FiClock size={40} className="solicit-empty-icon" />
              <p>Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="solicit-list">
              {requests.map((request) => (
                <div key={request.id} className="solicit-card">
                  <div className="solicit-card-badge">
                    <FiClock size={13} /> Aguardando aprovação
                  </div>

                  <div className="solicit-card-body">
                    <div className="solicit-card-row">
                      <span className="solicit-card-label">Cliente</span>
                      <span className="solicit-card-value">{request.customerPhone || request.customerName || '—'}</span>
                    </div>
                    <div className="solicit-card-row">
                      <span className="solicit-card-label">Serviço</span>
                      <span className="solicit-card-value">{request.serviceName || '—'}</span>
                    </div>
                    <div className="solicit-card-row">
                      <span className="solicit-card-label">Profissional</span>
                      <span className="solicit-card-value">{request.professionalName || '—'}</span>
                    </div>
                    <div className="solicit-card-row">
                      <span className="solicit-card-label">Data</span>
                      <span className="solicit-card-value">{formatDate(request.appointmentDate)}</span>
                    </div>
                    <div className="solicit-card-row">
                      <span className="solicit-card-label">Horário</span>
                      <span className="solicit-card-value">{request.appointmentTime || '—'}</span>
                    </div>
                    <div className="solicit-card-row">
                      <span className="solicit-card-label">Duração</span>
                      <span className="solicit-card-value">{request.durationMinutes ? `${request.durationMinutes} min` : '—'}</span>
                    </div>
                    {request.notes && (
                      <div className="solicit-card-row">
                        <span className="solicit-card-label">Obs.</span>
                        <span className="solicit-card-value">{request.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="solicit-card-actions">
                    <button
                      type="button"
                      className="solicit-btn solicit-btn--reject"
                      onClick={() => handleDecision(request.id, false)}
                      disabled={processingIds.has(request.id)}
                    >
                      <FiX size={16} /> Recusar
                    </button>
                    <button
                      type="button"
                      className="solicit-btn solicit-btn--approve"
                      onClick={() => handleDecision(request.id, true)}
                      disabled={processingIds.has(request.id)}
                    >
                      <FiCheck size={16} /> Aprovar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SolicitacoesPendentes;
