import React, { useState, useEffect, useCallback } from 'react';
import s from '../Financeiro.module.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtN = v => new Intl.NumberFormat('pt-BR').format(Number(v) || 0);

const MEDALS       = ['🥇', '🥈', '🥉'];
const MEDAL_COLORS = ['#f59e0b','#9ca3af','#b45309','#2563eb','#7c3aed','#16a34a','#0891b2','#db2777'];

const doughnutOpts = {
  responsive: true,
  plugins: {
    legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 12 } },
    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmtR(ctx.parsed)}` } },
  },
};

export default function RankingTab({ periodo }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy,  setSortBy]  = useState('faturamento');

  const buscar = useCallback(() => {
    setLoading(true);
    fetch(`/api/financeiro/ranking?periodo=${periodo}`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json())
      .then(d => setData(d.data || []))
      .finally(() => setLoading(false));
  }, [periodo]);

  useEffect(() => { buscar(); }, [buscar]);

  const sorted = [...data].sort((a, b) => b[sortBy] - a[sortBy]);

  // Gráfico barras horizontal — faturamento
  const barData = {
    labels: sorted.map(b => b.nome),
    datasets: [{
      label: sortBy === 'faturamento' ? 'Faturamento' : sortBy === 'atendimentos' ? 'Atendimentos' : 'Ticket Médio',
      data: sorted.map(b => b[sortBy]),
      backgroundColor: MEDAL_COLORS,
      borderRadius: 4,
    }],
  };

  const barOpts = {
    responsive: true,
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => sortBy === 'atendimentos' ? `${ctx.parsed.x}x` : fmtR(ctx.parsed.x) } },
    },
    scales: {
      x: { ticks: { color: '#6b7280', font: { size: 10 }, callback: v => sortBy === 'atendimentos' ? v : fmtR(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };

  // Anel — participação no faturamento
  const doughnutData = {
    labels: sorted.map(b => b.nome),
    datasets: [{
      data: sorted.map(b => b.faturamento),
      backgroundColor: MEDAL_COLORS,
      borderWidth: 0,
    }],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className={s.inputRow}>
        <div className={s.inputGroup}>
          <label>Ordenar por</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="faturamento">Faturamento</option>
            <option value="atendimentos">Atendimentos</option>
            <option value="ticketMedio">Ticket Médio</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className={s.emptyState}>Carregando...</p>
      ) : data.length === 0 ? (
        <p className={s.emptyState}>Nenhum dado no período.</p>
      ) : (
        <>
          {/* Gráficos */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1rem' }}>
            <div className="card">
              <div className="card-body">
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Ranking por {sortBy === 'faturamento' ? 'Faturamento' : sortBy === 'atendimentos' ? 'Atendimentos' : 'Ticket Médio'}</h4>
                <Bar data={barData} options={barOpts} />
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Participação no Faturamento</h4>
                <Doughnut data={doughnutData} options={doughnutOpts} />
              </div>
            </div>
          </div>

          {/* Tabela */}
          <div className={s.tableWrap}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Profissional</th>
                  <th style={{ textAlign: 'center' }}>Atendimentos</th>
                  <th style={{ textAlign: 'right' }}>Ticket Médio</th>
                  <th style={{ textAlign: 'right' }}>Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((b, i) => (
                  <tr key={b.id}>
                    <td style={{ textAlign: 'center', fontSize: '1rem' }}>{MEDALS[i] || i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{b.nome}</td>
                    <td style={{ textAlign: 'center' }}>{fmtN(b.atendimentos)}</td>
                    <td style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 700 }}>{fmtR(b.ticketMedio)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>{fmtR(b.faturamento)}</td>
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
