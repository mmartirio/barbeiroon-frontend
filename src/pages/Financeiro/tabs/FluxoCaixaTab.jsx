import React, { useState, useEffect, useCallback } from 'react';
import s from '../Financeiro.module.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtD = v => { if (!v) return '—'; const [y,m,d] = String(v).split('-'); return `${d}/${m}`; };
const fmtDFull = v => { if (!v) return '—'; const [y,m,d] = String(v).split('-'); return `${d}/${m}/${y}`; };

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

const barOpts = {
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

export default function FluxoCaixaTab({ periodo, isBarber }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);

  const buscar = useCallback(() => {
    setLoading(true);
    fetch(`/api/financeiro/fluxo?periodo=${periodo}`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json())
      .then(d => setData(d.data || []))
      .finally(() => setLoading(false));
  }, [periodo]);

  useEffect(() => { buscar(); }, [buscar]);

  const saldoTotal   = data.reduce((s, d) => s + d.saldo,   0);
  const receitaTotal = data.reduce((s, d) => s + d.receita, 0);
  const despesaTotal = data.reduce((s, d) => s + d.despesa, 0);

  const labels = data.map(d => fmtD(d.data));

  const lineData = {
    labels,
    datasets: [
      {
        label: 'Receitas',
        data: data.map(d => d.receita),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22,163,74,0.12)',
        fill: true, tension: 0.4,
        pointRadius: data.length > 20 ? 0 : 3,
      },
      {
        label: 'Despesas',
        data: data.map(d => d.despesa),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220,38,38,0.08)',
        fill: true, tension: 0.4,
        pointRadius: data.length > 20 ? 0 : 3,
      },
    ],
  };

  const saldoBar = {
    labels,
    datasets: [{
      label: 'Saldo',
      data: data.map(d => d.saldo),
      backgroundColor: data.map(d => d.saldo >= 0 ? 'rgba(22,163,74,0.75)' : 'rgba(220,38,38,0.75)'),
      borderRadius: 4,
    }],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* KPIs */}
      <div className={s.kpiGrid}>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Total Receitas</span>
          <span className={s.kpiValue} style={{ color: 'var(--success)' }}>{fmtR(receitaTotal)}</span>
        </div>
        {!isBarber && (
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Total Despesas</span>
            <span className={s.kpiValue} style={{ color: '#dc2626' }}>{fmtR(despesaTotal)}</span>
          </div>
        )}
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Saldo do Período</span>
          <span className={s.kpiValue} style={{ color: saldoTotal >= 0 ? 'var(--success)' : '#dc2626' }}>{fmtR(saldoTotal)}</span>
        </div>
      </div>

      {loading ? (
        <p className={s.emptyState}>Carregando...</p>
      ) : data.length === 0 ? (
        <p className={s.emptyState}>Nenhum dado no período.</p>
      ) : (
        <>
          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Receitas vs Despesas</h4>
              <Line data={lineData} options={lineOpts} />
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Saldo por Dia</h4>
              <Bar data={saldoBar} options={barOpts} />
            </div>
          </div>

          <div className={s.tableWrap}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th style={{ textAlign: 'right' }}>Receitas</th>
                  {!isBarber && <th style={{ textAlign: 'right' }}>Despesas</th>}
                  <th style={{ textAlign: 'right' }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {data.map(d => (
                  <tr key={d.data}>
                    <td style={{ fontSize: '0.85rem' }}>{fmtDFull(d.data)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>{fmtR(d.receita)}</td>
                    {!isBarber && <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>{fmtR(d.despesa)}</td>}
                    <td style={{ textAlign: 'right', fontWeight: 700, color: d.saldo >= 0 ? 'var(--success)' : '#dc2626' }}>{fmtR(d.saldo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
