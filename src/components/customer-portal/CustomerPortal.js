// CustomerPortal.js - CORRIGIDO COM ALERTA DE VOUCHER NA ETAPA 3
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './CustomerPortal.css';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { FiScissors, FiClock, FiDollarSign } from 'react-icons/fi';

// Componente FeedbackMessage
const FeedbackMessage = ({ message, type, onClose, duration = 10000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            if (onClose) onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [onClose, message, duration]);
    
    return (
        <div className={`feedback-message feedback-${type}`} style={{
            background: type === 'success' ? '#d1fae5' : '#fee2e2',
            color: type === 'success' ? '#065f46' : '#991b1b',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <span>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>×</button>
        </div>
    );
};

// Funções auxiliares
const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 7) return `(${cleaned.slice(0,2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7,11)}`;
};

const formatDateBr = (value) => {
    if (!value) return '';
    const rawValue = String(value).split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
        const [year, month, day] = rawValue.split('-');
        return `${day}/${month}/${year}`;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString('pt-BR');
};

const normalizeAssetUrl = (value) => {
    if (!value) return '';
    const stringValue = String(value);
    if (/^data:/i.test(stringValue)) return stringValue;
    if (/^https?:\/\//i.test(stringValue)) return stringValue;
    if (/^[0-9]+$/.test(stringValue)) return `/api/images/image/${stringValue}`;
    if (stringValue.startsWith('/')) return stringValue;
    return stringValue;
};

const CustomerPortal = () => {
    const { slug } = useParams();
    
    // Estados
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
    const [customerData, setCustomerData] = useState({ phone: '', name: '', birthDate: '' });
    const [showExtraFields, setShowExtraFields] = useState(false);
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [customer, setCustomer] = useState(null);
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
    const [availablePromotions, setAvailablePromotions] = useState([]);
    const [voucherAlert, setVoucherAlert] = useState('');
    const [voucherAgendamento, setVoucherAgendamento] = useState('');
    const [voucherDisplayed, setVoucherDisplayed] = useState(false); // Controle para exibir apenas uma vez

    // Buscar promoções disponíveis para o cliente
    const loadAvailablePromotions = async (phone) => {
        if (!phone || !tenantData.id) return;
        try {
            const params = new URLSearchParams({
                customerPhone: phone,
                tenantId: tenantData.id
            });
            const response = await fetch(`/api/public/promotion/available?${params.toString()}`);
            const data = await response.json();
            setAvailablePromotions(data.promotions || []);
            
            // Verificar se há voucher
            const firstVoucher = (data.promotions || []).find(p => p.voucher);
            if (firstVoucher) {
                setVoucherAlert(`🎉 Você ganhou um cupom promocional: ${firstVoucher.voucher}`);
            } else {
                setVoucherAlert('');
            }
            // Resetar controle de exibição quando novas promoções chegam
            setVoucherDisplayed(false);
        } catch (error) {
            console.error('Erro ao carregar promoções:', error);
            setAvailablePromotions([]);
            setVoucherAlert('');
        }
    };

    // CORREÇÃO: Efeito para exibir alerta de voucher ao entrar na etapa 3
    useEffect(() => {
        if (step === 3 && voucherAlert && !voucherDisplayed) {
            // Marcar como exibido para não mostrar novamente
            setVoucherDisplayed(true);
            // Scroll para o topo para o cliente ver o alerta
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 100);
        }
    }, [step, voucherAlert, voucherDisplayed]);

    // Carregar dados da barbearia
    const loadTenantData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/tenant/slug/${slug}`);
            if (response.ok) {
                const data = await response.json();
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
                setError(`Barbearia "${slug}" não encontrada.`);
            }
        } catch (error) {
            setError('Erro ao conectar com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    // Carregar serviços
    const loadServices = async () => {
        try {
            const response = await fetch(`/api/public/service/${tenantData.id}`);
            const data = await response.json();
            const mapped = (data.services || []).map(s => {
                const rawDuration = s.duration || s.duracao;
                let durationMinutes = 30;
                if (rawDuration !== undefined && rawDuration !== null) {
                    const str = String(rawDuration);
                    const parts = str.split(':');
                    durationMinutes = parts.length >= 2
                        ? parseInt(parts[0]) * 60 + parseInt(parts[1])
                        : parseInt(str) || 30;
                }
                return {
                    id: s.id,
                    name: s.tipoServico || s.name || 'Serviço',
                    price: parseFloat(s.valor ?? s.price ?? 0) || 0,
                    duration: durationMinutes
                };
            });
            setServices(mapped);
        } catch (error) {
            console.error('Erro ao carregar serviços:', error);
        }
    };

    // Carregar profissionais (apenas barbeiros com conta de usuário, pois professionalId=User.id)
    const loadProfessionals = async () => {
        try {
            const userResponse = await fetch(`/api/public/users/barbers/${tenantData.id}`);
            const userData = await userResponse.json();
            const users = (userData.users || []).map(u => ({
                id: u.id,
                name: u.name,
                imageUrl: u.imageUrl || null
            }));
            setProfessionals(users);
        } catch (error) {
            console.error('Erro ao carregar profissionais:', error);
        }
    };

    // Carregar agendamentos do cliente
    const loadCustomerAppointments = async (phone) => {
        try {
            const response = await fetch(`/api/public/appointment/by-customer?customerPhone=${encodeURIComponent(phone)}&tenantId=${tenantData.id}`);
            const data = await response.json();
            setAppointments(data.appointments || []);
            if (data.appointments?.length > 0) {
                setStep(2);
            } else {
                setStep(3);
            }
        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            setStep(3);
        }
    };

    // Buscar horários disponíveis
    const fetchAvailableTimes = async () => {
        if (!appointmentData.professionalId || !appointmentData.date || !appointmentData.serviceId) return;
        setLoadingTimes(true);
        try {
            const params = new URLSearchParams({
                professionalId: appointmentData.professionalId,
                date: appointmentData.date,
                tenantId: tenantData.id,
                serviceId: appointmentData.serviceId
            });
            const response = await fetch(`/api/public/appointment/available-times?${params.toString()}`);
            const data = await response.json();
            setAvailableTimes(data.availableTimes || []);
            setOverflowTimes(data.overflowTimes || []);
        } catch (error) {
            console.error('Erro ao buscar horários:', error);
        } finally {
            setLoadingTimes(false);
        }
    };

    // Identificação do cliente
    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/public/customer/get-or-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...customerData, tenantId: tenantData.id })
            });
            if (!response.ok) throw new Error('Erro ao processar dados');
            const data = await response.json();
            if (data.needsName) {
                setShowExtraFields(true);
                return;
            }
            setCustomer(data.customer);
            await loadCustomerAppointments(data.customer.phone);
            await loadAvailablePromotions(data.customer.phone);
        } catch (error) {
            alert('Não foi possível processar seus dados.');
        }
    };

    // Criar agendamento
    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        if (!appointmentData.professionalId) {
            alert('Selecione um profissional para continuar.');
            return;
        }
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
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao criar agendamento');
            
            if (data.voucher) {
                setVoucherAgendamento(data.voucher);
                alert(`🎉 Parabéns! Você ganhou um voucher: ${data.voucher}`);
            }
            if (data.status === 'pending' && data.requestId) {
                setPendingRequest({ id: data.requestId, expiresAt: data.expiresAt });
                return;
            }
            setStep(5);
        } catch (error) {
            alert('Não foi possível criar seu agendamento.');
        } finally {
            setLoading(false);
        }
    };

    // Cancelar agendamento
    const cancelAppointment = async (appt) => {
        try {
            const response = await fetch('/api/public/appointment/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: appt.id,
                    customerPhone: customer.phone,
                    tenantId: tenantData.id
                })
            });
            if (!response.ok) throw new Error('Erro ao cancelar');
            setConfirmCancel({ open: false, appointment: null });
            await loadCustomerAppointments(customer.phone);
        } catch (error) {
            alert('Não foi possível cancelar o agendamento.');
        }
    };

    // WhatsApp redirect
    useEffect(() => {
        if (step === 5 && tenantData.phone && customer && appointmentData.date) {
            const timeout = setTimeout(() => {
                const serviceName = services.find(s => s.id === Number(appointmentData.serviceId) || s.id === appointmentData.serviceId)?.name || 'serviço';
                let message = `Concluí meu agendamento do "${serviceName}" para o dia "${formatDateBr(appointmentData.date)}" e hora "${appointmentData.time}"`;
                if (voucherAgendamento) {
                    message += `\n\n🎫 Cupom: ${voucherAgendamento}`;
                }
                const url = `https://wa.me/${String(tenantData.phone).replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
            }, 3000);
            return () => clearTimeout(timeout);
        }
    }, [step, tenantData.phone, customer, appointmentData, voucherAgendamento, services]);

    // Efeitos
    useEffect(() => { if (slug) loadTenantData(); }, [slug]);
    useEffect(() => { if (tenantData.id) loadServices(); }, [tenantData.id]);
    useEffect(() => { if (tenantData.id && step === 4) loadProfessionals(); }, [tenantData.id, step]);
    useEffect(() => { fetchAvailableTimes(); }, [appointmentData.professionalId, appointmentData.date, appointmentData.serviceId]);

    // Renderização condicional
    if (loading) {
        return (
            <div className="customer-portal loading">
                <div className="customer-portal-container">
                    <h2>Carregando...</h2>
                    <p>Aguarde enquanto carregamos os dados</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="customer-portal error">
                <div className="customer-portal-container">
                    <h2>⚠️ Erro</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    // Renderização dos steps
    return (
        <div className="login-page customer-portal-page" style={{ minHeight: '100vh', background: tenantData.backgroundImage
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${tenantData.backgroundImage})`
            : 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
        
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        {tenantData.logo && (
                            <div className="customer-portal-logo">
                                <img src={tenantData.logo} alt={tenantData.name} style={{ maxWidth: 120, maxHeight: 80, margin: '0 auto' }} />
                            </div>
                        )}
                        <h1 className="login-title">{tenantData.name || 'Agendamento Online'}</h1>
                        <p className="login-subtitle">Agende seu horário de forma rápida e fácil</p>
                        {tenantData.phone && <p style={{ marginTop: '10px', fontSize: '16px', color: '#fff' }}>📞 {tenantData.phone}</p>}
                    </div>
                    
                    <div className="portal-progress">
                        <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>1. Identificação</div>
                        <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>2. Meus Agendamentos</div>
                        <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>3. Serviço</div>
                        <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>4. Agendar</div>
                        <div className={`progress-step ${step >= 5 ? 'active' : ''}`}>5. Confirmação</div>
                    </div>
                    
                    <div className="portal-content">
                        {/* CORREÇÃO: Alertas de voucher sempre visíveis na etapa 3 */}
                        {step === 1 && (
                            <div className="customer-portal-step">
                                <h2>Identificação</h2>
                                <form onSubmit={handleCustomerSubmit}>
                                    <div className="form-group">
                                        <label>Telefone *</label>
                                        <input type="tel" placeholder="(99) 99999-9999" value={formatPhone(customerData.phone)} onChange={e => setCustomerData({...customerData, phone: e.target.value.replace(/\D/g, '')})} required />
                                    </div>
                                    {showExtraFields && (
                                        <>
                                            <div className="form-group"><label>Nome Completo *</label><input type="text" value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} required /></div>
                                            <div className="form-group"><label>Data de Nascimento</label><input type="date" value={customerData.birthDate} onChange={e => setCustomerData({...customerData, birthDate: e.target.value})} /></div>
                                            <button type="submit">Continuar</button>
                                        </>
                                    )}
                                    {!showExtraFields && <button type="submit">Continuar</button>}
                                </form>
                            </div>
                        )}
                        
                        {step === 2 && (
                            <div className="customer-portal-step">
                                <h2>Meus Agendamentos</h2>
                                {appointments.length === 0 ? <p>Nenhum agendamento encontrado.</p> : (
                                    <div className="appointments-list">
                                        {appointments.map(appt => (
                                            <div key={appt.id} className="appointment-item">
                                                <div><strong>{appt.service?.name || 'Serviço'}</strong><div>{appt.professionalName || appt.professional?.name}</div><div>{formatDateBr(appt.appointmentDate)} {appt.appointmentTime}</div></div>
                                                <button onClick={() => setConfirmCancel({ open: true, appointment: appt })}>Cancelar</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="button-group"><button onClick={() => setStep(3)}>Novo agendamento</button></div>
                            </div>
                        )}
                        
                        {/* CORREÇÃO: Etapa 3 com alerta de voucher destacado */}
                        {step === 3 && (
                            <div className="customer-portal-step">
                                {voucherAlert && (
                                    <FeedbackMessage message={voucherAlert} type="success" onClose={() => setVoucherAlert('')} />
                                )}
                                <h2>Escolha o Serviço</h2>
                                <p>Olá, {customer?.name}! Selecione o serviço desejado:</p>
                                
                                {availablePromotions.length > 0 && (
                                    <div className="promotion-info-box">
                                        <strong>🎁 Promoções disponíveis para você:</strong>
                                        <ul>
                                            {availablePromotions.map((promo, idx) => (
                                                <li key={promo.id || idx}>
                                                    {promo.motivo === 'aniversariante' && '🎉 '}
                                                    {promo.motivo === 'fidelidade' && '🏅 '}
                                                    <b>{promo.name}</b> - {promo.priceType === 'percentual' ? `${promo.price}%` : `R$ ${promo.price}`}
                                                    {promo.voucher && <span style={{ color: '#2563eb', marginLeft: 8 }}>🎫 Cupom: {promo.voucher}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                <div className="service-cards-grid">
                                    {services.map(service => (
                                        <div key={service.id} className={`service-dashboard-card ui-card ${selectedServiceId === service.id ? 'selected' : ''}`} onClick={() => setSelectedServiceId(service.id)}>
                                            <div className="card-title"><FiScissors /> <span>{service.name}</span></div>
                                            <div><FiClock /> {service.duration} min</div>
                                            <div><FiDollarSign /> R$ {Number(service.price).toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="button-group">
                                    <button className="service-advance-button" disabled={!selectedServiceId} onClick={() => { setAppointmentData({...appointmentData, serviceId: selectedServiceId}); setStep(4); }}>Avançar</button>
                                </div>
                            </div>
                        )}
                        
                        {step === 4 && (
                            <div className="customer-portal-step">
                                <h2>Agendar Serviço</h2>
                                <form onSubmit={handleAppointmentSubmit}>
                                    <div className="form-group">
                                        <label>Profissional *</label>
                                        <div className="professional-list-grid">
                                            {professionals.map(prof => (
                                                <button key={prof.id} type="button" className={`professional-item-card ${String(appointmentData.professionalId) === String(prof.id) ? 'selected' : ''}`} onClick={() => setAppointmentData({...appointmentData, professionalId: prof.id})}>
                                                    <div className="professional-avatar professional-avatar-fallback">{prof.name?.charAt(0).toUpperCase()}</div>
                                                    <span>{prof.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-group"><label>Data *</label><input type="date" value={appointmentData.date} onChange={e => setAppointmentData({...appointmentData, date: e.target.value})} min={new Date().toISOString().split('T')[0]} required /></div>
                                    <div className="form-group">
                                        <label>Horário *</label>
                                        <select value={appointmentData.time} onChange={e => setAppointmentData({...appointmentData, time: e.target.value})} required disabled={loadingTimes}>
                                            <option value="">Selecione um horário</option>
                                            {loadingTimes && <option disabled>Carregando...</option>}
                                            {availableTimes.map(t => <option key={t} value={t}>{t}</option>)}
                                            {overflowTimes.map(t => <option key={t} value={t}>{t} (pendente)</option>)}
                                        </select>
                                    </div>
                                    <div className="button-group"><button type="button" onClick={() => setStep(3)}>Voltar</button><button type="submit" disabled={loading}>Confirmar</button></div>
                                </form>
                            </div>
                        )}
                        
                        {step === 5 && (
                            <div className="customer-portal-step confirmation">
                                <h2>✓ Agendamento Confirmado!</h2>
                                <p>Redirecionando para WhatsApp em instantes...</p>
                                {voucherAgendamento && <div className="promotion-info-box">🎫 Cupom gerado: <strong>{voucherAgendamento}</strong><br />Use na próxima compra!</div>}
                                <div className="confirmation-details">
                                    <h3>Detalhes</h3>
                                    <p><strong>Cliente:</strong> {customer?.name}</p>
                                    <p><strong>Data:</strong> {formatDateBr(appointmentData.date)}</p>
                                    <p><strong>Horário:</strong> {appointmentData.time}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {confirmCancel.open && (
                <div className="confirm-modal-backdrop">
                    <div className="confirm-modal">
                        <h3>Cancelar agendamento?</h3>
                        <div className="confirm-actions">
                            <button className="confirm-btn confirm-no" onClick={() => setConfirmCancel({ open: false, appointment: null })}>Não</button>
                            <button className="confirm-btn confirm-yes" onClick={() => cancelAppointment(confirmCancel.appointment)}>Sim</button>
                        </div>
                    </div>
                </div>
            )}
            
            {pendingRequest && (
                <div className="pending-approval-overlay">
                    <div className="pending-approval-card">
                        <h3>Aguardando confirmação</h3>
                        <p>O barbeiro precisa aprovar seu horário.</p>
                        {pendingCountdown > 0 && <div className="pending-approval-timer">Tempo restante: {Math.floor(pendingCountdown / 60)}:{String(pendingCountdown % 60).padStart(2, '0')}</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerPortal;