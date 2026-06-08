import React, { useState, useEffect, useCallback } from 'react';
import s from '../Financeiro.module.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiCheck, FiTrash2 } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const tok    = () => sessionStorage.getItem('token');
const fmtR   = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtPct = v => {
  const n = parseFloat(v || 0);
  return n % 1 === 0 ? `${Math.round(n)}%` : `${n.toFixed(1)}%`;
};

const MEDALS = ['🥇', '🥈', '🥉'];
const COLORS  = ['#f59e0b', '#9ca3af', '#b45309', '#2563eb', '#7c3aed', '#16a34a', '#0891b2', '#db2777'];

const chartBarOpts = {
  indexAxis: 'y',
  responsive: true,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => fmtR(ctx.parsed.x) } } },
  scales: {
    x: { ticks: { color: '#6b7280', font: { size: 10 }, callback: v => fmtR(v) }, grid: { color: 'rgba(255,255,255,0.05)' } },
    y: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.05)' } },
  },
};
const chartDonutOpts = {
  responsive: true,
  plugins: {
    legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 12 } },
    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmtR(ctx.parsed)}` } },
  },
};

// ─── Input de valor formatado por tipo ───────────────────────────────────────
function ValorInput({ type, value, onChange }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 110 }}>
      {type === 'fixed' && (
        <span style={{ position: 'absolute', left: '0.55rem', fontSize: '0.8rem', color: 'var(--color-muted)', pointerEvents: 'none' }}>R$</span>
      )}
      <input
        type="number"
        min="0"
        max={type === 'percentage' ? 100 : undefined}
        step={type === 'percentage' ? 1 : 0.01}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={type === 'fixed' ? '0,00' : '0'}
        className={s.pctInput}
        style={{
          width: '100%',
          paddingLeft:  type === 'fixed'      ? '2rem'   : '0.5rem',
          paddingRight: type === 'percentage' ? '1.75rem' : '0.5rem',
          textAlign: 'left',
        }}
      />
      {type === 'percentage' && (
        <span style={{ position: 'absolute', right: '0.55rem', fontSize: '0.8rem', color: 'var(--color-muted)', pointerEvents: 'none' }}>%</span>
      )}
    </div>
  );
}

// ─── Card da comissão do próprio barbeiro ────────────────────────────────────
function MyComissaoCard({ result }) {
  if (!result) return null;
  const isFixed    = result.commissionType === 'fixed';
  const hasConfig  = isFixed ? result.commissionValue > 0 : result.percentual > 0;
  const configStr  = isFixed ? `${fmtR(result.commissionValue)} / atendimento` : fmtPct(result.percentual);

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-muted)', letterSpacing: '0.04em' }}>
          Minha Comissão
        </span>
        <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {hasConfig ? (
            <>
              <span className={s.badge} style={{
                background: isFixed ? 'rgba(37,99,235,0.15)' : 'rgba(124,58,237,0.15)',
                color:      isFixed ? 'var(--accent)'        : '#7c3aed',
              }}>
                {isFixed ? 'Valor Fixo' : 'Percentagem'}
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: isFixed ? 'var(--accent)' : '#7c3aed' }}>
                {configStr}
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--color-muted)', fontStyle: 'italic', fontSize: '0.875rem' }}>Não configurada</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        {[
          { label: 'Atendimentos',     value: result.qtdAtendimentos,                          color: 'var(--color)' },
          { label: 'Faturamento',      value: fmtR(result.faturamento),                        color: 'var(--success)' },
          { label: 'Ganho no Período', value: result.comissao > 0 ? fmtR(result.comissao) : '—', color: '#7c3aed' },
        ].map(k => (
          <div key={k.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--color-muted)' }}>{k.label}</span>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: k.color }}>{k.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────
export default function ComissaoTab({ periodo, isBarber }) {
  const [barbers,       setBarbers]       = useState([]);
  const [results,       setResults]       = useState([]);
  const [loadingConfig, setLoadingConfig] = useState(!isBarber);
  const [loadingResult, setLoadingResult] = useState(true);
  // Estado local de cada linha: { [id]: { type, value } }
  const [rows,          setRows]          = useState({});
  const [saving,        setSaving]        = useState({});
  // Filtro
  const [filterBarber,  setFilterBarber]  = useState('todos');
  // Formulário "Aplicar para Todos"
  const [loteType,  setLoteType]  = useState('percentage');
  const [loteValue, setLoteValue] = useState('');
  const [savingLote, setSavingLote] = useState(false);

  // Busca configurações (só gestores)
  const buscarBarbers = useCallback(async () => {
    if (isBarber) return;
    setLoadingConfig(true);
    try {
      const r = await fetch('/api/financeiro/comissao/barbeiros', { headers: { Authorization: `Bearer ${tok()}` } });
      const d = await r.json();
      const list = d.data || [];
      setBarbers(list);
      // Inicializa estado das linhas
      const init = {};
      list.forEach(b => {
        init[b.id] = {
          type:  b.commissionType || 'percentage',
          value: b.commissionType === 'fixed'
            ? (b.commissionValue != null ? String(b.commissionValue) : '')
            : (b.commissionPercentage != null ? String(b.commissionPercentage) : ''),
        };
      });
      setRows(init);
    } finally {
      setLoadingConfig(false);
    }
  }, [isBarber]);

  // Busca resultados do período
  const buscarResults = useCallback(async () => {
    setLoadingResult(true);
    try {
      const r = await fetch(`/api/financeiro/comissao?periodo=${periodo}`, { headers: { Authorization: `Bearer ${tok()}` } });
      const d = await r.json();
      setResults(d.data || []);
    } finally {
      setLoadingResult(false);
    }
  }, [periodo]);

  useEffect(() => { buscarBarbers(); }, [buscarBarbers]);
  useEffect(() => { buscarResults(); }, [buscarResults]);

  // Atualiza campo de uma linha
  const setRow = (id, field, val) =>
    setRows(prev => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  // Salvar uma linha
  const salvar = async (id) => {
    const row = rows[id] || {};
    const num = parseFloat(row.value);
    if (row.value === '' || isNaN(num) || num < 0) return alert('Informe um valor válido.');
    if (row.type === 'percentage' && num > 100) return alert('Percentual deve ser entre 0 e 100.');

    setSaving(sv => ({ ...sv, [id]: true }));
    try {
      const res = await fetch(`/api/financeiro/comissao/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ type: row.type, value: num }),
      });
      if (!res.ok) throw new Error();
      await Promise.all([buscarBarbers(), buscarResults()]);
    } catch { alert('Erro ao salvar comissão.'); }
    finally { setSaving(sv => ({ ...sv, [id]: false })); }
  };

  // Excluir comissão de uma linha
  const excluir = async (id, nome) => {
    if (!window.confirm(`Remover comissão de "${nome}"?`)) return;
    setSaving(sv => ({ ...sv, [id]: true }));
    try {
      await fetch(`/api/financeiro/comissao/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok()}` },
      });
      await Promise.all([buscarBarbers(), buscarResults()]);
    } catch { alert('Erro ao remover comissão.'); }
    finally { setSaving(sv => ({ ...sv, [id]: false })); }
  };

  // Aplicar tipo+valor para todos (ou filtrado)
  const aplicarLote = async () => {
    const num = parseFloat(loteValue);
    if (loteValue === '' || isNaN(num) || num < 0) return alert('Informe um valor válido.');
    if (loteType === 'percentage' && num > 100) return alert('Percentual deve ser entre 0 e 100.');
    setSavingLote(true);
    const targets = filteredBarbers;
    try {
      await Promise.all(targets.map(b =>
        fetch(`/api/financeiro/comissao/${b.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify({ type: loteType, value: num }),
        })
      ));
      setLoteValue('');
      await Promise.all([buscarBarbers(), buscarResults()]);
    } catch { alert('Erro ao salvar comissões.'); }
    finally { setSavingLote(false); }
  };

  // Dados filtrados
  const filteredBarbers = filterBarber === 'todos'
    ? barbers
    : barbers.filter(b => b.id === Number(filterBarber));

  const filteredResults = filterBarber === 'todos'
    ? results
    : results.filter(r => r.id === Number(filterBarber));

  const totalFaturamento = filteredResults.reduce((acc, b) => acc + Number(b.faturamento || 0), 0);
  const totalComissao    = filteredResults.reduce((acc, b) => acc + Number(b.comissao    || 0), 0);

  // Gráficos
  const fatBar = {
    labels: filteredResults.map(b => b.nome),
    datasets: [{ data: filteredResults.map(b => b.faturamento), backgroundColor: COLORS, borderRadius: 4 }],
  };
  const donutData = filteredResults.filter(b => b.comissao > 0);
  const comissaoDoughnut = {
    labels: donutData.map(b => b.nome),
    datasets: [{ data: donutData.map(b => b.comissao), backgroundColor: COLORS, borderWidth: 0 }],
  };

  const myResult = isBarber ? results[0] || null : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Vista do barbeiro ─────────────────────────────────────────── */}
      {isBarber && (
        loadingResult
          ? <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
          : <MyComissaoCard result={myResult} />
      )}

      {/* ── Seção CRUD (só gestores) ───────────────────────────────────── */}
      {!isBarber && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Cabeçalho + filtro */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className={s.inputGroup}>
              <label>Filtrar barbeiro</label>
              <select value={filterBarber} onChange={e => setFilterBarber(e.target.value)}>
                <option value="todos">Todos</option>
                {barbers.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select>
            </div>
          </div>

          {/* Formulário "Aplicar para Todos / Filtrado" */}
          <div className="card" style={{ padding: '1rem' }}>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              {filterBarber === 'todos' ? 'Aplicar para Todos os Barbeiros' : `Aplicar para: ${barbers.find(b => b.id === Number(filterBarber))?.nome}`}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div className={s.inputGroup}>
                <label>Tipo</label>
                <select value={loteType} onChange={e => { setLoteType(e.target.value); setLoteValue(''); }}>
                  <option value="percentage">Percentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>
              <div className={s.inputGroup}>
                <label>{loteType === 'fixed' ? 'Valor por Atendimento' : 'Percentual'}</label>
                <ValorInput type={loteType} value={loteValue} onChange={setLoteValue} />
              </div>
              <button
                className="btn btn-primary"
                onClick={aplicarLote}
                disabled={savingLote || !loteValue}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <FiCheck size={14} />
                {savingLote ? 'Aplicando...' : filterBarber === 'todos' ? 'Aplicar para Todos' : 'Aplicar'}
              </button>
            </div>
          </div>

          {/* Tabela CRUD inline */}
          <div>
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
              Comissão por Profissional
            </p>

            {loadingConfig ? (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
            ) : filteredBarbers.length === 0 ? (
              <p className={s.emptyState}>Nenhum barbeiro encontrado.</p>
            ) : (
              <div className={s.tableWrap}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Profissional</th>
                      <th style={{ textAlign: 'center', width: 160 }}>Tipo de Comissão</th>
                      <th style={{ textAlign: 'center', width: 140 }}>Valor</th>
                      <th style={{ textAlign: 'center', width: 90 }}>Situação</th>
                      <th style={{ width: 90 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBarbers.map(b => {
                      const row         = rows[b.id] || { type: 'percentage', value: '' };
                      const hasComissao = !!b.commissionType;
                      const isSaving    = saving[b.id];
                      return (
                        <tr key={b.id}>
                          <td style={{ fontWeight: 600 }}>{b.nome}</td>

                          {/* Tipo */}
                          <td style={{ textAlign: 'center' }}>
                            <select
                              value={row.type}
                              onChange={e => setRow(b.id, 'type', e.target.value)}
                              style={{
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-xs)',
                                color: 'var(--color)',
                                fontSize: '0.82rem',
                                padding: '0.35rem 0.5rem',
                                width: '100%',
                              }}
                            >
                              <option value="percentage">Percentagem (%)</option>
                              <option value="fixed">Valor Fixo (R$)</option>
                            </select>
                          </td>

                          {/* Valor */}
                          <td style={{ textAlign: 'center' }}>
                            <ValorInput
                              type={row.type}
                              value={row.value}
                              onChange={val => setRow(b.id, 'value', val)}
                            />
                          </td>

                          {/* Situação */}
                          <td style={{ textAlign: 'center' }}>
                            {hasComissao ? (
                              <span className={s.badge} style={{
                                background: b.commissionType === 'fixed' ? 'rgba(37,99,235,0.15)' : 'rgba(124,58,237,0.15)',
                                color:      b.commissionType === 'fixed' ? 'var(--accent)'        : '#7c3aed',
                              }}>
                                {b.commissionType === 'fixed'
                                  ? fmtR(b.commissionValue)
                                  : fmtPct(b.commissionPercentage)}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--color-muted)', fontSize: '0.78rem' }}>Não definida</span>
                            )}
                          </td>

                          {/* Ações */}
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                                onClick={() => salvar(b.id)}
                                disabled={isSaving || !row.value}
                                title="Salvar"
                              >
                                <FiCheck size={13} />
                                {isSaving ? '...' : 'Salvar'}
                              </button>
                              {hasComissao && (
                                <button
                                  className="btn btn-ghost"
                                  style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                                  onClick={() => excluir(b.id, b.nome)}
                                  disabled={isSaving}
                                  title="Remover comissão"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── KPIs do período ─────────────────────────────────────────────── */}
      <div className={s.kpiGrid}>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Faturamento Total</span>
          <span className={s.kpiValue} style={{ color: 'var(--success)' }}>{fmtR(totalFaturamento)}</span>
        </div>
        <div className={s.kpiCard}>
          <span className={s.kpiLabel}>Total Comissões</span>
          <span className={s.kpiValue} style={{ color: '#7c3aed' }}>{fmtR(totalComissao)}</span>
        </div>
        {totalFaturamento > 0 && !isBarber && (
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>% sobre Faturamento</span>
            <span className={s.kpiValue} style={{ color: '#f59e0b' }}>
              {((totalComissao / totalFaturamento) * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* ── Gráficos ────────────────────────────────────────────────────── */}
      {!isBarber && filteredResults.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Faturamento por Barbeiro</h4>
              <Bar data={fatBar} options={chartBarOpts} />
            </div>
          </div>
          {donutData.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Distribuição de Comissões</h4>
                <Doughnut data={comissaoDoughnut} options={chartDonutOpts} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tabela de resultados do período ─────────────────────────────── */}
      <div>
        <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
          Resultados do Período
        </p>
        {loadingResult ? (
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
        ) : filteredResults.length === 0 ? (
          <p className={s.emptyState}>Nenhum atendimento concluído no período.</p>
        ) : (
          <div className={s.tableWrap}>
            <table className="data-table">
              <thead>
                <tr>
                  {!isBarber && <th>#</th>}
                  <th>Profissional</th>
                  <th style={{ textAlign: 'center' }}>Atendimentos</th>
                  <th style={{ textAlign: 'right'  }}>Faturamento</th>
                  <th style={{ textAlign: 'center' }}>Comissão</th>
                  <th style={{ textAlign: 'right'  }}>Ganho</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((b, i) => {
                  const isFixed     = b.commissionType === 'fixed';
                  const hasComissao = isFixed ? b.commissionValue > 0 : b.percentual > 0;
                  return (
                    <tr key={b.id}>
                      {!isBarber && (
                        <td style={{ textAlign: 'center', fontSize: '1rem' }}>{MEDALS[i] || i + 1}</td>
                      )}
                      <td style={{ fontWeight: 600 }}>{b.nome}</td>
                      <td style={{ textAlign: 'center' }}>{b.qtdAtendimentos}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>{fmtR(b.faturamento)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {hasComissao ? (
                          isFixed
                            ? <span>{fmtR(b.commissionValue)}<span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginLeft: '0.25rem' }}>/atend.</span></span>
                            : <span style={{ fontWeight: 700 }}>{fmtPct(b.percentual)}</span>
                        ) : (
                          <span style={{ color: 'var(--color-muted)' }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', color: '#7c3aed', fontWeight: 700 }}>
                        {b.comissao > 0 ? fmtR(b.comissao) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
