import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FiScissors, FiClock, FiDollarSign, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import './AgendamentoPublico.css';
import apiFetch from '../../services/api';

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEK_LABELS = ['D','S','T','Q','Q','S','S'];

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

function MiniCalendar({ year, month, availableDays, selectedDate, onSelect, loadingDays, onPrev, onNext, canGoPrev }) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstWeekday = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return (
        <div className="portal-calendar">
            <div className="portal-calendar-nav">
                <button type="button" className="portal-cal-nav-btn" onClick={onPrev} disabled={!canGoPrev}>
                    <FiChevronLeft size={16} />
                </button>
                <span className="portal-cal-month-label">{MONTH_NAMES[month - 1]} {year}</span>
                <button type="button" className="portal-cal-nav-btn" onClick={onNext}>
                    <FiChevronRight size={16} />
                </button>
            </div>
            <div className="portal-calendar-weekdays">
                {WEEK_LABELS.map((l, i) => <span key={i}>{l}</span>)}
            </div>
            {loadingDays ? (
                <div className="portal-cal-loading">Carregando dias...</div>
            ) : (
                <div className="portal-calendar-grid">
                    {cells.map((day, i) => {
                        if (!day) return <span key={i} className="portal-cal-day portal-cal-empty" />;
                        const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                        const dateObj = new Date(year, month - 1, day);
                        const isPast = dateObj < today;
                        const isAvailable = !isPast && availableDays.includes(dateStr);
                        const isSelected = selectedDate === dateStr;

                        let cls = 'portal-cal-day';
                        if (isPast || !isAvailable) cls += ' portal-cal-day--off';
                        else cls += ' portal-cal-day--on';
                        if (isSelected) cls += ' portal-cal-day--selected';

                        return (
                            <button
                                key={i}
                                type="button"
                                className={cls}
                                disabled={isPast || !isAvailable}
                                onClick={() => onSelect(dateStr)}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

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
    const [timesError, setTimesError] = useState('');
    const [promotions, setPromotions] = useState([]);
    const [voucherAlert, setVoucherAlert] = useState('');
    const [voucherDisplayed, setVoucherDisplayed] = useState(false);
    const [voucherAgendamento, setVoucherAgendamento] = useState('');
    const [pendingRequest, setPendingRequest] = useState(null);
    const [confirmCancel, setConfirmCancel] = useState({ open: false, appointment: null });
    const [whatsappConnected, setWhatsappConnected] = useState(false);

    // Planos de serviço
    const [portalTab,      setPortalTab]      = useState('agendamentos'); // 'agendamentos' | 'planos'
    const [clientPlans,    setClientPlans]     = useState([]);
    const [availablePlans, setAvailablePlans]  = useState([]);
    const [planLoading,    setPlanLoading]     = useState(false);
    const [subscribeResult, setSubscribeResult] = useState(null); // {pixEmv, plan, clientPlanId}
    const [subscribeError,  setSubscribeError]  = useState('');
    const [copiedPix,      setCopiedPix]       = useState(false);

    // Calendar state
    const now = new Date();
    const [calendarYear, setCalendarYear] = useState(now.getFullYear());
    const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1);
    const [availableDays, setAvailableDays] = useState([]);
    const [loadingDays, setLoadingDays] = useState(false);
    const timeSlotsRef = useRef(null);

    const loadTenant = async () => {
        setLoading(true);
        try {
            const r = await fetch(`/api/tenant/slug/${slug}`);
            if (!r.ok) { setError(`Barbearia "${slug}" não encontrada.`); return; }
            const d = await r.json();
            setTenant({ id: d.id, name: d.name || '', logo: normalizeUrl(d.logo), backgroundImage: normalizeUrl(d.backgroundImage), phone: d.phone || '' });
            fetch(`/api/public/whatsapp/status?tenantId=${d.id}`)
                .then(res => res.json())
                .then(ws => setWhatsappConnected(ws.connected === true))
                .catch(() => {});
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
            const appointments = d.appointments || [];
            setAppointments(appointments);
            setPortalTab(appointments.length > 0 ? 'agendamentos' : 'planos');
            setStep(2);
        } catch {
            setPortalTab('planos');
            setStep(2);
        }
    };

    const loadPlans = async (phone, tenantId) => {
        setPlanLoading(true);
        try {
            const [cpRes, apRes] = await Promise.all([
                fetch(`/api/public/service-plans/client?customerPhone=${encodeURIComponent(phone)}&tenantId=${tenantId}`),
                fetch(`/api/public/service-plans/available?tenantId=${tenantId}`),
            ]);
            const cpData = await cpRes.json().catch(() => ({}));
            const apData = await apRes.json().catch(() => ({}));
            setClientPlans(cpData.plans || []);
            setAvailablePlans(apData.plans || []);
        } catch { /* silent */ }
        finally { setPlanLoading(false); }
    };

    const handleSubscribe = async (planId) => {
        setSubscribeError('');
        setSubscribeResult(null);
        try {
            const plan = availablePlans.find(p => String(p.id) === String(planId));
            const r = await fetch('/api/public/service-plans/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerPhone: customer.phone,
                    customerName: customer.name,
                    planId,
                    planName: plan?.name || '',
                    tenantId: tenant.id,
                }),
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.message || 'Erro ao contratar plano.');
            setSubscribeResult(d);
        } catch (e) { setSubscribeError(e.message); }
    };

    const copyPix = (text) => {
        navigator.clipboard.writeText(text).then(() => { setCopiedPix(true); setTimeout(() => setCopiedPix(false), 2500); });
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

    const fetchAvailableDays = async (professionalId, year, month, tenantId, serviceId) => {
        if (!professionalId || !tenantId) { setAvailableDays([]); return; }
        setLoadingDays(true);
        setAvailableDays([]);
        try {
            const params = new URLSearchParams({ professionalId, year, month, tenantId });
            if (serviceId) params.set('serviceId', serviceId);
            const r = await apiFetch(`/api/public/appointment/available-days?${params}`);
            const d = await r.json().catch(() => ({}));
            if (!r.ok) {
                console.error('Erro ao buscar dias disponíveis:', r.status, d);
                setAvailableDays([]);
            } else {
                setAvailableDays(d.availableDays || []);
            }
        } catch { setAvailableDays([]); }
        finally { setLoadingDays(false); }
    };

    const fetchTimes = async (professionalId, date, serviceId, tenantId) => {
        if (!professionalId || !date || !serviceId) return;
        setLoadingTimes(true);
        setTimesError('');
        try {
            const params = new URLSearchParams({ professionalId, date, tenantId, serviceId });
            const r = await apiFetch(`/api/public/appointment/available-times?${params}`);
            const d = await r.json().catch(() => ({}));
            if (!r.ok) {
                console.error('Erro ao buscar horários disponíveis:', r.status, d);
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
            await Promise.all([
                loadPromotions(d.customer.phone, tenant.id),
                loadPlans(d.customer.phone, tenant.id),
            ]);
        } catch { alert('Não foi possível processar seus dados.'); }
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        if (!appointmentData.professionalId) { alert('Selecione um profissional para continuar.'); return; }
        if (!appointmentData.date) { alert('Selecione uma data para continuar.'); return; }
        if (!appointmentData.time) { alert('Selecione um horário para continuar.'); return; }
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

    const handlePrevMonth = () => {
        const todayNow = new Date();
        if (calendarYear === todayNow.getFullYear() && calendarMonth === todayNow.getMonth() + 1) return;
        if (calendarMonth === 1) { setCalendarYear(y => y - 1); setCalendarMonth(12); }
        else setCalendarMonth(m => m - 1);
    };
    const handleNextMonth = () => {
        if (calendarMonth === 12) { setCalendarYear(y => y + 1); setCalendarMonth(1); }
        else setCalendarMonth(m => m + 1);
    };

    const canGoPrev = !(calendarYear === now.getFullYear() && calendarMonth === now.getMonth() + 1);

    useEffect(() => { if (slug) loadTenant(); }, [slug]);
    useEffect(() => { if (tenant.id) loadServices(tenant.id); }, [tenant.id]);
    useEffect(() => { if (tenant.id && step === 4) loadProfessionals(tenant.id); }, [tenant.id, step]);

    // Fetch available days when professional or month changes
    useEffect(() => {
        if (step === 4 && appointmentData.professionalId && tenant.id) {
            fetchAvailableDays(appointmentData.professionalId, calendarYear, calendarMonth, tenant.id, appointmentData.serviceId);
        } else {
            setAvailableDays([]);
        }
    }, [appointmentData.professionalId, calendarYear, calendarMonth, tenant.id, step]);

    // Fetch time slots when date changes
    useEffect(() => {
        setAvailableTimes([]);
        setOverflowTimes([]);
        setTimesError('');
        fetchTimes(appointmentData.professionalId, appointmentData.date, appointmentData.serviceId, tenant.id);
    }, [appointmentData.professionalId, appointmentData.date, appointmentData.serviceId, tenant.id]);

    // Scroll to time slots when they load
    useEffect(() => {
        if (appointmentData.date && !loadingTimes && timeSlotsRef.current) {
            setTimeout(() => timeSlotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
        }
    }, [appointmentData.date, loadingTimes]);

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
                if (d.status === 'approved') { clearInterval(poll); setPendingRequest(null); setStep(5); }
                else if (d.status === 'rejected' || d.status === 'expired') {
                    clearInterval(poll); setPendingRequest(null);
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
            if (p.discountType === 'combo_servico') {
                return p.rewardServiceName &&
                    service.name.toLowerCase().includes(p.rewardServiceName.toLowerCase());
            }
            if (p.discountType !== 'desconto_compra') return false;
            const hasSvcX = (p.criteria || []).includes('servico_x');
            if (hasSvcX) return p.serviceX && service.name.toLowerCase().includes(p.serviceX.toLowerCase());
            return true;
        });
        if (!applicable.length) return null;
        const promo = applicable[0];
        const orig = Number(service.price) || 0;
        let discounted;
        if (promo.priceType === 'gratis') {
            discounted = 0;
        } else if (promo.priceType === 'percentual') {
            discounted = orig * (1 - Number(promo.price) / 100);
        } else {
            discounted = Math.max(0, orig - Number(promo.price));
        }
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
        setAvailableDays([]);
        setPromotions([]);
        setVoucherAlert('');
        setVoucherDisplayed(false);
        setVoucherAgendamento('');
        setPendingRequest(null);
        const n = new Date();
        setCalendarYear(n.getFullYear());
        setCalendarMonth(n.getMonth() + 1);
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

                        {/* Step 2 — Agendamentos + Planos */}
                        {step === 2 && (
                            <div className="customer-portal-step">
                                {/* Tab switcher */}
                                <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.15)', marginBottom: '1.25rem' }}>
                                    {[['agendamentos', 'Agendamentos'], ['planos', 'Meus Planos']].map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => setPortalTab(key)}
                                            style={{
                                                flex: 1, padding: '0.55rem', fontSize: '0.88rem', fontWeight: 500,
                                                color: portalTab === key ? '#f59e0b' : 'rgba(255,255,255,0.55)',
                                                borderBottom: portalTab === key ? '2px solid #f59e0b' : '2px solid transparent',
                                                background: 'none', border: 'none', borderRadius: 0, cursor: 'pointer', marginBottom: -1,
                                            }}
                                        >{label}{key === 'planos' && clientPlans.length > 0 && <span style={{ marginLeft: 5, fontSize: '0.72rem', background: '#22c55e', color: '#fff', borderRadius: 99, padding: '1px 7px' }}>{clientPlans.length}</span>}</button>
                                    ))}
                                </div>

                                {/* ── Aba: Agendamentos ── */}
                                {portalTab === 'agendamentos' && (
                                    <>
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
                                    </>
                                )}

                                {/* ── Aba: Planos ── */}
                                {portalTab === 'planos' && (
                                    <div>
                                        {/* Plano ativo */}
                                        {clientPlans.length > 0 && (
                                            <div style={{ marginBottom: '1.5rem' }}>
                                                <h2 style={{ marginBottom: '0.75rem' }}>Planos Ativos</h2>
                                                {clientPlans.map(cp => {
                                                    const hasAvailable = (cp.services || []).some(s => s.maxUsages == null || Number(s.usedCount || 0) < Number(s.maxUsages || 0));
                                                    return (
                                                        <div key={cp.id} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '1rem', marginBottom: '0.75rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: '1rem' }}>
                                                                <div>
                                                                    <strong style={{ fontSize: '1rem' }}>{cp.servicePlan?.name}</strong>
                                                                    {cp.endDate && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>Válido até {cp.endDate.split('-').reverse().join('/')}</p>}
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                                                    <span style={{ fontSize: '0.72rem', padding: '3px 10px', borderRadius: 99, background: cp.status === 'active' ? '#22c55e33' : '#f59e0b33', color: cp.status === 'active' ? '#22c55e' : '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                        {cp.status === 'active' ? 'ATIVO' : 'AGUARDANDO PAGAMENTO'}
                                                                    </span>
                                                                    {cp.status === 'active' && (
                                                                        <span style={{ fontSize: '0.7rem', color: hasAvailable ? '#a3e635' : '#f87171' }}>
                                                                            {hasAvailable ? 'Serviços disponíveis' : 'Sem serviços disponíveis'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {(cp.services || []).map((s, i) => {
                                                                const pct = s.maxUsages ? Math.min(100, (s.usedCount / s.maxUsages) * 100) : 0;
                                                                return (
                                                                    <div key={i} style={{ marginBottom: 8 }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 3 }}>
                                                                            <span>{s.serviceName}</span>
                                                                            <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                                                                                {s.maxUsages == null ? 'Ilimitado' : `${s.usedCount}/${s.maxUsages} usos`}
                                                                            </span>
                                                                        </div>
                                                                        {s.maxUsages !== null && (
                                                                            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
                                                                                <div style={{ height: '100%', width: `${100 - pct}%`, background: pct >= 100 ? '#ef4444' : '#22c55e', borderRadius: 99, transition: 'width 0.3s' }} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                            {cp.status === 'active' && hasAvailable && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const firstAvailable = (cp.services || []).find(s => s.maxUsages == null || Number(s.usedCount || 0) < Number(s.maxUsages || 0));
                                                                        const serviceObj = services.find(svc => String(svc.id) === String(firstAvailable.serviceId) || svc.name?.toLowerCase() === String(firstAvailable.serviceName || '').toLowerCase());
                                                                        if (!serviceObj) {
                                                                            alert('Serviço do plano não está disponível para agendamento.');
                                                                            return;
                                                                        }
                                                                        setAppointmentData(prev => ({ ...prev, serviceId: serviceObj.id, date: '', time: '' }));
                                                                        setStep(4);
                                                                    }}
                                                                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, background: '#3b82f6', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.85rem', marginTop: 8 }}
                                                                >
                                                                    Agendar com plano
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Resultado de contratação */}
                                        {subscribeResult && (
                                            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e55', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem' }}>
                                                <p style={{ fontWeight: 600, marginBottom: 10 }}>✅ Plano contratado: {subscribeResult.plan?.name}</p>
                                                
                                                <div style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, padding: '0.75rem', marginBottom: 10, fontSize: '0.82rem', color: '#fbbf24' }}>
                                                    ⏳ <strong>Aguardando aprovação do barbeiro</strong><br/>
                                                    Após confirmar o pagamento, o barbeiro aprovará seu plano. Você poderá usá-lo para agendar após a aprovação.
                                                </div>

                                                {subscribeResult.pixEmv ? (
                                                    <>
                                                        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginBottom: 8 }}>
                                                            📋 Código PIX para pagamento:
                                                        </p>
                                                        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', marginBottom: 8, color: '#fbbf24' }}>
                                                            {subscribeResult.pixEmv}
                                                        </div>
                                                        <button
                                                            onClick={() => copyPix(subscribeResult.pixEmv)}
                                                            style={{ width: '100%', padding: '10px', borderRadius: 8, background: copiedPix ? '#22c55e' : '#f59e0b', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.88rem', marginBottom: 8 }}
                                                        >
                                                            {copiedPix ? '✓ Código copiado!' : '📋 Copiar código PIX'}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.65)', marginBottom: 10 }}>
                                                        Combine o pagamento diretamente com a barbearia.
                                                    </p>
                                                )}
                                                
                                                <button onClick={() => { setSubscribeResult(null); loadPlans(customer.phone, tenant.id); }} style={{ width: '100%', background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: '0.78rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                                    Fechar
                                                </button>
                                            </div>
                                        )}

                                        {subscribeError && (
                                            <div style={{ color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef444444', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                                {subscribeError}
                                            </div>
                                        )}

                                        {/* Planos disponíveis */}
                                        <h2 style={{ marginBottom: '0.75rem' }}>Planos disponíveis</h2>
                                        {planLoading ? (
                                            <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '1rem' }}>Carregando planos...</p>
                                        ) : availablePlans.length === 0 ? (
                                            <p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: '1rem' }}>Nenhum plano disponível no momento.</p>
                                        ) : (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem', justifyItems: 'center', maxWidth: '600px', margin: '0 auto' }}>
                                                {availablePlans.map(plan => (
                                                    <div key={plan.id} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '0.5rem 0.6rem', width: '100%', maxWidth: '280px' }}>
                                                        <div style={{ marginBottom: 4 }}>
                                                            <strong style={{ fontSize: '0.8rem', lineHeight: 1.2 }}>{plan.name}</strong>
                                                            {plan.description && <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', margin: '2px 0 0' }}>{plan.description}</p>}
                                                        </div>
                                                        <div style={{ textAlign: 'center', marginBottom: 6 }}>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b', lineHeight: 1.1 }}>
                                                                R$ {Number(plan.price).toFixed(2).replace('.', ',')}
                                                            </div>
                                                            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>
                                                                {plan.billingPeriod === 'monthly' ? '/mês' : plan.billingPeriod === 'annual' ? '/ano' : plan.billingPeriod === 'quarterly' ? '/trim.' : ''}
                                                            </div>
                                                        </div>
                                                        {(plan.services || []).length > 0 && (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6, justifyContent: 'center' }}>
                                                                {(plan.services || []).map((s, i) => (
                                                                    <span key={i} style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: 99, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                                                                        {s.serviceName} {s.maxUsages ? `× ${s.maxUsages}` : '∞'}
                                                                    </span>
                                                                ))}
                                                                {plan.validityDays && <span style={{ fontSize: '0.6rem', padding: '1px 5px', borderRadius: 99, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>{plan.validityDays} dias</span>}
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => handleSubscribe(plan.id)}
                                                            style={{ width: '100%', padding: '6px 12px', borderRadius: 6, background: '#f59e0b', color: '#000', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '0.75rem', lineHeight: 1.2 }}
                                                        >
                                                            Contratar plano
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <button className="portal-btn" onClick={() => setStep(3)}>Novo agendamento</button>
                                        </div>
                                    </div>
                                )}
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
                                                            {disc.discounted === 0
                                                                ? '🎁 GRÁTIS'
                                                                : <><FiDollarSign size={12} /> R$ {disc.discounted.toFixed(2)}</>
                                                            }
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
                                    {/* Profissional */}
                                    <div className="form-group">
                                        <label>Profissional *</label>
                                        <div className="professional-list-grid">
                                            {professionals.map(prof => (
                                                <button
                                                    key={prof.id}
                                                    type="button"
                                                    className={`professional-item-card${String(appointmentData.professionalId) === String(prof.id) ? ' selected' : ''}`}
                                                    onClick={() => setAppointmentData(p => ({ ...p, professionalId: prof.id, date: '', time: '' }))}
                                                >
                                                    {prof.imageUrl
                                                        ? <img src={prof.imageUrl} alt={prof.name} className="professional-avatar-img" />
                                                        : <div className="professional-avatar-fallback">{prof.name?.charAt(0).toUpperCase()}</div>}
                                                    <span>{prof.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Calendário */}
                                    {appointmentData.professionalId ? (
                                        <div className="form-group">
                                            <label>Data *</label>
                                            <MiniCalendar
                                                year={calendarYear}
                                                month={calendarMonth}
                                                availableDays={availableDays}
                                                selectedDate={appointmentData.date}
                                                onSelect={(dateStr) => setAppointmentData(p => ({ ...p, date: dateStr, time: '' }))}
                                                loadingDays={loadingDays}
                                                onPrev={handlePrevMonth}
                                                onNext={handleNextMonth}
                                                canGoPrev={canGoPrev}
                                            />
                                            {!loadingDays && availableDays.length === 0 && (
                                                <p className="portal-cal-no-days">Nenhum dia disponível neste mês.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="portal-cal-hint">Selecione um profissional para ver o calendário.</p>
                                    )}

                                    {/* Horários */}
                                    {appointmentData.date && (
                                        <div className="form-group" ref={timeSlotsRef}>
                                            <label>
                                                Horário * <span className="portal-slots-date">— {formatDateBr(appointmentData.date)}</span>
                                            </label>
                                            {loadingTimes ? (
                                                <p className="portal-slots-loading">Carregando horários...</p>
                                            ) : timesError ? (
                                                <p className="portal-slots-error">{timesError}</p>
                                            ) : (
                                                <div className="portal-timeslots">
                                                    {availableTimes.map(t => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            className={`timeslot-btn${appointmentData.time === t ? ' timeslot-btn--selected' : ''}`}
                                                            onClick={() => setAppointmentData(p => ({ ...p, time: t }))}
                                                        >
                                                            {t}
                                                        </button>
                                                    ))}
                                                    {overflowTimes.map(t => (
                                                        <button
                                                            key={t}
                                                            type="button"
                                                            className={`timeslot-btn timeslot-btn--overflow${appointmentData.time === t ? ' timeslot-btn--selected' : ''}`}
                                                            onClick={() => setAppointmentData(p => ({ ...p, time: t }))}
                                                            title="Excede o expediente — sujeito à confirmação"
                                                        >
                                                            {t} *
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {overflowTimes.length > 0 && (
                                                <p className="portal-slots-overflow-note">* Horários fora do expediente estão sujeitos à confirmação do profissional.</p>
                                            )}
                                        </div>
                                    )}

                                    <div className="button-group">
                                        <button type="button" className="portal-btn portal-btn-secondary" onClick={() => setStep(3)}>Voltar</button>
                                        <button
                                            type="submit"
                                            className="portal-btn"
                                            disabled={loading || !appointmentData.date || !appointmentData.time}
                                        >
                                            Confirmar
                                        </button>
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
                                {tenant.phone && !whatsappConnected && (
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
