import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GestorLayout, { gestorApi } from '../GestorLayout';

const PLAN_LABELS = { free: 'Free', basic: 'Basic', premium: 'Premium', enterprise: 'Enterprise' };
const PLAN_BADGE  = { free: 'sa-badge-yellow', basic: 'sa-badge-blue', premium: 'sa-badge-purple', enterprise: 'sa-badge-green' };

function StatCard({ label, value, sub, color }) {
    return (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: color || '#f8fafc' }}>{value}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f8fafc', marginTop: 4 }}>{label}</div>
            {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

export default function GestorDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        gestorApi('/dashboard')
            .then(r => {
                if (r.status === 401) { localStorage.removeItem('gestor_token'); navigate('/gestor'); return null; }
                return r.json();
            })
            .then(d => { if (d) setData(d); })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [navigate]);

    const fmt = d => new Date(d).toLocaleDateString('pt-BR');

    return (
        <GestorLayout title="Dashboard">
            {loading && <div className="sa-loading">Carregando...</div>}
            {!loading && data && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
                        <StatCard label="Total de Empresas" value={data.stats.totalTenants} />
                        <StatCard label="Empresas Ativas" value={data.stats.activeTenants} color="#4ade80" />
                        <StatCard label="Inativas" value={data.stats.inactiveTenants} color="#f87171" />
                        <StatCard label="Novas (30 dias)" value={data.stats.newTenants} color="#60a5fa" />
                        <StatCard label="Planos Ativos" value={data.stats.totalPlans} color="#a5b4fc" />
                        <StatCard label="Formas de Pagamento" value={data.stats.totalPaymentMethods} color="#fbbf24" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
                        <div className="sa-card">
                            <p className="sa-card-title">Distribuição por Plano</p>
                            {data.planDistribution.map(p => (
                                <div key={p.planType} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                    <span className={`sa-badge ${PLAN_BADGE[p.planType] || 'sa-badge-blue'}`}>
                                        {PLAN_LABELS[p.planType] || p.planType}
                                    </span>
                                    <strong style={{ color: '#f8fafc' }}>{p.count}</strong>
                                </div>
                            ))}
                            {!data.planDistribution.length && <p className="sa-empty">Sem dados</p>}
                        </div>

                        <div className="sa-card">
                            <p className="sa-card-title">Empresas Recentes</p>
                            <div className="sa-table-wrap">
                                <table className="sa-table">
                                    <thead>
                                        <tr>
                                            <th>Nome</th>
                                            <th>Email</th>
                                            <th>Plano</th>
                                            <th>Status</th>
                                            <th>Criado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.recentTenants.map(t => (
                                            <tr key={t.id}>
                                                <td style={{ color: '#f8fafc', fontWeight: 600 }}>{t.name}</td>
                                                <td>{t.email}</td>
                                                <td><span className={`sa-badge ${PLAN_BADGE[t.planType] || 'sa-badge-blue'}`}>{PLAN_LABELS[t.planType] || t.planType}</span></td>
                                                <td><span className={`sa-badge ${t.isActive ? 'sa-badge-green' : 'sa-badge-red'}`}>{t.isActive ? 'Ativo' : 'Inativo'}</span></td>
                                                <td>{fmt(t.createdAt)}</td>
                                            </tr>
                                        ))}
                                        {!data.recentTenants.length && (
                                            <tr><td colSpan={5} className="sa-empty">Nenhuma empresa</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </GestorLayout>
    );
}
