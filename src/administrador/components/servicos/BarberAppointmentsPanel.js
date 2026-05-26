import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const BarberAppointmentsPanel = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState('');
  const [appointmentsSuccess, setAppointmentsSuccess] = useState('');

  const [statusFilter, setStatusFilter] = useState('agendado');

  // Modal de cancelamento
  const [cancelModal, setCancelModal] = useState({ open: false, apptId: null });
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    if (!appointmentDate) {
      setAppointmentDate(getTodayDateString());
    }
  }, [appointmentDate]);

  const loadAppointments = async (dateValue) => {
    setAppointmentsLoading(true);
    setAppointmentsError('');
    setAppointmentsSuccess('');
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/appointment/own?date=${encodeURIComponent(dateValue)}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Erro ao carregar agendamentos');
      setAppointments(data.appointments || []);
    } catch (err) {
      setAppointmentsError(err.message || 'Erro ao carregar agendamentos');
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentDate && user?.id) {
      loadAppointments(appointmentDate);
    }
  }, [appointmentDate, user?.id]);

  const openCancelModal = (apptId) => {
    setCancelReason('');
    setCancelModal({ open: true, apptId });
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, apptId: null });
    setCancelReason('');
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelLoading(true);
    setAppointmentsError('');
    setAppointmentsSuccess('');
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/appointment/own/${cancelModal.apptId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason: cancelReason.trim() })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Erro ao cancelar agendamento');
      setAppointments((prev) => prev.filter((item) => item.id !== cancelModal.apptId));
      setAppointmentsSuccess(data.message || 'Agendamento cancelado com sucesso');
      closeCancelModal();
    } catch (err) {
      setAppointmentsError(err.message || 'Erro ao cancelar agendamento');
      closeCancelModal();
    } finally {
      setCancelLoading(false);
    }
  };

  const handleClose = async (apptId) => {
    if (!window.confirm('Deseja encerrar este atendimento?')) return;
    setAppointmentsError('');
    setAppointmentsSuccess('');
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/appointment/own/${apptId}/close`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Erro ao encerrar agendamento');
      setAppointments((prev) => prev.filter((item) => item.id !== apptId));
      setAppointmentsSuccess(data.message || 'Atendimento encerrado com sucesso');
    } catch (err) {
      setAppointmentsError(err.message || 'Erro ao encerrar agendamento');
    }
  };

  return (
    <div className="barber-appointments-section">
      {/* Modal de cancelamento com motivo */}
      {cancelModal.open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 420,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>Cancelar agendamento</h3>
            <p style={{ color: '#555', marginBottom: 16, fontSize: 14 }}>
              Informe o motivo do cancelamento. Ele será enviado ao cliente via WhatsApp.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Profissional indisponível, problema de saúde..."
              rows={4}
              style={{
                width: '100%', boxSizing: 'border-box', borderRadius: 8, border: '1px solid #ddd',
                padding: '10px 12px', fontSize: 14, resize: 'vertical', fontFamily: 'inherit'
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={closeCancelModal}
                disabled={cancelLoading}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: '1px solid #ddd',
                  background: '#f5f5f5', cursor: 'pointer', fontWeight: 500
                }}
              >
                Desistir
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!cancelReason.trim() || cancelLoading}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: cancelReason.trim() ? '#dc3545' : '#ccc',
                  color: '#fff', cursor: cancelReason.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 600
                }}
              >
                {cancelLoading ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="barber-appointments-header">
        <h3>Agendamentos do barbeiro</h3>
        <div className="barber-appointments-filters">
          <label>
            Dia
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="barber-appointments-today"
            onClick={() => setAppointmentDate(getTodayDateString())}
          >
            Hoje
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'agendado',  label: 'Agendados',  color: '#2563eb' },
          { key: 'concluido', label: 'Concluídos', color: '#16a34a' },
          { key: 'cancelado', label: 'Cancelados', color: '#dc2626' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            style={{
              padding: '6px 18px', borderRadius: 20, border: `2px solid ${color}`,
              background: statusFilter === key ? color : 'transparent',
              color: statusFilter === key ? '#fff' : color,
              fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {appointmentsError && <div className="alert-error" role="alert">{appointmentsError}</div>}
      {appointmentsSuccess && <div className="alert-success" role="status">{appointmentsSuccess}</div>}
      {appointmentsLoading && <div className="barber-appointments-loading">Carregando agendamentos...</div>}
      {!appointmentsLoading && (() => {
        const filtered = appointments.filter((a) => (a.status || 'agendado') === statusFilter);
        if (filtered.length === 0) {
          return <div className="barber-appointments-empty">Nenhum agendamento com status "{statusFilter}" neste dia.</div>;
        }
        return (
          <div style={{ overflowX: 'auto' }}>
            <table className="client-list-table">
              <thead>
                <tr>
                  <th>Horario</th>
                  <th>Cliente</th>
                  <th>Servico</th>
                  <th>Telefone</th>
                  {statusFilter === 'agendado' && <th></th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((appt) => (
                  <tr key={appt.id}>
                    <td>{appt.appointmentTime || '--:--'}</td>
                    <td>{appt.customer?.name || 'Cliente'}</td>
                    <td>{appt.service?.name || 'Servico'}</td>
                    <td>{appt.customer?.phone || appt.customerPhone || '-'}</td>
                    {statusFilter === 'agendado' && (
                      <td>
                        <div className="client-list-actions">
                          <button
                            type="button"
                            className="client-action-btn delete"
                            onClick={() => openCancelModal(appt.id)}
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            className="client-action-btn edit"
                            onClick={() => handleClose(appt.id)}
                          >
                            Encerrar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
};

export default BarberAppointmentsPanel;
