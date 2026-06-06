import React, { useState, useEffect, useCallback } from 'react';
import s from '../Financeiro.module.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiCheck } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtN = v => new Intl.NumberFormat('pt-BR').format(Number(v) || 0);

const MEDALS  = ['🥇', '🥈', '🥉'];
const COLORS  = ['#f59e0b','#9ca3af','#b45309','#2563eb','#7c3aed','#16a34a','#0891b2','#db2777'];

const doughnutOpts = {
  responsive: true,
  plugins: {
    legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 12 } },
    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmtR(ctx.parsed)}` } },
  },
};

const barOpts = (fmt) => ({
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.x ?? ctx.parsed.y) } } },
  scales: {
    x: { ticks: { color: '#6b7280', font: { size: 10 }, callback: v => fmt(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
});

export default function ComissaoTab({ periodo, isBarber }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [pcts,    setPcts]    = useState({});
  const [saving,  setSaving]  = useState({});

  const buscar = useCallback(() => {
    setLoading(true);
    fetch(`/api/financeiro/comissao?periodo=${periodo}`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json())
      .then(d => {
        const list = d.data || [];
        setData(list);
        const p = {};
        list.forEach(b => { p[b.id] = b.percentual ?? ''; });
        setPcts(p);
      })
      .finally(() => setLoading(false));
  }, [periodo]);

  useEffect(() => { buscar(); }, [buscar]);

  const salvarPct = async (barberId) => {
    setSaving(sv => ({ ...sv, [barberId]: true }));
    try {
      const res = await fetch(`/api/financeiro/comissao/${barberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ percentual: Number(pcts[barberId] || 0) }),
      });
      if (!res.ok) throw new Error();
      buscar();
    } catch { alert('Erro ao salvar comissão.'); }
    finally { setSaving(sv => ({ ...sv, [barberId]: false })); }
  };

  const totalComissao  = data.reduce((s, b) => s + Number(b.comissao  || 0), 0);
  const totalFaturamento = data.reduce((s, b) => s + Number(b.faturamento || 0), 0);

  // Gráfico barras — faturamento por barbeiro
  const fatBar = {
    labels: data.map(b => b.nome),
    datasets: [{
      label: 'Faturamento',
      data: data.map(b => b.faturamento),
      backgroundColor: COLORS,
      borderRadius: 4,
    }],
  };

  // Gráfico anel — distribuição de comissões
  const comissaoDoughnut = {
    labels: data.filter(b => b.comissao > 0).map(b => b.nome),
    datasets: [{
      data: data.filter(b => b.comissao > 0).map(b => b.comissao),
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  };

  if (loading) return <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* KPIs */}
      <div className={s.kpiGrid}>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Faturamento Total</span>
          <span className={s.kpiValue} style={{ color: 'var(--success)' }}>{fmtR(totalFaturamento)}</span>
        </div>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Total Comissões</span>
          <span className={s.kpiValue} style={{ color: '#7c3aed' }}>{fmtR(totalComissao)}</span>
        </div>
      </div>

      {/* Gráficos */}
      {data.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Faturamento por Barbeiro</h4>
              <Bar data={fatBar} options={{ ...barOpts(fmtR), indexAxis: 'y' }} />
            </div>
          </div>
          {data.some(b => b.comissao > 0) && (
            <div className="card">
              <div className="card-body">
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Distribuição de Comissões</h4>
                <Doughnut data={comissaoDoughnut} options={doughnutOpts} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tabela */}
      {data.length === 0 ? (
        <p className={s.emptyState}>Nenhum barbeiro encontrado.</p>
      ) : (
        <div className={s.tableWrap}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Profissional</th>
                <th style={{ textAlign: 'center' }}>Atendimentos</th>
                <th style={{ textAlign: 'right' }}>Faturamento</th>
                <th style={{ textAlign: 'center' }}>Comissão %</th>
                <th style={{ textAlign: 'right' }}>Comissão R$</th>
                {!isBarber && <th></th>}
              </tr>
            </thead>
            <tbody>
              {data.map((b, i) => (
                <tr key={b.id}>
                  <td style={{ textAlign: 'center', fontSize: '1rem' }}>{MEDALS[i] || i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{b.nome}</td>
                  <td style={{ textAlign: 'center' }}>{fmtN(b.qtdAtendimentos)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>{fmtR(b.faturamento)}</td>
                  <td style={{ textAlign: 'center' }}>
                    {!isBarber ? (
                      <input
                        type="number" min="0" max="100" step="0.5"
                        className={s.pctInput}
                        value={pcts[b.id] ?? ''}
                        onChange={e => setPcts(p => ({ ...p, [b.id]: e.target.value }))}
                      />
                    ) : (
                      <span style={{ fontWeight: 700 }}>{b.percentual > 0 ? `${b.percentual}%` : '—'}</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', color: '#7c3aed', fontWeight: 700 }}>{b.percentual > 0 ? fmtR(b.comissao) : '—'}</td>
                  {!isBarber && (
                    <td>
                      <button
                        className="btn btn-ghost"
                        onClick={() => salvarPct(b.id)}
                        disabled={saving[b.id]}
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <FiCheck size={12} /> {saving[b.id] ? '...' : 'Salvar'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!isBarber && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
          Edite o percentual e clique em Salvar para atualizar a comissão de cada barbeiro.
        </p>
      )}
    </div>
  );
}
