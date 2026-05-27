import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiRefreshCw, FiSearch, FiActivity, FiUsers, FiScissors, FiCalendar, FiList, FiBarChart2 } from 'react-icons/fi';
import {
    Chart as ChartJS,
    CategoryScale, LinearScale, BarElement,
    ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const REFRESH_INTERVAL = 30000;
const CHART_COLORS = {
    scheduled:  { bg: 'rgba(245,158,11,0.75)',  border: '#f59e0b' },
    completed:  { bg: 'rgba(22,163,74,0.75)',   border: '#16a34a' },
    cancelled:  { bg: 'rgba(220,38,38,0.75)',   border: '#dc2626' },
    pending:    { bg: 'rgba(96,165,250,0.75)',   border: '#60a5fa' },
    users:      { bg: 'rgba(37,99,235,0.75)',    border: '#2563eb' },
    customers:  { bg: 'rgba(124,58,237,0.75)',   border: '#7c3aed' },
    services:   { bg: 'rgba(14,165,233,0.75)',   border: '#0ea5e9' },
};

const CHART_OPTS_BASE = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { labels: { color: '#9ca3af', font: { size: 12 } } },
        tooltip: { callbacks: {} },
    },
    scales: {
        x: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.06)' } },
        y: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.06)' } },
    },
};

const DOUGHNUT_OPTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 12 }, padding: 14, boxWidth: 14 } },
        tooltip: {},
    },
};

const badge = (bg, color, text) => (
    <span style={{ fontSize: '0.72rem', padding: '2px 7px', borderRadius: 4, background: bg, color, fontWeight: 600, whiteSpace: 'nowrap' }}>{text}</span>
);

function MetricCell({ value, color }) {
    return <span style={{ fontWeight: 700, color: color || 'var(--color)', fontSize: '0.95rem' }}>{value}</span>;
}

function Card({ children, title, style = {} }) {
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, ...style }}>
            {title && <h3 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>}
            {children}
        </div>
    );
}

export default function GestorMonitor({ api }) {
    const [tenants, setTenants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [search, setSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [expanded, setExpanded] = useState(null);
    const [view, setView] = useState('table'); // 'table' | 'charts'
    const intervalRef = useRef(null);

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const p = new URLSearchParams();
            if (search) p.set('search', search);
            if (activeFilter) p.set('active', activeFilter);
            const d = await api(`/monitor?${p}`);
            setTenants(d.tenants || []);
            setLastUpdate(new Date());
        } catch { /* silent */ }
        finally { if (!silent) setLoading(false); }
    }, [api, search, activeFilter]);

    useEffect(() => {
        load();
        intervalRef.current = setInterval(() => load(true), REFRESH_INTERVAL);
        return () => clearInterval(intervalRef.current);
    }, [load]);

    const totals = tenants.reduce((acc, t) => ({
        users:     acc.users     + Number(t.totalUsers || 0),
        customers: acc.customers + Number(t.totalCustomers || 0),
        services:  acc.services  + Number(t.totalServices || 0),
        scheduled: acc.scheduled + Number(t.appointmentsScheduled || 0),
        completed: acc.completed + Number(t.appointmentsCompleted || 0),
        cancelled: acc.cancelled + Number(t.appointmentsCancelled || 0),
        pending:   acc.pending   + Number(t.appointmentsPending || 0),
    }), { users: 0, customers: 0, services: 0, scheduled: 0, completed: 0, cancelled: 0, pending: 0 });

    // ─── Chart data ──────────────────────────────────────────────────────────────

    const doughnutData = {
        labels: ['Agendados', 'Concluídos', 'Cancelados', 'Pendentes'],
        datasets: [{
            data: [totals.scheduled, totals.completed, totals.cancelled, totals.pending],
            backgroundColor: [CHART_COLORS.scheduled.bg, CHART_COLORS.completed.bg, CHART_COLORS.cancelled.bg, CHART_COLORS.pending.bg],
            borderColor:     [CHART_COLORS.scheduled.border, CHART_COLORS.completed.border, CHART_COLORS.cancelled.border, CHART_COLORS.pending.border],
            borderWidth: 1,
        }],
    };

    const top8 = [...tenants].sort((a, b) => Number(b.appointmentsTotal) - Number(a.appointmentsTotal)).slice(0, 8);
    const labels8 = top8.map(t => t.name.length > 14 ? t.name.slice(0, 14) + '…' : t.name);

    const stackedBarData = {
        labels: labels8,
        datasets: [
            { label: 'Concluídos', data: top8.map(t => Number(t.appointmentsCompleted)), backgroundColor: CHART_COLORS.completed.bg, borderColor: CHART_COLORS.completed.border, borderWidth: 1 },
            { label: 'Agendados',  data: top8.map(t => Number(t.appointmentsScheduled)), backgroundColor: CHART_COLORS.scheduled.bg,  borderColor: CHART_COLORS.scheduled.border,  borderWidth: 1 },
            { label: 'Cancelados', data: top8.map(t => Number(t.appointmentsCancelled)), backgroundColor: CHART_COLORS.cancelled.bg,  borderColor: CHART_COLORS.cancelled.border,  borderWidth: 1 },
            { label: 'Pendentes',  data: top8.map(t => Number(t.appointmentsPending)),   backgroundColor: CHART_COLORS.pending.bg,    borderColor: CHART_COLORS.pending.border,    borderWidth: 1 },
        ],
    };

    const stackedBarOpts = {
        ...CHART_OPTS_BASE,
        plugins: { ...CHART_OPTS_BASE.plugins, legend: { ...CHART_OPTS_BASE.plugins.legend } },
        scales: {
            x: { ...CHART_OPTS_BASE.scales.x, stacked: true },
            y: { ...CHART_OPTS_BASE.scales.y, stacked: true },
        },
    };

    const resourcesBarData = {
        labels: labels8,
        datasets: [
            { label: 'Usuários',  data: top8.map(t => Number(t.totalUsers)),     backgroundColor: CHART_COLORS.users.bg,     borderColor: CHART_COLORS.users.border,     borderWidth: 1 },
            { label: 'Clientes',  data: top8.map(t => Number(t.totalCustomers)), backgroundColor: CHART_COLORS.customers.bg, borderColor: CHART_COLORS.customers.border, borderWidth: 1 },
            { label: 'Serviços',  data: top8.map(t => Number(t.totalServices)),  backgroundColor: CHART_COLORS.services.bg,  borderColor: CHART_COLORS.services.border,  borderWidth: 1 },
        ],
    };

    const completionRateData = {
        labels: [...tenants].filter(t => Number(t.appointmentsTotal) > 0).sort((a, b) => {
            const ra = Number(a.appointmentsCompleted) / Number(a.appointmentsTotal);
            const rb = Number(b.appointmentsCompleted) / Number(b.appointmentsTotal);
            return rb - ra;
        }).slice(0, 8).map(t => t.name.length > 14 ? t.name.slice(0, 14) + '…' : t.name),
        datasets: [{
            label: 'Taxa de conclusão (%)',
            data: [...tenants].filter(t => Number(t.appointmentsTotal) > 0).sort((a, b) => {
                const ra = Number(a.appointmentsCompleted) / Number(a.appointmentsTotal);
                const rb = Number(b.appointmentsCompleted) / Number(b.appointmentsTotal);
                return rb - ra;
            }).slice(0, 8).map(t => Math.round(Number(t.appointmentsCompleted) / Number(t.appointmentsTotal) * 100)),
            backgroundColor: CHART_COLORS.completed.bg,
            borderColor: CHART_COLORS.completed.border,
            borderWidth: 1,
            borderRadius: 4,
        }],
    };

    const completionRateOpts = {
        ...CHART_OPTS_BASE,
        indexAxis: 'y',
        scales: {
            x: { ...CHART_OPTS_BASE.scales.x, min: 0, max: 100, ticks: { ...CHART_OPTS_BASE.scales.x.ticks, callback: v => `${v}%` } },
            y: { ...CHART_OPTS_BASE.scales.y },
        },
    };

    // ─── Summary cards ────────────────────────────────────────────────────────────
    const summaryCards = [
        { label: 'Usuários',   value: totals.users,     icon: FiUsers,    color: '#2563eb' },
        { label: 'Clientes',   value: totals.customers, icon: FiUsers,    color: '#7c3aed' },
        { label: 'Serviços',   value: totals.services,  icon: FiScissors, color: '#0ea5e9' },
        { label: 'Agendados',  value: totals.scheduled, icon: FiCalendar, color: '#f59e0b' },
        { label: 'Concluídos', value: totals.completed, icon: FiActivity, color: '#16a34a' },
        { label: 'Cancelados', value: totals.cancelled, icon: FiActivity, color: '#dc2626' },
    ];

    const TH = { padding: '9px 12px', textAlign: 'left', fontWeight: 600, fontSize: '0.72rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' };
    const TD = { padding: '10px 12px', verticalAlign: 'middle', fontSize: '0.84rem', borderBottom: '1px solid var(--border)' };

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Monitoramento</h2>
                    {lastUpdate && <p style={{ fontSize: '0.73rem', color: 'var(--color-muted)', margin: '3px 0 0' }}>Atualizado: {lastUpdate.toLocaleTimeString('pt-BR')} · Auto-refresh 30s</p>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                        <button onClick={() => setView('table')} style={{ padding: '7px 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', background: view === 'table' ? 'rgba(37,99,235,0.2)' : 'transparent', color: view === 'table' ? 'var(--accent)' : 'var(--color-muted)', fontWeight: view === 'table' ? 600 : 400 }}>
                            <FiList size={13} /> Tabela
                        </button>
                        <button onClick={() => setView('charts')} style={{ padding: '7px 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', background: view === 'charts' ? 'rgba(37,99,235,0.2)' : 'transparent', color: view === 'charts' ? 'var(--accent)' : 'var(--color-muted)', fontWeight: view === 'charts' ? 600 : 400 }}>
                            <FiBarChart2 size={13} /> Gráficos
                        </button>
                    </div>
                    <button className="btn" onClick={() => load()} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem' }}>
                        <FiRefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Atualizar
                    </button>
                </div>
            </div>

            {/* Cards de totais */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                {summaryCards.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 6, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                            <Icon size={14} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--color-muted)', marginTop: 2 }}>{label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filtros */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
                    <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                    <input className="form-input" placeholder="Buscar empresa..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
                </div>
                <select className="form-input" value={activeFilter} onChange={e => setActiveFilter(e.target.value)} style={{ width: 130 }}>
                    <option value="">Todas</option>
                    <option value="true">Ativas</option>
                    <option value="false">Inativas</option>
                </select>
            </div>

            {/* ── Tabela ─────────────────────────────────────────────────────────── */}
            {view === 'table' && (
                <>
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border)' }}>
                                    <th style={TH}>Empresa</th>
                                    <th style={{ ...TH, textAlign: 'center' }}>Status</th>
                                    <th style={{ ...TH, textAlign: 'center' }}>Usuários</th>
                                    <th style={{ ...TH, textAlign: 'center' }}>Clientes</th>
                                    <th style={{ ...TH, textAlign: 'center' }}>Serviços</th>
                                    <th style={{ ...TH, textAlign: 'center' }}>Agendados</th>
                                    <th style={{ ...TH, textAlign: 'center' }}>Concluídos</th>
                                    <th style={{ ...TH, textAlign: 'center' }}>Cancelados</th>
                                    <th style={{ ...TH, textAlign: 'center' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && tenants.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>Carregando...</td></tr>
                                ) : tenants.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--color-muted)' }}>Nenhuma empresa encontrada.</td></tr>
                                ) : tenants.map(t => {
                                    const total = Number(t.appointmentsTotal || 0);
                                    const pctCompleted = total > 0 ? Math.round(Number(t.appointmentsCompleted) / total * 100) : 0;
                                    return (
                                        <React.Fragment key={t.id}>
                                            <tr onClick={() => setExpanded(expanded === t.id ? null : t.id)} style={{ cursor: 'pointer', background: expanded === t.id ? 'rgba(37,99,235,0.06)' : 'transparent', transition: 'background 0.15s' }}>
                                                <td style={TD}>
                                                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{t.email}</div>
                                                </td>
                                                <td style={{ ...TD, textAlign: 'center' }}>{t.isActive ? badge('rgba(22,163,74,0.15)', '#4ade80', 'Ativa') : badge('rgba(220,38,38,0.15)', '#f87171', 'Inativa')}</td>
                                                <td style={{ ...TD, textAlign: 'center' }}><MetricCell value={t.totalUsers} /></td>
                                                <td style={{ ...TD, textAlign: 'center' }}><MetricCell value={t.totalCustomers} /></td>
                                                <td style={{ ...TD, textAlign: 'center' }}><MetricCell value={t.totalServices} /></td>
                                                <td style={{ ...TD, textAlign: 'center' }}><MetricCell value={t.appointmentsScheduled} color="#f59e0b" /></td>
                                                <td style={{ ...TD, textAlign: 'center' }}><MetricCell value={t.appointmentsCompleted} color="#4ade80" /></td>
                                                <td style={{ ...TD, textAlign: 'center' }}><MetricCell value={t.appointmentsCancelled} color="#f87171" /></td>
                                                <td style={{ ...TD, textAlign: 'center' }}><MetricCell value={total} /></td>
                                            </tr>
                                            {expanded === t.id && (
                                                <tr>
                                                    <td colSpan={9} style={{ padding: '14px 18px', background: 'rgba(37,99,235,0.04)', borderBottom: '1px solid var(--border)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                                                            <div>
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', margin: '0 0 4px' }}>Taxa de conclusão</p>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <div style={{ width: 140, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                                                        <div style={{ width: `${pctCompleted}%`, height: '100%', background: '#4ade80', borderRadius: 3 }} />
                                                                    </div>
                                                                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4ade80' }}>{pctCompleted}%</span>
                                                                </div>
                                                            </div>
                                                            <div><p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', margin: '0 0 4px' }}>Pendentes</p><span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#60a5fa' }}>{t.appointmentsPending}</span></div>
                                                            <div><p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', margin: '0 0 4px' }}>Plano</p><span style={{ fontSize: '0.82rem', padding: '2px 8px', borderRadius: 4, background: 'rgba(37,99,235,0.15)', color: '#60a5fa' }}>{t.planType}</span></div>
                                                            <div><p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', margin: '0 0 4px' }}>Slug</p><span style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>/{t.slug}</span></div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: 8 }}>Clique em uma linha para ver detalhes · {tenants.length} empresa(s)</p>
                </>
            )}

            {/* ── Gráficos ───────────────────────────────────────────────────────── */}
            {view === 'charts' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Linha 1: Donut + Taxa de conclusão */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 }}>
                        <Card title="Distribuição de Agendamentos">
                            {(totals.scheduled + totals.completed + totals.cancelled + totals.pending) === 0
                                ? <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 32 }}>Sem dados</p>
                                : <div style={{ height: 220 }}><Doughnut data={doughnutData} options={DOUGHNUT_OPTS} /></div>
                            }
                        </Card>
                        <Card title="Taxa de Conclusão por Empresa (Top 8)">
                            {tenants.filter(t => Number(t.appointmentsTotal) > 0).length === 0
                                ? <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 32 }}>Sem dados</p>
                                : <div style={{ height: 220 }}><Bar data={completionRateData} options={completionRateOpts} /></div>
                            }
                        </Card>
                    </div>

                    {/* Linha 2: Agendamentos empilhado */}
                    <Card title="Agendamentos por Empresa (Top 8)">
                        {top8.length === 0
                            ? <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 32 }}>Sem dados</p>
                            : <div style={{ height: 260 }}><Bar data={stackedBarData} options={stackedBarOpts} /></div>
                        }
                    </Card>

                    {/* Linha 3: Usuários, Clientes, Serviços */}
                    <Card title="Usuários · Clientes · Serviços por Empresa (Top 8)">
                        {top8.length === 0
                            ? <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 32 }}>Sem dados</p>
                            : <div style={{ height: 240 }}><Bar data={resourcesBarData} options={CHART_OPTS_BASE} /></div>
                        }
                    </Card>
                </div>
            )}

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
