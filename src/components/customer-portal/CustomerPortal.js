    // Função para formatar telefone (99) 99999-9999 em tempo real
    function formatPhone(phone) {
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, '');
        let formatted = '';
        if (cleaned.length <= 2) {
            formatted = cleaned;
        } else if (cleaned.length <= 7) {
            formatted = `(${cleaned.slice(0,2)}) ${cleaned.slice(2)}`;
        } else if (cleaned.length <= 11) {
            formatted = `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7,11)}`;
        } else {
            formatted = `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7,11)}`;
        }
        return formatted;
    }
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './CustomerPortal.css';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';

/**
 * Portal do Cliente - Interface pública para agendamento
 * Não requer autenticação, apenas telefone e dados básicos
 */
const CustomerPortal = () => {
    const { slug } = useParams();
    // Etapas: 1 - Identificação, 2 - Meus Agendamentos, 3 - Seleção Serviço, 4 - Seleção Profissional/Data/Horário, 5 - Confirmação
    const [step, setStep] = useState(1);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenantData, setTenantData] = useState({
        id: null,
        name: '',
        logo: '',
        backgroundImage: '',
        phone: '',
        address: '',
        city: '',
        state: ''
    });
    
    // Dados do cliente
    const [customerData, setCustomerData] = useState({
        phone: '',
        name: '',
        birthDate: ''
    });
    const [showExtraFields, setShowExtraFields] = useState(false);
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [customer, setCustomer] = useState(null);
    
    // Dados do agendamento
    const [services, setServices] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [confirmCancel, setConfirmCancel] = useState({ open: false, appointment: null });
    const [appointmentData, setAppointmentData] = useState({
        serviceId: '',
        professionalId: '',
        date: '',
        time: ''
    });
    const [availableTimes, setAvailableTimes] = useState([]);
    const [overflowTimes, setOverflowTimes] = useState([]);
    const [loadingTimes, setLoadingTimes] = useState(false);
    const [pendingRequest, setPendingRequest] = useState(null);
    const [pendingCountdown, setPendingCountdown] = useState(0);
    
    // API_URL removido - usando URLs relativas com proxy nginx

    const normalizeAssetUrl = (value) => {
        if (!value) return '';
        const stringValue = String(value);

        if (/^data:/i.test(stringValue)) return stringValue;
        if (/^https?:\/\//i.test(stringValue)) return stringValue;
        if (/^[0-9]+$/.test(stringValue)) return `/api/images/image/${stringValue}`;
        if (stringValue.startsWith('/')) return stringValue;
        if (stringValue.startsWith('uploads/') || stringValue.startsWith('api/')) {
            return `/${stringValue}`;
        }

        return stringValue;
    };


    // Carregar dados da barbearia ao montar o componente
    useEffect(() => {
        if (slug) {
            loadTenantData();
        }
    }, [slug]);

    // Carregar serviços quando tenantData.id estiver disponível
    useEffect(() => {
        if (tenantData.id) {
            loadServices();
        }
    }, [tenantData.id]);

    // Carregar profissionais quando chegar na etapa de agendamento
    useEffect(() => {
        if (tenantData.id && step === 4) {
            loadProfessionals();
        }
    }, [tenantData.id, step]);

    useEffect(() => {
        if (!tenantData.id || step !== 4) return;
        if (!appointmentData.professionalId || !appointmentData.date || !appointmentData.serviceId) {
            setAvailableTimes([]);
            setOverflowTimes([]);
            return;
        }

        const fetchTimes = async () => {
            setLoadingTimes(true);
            try {
                const params = new URLSearchParams({
                    professionalId: appointmentData.professionalId,
                    date: appointmentData.date,
                    tenantId: tenantData.id,
                    serviceId: appointmentData.serviceId
                });
                const response = await fetch(`/api/public/appointment/available-times?${params.toString()}`);
                const data = await response.json().catch(() => ({}));
                if (!response.ok) {
                    setAvailableTimes([]);
                    setOverflowTimes([]);
                    return;
                }
                const times = data.availableTimes || [];
                const overflow = data.overflowTimes || [];
                setAvailableTimes(times);
                setOverflowTimes(overflow);
                if (appointmentData.time && !times.includes(appointmentData.time) && !overflow.includes(appointmentData.time)) {
                    setAppointmentData((prev) => ({ ...prev, time: '' }));
                }
            } catch (error) {
                console.error('Erro ao carregar horarios disponiveis:', error);
                setAvailableTimes([]);
                setOverflowTimes([]);
            } finally {
                setLoadingTimes(false);
            }
        };

        fetchTimes();
    }, [appointmentData.professionalId, appointmentData.date, appointmentData.serviceId, tenantData.id, step, appointmentData.time]);

    useEffect(() => {
        if (pendingRequest && step !== 4) {
            setStep(4);
        }
    }, [pendingRequest, step]);

    useEffect(() => {
        if (!pendingRequest?.expiresAt) {
            setPendingCountdown(0);
            return;
        }

        const updateCountdown = () => {
            const remaining = Math.max(0, Math.ceil((new Date(pendingRequest.expiresAt).getTime() - Date.now()) / 1000));
            setPendingCountdown(remaining);
        };

        updateCountdown();
        const intervalId = setInterval(updateCountdown, 1000);
        return () => clearInterval(intervalId);
    }, [pendingRequest?.expiresAt]);

    const findNextAvailableDate = async (startDate) => {
        const maxDays = 60;
        const base = new Date(`${startDate}T00:00:00`);
        for (let i = 1; i <= maxDays; i += 1) {
            const candidate = new Date(base);
            candidate.setDate(candidate.getDate() + i);
            const dateValue = candidate.toISOString().split('T')[0];

            const params = new URLSearchParams({
                professionalId: appointmentData.professionalId,
                date: dateValue,
                tenantId: tenantData.id,
                serviceId: appointmentData.serviceId
            });
            const response = await fetch(`/api/public/appointment/available-times?${params.toString()}`);
            const data = await response.json().catch(() => ({}));
            if (response.ok && (data.availableTimes || []).length > 0) {
                return dateValue;
            }
        }
        return startDate;
    };

    // Carregar dados da barbearia (logo e background)
    const loadTenantData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('Buscando barbearia com slug:', slug);
            const response = await fetch(`/api/tenant/slug/${slug}`);
            console.log('Resposta:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Dados da barbearia:', data);
                setTenantData({
                    id: data.id,
                    name: data.name || '',
                    logo: normalizeAssetUrl(data.logo),
                    backgroundImage: normalizeAssetUrl(data.backgroundImage),
                    phone: data.phone || '',
                    address: data.address || '',
                    city: data.city || '',
                    state: data.state || ''
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(`Barbearia "${slug}" não encontrada. Verifique se o link está correto.`);
                console.error('Erro ao buscar barbearia:', errorData);
            }
        } catch (error) {
            console.error('Erro ao carregar dados da barbearia:', error);
            setError('Erro ao conectar com o servidor. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    // Passo 1: Identificar/Criar Cliente
    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        const submitLoading = true; // usar variável local para não afetar loading global

        try {
            const response = await fetch('/api/public/customer/get-or-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...customerData,
                    tenantId: tenantData.id
                })
            });

            if (!response.ok) throw new Error('Erro ao processar dados do cliente');

            const data = await response.json();
            if (data.needsName) {
                setShowExtraFields(true);
                return;
            }
            setCustomer(data.customer);
            await loadCustomerAppointments(data.customer.phone);
        } catch (error) {
            console.error('Erro:', error);
            alert('😞 Não foi possível processar seus dados. Por favor, verifique as informações e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    // Carregar agendamentos do cliente
    const loadCustomerAppointments = async (phone) => {
        try {
            const response = await fetch(`/api/public/appointment/by-customer?customerPhone=${encodeURIComponent(phone)}&tenantId=${tenantData.id}`);
            const data = await response.json();
            const list = data.appointments || [];
            setAppointments(list);
            if (list.length > 0) {
                setStep(2);
            } else {
                setStep(3);
            }
        } catch (error) {
            console.error('Erro ao carregar agendamentos do cliente:', error);
            setStep(3);
        }
    };

    const cancelAppointment = async (appt) => {
        try {
            const phoneValue = customer?.phone || customerData.phone;
            if (!phoneValue || !tenantData.id) {
                alert('Nao foi possivel cancelar. Telefone ou barbearia nao encontrados.');
                return;
            }
            const resp = await fetch('/api/public/appointment/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appt.id,
                    customerPhone: phoneValue,
                    tenantId: tenantData.id
                })
            });
            const payload = await resp.json().catch(() => ({}));
            if (!resp.ok) {
                alert(payload.message || 'Nao foi possivel cancelar o agendamento.');
                return;
            }

            setConfirmCancel({ open: false, appointment: null });
            const updated = appointments.filter(item => item.id !== appt.id);
            setAppointments(updated);
            if (updated.length === 0) {
                setStep(3);
            } else {
                await loadCustomerAppointments(phoneValue);
            }
        } catch (err) {
            console.error('Erro ao cancelar agendamento:', err);
            alert('Nao foi possivel cancelar o agendamento.');
        }
    };

    // Carregar serviços disponíveis
    const loadServices = async () => {
        try {
            const response = await fetch(`/api/public/service/${tenantData.id}`);
            const data = await response.json();
            // Mapeia campos do backend para o frontend
            const mapped = (data.services || []).map(s => ({
                id: s.id,
                name: s.tipoServico || s.name || 'Serviço',
                price: s.valor || s.price || 0,
                duration: s.duration || s.duracao || null,
                description: s.description || s.descricao || ''
            }));
            setServices(mapped);
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
        }
    };

    // Carregar profissionais disponíveis (profissionais + barbeiros do tenant)
    const loadProfessionals = async () => {
        try {
            // Busca profissionais
            const profResponse = await fetch(`/api/public/professional/${tenantData.id}`);
            const profData = await profResponse.json();
            const professionals = profData.professionals || [];

            // Busca barbeiros do tenant (usuarios com isBarber=true)
            const userResponse = await fetch(`/api/public/users/barbers/${tenantData.id}`);
            const userData = await userResponse.json();
            const users = (userData.users || []).map(u => ({
                id: 'user-' + u.id,
                name: u.name,
                isUser: true
            }));

            // Junta profissionais e usuários (sem dedup por nome para nao ocultar barbeiros)
            const all = [...professionals, ...users];
            setProfessionals(all);
        } catch (error) {
            console.error('Erro ao carregar profissionais e usuários:', error);
        }
    };

    // Passo 2: Criar Agendamento
    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const dateTime = `${appointmentData.date}T${appointmentData.time}:00`;
            
            const response = await fetch('/api/public/appointment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerPhone: customer.phone,
                    serviceId: appointmentData.serviceId,
                    professionalId: appointmentData.professionalId,
                    date: dateTime,
                    tenantId: tenantData.id
                })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.message || 'Erro ao criar agendamento');

            if (data.status === 'pending' && data.requestId) {
                setPendingRequest({
                    id: data.requestId,
                    expiresAt: data.expiresAt
                });
                return;
            }

            setStep(5);
        } catch (error) {
            console.error('Erro:', error);
            alert('😞 Não foi possível criar seu agendamento. Por favor, tente novamente ou entre em contato com a barbearia.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!pendingRequest || !tenantData.id || !customer?.phone) return;

        let active = true;
        const poll = async () => {
            try {
                const params = new URLSearchParams({
                    customerPhone: customer.phone,
                    tenantId: tenantData.id
                });
                const response = await fetch(`/api/public/appointment/request/${pendingRequest.id}?${params.toString()}`);
                const data = await response.json().catch(() => ({}));
                if (!response.ok) return;

                if (!active) return;

                if (data.status === 'approved') {
                    alert('Seu agendamento foi confirmado pelo barbeiro.');
                    setPendingRequest(null);
                    await loadCustomerAppointments(customer.phone);
                    return;
                }

                if (data.status === 'rejected' || data.status === 'expired') {
                    alert('O agendamento nao foi validado pelo barbeiro. Escolha um novo horario no proximo dia disponivel.');
                    setPendingRequest(null);
                    const nextDate = await findNextAvailableDate(appointmentData.date || new Date().toISOString().split('T')[0]);
                    setAppointmentData((prev) => ({ ...prev, date: nextDate, time: '' }));
                    setStep(4);
                }
            } catch (error) {
                console.error('Erro ao consultar solicitacao:', error);
            }
        };

        poll();
        const intervalId = setInterval(poll, 15000);
        return () => {
            active = false;
            clearInterval(intervalId);
        };
    }, [pendingRequest, tenantData.id, customer?.phone]);

    // Renderizar formulário de identificação
    const renderStepIdentification = () => (
        <div className="customer-portal-step">
            <h2>Identificação</h2>
            <p>Por favor, informe seu telefone para agendar</p>
            <form onSubmit={handleCustomerSubmit} autoComplete="off">
                <div className="form-group">
                    <label>Telefone *</label>
                    <input
                        type="tel"
                        placeholder="(11) 98765-4321"
                        value={formatPhone(customerData.phone)}
                        onChange={async e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            const formatted = formatPhone(raw);
                            setCustomerData({ ...customerData, phone: raw });
                            if (raw && raw.length >= 10 && tenantData.id) {
                                setCheckingPhone(true);
                                try {
                                    const resp = await fetch('/api/public/customer/get-or-create', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ phone: raw, tenantId: tenantData.id })
                                    });
                                    if (resp.ok) {
                                        const data = await resp.json();
                                        if (data.customer && data.customer.name) {
                                            setCustomer(data.customer);
                                            await loadCustomerAppointments(data.customer.phone);
                                            setShowExtraFields(false);
                                            return;
                                        } else {
                                            setShowExtraFields(true); // Não encontrado, mostrar campos
                                        }
                                    } else {
                                        setShowExtraFields(true);
                                    }
                                } catch (err) {
                                    setShowExtraFields(true);
                                } finally {
                                    setCheckingPhone(false);
                                }
                            } else {
                                setShowExtraFields(false);
                                setCheckingPhone(false);
                            }
                        }}
                        required
                    />
                </div>
                {/* Removido loading visual da checagem automática */}
                {showExtraFields && (
                    <>
                        <div className="form-group">
                            <label>Nome Completo *</label>
                            <input
                                type="text"
                                placeholder="João Silva"
                                value={customerData.name}
                                onChange={e => setCustomerData({ ...customerData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Data de Nascimento</label>
                            <input
                                type="date"
                                value={customerData.birthDate}
                                onChange={e => setCustomerData({ ...customerData, birthDate: e.target.value })}
                            />
                        </div>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Processando...' : 'Continuar'}
                        </button>
                    </>
                )}
            </form>
        </div>
    );

    // Passo 2: Lista de agendamentos do cliente
    const renderStepAppointments = () => (
        <div className="customer-portal-step">
            <h2>Meus Agendamentos</h2>
            <p>Confira seus agendamentos pendentes</p>
            {appointments.length === 0 ? (
                <p>Nenhum agendamento encontrado.</p>
            ) : (
                <div className="appointments-list">
                    {appointments.map((appt) => (
                        <div key={appt.id} className="appointment-item">
                            <div>
                                <strong>{appt.service?.name || 'Servico'}</strong>
                                <div>{appt.professionalName || appt.professional?.name || 'Profissional'}</div>
                                <div>{appt.appointmentDate} {appt.appointmentTime}</div>
                            </div>
                            <button
                                type="button"
                                onClick={async () => {
                                    setConfirmCancel({ open: true, appointment: appt });
                                }}
                            >
                                Cancelar agendamento
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <div className="button-group">
                <button type="button" onClick={() => setStep(3)}>
                    Novo agendamento
                </button>
            </div>
        </div>
    );

    // Passo 3: Seleção de Serviço (cards)
    const renderStepServiceSelection = () => (
        <div className="customer-portal-step">
            <h2>Escolha o Serviço</h2>
            <p>Olá, {customer?.name}! Selecione o serviço desejado:</p>
            <div className="service-cards-grid">
                {services.map(service => (
                    <Card
                        key={service.id}
                        className={`service-dashboard-card${selectedServiceId === service.id ? ' selected' : ''}`}
                        variant="default"
                        padding="sm"
                        hover
                        onClick={() => setSelectedServiceId(service.id)}
                        style={{
                            cursor: 'pointer',
                            minWidth: 180,
                            maxWidth: 220,
                            margin: '0 auto',
                            background: 'rgba(255,255,255,0.8)',
                            color: '#23272f',
                            border: '2px solid #e0e0e0',
                        }}
                    >
                        <CardTitle style={{ fontSize: '1.08rem', marginBottom: 8, color: '#23272f', fontWeight: 700 }}>{service.name}</CardTitle>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.98rem', marginBottom: 2, color: '#23272f' }}>
                            <span>{service.duration ? service.duration + ' min' : 'N/A'}</span>
                            <span>R$ {service.price?.toFixed ? service.price.toFixed(2) : service.price}</span>
                        </div>
                    </Card>
                ))}
            </div>
            <div className="button-group">
                <button type="button" disabled={!selectedServiceId} onClick={() => {
                    setAppointmentData({ ...appointmentData, serviceId: selectedServiceId });
                    setStep(4);
                }}>
                    Avançar
                </button>
            </div>
        </div>
    );

    // Passo 4: Seleção de profissional/data/horário
    const renderStepSelection = () => {
        const isOverflowSelected = overflowTimes.includes(appointmentData.time);

        return (
        <div className="customer-portal-step">
            <h2>Agendar Serviço</h2>
            <p>Olá, {customer?.name}! Escolha o profissional e horário</p>
            <form onSubmit={handleAppointmentSubmit}>
                <div className="form-group">
                    <label>Profissional *</label>
                    <select
                        value={appointmentData.professionalId}
                        onChange={(e) => setAppointmentData({...appointmentData, professionalId: e.target.value})}
                        required
                    >
                        <option value="">Selecione um profissional</option>
                        {professionals.map(prof => (
                            <option key={prof.id} value={prof.id}>
                                {prof.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Data *</label>
                    <input
                        type="date"
                        value={appointmentData.date}
                        onChange={(e) => setAppointmentData({...appointmentData, date: e.target.value})}
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Horário *</label>
                    <select
                        value={appointmentData.time}
                        onChange={(e) => setAppointmentData({...appointmentData, time: e.target.value})}
                        required
                        disabled={!!pendingRequest}
                    >
                        <option value="">Selecione um horário</option>
                        {loadingTimes && <option value="" disabled>Carregando horarios...</option>}
                        {!loadingTimes && availableTimes.length === 0 && (
                            <option value="" disabled>Sem horarios disponiveis</option>
                        )}
                        {availableTimes.map((time) => (
                            <option key={time} value={time}>{time}</option>
                        ))}
                        {!loadingTimes && overflowTimes.length > 0 && (
                            <option value="" disabled>---</option>
                        )}
                        {overflowTimes.map((time) => (
                            <option key={`overflow-${time}`} value={time}>{time} (confirmacao)</option>
                        ))}
                    </select>
                    {isOverflowSelected && !pendingRequest && (
                        <div style={{ marginTop: 8, color: '#f8d7da', fontWeight: 600 }}>
                            Este horario excede o expediente. O barbeiro confirmara em ate 2 minutos.
                        </div>
                    )}
                    {pendingRequest && (
                        <div style={{ marginTop: 8, color: '#dfe3ea', fontWeight: 600 }}>
                            Aguardando confirmacao do barbeiro...
                        </div>
                    )}
                </div>
                <div className="button-group">
                    <button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={!!pendingRequest}
                    >
                        Voltar
                    </button>
                    <button type="submit" disabled={loading || !!pendingRequest}>
                        {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                    </button>
                </div>
            </form>
        </div>
        );
    };

    // Renderizar confirmação
    const renderStepConfirmation = () => (
        <div className="customer-portal-step confirmation">
            <h2>✓ Agendamento Confirmado!</h2>
            <p>Seu agendamento foi realizado com sucesso.</p>
            <div className="confirmation-details">
                <h3>Detalhes do Agendamento</h3>
                <p><strong>Nome:</strong> {customer?.name}</p>
                <p><strong>Telefone:</strong> {formatPhone(customer?.phone)}</p>
                <p><strong>Data:</strong> {appointmentData.date}</p>
                <p><strong>Horário:</strong> {appointmentData.time}</p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="customer-portal loading">
                <div className="customer-portal-container">
                    <h2>Carregando...</h2>
                    <p>Aguarde enquanto carregamos os dados da barbearia</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="customer-portal error">
                <div className="customer-portal-container">
                    <h2>⚠️ Ops!</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="login-page customer-portal-page" style={{ minHeight: '100vh', background: tenantData.backgroundImage
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${tenantData.backgroundImage})`
            : 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', position: 'relative' }}>
        
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        {tenantData.logo && (
                            <div className="customer-portal-logo" style={{ background: 'none', marginBottom: 0, padding: 0 }}>
                                <img 
                                    src={tenantData.logo} 
                                    alt={tenantData.name}
                                    style={{ maxWidth: 120, maxHeight: 80, margin: '0 auto' }}
                                    onError={(e) => {
                                        console.error('Erro ao carregar logo');
                                        e.target.style.display = 'none';
                                    }}
                                />
                            </div>
                        )}
                        <h1 className="login-title">{tenantData.name || 'Agendamento Online'}</h1>
                        <p className="login-subtitle">Agende seu horário de forma rápida e fácil</p>
                        {tenantData.phone && (
                            <p style={{ marginTop: '10px', fontSize: '16px', color: '#fff' }}>
                                📞 {tenantData.phone}
                            </p>
                        )}
                        {(tenantData.address || tenantData.city) && (
                            <p style={{ marginTop: '5px', fontSize: '14px', opacity: 0.9, color: '#fff' }}>
                                📍 {[tenantData.address, tenantData.city, tenantData.state].filter(Boolean).join(', ')}
                            </p>
                        )}
                    </div>
                    <div className="portal-progress" style={{ background: 'none', border: 'none', marginBottom: 16 }}>
                        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Identificação</div>
                        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Meus Agendamentos</div>
                        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Agendamento</div>
                        <div className={`progress-step ${step >= 5 ? 'active' : ''}`}>4. Confirmação</div>
                    </div>
                    <div className="portal-content" style={{ padding: 0 }}>
                        {step === 1 && renderStepIdentification()}
                        {step === 2 && renderStepAppointments()}
                        {step === 3 && renderStepServiceSelection()}
                        {step === 4 && renderStepSelection()}
                        {step === 5 && renderStepConfirmation()}
                    </div>
                    {pendingRequest && (
                        <div className="pending-approval-overlay">
                            <div className="pending-approval-card">
                                <h3>Aguardando confirmacao</h3>
                                <p>O barbeiro precisa aprovar o agendamento.</p>
                                <p>Assim que ele responder, voce sera avisado.</p>
                                {pendingCountdown > 0 && (
                                    <div className="pending-approval-timer">
                                        Tempo restante: {Math.floor(pendingCountdown / 60)}:{String(pendingCountdown % 60).padStart(2, '0')}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {confirmCancel.open && (
                        <div className="confirm-modal-backdrop">
                            <div className="confirm-modal">
                                <h3>Cancelar agendamento?</h3>
                                <p>Deseja confirmar o cancelamento deste agendamento?</p>
                                <div className="confirm-actions">
                                    <button
                                        type="button"
                                        className="confirm-btn confirm-no"
                                        onClick={() => setConfirmCancel({ open: false, appointment: null })}
                                    >
                                        Nao
                                    </button>
                                    <button
                                        type="button"
                                        className="confirm-btn confirm-yes"
                                        onClick={() => cancelAppointment(confirmCancel.appointment)}
                                        disabled={!confirmCancel.appointment}
                                    >
                                        Sim
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomerPortal;
    // Componente removido. O cadastro de clientes agora é feito via Services.js.
