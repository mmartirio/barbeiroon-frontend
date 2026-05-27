import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const errStyle = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 };
const EMPTY = { name: '', description: '', priceMonthly: '', priceAnnual: '', features: [], maxUsers: '', maxAppointments: '', trialMonths: '', sortOrder: '', isActive: true };

function Modal({ title, onClose, children }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
}

export default function GestorPlans({ api }) {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [editId, setEditId] = useState(null);
    const [delTarget, setDelTarget] = useState(null);
    const [newFeature, setNewFeature] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try { const d = await api('/plans'); setPlans(d.plans || []); }
        catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [api]);

    useEffect(() => { load(); }, [load]);

    const openCreate = () => { setForm(EMPTY); setEditId(null); setNewFeature(''); setError(''); setModal('form'); };
    const openEdit = (p) => {
        setForm({ name: p.name || '', description: p.description || '', priceMonthly: p.priceMonthly ?? '', priceAnnual: p.priceAnnual ?? '', features: Array.isArray(p.features) ? [...p.features] : [], maxUsers: p.maxUsers ?? '', maxAppointments: p.maxAppointments ?? '', trialMonths: p.trialMonths ?? '', sortOrder: p.sortOrder ?? '', isActive: p.isActive });
        setEditId(p.id); setNewFeature(''); setError(''); setModal('form');
    };
    const closeModal = () => { setModal(null); setError(''); };

    const addFeature = () => {
        if (!newFeature.trim()) return;
        setForm(p => ({ ...p, features: [...p.features, newFeature.trim()] }));
        setNewFeature('');
    };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            const payload = { ...form, priceMonthly: Number(form.priceMonthly) || 0, priceAnnual: Number(form.priceAnnual) || 0, maxUsers: form.maxUsers ? Number(form.maxUsers) : null, maxAppointments: form.maxAppointments ? Number(form.maxAppointments) : null, trialMonths: form.trialMonths ? Number(form.trialMonths) : null, sortOrder: form.sortOrder !== '' ? Number(form.sortOrder) : 99 };
            if (editId) await api(`/plans/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
            else await api('/plans', { method: 'POST', body: JSON.stringify(payload) });
            closeModal(); load();
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setSaving(true);
        try { await api(`/plans/${delTarget.id}`, { method: 'DELETE' }); closeModal(); load(); }
        catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const inp = (f) => ({ value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })) });

    if (loading && !plans.length) return <p style={{ color: 'var(--color-muted)' }}>Carregando...</p>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Planos</h2>
                <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiPlus size={14} /> Novo Plano</button>
            </div>

            {error && !modal && <div style={errStyle}>{error}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                {plans.map(plan => (
                    <div key={plan.id} style={{ background: 'var(--bg-card)', border: `1px solid ${plan.isDefault ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 4 }}>
                            {plan.isDefault && <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'var(--accent)', color: '#fff', borderRadius: 4 }}>Padrão</span>}
                            {!plan.isActive && <span style={{ fontSize: '0.68rem', padding: '2px 6px', background: 'rgba(220,38,38,0.2)', color: '#f87171', borderRadius: 4 }}>Inativo</span>}
                        </div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 4, paddingRight: plan.isDefault ? 70 : 0 }}>{plan.name}</h3>
                        {plan.description && <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginBottom: 12 }}>{plan.description}</p>}
                        <div style={{ marginBottom: 12 }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent)' }}>{fmt(plan.priceMonthly)}<span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'var(--color-muted)' }}>/mês</span></div>
                            {Number(plan.priceAnnual) > 0 && <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>{fmt(plan.priceAnnual)}/ano</div>}
                        </div>
                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                                {plan.features.map((f, i) => <li key={i} style={{ fontSize: '0.77rem', color: 'var(--color-muted)' }}>✓ {f}</li>)}
                            </ul>
                        )}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                            {plan.maxUsers && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.07)', color: 'var(--color-muted)' }}>👤 {plan.maxUsers} usuários</span>}
                            {plan.maxAppointments && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.07)', color: 'var(--color-muted)' }}>📅 {plan.maxAppointments} agend.</span>}
                            {plan.trialMonths && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.07)', color: 'var(--color-muted)' }}>🎁 {plan.trialMonths}m trial</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                            <button className="btn" onClick={() => openEdit(plan)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem' }}><FiEdit2 size={12} /> Editar</button>
                            {!plan.isDefault && <button className="btn" onClick={() => { setDelTarget(plan); setError(''); setModal('delete'); }} style={{ padding: '0 10px', color: '#f87171' }}><FiTrash2 size={14} /></button>}
                        </div>
                    </div>
                ))}
                {!loading && plans.length === 0 && <p style={{ color: 'var(--color-muted)' }}>Nenhum plano cadastrado.</p>}
            </div>

            {modal === 'form' && (
                <Modal title={editId ? 'Editar Plano' : 'Novo Plano'} onClose={closeModal}>
                    <form onSubmit={handleSave}>
                        {error && <div style={errStyle}>{error}</div>}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Nome *</label>
                                <input className="form-input" {...inp('name')} required />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                <label className="form-label">Descrição</label>
                                <textarea className="form-input" {...inp('description')} rows={2} style={{ resize: 'vertical' }} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Preço Mensal (R$)</label>
                                <input className="form-input" type="number" min="0" step="0.01" {...inp('priceMonthly')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Preço Anual (R$)</label>
                                <input className="form-input" type="number" min="0" step="0.01" {...inp('priceAnnual')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Máx. Usuários</label>
                                <input className="form-input" type="number" min="1" {...inp('maxUsers')} placeholder="Ilimitado" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Máx. Agendamentos</label>
                                <input className="form-input" type="number" min="1" {...inp('maxAppointments')} placeholder="Ilimitado" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Trial (meses)</label>
                                <input className="form-input" type="number" min="0" {...inp('trialMonths')} placeholder="Sem trial" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Ordem de exibição</label>
                                <input className="form-input" type="number" min="0" {...inp('sortOrder')} />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: 4 }}>
                            <label className="form-label">Recursos inclusos</label>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                <input className="form-input" value={newFeature} onChange={e => setNewFeature(e.target.value)} placeholder="Ex: Agendamento online" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} style={{ flex: 1 }} />
                                <button type="button" className="btn btn-primary" onClick={addFeature} style={{ padding: '0 12px' }}><FiPlus size={14} /></button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {form.features.map((f, i) => (
                                    <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(37,99,235,0.15)', color: '#60a5fa', padding: '3px 8px', borderRadius: 4, fontSize: '0.78rem' }}>
                                        {f}
                                        <button type="button" onClick={() => setForm(p => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }}><FiX size={11} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginTop: 14, cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                            Plano ativo
                        </label>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button type="button" className="btn" onClick={closeModal}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal === 'delete' && (
                <Modal title="Excluir Plano" onClose={closeModal}>
                    {error && <div style={errStyle}>{error}</div>}
                    <p style={{ marginBottom: 20, color: 'var(--color-muted)' }}>Excluir o plano <strong style={{ color: 'var(--color)' }}>{delTarget?.name}</strong>? Esta ação não pode ser desfeita.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={closeModal}>Cancelar</button>
                        <button className="btn" onClick={handleDelete} disabled={saving} style={{ background: '#dc2626', color: '#fff', border: 'none' }}>{saving ? 'Excluindo...' : 'Excluir'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
