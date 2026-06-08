import React, { useState, useEffect } from 'react';
import s from '../Financeiro.module.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtN = v => new Intl.NumberFormat('pt-BR').format(Number(v) || 0);
const fmtD = v => { if (!v) return '—'; const [y,m,d] = String(v).split('-'); return `${d}/${m}`; };

const COLORS = ['#2563eb','#7c3aed','#16a34a','#f59e0b','#dc2626','#0891b2','#db2777','#65a30d'];

const doughnutOpts = {
  responsive: true,
  plugins: {
    legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 12 } },
    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmtR(ctx.parsed)}` } },
  },
};

const barOpts = (fmt) => ({
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.y) } } },
  scales: {
    x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#6b7280', font: { size: 10 }, callback: v => fmt(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
});

const lineOpts = {
  responsive: true,
  plugins: {
    legend: { position: 'top', labels: { color: '#9ca3af', font: { size: 11 } } },
    tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${fmtR(ctx.parsed.y)}` } },
  },
  scales: {
    x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#6b7280', font: { size: 10 }, callback: v => fmtR(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
};

export default function ResumoTab({ periodo }) {
  const [resumo,   setResumo]   = useState(null);
  const [fluxo,    setFluxo]    = useState([]);
  const [produtos, setProdutos] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setApiError(null);
    Promise.all([
      fetch(`/api/financeiro/resumo?periodo=${periodo}`, { headers: { Authorization: `Bearer ${tok()}` } })
        .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, data: d }))),
      fetch(`/api/financeiro/fluxo?periodo=${periodo}`,  { headers: { Authorization: `Bearer ${tok()}` } })
        .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, data: d }))).catch(() => ({ ok: true, data: {} })),
      fetch(`/api/produtos/vendas?periodo=${periodo}`,   { headers: { Authorization: `Bearer ${tok()}` } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([r, f, p]) => {
      if (!r.ok) {
        setApiError(`[${r.status}] ${r.data?.message || JSON.stringify(r.data)}`);
        setLoading(false);
        return;
      }
      setResumo(r.data);
      setFluxo(f.data?.data || []);
      if (p) setProdutos(p);
      setLoading(false);
    }).catch(err => {
      setApiError(err.message);
      setLoading(false);
    });
  }, [periodo]);

  if (loading) return <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>;
  if (apiError) return (
    <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #dc2626', borderRadius: 6, padding: '1rem', color: '#dc2626', fontSize: '0.875rem' }}>
      <strong>Erro ao carregar dados:</strong><br />
      <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{apiError}</code>
    </div>
  );
  if (!resumo) return null;

  const kpisFinanceiros = [
    { label: 'Faturamento Bruto',   value: fmtR(resumo.faturamentoBruto),  color: 'var(--success)' },
    { label: 'Total Despesas',      value: fmtR(resumo.totalDespesas),      color: '#dc2626' },
    { label: 'Total Comissões',     value: fmtR(resumo.totalComissoes),     color: '#7c3aed' },
    { label: 'Lucro Líquido',       value: fmtR(resumo.lucroLiquido),       color: resumo.lucroLiquido >= 0 ? 'var(--success)' : '#dc2626' },
    { label: 'Receita Potencial',   value: fmtR(resumo.receitaPotencial),   color: '#f59e0b' },
    { label: 'Ticket Médio',        value: fmtR(resumo.ticketMedio),        color: '#f59e0b' },
    { label: 'Taxa de Conversão',   value: `${resumo.taxaConversao}%`,      color: resumo.taxaConversao >= 70 ? 'var(--success)' : '#f59e0b' },
  ];

  const kpisAtendimentos = [
    { label: 'Total Agendamentos', value: fmtN(resumo.qtdTotal),       color: 'var(--color)' },
    { label: 'Concluídos',         value: fmtN(resumo.qtdConcluidos),  color: 'var(--success)' },
    { label: 'Agendados',          value: fmtN(resumo.qtdAgendados),   color: '#2563eb' },
    { label: 'Pendentes',          value: fmtN(resumo.qtdPendentes),   color: '#f59e0b' },
    { label: 'Cancelados',         value: fmtN(resumo.qtdCancelados),  color: '#dc2626' },
    { label: 'Clientes Únicos',    value: fmtN(resumo.qtdClientes),    color: 'var(--accent)' },
    { label: 'Profissionais',      value: fmtN(resumo.qtdBarbeiros),   color: '#7c3aed' },
    { label: 'Serviços Realizados',value: fmtN(resumo.qtdServicos),    color: '#0891b2' },
  ];

  // Gráfico de anel — status dos agendamentos
  const statusDoughnut = {
    labels: ['Concluídos', 'Agendados', 'Pendentes', 'Cancelados'],
    datasets: [{
      data: [resumo.qtdConcluidos, resumo.qtdAgendados, resumo.qtdPendentes, resumo.qtdCancelados],
      backgroundColor: ['#16a34a', '#2563eb', '#f59e0b', '#dc2626'],
      borderWidth: 0,
    }],
  };

  // Gráfico de barras — top serviços
  const svcBar = {
    labels: (resumo.porServico || []).map(s => s.nome),
    datasets: [{
      label: 'Receita',
      data: (resumo.porServico || []).map(s => s.total),
      backgroundColor: COLORS,
      borderRadius: 4,
    }],
  };

  // Gráfico de barras — top barbeiros
  const barbBar = {
    labels: (resumo.porBarbeiro || []).map(b => b.nome),
    datasets: [{
      label: 'Receita',
      data: (resumo.porBarbeiro || []).map(b => b.total),
      backgroundColor: COLORS,
      borderRadius: 4,
    }],
  };

  // Gráfico de linha — fluxo receitas vs despesas
  const lineData = {
    labels: fluxo.map(d => fmtD(d.data)),
    datasets: [
      {
        label: 'Receitas',
        data: fluxo.map(d => d.receita),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.12)',
        fill: true, tension: 0.4,
        pointRadius: fluxo.length > 20 ? 0 : 3,
      },
      {
        label: 'Despesas',
        data: fluxo.map(d => d.despesa),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220,38,38,0.08)',
        fill: true, tension: 0.4,
        pointRadius: fluxo.length > 20 ? 0 : 3,
      },
    ],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* KPIs Financeiros */}
      <div>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Financeiro</h4>
        <div className={s.kpiGrid}>
          {kpisFinanceiros.map(k => (
            <div key={k.label} className={s.kpiCard}>
              <span className={s.kpiLabel}>{k.label}</span>
              <span className={s.kpiValue} style={{ color: k.color }}>{k.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs Atendimentos */}
      <div>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Atendimentos</h4>
        <div className={s.kpiGrid}>
          {kpisAtendimentos.map(k => (
            <div key={k.label} className={s.kpiCard}>
              <span className={s.kpiLabel}>{k.label}</span>
              <span className={s.kpiValue} style={{ color: k.color }}>{k.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs Produtos */}
      {produtos && (
        <div>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--color-muted)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Produtos</h4>
          <div className={s.kpiGrid}>
            {[
              { label: 'Total em Produtos',  value: fmtR(produtos.totalVendas),                                                                   color: 'var(--success)' },
              { label: 'Itens Vendidos',     value: fmtN((produtos.data || []).reduce((a, r) => a + Number(r.quantidade_vendida || 0), 0)),        color: '#7c3aed' },
              { label: 'Transações',         value: fmtN((produtos.data || []).length),                                                           color: '#2563eb' },
            ].map(k => (
              <div key={k.label} className={s.kpiCard}>
                <span className={s.kpiLabel}>{k.label}</span>
                <span className={s.kpiValue} style={{ color: k.color }}>{k.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Linha — Evolução Receitas vs Despesas */}
      {fluxo.length > 0 && (
        <div className="card">
          <div className="card-body">
            <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Evolução — Receitas vs Despesas</h4>
            <Line data={lineData} options={lineOpts} />
          </div>
        </div>
      )}

      {/* Anel — Status dos agendamentos + Barras top serviços */}
      {resumo.qtdTotal > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Agendamentos por Status</h4>
              <Doughnut data={statusDoughnut} options={doughnutOpts} />
            </div>
          </div>
          {(resumo.porServico || []).length > 0 && (
            <div className="card">
              <div className="card-body">
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Top Serviços</h4>
                <Bar data={svcBar} options={{ ...barOpts(fmtR), indexAxis: 'y' }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barras — Top barbeiros */}
      {(resumo.porBarbeiro || []).length > 0 && (
        <div className="card">
          <div className="card-body">
            <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Faturamento por Barbeiro</h4>
            <Bar data={barbBar} options={barOpts(fmtR)} />
          </div>
        </div>
      )}
    </div>
  );
}
