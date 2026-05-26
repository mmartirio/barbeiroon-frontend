import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GestorLayout, { gestorApi } from '../GestorLayout';

const PLAN_LABELS = { free: 'Free', basic: 'Basic', premium: 'Premium', enterprise: 'Enterprise' };
const PLAN_COLORS = { free: '#fbbf24', basic: '#60a5fa', premium: '#a5b4fc', enterprise: '#4ade80' };

function MetricCard({ label, value, sub, icon }) {
    return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 32 }}>{icon}</div>
            <div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>{value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{label}</div>
                {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>}
            </div>
        </div>
    );
}

function ProgressBar({ pct, color }) {
    return (
        <div className="sa-progress-bar">
            <div className="sa-progress-fill" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

export default function Relatorios() {
    const [data, setData] = useState(null);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        Promise.all([
            gestorApi('/dashboard').then(r => {
                if (r.status === 401) { localStorage.removeItem('gestor_token'); navigate('/gestor'); return null; }
                return r.json();
            }),
            gestorApi('/plans').then(r => r.json()).catch(() => ({ plans: [] })),
        ]).then(([dash, plansData]) => {
            if (dash) setData(dash);
            setPlans(plansData.plans || []);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, [navigate]);

    if (loading) return <GestorLayout title="Relatórios"><div className="sa-loading">Carregando...</div></GestorLayout>;
    if (!data) return <GestorLayout title="Relatórios"><div className="sa-empty">Erro ao carregar dados.</div></GestorLayout>;

    const { stats, planDistribution } = data;
    const total = stats.totalTenants || 1;
    const activePct = Math.round((stats.activeTenants / total) * 100);
    const inactivePct = 100 - activePct;
    const growthPct = total > 0 ? Math.round((stats.newTenants / total) * 100) : 0;

    const planMap = Object.fromEntries(plans.map(p => [p.name, p]));
    const mrrEstimate = planDistribution.reduce((sum, dist) => {
        const planByType = plans.find(p =>
            p.name.toLowerCase().includes(dist.planType) || dist.planType.includes(p.name.toLowerCase())
        );
        const price = planByType ? Number(planByType.priceMonthly || 0) : 0;
        return sum + price * Number(dist.count || 0);
    }, 0);

    const fmtCurrency = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return (
        <GestorLayout title="Relatórios">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                <MetricCard label="Total de Empresas" value={total} icon="🏢" sub="cadastradas na plataforma" />
                <MetricCard label="Taxa de Atividade" value={`${activePct}%`} icon="✅" sub={`${stats.activeTenants} ativas / ${stats.inactiveTenants} inativas`} />
                <MetricCard label="Crescimento (30d)" value={`+${stats.newTenants}`} icon="📈" sub={`${growthPct}% do total`} />
                <MetricCard label="MRR Estimado" value={fmtCurrency(mrrEstimate)} icon="💰" sub="receita mensal recorrente" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div className="sa-card">
                    <p className="sa-card-title">Distribuição por Plano</p>
                    {planDistribution.length === 0 && <p className="sa-empty">Sem dados</p>}
                    {planDistribution.map(p => {
                        const pct = Math.round((p.count / total) * 100);
                        const color = PLAN_COLORS[p.planType] || '#60a5fa';
                        return (
                            <div key={p.planType} style={{ marginBottom: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>
                                        {PLAN_LABELS[p.planType] || p.planType}
                                    </span>
                                    <span style={{ fontSize: 13, color, fontWeight: 700 }}>
                                        {p.count} ({pct}%)
                                    </span>
                                </div>
                                <ProgressBar pct={pct} color={color} />
                            </div>
                        );
                    })}
                </div>

                <div className="sa-card">
                    <p className="sa-card-title">Status das Empresas</p>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Ativas</span>
                            <span style={{ fontSize: 13, color: '#4ade80', fontWeight: 700 }}>{stats.activeTenants} ({activePct}%)</span>
                        </div>
                        <ProgressBar pct={activePct} color="#4ade80" />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Inativas</span>
                            <span style={{ fontSize: 13, color: '#f87171', fontWeight: 700 }}>{stats.inactiveTenants} ({inactivePct}%)</span>
                        </div>
                        <ProgressBar pct={inactivePct} color="#f87171" />
                    </div>
                    <div style={{ marginTop: 20, padding: '14px', background: '#0f172a', borderRadius: 8 }}>
                        <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>
                            Novas nos últimos 30 dias
                        </div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: '#60a5fa' }}>+{stats.newTenants}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                            {growthPct}% do total de empresas
                        </div>
                    </div>
                </div>
            </div>

            {plans.length > 0 && (
                <div className="sa-card">
                    <p className="sa-card-title">Tabela de Planos e Receita</p>
                    <div className="sa-table-wrap">
                        <table className="sa-table">
                            <thead>
                                <tr>
                                    <th>Plano</th>
                                    <th>Preço Mensal</th>
                                    <th>Preço Anual</th>
                                    <th>Máx. Usuários</th>
                                    <th>Máx. Agendamentos</th>
                                    <th>Recursos</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {plans.map(p => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 600, color: '#f8fafc' }}>{p.name}</td>
                                        <td style={{ color: '#4ade80', fontWeight: 700 }}>
                                            {Number(p.priceMonthly).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td style={{ color: '#60a5fa', fontWeight: 700 }}>
                                            {Number(p.priceAnnual).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td>{p.maxUsers ?? <span style={{ color: '#64748b' }}>Ilimitado</span>}</td>
                                        <td>{p.maxAppointments ?? <span style={{ color: '#64748b' }}>Ilimitado</span>}</td>
                                        <td>
                                            <span className="sa-badge sa-badge-cyan">
                                                {Array.isArray(p.features) ? p.features.length : 0} recursos
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`sa-badge ${p.isActive ? 'sa-badge-green' : 'sa-badge-red'}`}>
                                                {p.isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </GestorLayout>
    );
}
