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
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao carregar agendamentos');
      }
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

  const handleAppointmentAction = async (apptId, actionType) => {
    const isCancel = actionType === 'cancel';
    const confirmText = isCancel
      ? 'Deseja cancelar este agendamento?'
      : 'Deseja encerrar este atendimento?';
    if (!window.confirm(confirmText)) return;
    setAppointmentsError('');
    setAppointmentsSuccess('');
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/appointment/own/${apptId}/${actionType}`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao atualizar agendamento');
      }
      setAppointments((prev) => prev.filter((item) => item.id !== apptId));
      setAppointmentsSuccess(data.message || 'Agendamento atualizado com sucesso');
    } catch (err) {
      setAppointmentsError(err.message || 'Erro ao atualizar agendamento');
    }
  };

  return (
    <div className="barber-appointments-section">
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
      {appointmentsError && <div className="alert-error" role="alert">{appointmentsError}</div>}
      {appointmentsSuccess && <div className="alert-success" role="status">{appointmentsSuccess}</div>}
      {appointmentsLoading && <div className="barber-appointments-loading">Carregando agendamentos...</div>}
      {!appointmentsLoading && appointments.length === 0 && (
        <div className="barber-appointments-empty">Nenhum agendamento encontrado para este dia.</div>
      )}
      {!appointmentsLoading && appointments.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="client-list-table">
            <thead>
              <tr>
                <th>Horario</th>
                <th>Cliente</th>
                <th>Servico</th>
                <th>Telefone</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt) => (
                <tr key={appt.id}>
                  <td>{appt.appointmentTime || '--:--'}</td>
                  <td>{appt.customer?.name || 'Cliente'}</td>
                  <td>{appt.service?.name || 'Servico'}</td>
                  <td>{appt.customer?.phone || appt.customerPhone || '-'}</td>
                  <td>
                    <div className="client-list-actions">
                      <button
                        type="button"
                        className="client-action-btn delete"
                        onClick={() => handleAppointmentAction(appt.id, 'cancel')}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="client-action-btn edit"
                        onClick={() => handleAppointmentAction(appt.id, 'close')}
                      >
                        Encerrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BarberAppointmentsPanel;
