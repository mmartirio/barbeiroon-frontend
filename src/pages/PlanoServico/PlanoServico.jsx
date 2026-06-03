import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiPackage, FiUsers } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const BILLING_LABELS = { oneTime: 'Pagamento único', monthly: 'Mensal', quarterly: 'Trimestral', annual: 'Anual' };
const TYPE_LABELS     = { package: 'Pacote', subscription: 'Assinatura' };
const STATUS_LABELS   = { pending_payment: 'Aguardando pagamento', active: 'Ativo', expired: 'Expirado', cancelled: 'Cancelado', paused: 'Pausado' };
const STATUS_COLORS   = { pending_payment: '#f59e0b', active: '#22c55e', expired: '#6b7280', cancelled: '#ef4444', paused: '#3b82f6' };

const fmtBRL  = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtDate = (d) => { if (!d) return '—'; const [y,m,dy] = String(d).split('T')[0].split('-'); return `${dy}/${m}/${y}`; };

const EMPTY_FORM = {
    name: '', description: '', price: '', type: 'package',
    billingPeriod: 'oneTime', validityDays: '', isActive: true,
    services: [],
};

export default function PlanoServico() {
    const [tab, setTab]               = useState('planos');
    const [plans, setPlans]           = useState([]);
    const [clientPlans, setClientPlans] = useState([]);
    const [tenantServices, setTenantServices] = useState([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');
    const [showForm, setShowForm]     = useState(false);
    const [editingId, setEditingId]   = useState(null);
    const [form, setForm]             = useState(EMPTY_FORM);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [subFilter, setSubFilter]   = useState('');
    const [subPage, setSubPage]       = useState(1);
    const [subTotal, setSubTotal]     = useState(0);

    const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

    const loadPlans = useCallback(async () => {
        setLoading(true);
        try {
            const r = await fetch('/api/service-plans/', { headers: { Authorization: `Bearer ${tok()}` } });
            const d = await r.json().catch(() => ({}));
            setPlans(d.plans || []);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, []);

    const loadClientPlans = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: subPage, limit: 30 });
            if (subFilter) params.set('status', subFilter);
            const r = await fetch(`/api/service-plans/client-plans/list?${params}`, { headers: { Authorization: `Bearer ${tok()}` } });
            const d = await r.json().catch(() => ({}));
            setClientPlans(d.items || []);
            setSubTotal(d.total || 0);
        } catch { /* silent */ }
        finally { setLoading(false); }
    }, [subFilter, subPage]);

    const loadTenantServices = useCallback(async () => {
        try {
            const r = await fetch('/api/service/', { headers: { Authorization: `Bearer ${tok()}` } });
            const d = await r.json().catch(() => ({}));
            setTenantServices(d.services || d || []);
        } catch { /* silent */ }
    }, []);

    useEffect(() => { loadTenantServices(); }, [loadTenantServices]);
    useEffect(() => { if (tab === 'planos') loadPlans(); else loadClientPlans(); }, [tab, loadPlans, loadClientPlans]);

    const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setError(''); setShowForm(true); };

    const openEdit = (plan) => {
        setEditingId(plan.id);
        setForm({
            name: plan.name || '',
            description: plan.description || '',
            price: String(plan.price || ''),
            type: plan.type || 'package',
            billingPeriod: plan.billingPeriod || 'oneTime',
            validityDays: plan.validityDays ? String(plan.validityDays) : '',
            isActive: plan.isActive !== false,
            services: Array.isArray(plan.services) ? plan.services : [],
        });
        setError('');
        setShowForm(true);
    };

    const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_FORM); setError(''); };

    const toggleService = (svcId, svcName, checked) => {
        setForm(p => {
            const existing = p.services.filter(s => s.serviceId !== svcId);
            if (!checked) return { ...p, services: existing };
            return { ...p, services: [...existing, { serviceId: svcId, serviceName: svcName, maxUsages: null }] };
        });
    };

    const setServiceMaxUsages = (svcId, val) => {
        setForm(p => ({
            ...p,
            services: p.services.map(s =>
                s.serviceId === svcId ? { ...s, maxUsages: val === '' || val === '0' ? null : Number(val) } : s
            ),
        }));
    };

    const handleSave = async () => {
        setError(''); setSaving(true);
        try {
            const url    = editingId ? `/api/service-plans/${editingId}` : '/api/service-plans/';
            const method = editingId ? 'PUT' : 'POST';
            const payload = {
                ...form,
                price: Number(form.price) || 0,
                validityDays: form.validityDays ? Number(form.validityDays) : null,
            };
            const r = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
                body: JSON.stringify(payload),
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.message || 'Erro ao salvar plano.');
            setSuccess(editingId ? 'Plano atualizado!' : 'Plano criado!');
            closeForm();
            loadPlans();
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        setSaving(true);
        try {
            const r = await fetch(`/api/service-plans/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.message || 'Erro ao excluir.');
            setSuccess('Plano excluído.');
            setDeleteConfirm(null);
            loadPlans();
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) { setError(e.message); setDeleteConfirm(null); }
        finally { setSaving(false); }
    };

    const handleActivate = async (id) => {
        try {
            const r = await fetch(`/api/service-plans/client-plans/${id}/activate`, {
                method: 'PUT', headers: { Authorization: `Bearer ${tok()}` },
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.message || 'Erro ao ativar.');
            setSuccess('Plano ativado com sucesso!');
            loadClientPlans();
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) { setError(e.message); }
    };

    const handleCancelSub = async (id) => {
        if (!window.confirm('Cancelar esta assinatura?')) return;
        try {
            const r = await fetch(`/api/service-plans/client-plans/${id}/cancel`, {
                method: 'PUT', headers: { Authorization: `Bearer ${tok()}` },
            });
            const d = await r.json().catch(() => ({}));
            if (!r.ok) throw new Error(d.message || 'Erro ao cancelar.');
            setSuccess('Assinatura cancelada.');
            loadClientPlans();
            setTimeout(() => setSuccess(''), 4000);
        } catch (e) { setError(e.message); }
    };

    return (
        <Layout title="Planos de Serviço">
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
                {[['planos', <FiPackage size={14} />, 'Meus Planos'], ['assinaturas', <FiUsers size={14} />, 'Assinaturas']].map(([key, icon, label]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '0.6rem 1.25rem', fontSize: '0.9rem', fontWeight: 500,
                            color: tab === key ? 'var(--accent)' : 'var(--color-muted)',
                            borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                            background: 'none', border: 'none', borderRadius: 0, cursor: 'pointer', marginBottom: -1,
                        }}
                    >{icon} {label}</button>
                ))}
            </div>

            {error   && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

            {/* ─── ABA: PLANOS ─── */}
            {tab === 'planos' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <FiPlus size={14} /> Novo Plano
                        </button>
                    </div>

                    {loading ? (
                        <p style={{ color: 'var(--color-muted)' }}>Carregando...</p>
                    ) : plans.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-muted)' }}>
                            <FiPackage size={36} style={{ marginBottom: 8, opacity: 0.4 }} />
                            <p>Nenhum plano criado ainda.</p>
                            <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ marginTop: 8 }}>Criar primeiro plano</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {plans.map(plan => (
                                <div key={plan.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <strong style={{ fontSize: '0.95rem' }}>{plan.name}</strong>
                                                <span style={{
                                                    fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99,
                                                    background: plan.isActive ? '#22c55e22' : '#6b728022',
                                                    color: plan.isActive ? '#22c55e' : '#6b7280',
                                                }}>{plan.isActive ? 'Ativo' : 'Inativo'}</span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                                                    {TYPE_LABELS[plan.type]} · {BILLING_LABELS[plan.billingPeriod]}
                                                </span>
                                            </div>
                                            {plan.description && <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', margin: '0 0 6px' }}>{plan.description}</p>}
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                {(plan.services || []).map((s, i) => (
                                                    <span key={i} style={{
                                                        fontSize: '0.75rem', padding: '2px 10px', borderRadius: 99,
                                                        background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--color-text)',
                                                    }}>
                                                        {s.serviceName || `Serviço ${s.serviceId}`} — {s.maxUsages ? `${s.maxUsages}×` : '∞'}
                                                    </span>
                                                ))}
                                            </div>
                                            {plan.validityDays && (
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 4 }}>
                                                    Validade: {plan.validityDays} dias após ativação
                                                </p>
                                            )}
                                        </div>
                                        <div style={{ textAlign: 'right', minWidth: 100 }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)' }}>{fmtBRL(plan.price)}</div>
                                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 8 }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(plan)} title="Editar">
                                                    <FiEdit2 size={13} />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirm(plan.id)} title="Excluir" style={{ color: '#ef4444' }}>
                                                    <FiTrash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ─── ABA: ASSINATURAS ─── */}
            {tab === 'assinaturas' && (
                <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <select
                            className="form-input"
                            style={{ width: 'auto', fontSize: '0.85rem' }}
                            value={subFilter}
                            onChange={e => { setSubFilter(e.target.value); setSubPage(1); }}
                        >
                            <option value="">Todos os status</option>
                            <option value="pending_payment">Aguardando pagamento</option>
                            <option value="active">Ativos</option>
                            <option value="expired">Expirados</option>
                            <option value="cancelled">Cancelados</option>
                        </select>
                        <span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{subTotal} assinatura(s)</span>
                    </div>

                    {loading ? (
                        <p style={{ color: 'var(--color-muted)' }}>Carregando...</p>
                    ) : clientPlans.length === 0 ? (
                        <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: '2rem' }}>Nenhuma assinatura encontrada.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {clientPlans.map(cp => (
                                <div key={cp.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                                <strong style={{ fontSize: '0.88rem' }}>{cp.customerPhone}</strong>
                                                <span style={{
                                                    fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99,
                                                    background: `${STATUS_COLORS[cp.status]}22`,
                                                    color: STATUS_COLORS[cp.status],
                                                }}>{STATUS_LABELS[cp.status] || cp.status}</span>
                                            </div>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--color-text)', margin: '0 0 4px' }}>
                                                {cp.servicePlan?.name || '—'} · {fmtBRL(cp.servicePlan?.price)}
                                            </p>
                                            {cp.startDate && (
                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                                                    {fmtDate(cp.startDate)} → {cp.endDate ? fmtDate(cp.endDate) : 'Sem data fim'}
                                                </p>
                                            )}
                                            {cp.services?.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                                    {cp.services.map((s, i) => (
                                                        <span key={i} style={{ fontSize: '0.72rem', padding: '1px 8px', borderRadius: 99, background: 'var(--bg-input)', border: '1px solid var(--border)' }}>
                                                            {s.serviceName}: {s.usedCount}/{s.maxUsages ?? '∞'}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                            {cp.status === 'pending_payment' && (
                                                <button className="btn btn-primary btn-sm" onClick={() => handleActivate(cp.id)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <FiCheck size={12} /> Ativar
                                                </button>
                                            )}
                                            {['active', 'paused', 'pending_payment'].includes(cp.status) && (
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleCancelSub(cp.id)} style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <FiX size={12} /> Cancelar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ─── MODAL: Formulário de plano ─── */}
            {showForm && (
                <div className="modal-overlay" onClick={closeForm}>
                    <div className="modal-box" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Editar Plano' : 'Novo Plano de Serviço'}</h3>
                            <button className="modal-close" onClick={closeForm}>✕</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                            <div className="form-group">
                                <label>Nome do plano *</label>
                                <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Pacote Mensal Premium" />
                            </div>

                            <div className="form-group">
                                <label>Descrição</label>
                                <textarea className="form-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descreva o plano brevemente" style={{ resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label>Preço (R$) *</label>
                                    <input className="form-input" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="0,00" />
                                </div>
                                <div className="form-group">
                                    <label>Tipo</label>
                                    <select className="form-input" value={form.type} onChange={e => set('type', e.target.value)}>
                                        <option value="package">Pacote (pré-pago)</option>
                                        <option value="subscription">Assinatura recorrente</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div className="form-group">
                                    <label>Período de cobrança</label>
                                    <select className="form-input" value={form.billingPeriod} onChange={e => set('billingPeriod', e.target.value)}>
                                        <option value="oneTime">Pagamento único</option>
                                        <option value="monthly">Mensal</option>
                                        <option value="quarterly">Trimestral</option>
                                        <option value="annual">Anual</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Validade (dias)</label>
                                    <input className="form-input" type="number" min="1" value={form.validityDays} onChange={e => set('validityDays', e.target.value)} placeholder="Ex: 30 (deixe vazio = sem limite)" />
                                </div>
                            </div>

                            {/* Serviços incluídos */}
                            <div className="form-group">
                                <label style={{ marginBottom: 8, display: 'block' }}>Serviços incluídos *</label>
                                {tenantServices.length === 0 ? (
                                    <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>Nenhum serviço cadastrado.</p>
                                ) : (
                                    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                                        {tenantServices.map((svc, i) => {
                                            const included = form.services.find(s => s.serviceId === svc.id);
                                            return (
                                                <div key={svc.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.9rem',
                                                    background: included ? 'var(--bg-input)' : 'transparent',
                                                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                                                }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`svc-${svc.id}`}
                                                        checked={!!included}
                                                        onChange={e => toggleService(svc.id, svc.tipoServico || svc.name, e.target.checked)}
                                                    />
                                                    <label htmlFor={`svc-${svc.id}`} style={{ flex: 1, cursor: 'pointer', fontSize: '0.88rem' }}>
                                                        {svc.tipoServico || svc.name}
                                                    </label>
                                                    {included && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <label style={{ fontSize: '0.75rem', color: 'var(--color-muted)', whiteSpace: 'nowrap' }}>Máx. usos:</label>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                className="form-input"
                                                                style={{ width: 80, padding: '4px 8px', fontSize: '0.82rem' }}
                                                                value={included.maxUsages ?? ''}
                                                                onChange={e => setServiceMaxUsages(svc.id, e.target.value)}
                                                                placeholder="∞"
                                                                title="Deixe vazio para ilimitado"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} />
                                <label htmlFor="isActive" style={{ cursor: 'pointer', fontSize: '0.88rem' }}>Plano ativo (visível para clientes)</label>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
                            <button className="btn btn-ghost" onClick={closeForm} disabled={saving}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Salvando...' : (editingId ? 'Salvar alterações' : 'Criar plano')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── CONFIRM DELETE ─── */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Confirmar exclusão</h3>
                            <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>Tem certeza que deseja excluir este plano? Planos com assinaturas ativas não podem ser excluídos.</p>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
                            <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
                            <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)} disabled={saving} style={{ background: '#ef4444', color: '#fff', border: 'none' }}>
                                {saving ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
