import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import './NovoAgendamento.css';
import '../../../styles/variables.css';
import { FiSearch, FiX, FiCheck } from 'react-icons/fi';

const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const formatPrice = (value) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
};

const SearchModal = ({ title, items, onSelect, onClose, renderItem, searchKey = 'name' }) => {
  const [query, setQuery] = useState('');
  const filtered = items.filter((item) =>
    String(item[searchKey] || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="novo-ag-modal-overlay" onClick={onClose}>
      <div className="novo-ag-modal" onClick={(e) => e.stopPropagation()}>
        <div className="novo-ag-modal-header">
          <h3>{title}</h3>
          <button type="button" className="novo-ag-modal-close" onClick={onClose}><FiX size={20} /></button>
        </div>
        <div className="novo-ag-modal-search">
          <FiSearch size={16} />
          <input
            autoFocus
            type="text"
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="novo-ag-modal-list">
          {filtered.length === 0 ? (
            <div className="novo-ag-modal-empty">Nenhum resultado</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                className="novo-ag-modal-item"
                onClick={() => { onSelect(item); onClose(); }}
              >
                {renderItem(item)}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const NovoAgendamento = () => {
  const navigate = useNavigate();
  const token = () => sessionStorage.getItem('token');

  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [availableTimes, setAvailableTimes] = useState([]);

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedTime, setSelectedTime] = useState('');

  const [modal, setModal] = useState(null);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const headers = { 'Authorization': `Bearer ${token()}` };
    Promise.all([
      fetch('/api/customer/customers?limit=500', { headers }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/service/services', { headers }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/user/users?limit=200', { headers }).then((r) => r.json()).catch(() => ({})),
      fetch('/api/promotion/promotions', { headers }).then((r) => r.json()).catch(() => ({})),
    ]).then(([clientsData, servicesData, usersData, promoData]) => {
      setClients(clientsData.customers || clientsData.data || []);
      setServices(servicesData.services || servicesData.data || []);
      const barbers = (usersData.users || usersData.data || []).filter((u) => u.isBarber);
      setProfessionals(barbers);
      setPromotions(promoData.promotions || promoData.data || []);
    });
  }, []);

  const loadAvailableTimes = useCallback(async () => {
    if (!selectedService || !selectedProfessional || !selectedDate) {
      setAvailableTimes([]);
      return;
    }
    setLoadingTimes(true);
    setSelectedTime('');
    try {
      const res = await fetch(
        `/api/appointment/available-times?date=${selectedDate}&professionalId=${selectedProfessional.id}&serviceId=${selectedService.id}`,
        { headers: { 'Authorization': `Bearer ${token()}` } }
      );
      const data = await res.json().catch(() => ({}));
      setAvailableTimes(data.times || data.availableTimes || []);
    } catch {
      setAvailableTimes([]);
    } finally {
      setLoadingTimes(false);
    }
  }, [selectedService, selectedProfessional, selectedDate]);

  useEffect(() => {
    loadAvailableTimes();
  }, [loadAvailableTimes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedClient) return setError('Selecione um cliente.');
    if (!selectedService) return setError('Selecione um serviço.');
    if (!selectedProfessional) return setError('Selecione um profissional.');
    if (!selectedDate) return setError('Selecione uma data.');
    if (!selectedTime) return setError('Selecione um horário.');

    setSubmitting(true);
    try {
      const body = {
        customerId: selectedClient.id,
        serviceId: selectedService.id,
        professionalId: selectedProfessional.id,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        ...(selectedPromotion ? { promotionId: selectedPromotion.id } : {}),
      };

      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token()}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao criar agendamento');

      setSuccess('Agendamento criado com sucesso!');
      setTimeout(() => navigate('/servico-agendados'), 1500);
    } catch (err) {
      setError(err.message || 'Erro ao criar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified">
        <div className="novo-ag-container">
          <div className="novo-ag-header">
            <button type="button" className="novo-ag-back" onClick={() => navigate(-1)}>← Voltar</button>
            <h1 className="novo-ag-title">Novo Agendamento</h1>
          </div>

          <form className="novo-ag-form" onSubmit={handleSubmit}>
            {error && <div className="novo-ag-alert novo-ag-alert--error">{error}</div>}
            {success && <div className="novo-ag-alert novo-ag-alert--success">{success}</div>}

            {/* Cliente */}
            <div className="novo-ag-field">
              <label className="novo-ag-label">Cliente</label>
              <button
                type="button"
                className={`novo-ag-picker ${selectedClient ? 'novo-ag-picker--selected' : ''}`}
                onClick={() => setModal('client')}
              >
                {selectedClient ? (
                  <span className="novo-ag-picker-value">
                    <FiCheck size={15} /> {selectedClient.name}
                    <button
                      type="button"
                      className="novo-ag-picker-clear"
                      onClick={(e) => { e.stopPropagation(); setSelectedClient(null); }}
                    ><FiX size={13} /></button>
                  </span>
                ) : (
                  <span className="novo-ag-picker-placeholder"><FiSearch size={15} /> Selecionar cliente</span>
                )}
              </button>
            </div>

            {/* Serviço */}
            <div className="novo-ag-field">
              <label className="novo-ag-label">Serviço</label>
              <button
                type="button"
                className={`novo-ag-picker ${selectedService ? 'novo-ag-picker--selected' : ''}`}
                onClick={() => setModal('service')}
              >
                {selectedService ? (
                  <span className="novo-ag-picker-value">
                    <FiCheck size={15} /> {selectedService.name} — {formatPrice(selectedService.price)}
                    <button
                      type="button"
                      className="novo-ag-picker-clear"
                      onClick={(e) => { e.stopPropagation(); setSelectedService(null); setSelectedTime(''); setAvailableTimes([]); }}
                    ><FiX size={13} /></button>
                  </span>
                ) : (
                  <span className="novo-ag-picker-placeholder"><FiSearch size={15} /> Selecionar serviço</span>
                )}
              </button>
            </div>

            {/* Profissional */}
            <div className="novo-ag-field">
              <label className="novo-ag-label">Profissional</label>
              <button
                type="button"
                className={`novo-ag-picker ${selectedProfessional ? 'novo-ag-picker--selected' : ''}`}
                onClick={() => setModal('professional')}
              >
                {selectedProfessional ? (
                  <span className="novo-ag-picker-value">
                    <FiCheck size={15} /> {selectedProfessional.name}
                    <button
                      type="button"
                      className="novo-ag-picker-clear"
                      onClick={(e) => { e.stopPropagation(); setSelectedProfessional(null); setSelectedTime(''); setAvailableTimes([]); }}
                    ><FiX size={13} /></button>
                  </span>
                ) : (
                  <span className="novo-ag-picker-placeholder"><FiSearch size={15} /> Selecionar profissional</span>
                )}
              </button>
            </div>

            {/* Promoção (opcional) */}
            <div className="novo-ag-field">
              <label className="novo-ag-label">Promoção <span className="novo-ag-optional">(opcional)</span></label>
              <button
                type="button"
                className={`novo-ag-picker ${selectedPromotion ? 'novo-ag-picker--selected' : ''}`}
                onClick={() => setModal('promotion')}
              >
                {selectedPromotion ? (
                  <span className="novo-ag-picker-value">
                    <FiCheck size={15} /> {selectedPromotion.name}
                    <button
                      type="button"
                      className="novo-ag-picker-clear"
                      onClick={(e) => { e.stopPropagation(); setSelectedPromotion(null); }}
                    ><FiX size={13} /></button>
                  </span>
                ) : (
                  <span className="novo-ag-picker-placeholder"><FiSearch size={15} /> Selecionar promoção</span>
                )}
              </button>
            </div>

            {/* Data */}
            <div className="novo-ag-field">
              <label className="novo-ag-label">Data</label>
              <input
                type="date"
                className="novo-ag-input"
                value={selectedDate}
                min={getTodayDateString()}
                onChange={(e) => { setSelectedDate(e.target.value); setSelectedTime(''); }}
              />
            </div>

            {/* Horários */}
            <div className="novo-ag-field">
              <label className="novo-ag-label">Horário</label>
              {loadingTimes ? (
                <div className="novo-ag-times-loading">Carregando horários...</div>
              ) : availableTimes.length > 0 ? (
                <div className="novo-ag-times-grid">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      type="button"
                      className={`novo-ag-time-btn ${selectedTime === time ? 'novo-ag-time-btn--selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="novo-ag-times-empty">
                  {selectedService && selectedProfessional && selectedDate
                    ? 'Nenhum horário disponível para esta data'
                    : 'Selecione serviço, profissional e data para ver os horários'}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="novo-ag-submit"
              disabled={submitting}
            >
              {submitting ? 'Criando...' : 'Confirmar Agendamento'}
            </button>
          </form>
        </div>

        {modal === 'client' && (
          <SearchModal
            title="Selecionar Cliente"
            items={clients}
            onSelect={setSelectedClient}
            onClose={() => setModal(null)}
            renderItem={(item) => (
              <div className="novo-ag-modal-item-content">
                <span className="novo-ag-modal-item-name">{item.name}</span>
                <span className="novo-ag-modal-item-sub">{item.phone || item.email || ''}</span>
              </div>
            )}
          />
        )}

        {modal === 'service' && (
          <SearchModal
            title="Selecionar Serviço"
            items={services}
            onSelect={setSelectedService}
            onClose={() => setModal(null)}
            renderItem={(item) => (
              <div className="novo-ag-modal-item-content">
                <span className="novo-ag-modal-item-name">{item.name}</span>
                <span className="novo-ag-modal-item-sub">{formatPrice(item.price)} · {item.durationMinutes || item.duration || ''}min</span>
              </div>
            )}
          />
        )}

        {modal === 'professional' && (
          <SearchModal
            title="Selecionar Profissional"
            items={professionals}
            onSelect={setSelectedProfessional}
            onClose={() => setModal(null)}
            renderItem={(item) => (
              <div className="novo-ag-modal-item-content">
                <span className="novo-ag-modal-item-name">{item.name}</span>
                <span className="novo-ag-modal-item-sub">{item.email || ''}</span>
              </div>
            )}
          />
        )}

        {modal === 'promotion' && (
          <SearchModal
            title="Selecionar Promoção"
            items={promotions}
            onSelect={setSelectedPromotion}
            onClose={() => setModal(null)}
            renderItem={(item) => (
              <div className="novo-ag-modal-item-content">
                <span className="novo-ag-modal-item-name">{item.name}</span>
                <span className="novo-ag-modal-item-sub">{item.description || ''}</span>
              </div>
            )}
          />
        )}
      </main>
    </div>
  );
};

export default NovoAgendamento;
