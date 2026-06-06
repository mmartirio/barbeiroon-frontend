import React, { useState, useEffect, useCallback } from 'react';
import s from '../Financeiro.module.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const tok   = () => sessionStorage.getItem('token');
const fmtR  = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtD  = v => { if (!v) return '—'; const [y,m,d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };
const fmtT  = v => String(v || '').slice(0, 5) || '—';
const fmtDD = v => { if (!v) return '—'; const [y,m,d] = String(v).split('-'); return `${d}/${m}`; };

const COLORS = ['#2563eb','#7c3aed','#16a34a','#f59e0b','#dc2626','#0891b2','#db2777','#65a30d'];

const barOpts = (fmt) => ({
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmt(ctx.parsed.y) } } },
  scales: {
    x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#6b7280', font: { size: 10 }, callback: v => fmt(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
});

const doughnutOpts = {
  responsive: true,
  plugins: {
    legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 12 } },
    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmtR(ctx.parsed)}` } },
  },
};

export default function ReceitasTab({ periodo, isBarber }) {
  const [data,          setData]          = useState([]);
  const [total,         setTotal]         = useState(0);
  const [qtd,           setQtd]           = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [profissionais, setProfissionais] = useState([]);
  const [servicos,      setServicos]      = useState([]);
  const [profId,        setProfId]        = useState('');
  const [servicoId,     setServicoId]     = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/financeiro/profissionais', { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json()).catch(() => ({})),
      fetch('/api/service?limit=200', { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json()).catch(() => ({})),
    ]).then(([p, sv]) => {
      setProfissionais(p.data || []);
      setServicos(sv.services || sv.data || []);
    });
  }, []);

  const buscar = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ periodo });
    if (profId)    params.set('professionalId', profId);
    if (servicoId) params.set('servicoId', servicoId);
    fetch(`/api/financeiro/receitas?${params}`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json())
      .then(d => { setData(d.data || []); setTotal(d.total || 0); setQtd(d.qtd || 0); })
      .finally(() => setLoading(false));
  }, [periodo, profId, servicoId]);

  useEffect(() => { buscar(); }, [buscar]);

  // Agrupamentos
  const byDay = data.reduce((acc, r) => { const d = String(r.date).slice(0,10); acc[d] = (acc[d]||0) + Number(r.valor||0); return acc; }, {});
  const dayLabels = Object.keys(byDay).sort();

  const bySvc = data.reduce((acc, r) => { const k = r.servicoNome || 'Outros'; acc[k] = (acc[k]||0) + Number(r.valor||0); return acc; }, {});
  const svcEntries = Object.entries(bySvc).sort((a,b) => b[1]-a[1]).slice(0,8);

  const byProf = data.reduce((acc, r) => { const k = r.profissionalNome || 'Outros'; acc[k] = (acc[k]||0) + Number(r.valor||0); return acc; }, {});
  const profEntries = Object.entries(byProf).sort((a,b) => b[1]-a[1]).slice(0,8);

  const dayChartData = {
    labels: dayLabels.map(fmtDD),
    datasets: [{ label: 'Receita', data: dayLabels.map(d => byDay[d]), backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 4 }],
  };

  const svcDoughnut = {
    labels: svcEntries.map(([k]) => k),
    datasets: [{ data: svcEntries.map(([,v]) => v), backgroundColor: COLORS, borderWidth: 0 }],
  };

  const profDoughnut = {
    labels: profEntries.map(([k]) => k),
    datasets: [{ data: profEntries.map(([,v]) => v), backgroundColor: COLORS, borderWidth: 0 }],
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {!isBarber && (
        <div className={s.inputRow}>
          <div className={s.inputGroup}>
            <label>Profissional</label>
            <select value={profId} onChange={e => setProfId(e.target.value)}>
              <option value="">Todos</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className={s.inputGroup}>
            <label>Serviço</label>
            <select value={servicoId} onChange={e => setServicoId(e.target.value)}>
              <option value="">Todos</option>
              {servicos.map(sv => <option key={sv.id} value={sv.id}>{sv.name}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className={s.kpiGrid}>
        <div className={s.kpiCard}><span className={s.kpiLabel}>Faturamento</span><span className={s.kpiValue} style={{ color:'var(--success)' }}>{fmtR(total)}</span></div>
        <div className={s.kpiCard}><span className={s.kpiLabel}>Atendimentos</span><span className={s.kpiValue}>{qtd}</span></div>
        <div className={s.kpiCard}><span className={s.kpiLabel}>Ticket Médio</span><span className={s.kpiValue} style={{ color:'#f59e0b' }}>{qtd > 0 ? fmtR(total/qtd) : 'R$ 0,00'}</span></div>
      </div>


      {data.length > 0 && (
        <>
          {/* Barras por dia */}
          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom:'0.75rem', fontSize:'0.875rem' }}>Receita por Dia</h4>
              <Bar data={dayChartData} options={barOpts(fmtR)} />
            </div>
          </div>

          {/* Anéis */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
            <div className="card">
              <div className="card-body">
                <h4 style={{ marginBottom:'0.75rem', fontSize:'0.875rem' }}>Receita por Serviço</h4>
                <Doughnut data={svcDoughnut} options={doughnutOpts} />
              </div>
            </div>
            {!isBarber && (
              <div className="card">
                <div className="card-body">
                  <h4 style={{ marginBottom:'0.75rem', fontSize:'0.875rem' }}>Receita por Profissional</h4>
                  <Doughnut data={profDoughnut} options={doughnutOpts} />
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {loading ? (
        <p className={s.emptyState}>Carregando...</p>
      ) : data.length === 0 ? (
        <p className={s.emptyState}>Nenhuma receita no período.</p>
      ) : (
        <div className={s.tableWrap}>
          <table className="data-table">
            <thead><tr><th>Data</th><th>Hora</th><th>Cliente</th><th>Profissional</th><th>Serviço</th><th>Valor</th></tr></thead>
            <tbody>
              {data.map((r, i) => (
                <tr key={r.id ?? i}>
                  <td style={{ fontSize:'0.85rem' }}>{fmtD(r.date)}</td>
                  <td style={{ fontSize:'0.85rem' }}>{fmtT(r.time)}</td>
                  <td style={{ fontWeight:600 }}>{r.clienteNome||'—'}</td>
                  <td>{r.profissionalNome||'—'}</td>
                  <td style={{ fontSize:'0.85rem' }}>{r.servicoNome||'—'}</td>
                  <td style={{ color:'var(--success)', fontWeight:700 }}>{fmtR(r.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
