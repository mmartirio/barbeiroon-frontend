import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GestorLayout, { gestorApi } from '../GestorLayout';
import PlanosForm from './PlanosForm';

export default function PlanosList() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await gestorApi('/plans');
            if (r.status === 401) { localStorage.removeItem('gestor_token'); navigate('/gestor'); return; }
            const d = await r.json();
            const sorted = (d.plans || []).slice().sort((a, b) => {
                if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
                return (a.sortOrder ?? 99) - (b.sortOrder ?? 99);
            });
            setPlans(sorted);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Excluir o plano "${name}"?`)) return;
        setDeleting(id);
        try {
            const r = await gestorApi(`/plans/${id}`, { method: 'DELETE' });
            const d = await r.json();
            if (r.ok) { setMsg({ type: 'success', text: d.message }); load(); }
            else setMsg({ type: 'error', text: d.message });
        } finally { setDeleting(null); }
    };

    const fmt = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Verifica se é o plano Essencial (para badge "Mais Vendido")
    const isBestSeller = (plan) => {
        return plan.name === 'Essencial' || plan.name.includes('Essencial');
    };

    return (
        <GestorLayout title="Planos">
            {msg.text && (
                <div className={msg.type === 'success' ? 'sa-success-msg' : 'sa-error-msg'}
                    onClick={() => setMsg({ type: '', text: '' })}>
                    {msg.text}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 20 }}>
                <button className="sa-btn sa-btn-primary" onClick={() => setModal('create')}>+ Novo Plano</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))', gap: 16 }}>
                {loading && <div className="sa-loading">Carregando...</div>}
                {!loading && plans.map(plan => (
                    <div key={plan.id} className="sa-card" style={{ position: 'relative', overflow: 'hidden' }}>
                        {/* Badge "Mais Vendido" para o Essencial */}
                        {isBestSeller(plan) && (
                            <div style={{
                                position: 'absolute',
                                top: 12,
                                right: -30,
                                background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                color: 'white',
                                fontSize: 11,
                                fontWeight: 'bold',
                                padding: '4px 30px',
                                transform: 'rotate(45deg)',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                zIndex: 1,
                            }}>
                                ⭐ MAIS VENDIDO
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                    <h3 style={{ color: '#f8fafc', margin: 0, fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.name}</h3>
                                    {plan.isDefault && (
                                        <span className="sa-badge sa-badge-cyan" style={{ fontSize: 10, padding: '1px 7px', whiteSpace: 'nowrap' }}>Padrão</span>
                                    )}
                                    {isBestSeller(plan) && !plan.isDefault && (
                                        <span className="sa-badge" style={{ fontSize: 10, padding: '1px 7px', background: '#f59e0b', color: '#000' }}>⭐ Mais Vendido</span>
                                    )}
                                </div>
                                <span className={`sa-badge ${plan.isActive ? 'sa-badge-green' : 'sa-badge-red'}`}>
                                    {plan.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                <button
                                    title="Editar plano"
                                    className="sa-btn-compact"
                                    onClick={() => setModal(plan)}
                                    style={{ background: '#334155', color: '#cbd5e1' }}
                                >✎</button>
                                {!plan.isDefault && (
                                    <button
                                        title="Excluir plano"
                                        className="sa-btn-compact"
                                        disabled={deleting === plan.id}
                                        onClick={() => handleDelete(plan.id, plan.name)}
                                        style={{ background: '#450a0a', color: '#f87171' }}
                                    >✕</button>
                                )}
                            </div>
                        </div>

                        {plan.description && (
                            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px' }}>{plan.description}</p>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                            <div style={{ background: '#0f172a', borderRadius: 8, padding: '12px 14px' }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Mensal</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#4ade80' }}>{fmt(plan.priceMonthly)}</div>
                                {plan.priceMonthly > 0 && plan.priceMonthly < 50 && (
                                    <div style={{ fontSize: 10, color: '#4ade80', marginTop: 2 }}>💰 Menos de R$ 2/dia</div>
                                )}
                            </div>
                            <div style={{ background: '#0f172a', borderRadius: 8, padding: '12px 14px' }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Anual</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#60a5fa' }}>{fmt(plan.priceAnnual)}</div>
                                {plan.priceMonthly > 0 && plan.priceAnnual > 0 && (
                                    <div style={{ fontSize: 10, color: '#60a5fa', marginTop: 2 }}>
                                        🎉 Economize {Math.round((1 - plan.priceAnnual / (plan.priceMonthly * 12)) * 100)}%
                                    </div>
                                )}
                            </div>
                        </div>

                        {(plan.maxUsers || plan.maxAppointments || plan.trialMonths) && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                {plan.maxUsers && <span className="sa-badge sa-badge-purple">👤 {plan.maxUsers} usuário{plan.maxUsers !== 1 ? 's' : ''}</span>}
                                {plan.maxAppointments && <span className="sa-badge sa-badge-blue">📅 {plan.maxAppointments.toLocaleString()} agend./mês</span>}
                                {!plan.maxAppointments && plan.name === 'Premium' && (
                                    <span className="sa-badge" style={{ background: '#4ade80', color: '#000' }}>🚀 Ilimitado</span>
                                )}
                                {plan.trialMonths && (
                                    <span className="sa-badge sa-badge-yellow">
                                        ⏱ {plan.trialMonths} {plan.trialMonths === 1 ? 'mês' : 'meses'}
                                    </span>
                                )}
                            </div>
                        )}

                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {/* Mostra apenas os primeiros 5 recursos + "mais" se houver mais */}
                                {plan.features.slice(0, 5).map((f, i) => (
                                    <li key={i} style={{ fontSize: 12, color: '#94a3b8', display: 'flex', gap: 6 }}>
                                        <span style={{ color: '#4ade80' }}>✓</span> {f}
                                    </li>
                                ))}
                                {plan.features.length > 5 && (
                                    <li style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
                                        + {plan.features.length - 5} outro{plan.features.length - 5 !== 1 ? 's' : ''} recurso{plan.features.length - 5 !== 1 ? 's' : ''}
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                ))}
                {!loading && !plans.length && <div className="sa-empty">Nenhum plano cadastrado.</div>}
            </div>

            {modal !== null && (
                <PlanosForm
                    plan={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => {
                        setModal(null); load();
                        setMsg({ type: 'success', text: modal === 'create' ? 'Plano criado!' : 'Plano atualizado!' });
                    }}
                />
            )}
        </GestorLayout>
    );
}