import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiScissors, FiClock, FiDollarSign } from 'react-icons/fi';
import './AgendamentoPublico.css';

const formatPhone = (v) => {
    const d = (v || '').replace(/\D/g, '');
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`;
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;
};

const formatDateBr = (v) => {
    if (!v) return '';
    const raw = String(v).split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [y, m, d] = raw.split('-');
        return `${d}/${m}/${y}`;
    }
    const p = new Date(v);
    return isNaN(p) ? String(v) : p.toLocaleDateString('pt-BR');
};

const normalizeUrl = (v) => {
    if (!v) return '';
    const s = String(v);
    if (/^data:/i.test(s) || /^https?:\/\//i.test(s)) return s;
    if (/^\d+$/.test(s)) return `/api/images/image/${s}`;
    return s.startsWith('/') ? s : `/${s}`;
};

const FeedbackMessage = ({ message, type, onClose, duration = 5000 }) => {
    useEffect(() => {
        const t = setTimeout(onClose, duration);
        return () => clearTimeout(t);
    }, [onClose, message, duration]);
    return (
        <div className={`feedback-message feedback-${type}`}>
            <span>{message}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', marginLeft: 12 }}>×</button>
        </div>
    );
};

export default function AgendamentoPublico() {
    const { slug } = useParams();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tenant, setTenant] = useState({ id: null, name: '', logo: '', backgroundImage: '', phone: '' });
    const [customerData, setCustomerData] = useState({ phone: '', name: '', birthDate: '' });
    const [showExtraFields, setShowExtraFields] = useState(false);
    const [customer, setCustomer] = useState(null);
    const [services, setServices] = useState([]);
    const [professionals, setProfessionals] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [appointmentData, setAppointmentData] = useState({ serviceId: '', professionalId: '', date: '', time: '' });
    const [availableTimes, setAvailableTimes] = useState([]);
    const [overflowTimes, setOverflowTimes] = useState([]);
    const [loadingTimes, setLoadingTimes] = useState(false);
    const [timesError,  setTimesError]  = useState('');
    const [promotions, setPromotions] = useState([]);
    const [voucherAlert, setVoucherAlert] = useState('');
    const [voucherDisplayed, setVoucherDisplayed] = useState(false);
    const [voucherAgendamento, setVoucherAgendamento] = useState('');
    const [pendingRequest, setPendingRequest] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState({ open: false, appointment: null });

    const loadTenant = async () => {
        setLoading(true);
        try {
            const r = await fetch(`/api/tenant/slug/${slug}`);
            if (!r.ok) { setError(`Barbearia "${slug}" não encontrada.`); return; }
            const d = await r.json();
            setTenant({ id: d.id, name: d.name || '', logo: normalizeUrl(d.logo), backgroundImage: normalizeUrl(d.backgroundImage), phone: d.phone || '' });
        } catch { setError('Erro ao conectar com o servidor.'); }
        finally { setLoading(false); }
    };

    const loadServices = async (tenantId) => {
        try {
            const r = await fetch(`/api/public/service/${tenantId}`);
            const d = await r.json();
            setServices((d.services || []).map(s => {
                const raw = s.duration || s.duracao;
                let mins = 30;
                if (raw != null) {
                    const parts = String(raw).split(':');
                    mins = parts.length >= 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : parseInt(raw) || 30;
                }
                return { id: s.id, name: s.tipoServico || s.name || 'Serviço', price: parseFloat(s.valor ?? s.price ?? 0) || 0, duration: mins };
            }));
        } catch { /* silent */ }
    };

    const loadProfessionals = async (tenantId) => {
        try {
            const r = await fetch(`/api/public/users/barbers/${tenantId}`);
            const d = await r.json();
            const list = (d.users || []).map(u => ({ id: u.id, name: u.name, imageUrl: u.imageUrl || null }));
            setProfessionals(list);
            if (list.length === 1) {
                setAppointmentData(p => ({ ...p, professionalId: list[0].id }));
            }
        } catch { /* silent */ }
    };

    const loadAppointments = async (phone, tenantId) => {
        try {
            const r = await fetch(`/api/public/appointment/by-customer?customerPhone=${encodeURIComponent(phone)}&tenantId=${tenantId}`);
            const d = await r.json();
            setAppointments(d.appointments || []);
            setStep(d.appointments?.length > 0 ? 2 : 3);
        } catch { setStep(3); }
    };

    const loadPromotions = async (phone, tenantId) => {
        try {
            const r = await fetch(`/api/public/promotion/available?customerPhone=${encodeURIComponent(phone)}&tenantId=${tenantId}`);
            const d = await r.json();
            const promos = d.promotions || [];
            setPromotions(promos);
            if (promos.length > 0) {
                const msg = promos.length === 1
                    ? `🎉 Você tem direito à promoção: ${promos[0].name}!`
                    : `🎉 Você tem ${promos.length} promoções disponíveis!`;
                setVoucherAlert(msg);
            }
            setVoucherDisplayed(false);
        } catch { /* silent */ }
    };

    const fetchTimes = async (professionalId, date, serviceId, tenantId) => {
        if (!professionalId || !date || !serviceId) return;
        setLoadingTimes(true);
        setTimesError('');
        try {
            const params = new URLSearchParams({ professionalId, date, tenantId, serviceId });
            const r = await fetch(`/api/public/appointment/available-times?${params}`);
            const d = await r.json().catch(() => ({}));
            if (!r.ok) {
                setTimesError(d.message || 'Erro ao buscar horários disponíveis.');
                setAvailableTimes([]);
                setOverflowTimes([]);
            } else {
                setAvailableTimes(d.availableTimes || []);
                setOverflowTimes(d.overflowTimes || []);
                if ((d.availableTimes || []).length === 0 && (d.overflowTimes || []).length === 0) {
                    setTimesError('Nenhum horário disponível para esta data.');
                }
            }
        } catch (err) {
            console.error('fetchTimes error:', err);
            setTimesError('Não foi possível carregar os horários. Verifique sua conexão.');
            setAvailableTimes([]);
            setOverflowTimes([]);
        } finally { setLoadingTimes(false); }
    };

    const handleCustomerSubmit = async (e) => {
        e.preventDefault();
        try {
            const r = await fetch('/api/public/customer/get-or-create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...customerData, tenantId: tenant.id }),
            });
            if (!r.ok) throw new Error();
            const d = await r.json();
            if (d.needsName) { setShowExtraFields(true); return; }
            setCustomer(d.customer);
            await loadAppointments(d.customer.phone, tenant.id);
            await loadPromotions(d.customer.phone, tenant.id);
        } catch { alert('Não foi possível processar seus dados.'); }
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        if (!appointmentData.professionalId) { alert('Selecione um profissional para continuar.'); return; }
        setLoading(true);
        try {
            const r = await fetch('/api/public/appointment/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerPhone: customer.phone,
                    serviceId: appointmentData.serviceId,
                    professionalId: appointmentData.professionalId,
                    date: `${appointmentData.date}T${appointmentData.time}:00`,
                    tenantId: tenant.id,
                }),
            });
            const d = await r.json();
            if (!r.ok) throw new Error(d.message || 'Erro ao criar agendamento');
            if (d.voucher) { setVoucherAgendamento(d.voucher); alert(`🎉 Parabéns! Voucher: ${d.voucher}`); }
            if (d.status === 'pending' && d.requestId) { setPendingRequest({ id: d.requestId, expiresAt: d.expiresAt }); return; }
            setStep(5);
        } catch (err) { alert(err.message || 'Não foi possível criar seu agendamento.'); }
        finally { setLoading(false); }
    };

    const cancelAppointment = async (appt) => {
        try {
            const r = await fetch('/api/public/appointment/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentId: appt.id, customerPhone: customer.phone, tenantId: tenant.id }),
            });
            if (!r.ok) throw new Error();
            setConfirmCancel({ open: false, appointment: null });
            await loadAppointments(customer.phone, tenant.id);
        } catch { alert('Não foi possível cancelar o agendamento.'); }
    };

    useEffect(() => { if (slug) loadTenant(); }, [slug]);
    useEffect(() => { if (tenant.id) loadServices(tenant.id); }, [tenant.id]);
    useEffect(() => { if (tenant.id && step === 4) loadProfessionals(tenant.id); }, [tenant.id, step]);
    useEffect(() => {
        setAvailableTimes([]);
        setOverflowTimes([]);
        setTimesError('');
        fetchTimes(appointmentData.professionalId, appointmentData.date, appointmentData.serviceId, tenant.id);
    }, [appointmentData.professionalId, appointmentData.date, appointmentData.serviceId, tenant.id]);

    useEffect(() => {
        if (step === 3 && voucherAlert && !voucherDisplayed) {
            setVoucherDisplayed(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [step, voucherAlert, voucherDisplayed]);

    useEffect(() => {
        if (!pendingRequest || !customer || !tenant.id) return;

        const poll = setInterval(async () => {
            try {
                const r = await fetch(`/api/public/appointment/request/${pendingRequest.id}?customerPhone=${encodeURIComponent(customer.phone)}&tenantId=${tenant.id}`);
                const d = await r.json();
                if (d.status === 'approved') {
                    clearInterval(poll);
                    setPendingRequest(null);
                    setStep(5);
                } else if (d.status === 'rejected' || d.status === 'expired') {
                    clearInterval(poll);
                    setPendingRequest(null);
                    alert(d.status === 'expired' ? 'O tempo de confirmação expirou. Tente outro horário.' : 'Sua solicitação foi recusada. Tente outro horário.');
                }
            } catch { /* silent */ }
        }, 5000);

        return () => clearInterval(poll);
    }, [pendingRequest]);

    const buildWhatsappUrl = () => {
        const svcObj = services.find(s => s.id === Number(appointmentData.serviceId) || s.id === appointmentData.serviceId);
        const svc = svcObj?.name || 'serviço';
        const disc = svcObj ? getServiceDiscount(svcObj) : null;
        const finalPrice = disc ? disc.discounted : svcObj?.price;
        const price = finalPrice != null ? ` — R$ ${Number(finalPrice).toFixed(2)}` : '';
        let msg = `Concluí meu agendamento do "${svc}"${price} para ${formatDateBr(appointmentData.date)} às ${appointmentData.time}`;
        if (voucherAgendamento) msg += `\n\n🎫 Cupom: ${voucherAgendamento}`;
        return `https://wa.me/${String(tenant.phone).replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    };

    const getServiceDiscount = (service) => {
        const applicable = promotions.filter(p => {
            if (p.discountType !== 'desconto_compra') return false;
            const hasSvcX = (p.criteria || []).includes('servico_x');
            if (hasSvcX) {
                return p.serviceX && service.name.toLowerCase().includes(p.serviceX.toLowerCase());
            }
            return true;
        });
        if (!applicable.length) return null;
        const promo = applicable[0];
        const orig = Number(service.price) || 0;
        const discounted = promo.priceType === 'percentual'
            ? orig * (1 - Number(promo.price) / 100)
            : Math.max(0, orig - Number(promo.price));
        return { discounted: Math.round(discounted * 100) / 100, promo };
    };

    const resetBooking = () => {
        setStep(1);
        setCustomerData({ phone: '', name: '', birthDate: '' });
        setShowExtraFields(false);
        setCustomer(null);
        setAppointments([]);
        setSelectedServiceId('');
        setAppointmentData({ serviceId: '', professionalId: '', date: '', time: '' });
        setAvailableTimes([]);
        setOverflowTimes([]);
        setPromotions([]);
        setVoucherAlert('');
        setVoucherDisplayed(false);
        setVoucherAgendamento('');
        setPendingRequest(null);
    };

    const bgStyle = tenant.backgroundImage
        ? { background: `linear-gradient(rgba(0,0,0,0.72),rgba(0,0,0,0.72)), url(${tenant.backgroundImage}) center/cover fixed` }
        : {};

    if (loading && !tenant.id) return (
        <div className="customer-portal" style={bgStyle}>
            <div className="customer-portal-container">
                <div className="login-card" style={{ padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.6)' }}>Carregando...</p>
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="customer-portal" style={bgStyle}>
            <div className="customer-portal-container">
                <div className="login-card" style={{ padding: 40, textAlign: 'center' }}>
                    <p style={{ color: '#f87171', fontSize: '1.1rem' }}>⚠️ {error}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="customer-portal" style={bgStyle}>
            <div className="customer-portal-container">
                <div className="login-card">
                    <div className="login-header">
                        {tenant.logo && <div className="customer-portal-logo"><img src={tenant.logo} alt={tenant.name} /></div>}
                        <h1 className="login-title">{tenant.name || 'Agendamento Online'}</h1>
                        <p className="login-subtitle">Agende seu horário de forma rápida e fácil</p>
                        {tenant.phone && <p style={{ marginTop: 8, color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>📞 {tenant.phone}</p>}
                    </div>

                    <div className="portal-progress">
                        {['Identificação','Agendamentos','Serviço','Agendar','Confirmação'].map((label, i) => (
                            <div key={i} className={`progress-step${step >= i + 1 ? ' active' : ''}`}>{i + 1}. {label}</div>
                        ))}
                    </div>

                    <div className="portal-content">
                        {/* Step 1 — Identificação */}
                        {step === 1 && (
                            <div className="customer-portal-step">
                                <h2>Identificação</h2>
                                <form onSubmit={handleCustomerSubmit}>
                                    <div className="form-group">
                                        <label>Telefone *</label>
                                        <input type="tel" placeholder="(99) 99999-9999" value={formatPhone(customerData.phone)} onChange={e => setCustomerData(p => ({ ...p, phone: e.target.value.replace(/\D/g,'') }))} required />
                                    </div>
                                    {showExtraFields && (
                                        <>
                                            <div className="form-group"><label>Nome completo *</label><input type="text" value={customerData.name} onChange={e => setCustomerData(p => ({ ...p, name: e.target.value }))} required /></div>
                                            <div className="form-group"><label>Data de nascimento</label><input type="date" value={customerData.birthDate} onChange={e => setCustomerData(p => ({ ...p, birthDate: e.target.value }))} /></div>
                                        </>
                                    )}
                                    <button type="submit" className="portal-btn">Continuar</button>
                                </form>
                            </div>
                        )}

                        {/* Step 2 — Agendamentos */}
                        {step === 2 && (
                            <div className="customer-portal-step">
                                <h2>Meus Agendamentos</h2>
                                {appointments.length === 0
                                    ? <p>Nenhum agendamento encontrado.</p>
                                    : (
                                        <div className="appointments-list">
                                            {appointments.map(appt => (
                                                <div key={appt.id} className="appointment-item">
                                                    <div className="appointment-item-info">
                                                        <strong>{appt.service?.name || 'Serviço'}</strong>
                                                        <span>{appt.professionalName || appt.professional?.name}</span>
                                                        <span>{formatDateBr(appt.appointmentDate)} {appt.appointmentTime}</span>
                                                    </div>
                                                    <button className="portal-btn portal-btn-danger" style={{ width: 'auto', padding: '10px 16px', fontSize: '0.85rem' }} onClick={() => setConfirmCancel({ open: true, appointment: appt })}>Cancelar</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                <div className="button-group">
                                    <button className="portal-btn" onClick={() => setStep(3)}>Novo agendamento</button>
                                </div>
                            </div>
                        )}

                        {/* Step 3 — Serviço */}
                        {step === 3 && (
                            <div className="customer-portal-step">
                                {voucherAlert && <FeedbackMessage message={voucherAlert} type="success" onClose={() => setVoucherAlert('')} />}
                                <h2>Escolha o Serviço</h2>
                                {customer?.name && <p>Olá, {customer.name}! Selecione o serviço desejado:</p>}
                                {promotions.length > 0 && (
                                    <div className="promotion-info-box">
                                        <strong>🎁 Promoções disponíveis para você:</strong>
                                        <ul>
                                            {promotions.map((p, i) => (
                                                <li key={p.id || i}>
                                                    {p.motivo === 'aniversariante' && '🎉 '}
                                                    {p.motivo === 'fidelidade' && '🏅 '}
                                                    <b>{p.name}</b> — {p.priceType === 'percentual' ? `${Number(p.price)}%` : `R$ ${Number(p.price).toFixed(2)}`}
                                                    {p.voucher && <span style={{ color: '#60a5fa', marginLeft: 8 }}>🎫 {p.voucher}</span>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="service-cards-grid">
                                    {services.map(s => {
                                        const disc = getServiceDiscount(s);
                                        return (
                                            <div key={s.id} className={`service-card${selectedServiceId === s.id ? ' selected' : ''}`} onClick={() => setSelectedServiceId(s.id)}>
                                                <div className="service-card-name"><FiScissors size={14} /> {s.name}</div>
                                                <div className="service-card-info"><FiClock size={12} /> {s.duration} min</div>
                                                {disc ? (
                                                    <>
                                                        <div className="service-card-info" style={{ textDecoration: 'line-through', opacity: 0.55 }}>
                                                            <FiDollarSign size={12} /> R$ {Number(s.price).toFixed(2)}
                                                        </div>
                                                        <div className="service-card-info" style={{ color: '#4ade80', fontWeight: 700 }}>
                                                            <FiDollarSign size={12} /> R$ {disc.discounted.toFixed(2)}
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="service-card-info"><FiDollarSign size={12} /> R$ {Number(s.price).toFixed(2)}</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="button-group">
                                    <button className="portal-btn" disabled={!selectedServiceId} onClick={() => { setAppointmentData(p => ({ ...p, serviceId: selectedServiceId })); setStep(4); }}>Avançar</button>
                                </div>
                            </div>
                        )}

                        {/* Step 4 — Agendar */}
                        {step === 4 && (
                            <div className="customer-portal-step">
                                <h2>Agendar Serviço</h2>
                                <form onSubmit={handleAppointmentSubmit}>
                                    <div className="form-group" style={{ alignItems: 'center' }}>
                                        <label>Profissional *</label>
                                        <div className="professional-list-grid">
                                            {professionals.map(prof => (
                                                <button key={prof.id} type="button" className={`professional-item-card${String(appointmentData.professionalId) === String(prof.id) ? ' selected' : ''}`} onClick={() => setAppointmentData(p => ({ ...p, professionalId: prof.id }))}>
                                                    {prof.imageUrl
                                                        ? <img src={prof.imageUrl} alt={prof.name} className="professional-avatar-img" />
                                                        : <div className="professional-avatar-fallback">{prof.name?.charAt(0).toUpperCase()}</div>}
                                                    <span>{prof.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Data *</label>
                                        <input type="date" value={appointmentData.date} min={new Date().toISOString().split('T')[0]} onChange={e => setAppointmentData(p => ({ ...p, date: e.target.value }))} required />
                                    </div>
                                    <div className="form-group">
                                        <label>Horário *</label>
                                        <select value={appointmentData.time} onChange={e => setAppointmentData(p => ({ ...p, time: e.target.value }))} required disabled={loadingTimes || (availableTimes.length === 0 && overflowTimes.length === 0)}>
                                            <option value="">{loadingTimes ? 'Carregando...' : 'Selecione um horário'}</option>
                                            {availableTimes.map(t => <option key={t} value={t}>{t}</option>)}
                                            {overflowTimes.map(t => <option key={t} value={t}>{t} (pendente)</option>)}
                                        </select>
                                        {timesError && <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: 4 }}>{timesError}</p>}
                                    </div>
                                    <div className="button-group">
                                        <button type="button" className="portal-btn portal-btn-secondary" onClick={() => setStep(3)}>Voltar</button>
                                        <button type="submit" className="portal-btn" disabled={loading}>Confirmar</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Step 5 — Confirmação */}
                        {step === 5 && (
                            <div className="customer-portal-step confirmation">
                                <h2>✓ Agendamento Confirmado!</h2>
                                {voucherAgendamento && (
                                    <div className="promotion-info-box">
                                        🎫 Cupom gerado: <strong>{voucherAgendamento}</strong><br />Use na próxima visita!
                                    </div>
                                )}
                                <div className="confirmation-details">
                                    <h3>Detalhes</h3>
                                    <p><strong>Cliente:</strong> {customer?.name}</p>
                                    <p><strong>Data:</strong> {formatDateBr(appointmentData.date)}</p>
                                    <p><strong>Horário:</strong> {appointmentData.time}</p>
                                </div>
                                {tenant.phone && (
                                    <div className="button-group">
                                        <a href={buildWhatsappUrl()} target="_blank" rel="noopener noreferrer" className="portal-btn" style={{ textDecoration: 'none' }}>
                                            📲 Avisar pelo WhatsApp
                                        </a>
                                    </div>
                                )}
                                <div className="button-group" style={{ marginTop: 12 }}>
                                    <button className="portal-btn portal-btn-new" onClick={resetBooking}>
                                        + Novo Agendamento
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {pendingRequest && (
                        <div className="pending-approval-overlay">
                            <div className="pending-approval-card">
                                <h3>Aguardando confirmação</h3>
                                <p>O barbeiro precisa aprovar seu horário.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {confirmCancel.open && (
                <div className="confirm-modal-backdrop">
                    <div className="confirm-modal">
                        <h3>Cancelar agendamento?</h3>
                        <p>Esta ação não pode ser desfeita.</p>
                        <div className="confirm-actions">
                            <button className="portal-btn portal-btn-secondary" onClick={() => setConfirmCancel({ open: false, appointment: null })}>Não</button>
                            <button className="portal-btn portal-btn-danger" onClick={() => cancelAppointment(confirmCancel.appointment)}>Sim, cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
