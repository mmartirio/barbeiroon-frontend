import React, { useState, useEffect, useCallback } from 'react';
import { FiUsers, FiPackage, FiCreditCard, FiTrendingUp, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useGestorAuth } from '../../context/GestorAuthContext';

const fmtDate = (v) => {
    if (!v) return '—';
    const [y, m, d] = String(v).split('T')[0].split('-');
    return `${d}/${m}/${y}`;
};

const PLAN_COLORS = { free: '#6b7280', basic: '#2563eb', premium: '#7c3aed', enterprise: '#0ea5e9' };
const PLAN_LABELS = { free: 'Free', basic: 'Basic', premium: 'Premium', enterprise: 'Enterprise' };

export default function GestorDashboard() {
    const { authFetch } = useGestorAuth();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const api = useCallback(async (path, opts = {}) => {
        const res = await authFetch('/api/gestor' + path, opts);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || 'Erro na requisição');
        return json;
    }, [authFetch]);

    useEffect(() => {
        api('/dashboard')
            .then(setData)
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [api]);

    if (loading) return <p style={{ color: 'var(--color-muted)' }}>Carregando...</p>;
    if (error) return <p style={{ color: '#f87171' }}>Erro: {error}</p>;
    if (!data) return null;

    const { stats, planDistribution, recentTenants } = data;

    const cards = [
        { label: 'Total de Barbearias', value: stats.totalTenants,        icon: FiUsers,       color: '#2563eb' },
        { label: 'Barbearias Ativas',   value: stats.activeTenants,       icon: FiCheckCircle, color: '#16a34a' },
        { label: 'Barbearias Inativas', value: stats.inactiveTenants,     icon: FiXCircle,     color: '#dc2626' },
        { label: 'Novas (30 dias)',      value: stats.newTenants,          icon: FiTrendingUp,  color: '#f59e0b' },
        { label: 'Planos Ativos',        value: stats.totalPlans,          icon: FiPackage,     color: '#7c3aed' },
        { label: 'Métodos Pagamento',    value: stats.totalPaymentMethods, icon: FiCreditCard,  color: '#0ea5e9' },
    ];

    return (
        <div>
            <h2 style={{ marginBottom: 24, fontSize: '1.35rem', fontWeight: 700 }}>Dashboard</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(175px, 1fr))', gap: 14, marginBottom: 28 }}>
                {cards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                            <Icon size={17} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.45rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: '0.73rem', color: 'var(--color-muted)', marginTop: 3 }}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
                    <h3 style={{ marginBottom: 16, fontSize: '0.92rem', fontWeight: 600 }}>Distribuição por Plano</h3>
                    {planDistribution.length === 0
                        ? <p style={{ color: 'var(--color-muted)', fontSize: '0.84rem' }}>Sem dados.</p>
                        : planDistribution.map(({ planType, count }) => (
                            <div key={planType} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <span style={{ width: 9, height: 9, borderRadius: '50%', background: PLAN_COLORS[planType] || '#6b7280', flexShrink: 0 }} />
                                <span style={{ flex: 1, fontSize: '0.84rem' }}>{PLAN_LABELS[planType] || planType}</span>
                                <strong style={{ fontSize: '0.88rem' }}>{count}</strong>
                            </div>
                        ))
                    }
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
                    <h3 style={{ marginBottom: 16, fontSize: '0.92rem', fontWeight: 600 }}>Cadastros Recentes</h3>
                    {recentTenants.length === 0
                        ? <p style={{ color: 'var(--color-muted)', fontSize: '0.84rem' }}>Sem cadastros.</p>
                        : recentTenants.map(t => (
                            <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.84rem' }}>{t.name}</div>
                                    <div style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>{t.email}</div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{fmtDate(t.createdAt)}</span>
                                    <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4, background: t.isActive ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)', color: t.isActive ? '#4ade80' : '#f87171' }}>
                                        {t.isActive ? 'Ativa' : 'Inativa'}
                                    </span>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    );
}
