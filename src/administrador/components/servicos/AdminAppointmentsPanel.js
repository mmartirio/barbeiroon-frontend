import React, { useEffect, useState } from 'react';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const formatPrice = (value) => {
  const numeric = Number(value || 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numeric);
};

const AdminAppointmentsPanel = () => {
  const [groups, setGroups] = useState([]);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appointmentDate) {
      setAppointmentDate(getTodayDateString());
    }
  }, [appointmentDate]);

  const loadAppointments = async (dateValue) => {
    setLoading(true);
    setError('');
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/appointment/all-grouped?date=${encodeURIComponent(dateValue)}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Erro ao carregar agendamentos');
      }
      setGroups(data.groups || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appointmentDate) {
      loadAppointments(appointmentDate);
    }
  }, [appointmentDate]);


  return (
    <div className="barber-appointments-section">
      <div className="barber-appointments-header">
        <h3>Agendamentos por barbeiro</h3>
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

      {error && <div className="alert-error" role="alert">{error}</div>}
      {loading && <div className="barber-appointments-loading">Carregando agendamentos...</div>}
      {!loading && groups.length === 0 && (
        <div className="barber-appointments-empty">Nenhum agendamento encontrado para este dia.</div>
      )}

      {!loading && groups.length > 0 && (
        <div>
          {groups.map((group) => (
            <div key={group.professionalId || group.professionalName} style={{ marginBottom: 24 }}>
              <h4 className="admin-appointments-title">{group.professionalName || 'Profissional'}</h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="client-list-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Data</th>
                      <th>Horario</th>
                      <th>Servico</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.appointments.map((appt) => (
                      <tr key={appt.id}>
                        <td>{appt.customer?.name || 'Cliente'}</td>
                        <td>{formatDate(appt.appointmentDate)}</td>
                        <td>{appt.appointmentTime || '--:--'}</td>
                        <td>{appt.service?.name || 'Servico'}</td>
                        <td>{formatPrice(appt.service?.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAppointmentsPanel;
