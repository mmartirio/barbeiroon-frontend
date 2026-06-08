import React, { useState, useEffect, useCallback } from 'react';
import s from '../Financeiro.module.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiEdit2, FiTrash2, FiUsers } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const tok    = () => sessionStorage.getItem('token');
const fmtR   = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtPct = v => {
  const n = parseFloat(v || 0);
  return n % 1 === 0 ? `${Math.round(n)}%` : `${n.toFixed(1)}%`;
};
const fmtConfig = (type, pct, val) => {
  if (!type) return null;
  return type === 'fixed' ? fmtR(val) : fmtPct(pct);
};

const MEDALS = ['🥇', '🥈', '🥉'];
const COLORS  = ['#f59e0b','#9ca3af','#b45309','#2563eb','#7c3aed','#16a34a','#0891b2','#db2777'];

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

// ─── Modal criar/editar ───────────────────────────────────────────────────────
function ComissaoModal({ barber, onSave, onClose, saving }) {
  const initial    = barber?.commissionType || 'percentage';
  const initialVal = initial === 'fixed'
    ? (barber?.commissionValue    != null ? String(barber.commissionValue)    : '')
    : (barber?.commissionPercentage != null ? String(barber.commissionPercentage) : '');

  const [type,  setType]  = useState(initial);
  const [value, setValue] = useState(initialVal);
  const [err,   setErr]   = useState('');

  const handleSave = () => {
    const num = parseFloat(value);
    if (value === '' || isNaN(num) || num < 0) return setErr('Informe um valor válido.');
    if (type === 'percentage' && num > 100)    return setErr('Percentual deve ser entre 0 e 100.');
    setErr('');
    onSave({ type, value: num });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ padding: '1.5rem', minWidth: 340, maxWidth: 420, width: '90%' }}>
        <h3 style={{ marginBottom: '1.25rem', fontSize: '0.95rem', fontWeight: 700 }}>
          {barber ? `Comissão — ${barber.nome}` : 'Definir Comissão para Todos'}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className={s.inputGroup}>
            <label>Tipo de Comissão</label>
            <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.25rem' }}>
              {[
                { v: 'percentage', label: 'Percentagem (%)' },
                { v: 'fixed',      label: 'Valor Fixo (R$)' },
              ].map(opt => (
                <label key={opt.v} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input
                    type="radio"
                    value={opt.v}
                    checked={type === opt.v}
                    onChange={() => { setType(opt.v); setValue(''); setErr(''); }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className={s.inputGroup}>
            <label>{type === 'fixed' ? 'Valor Fixo por Atendimento' : 'Percentual'}</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {type === 'fixed' && (
                <span style={{ position: 'absolute', left: '0.65rem', color: 'var(--color-muted)', fontSize: '0.875rem', pointerEvents: 'none' }}>R$</span>
              )}
              <input
                type="number"
                min="0"
                max={type === 'percentage' ? 100 : undefined}
                step={type === 'percentage' ? 1 : 0.01}
                value={value}
                onChange={e => { setValue(e.target.value); setErr(''); }}
                placeholder={type === 'fixed' ? '0,00' : '0'}
                style={{
                  width: '100%',
                  paddingLeft:  type === 'fixed'      ? '2.4rem' : '0.65rem',
                  paddingRight: type === 'percentage' ? '2rem'   : '0.65rem',
                }}
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
              {type === 'percentage' && (
                <span style={{ position: 'absolute', right: '0.65rem', color: 'var(--color-muted)', fontSize: '0.875rem', pointerEvents: 'none' }}>%</span>
              )}
            </div>
            {err && <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>{err}</span>}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Card de comissão do barbeiro (vista própria) ─────────────────────────────
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
          { label: 'Atendimentos',  value: result.qtdAtendimentos,          color: 'var(--color)' },
          { label: 'Faturamento',   value: fmtR(result.faturamento),        color: 'var(--success)' },
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
  const [filterBarber,  setFilterBarber]  = useState('todos');
  const [modal,         setModal]         = useState(null);
  const [saving,        setSaving]        = useState(false);

  // Busca configurações (só gestores)
  const buscarBarbers = useCallback(async () => {
    if (isBarber) return;
    setLoadingConfig(true);
    try {
      const r = await fetch('/api/financeiro/comissao/barbeiros', { headers: { Authorization: `Bearer ${tok()}` } });
      const d = await r.json();
      setBarbers(d.data || []);
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

  // Salvar individual
  const salvar = async (barberId, { type, value }) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/financeiro/comissao/${barberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ type, value }),
      });
      if (!res.ok) throw new Error();
      await Promise.all([buscarBarbers(), buscarResults()]);
      setModal(null);
    } catch { alert('Erro ao salvar comissão.'); }
    finally { setSaving(false); }
  };

  // Salvar em lote
  const salvarLote = async ({ type, value }) => {
    setSaving(true);
    try {
      await Promise.all(barbers.map(b =>
        fetch(`/api/financeiro/comissao/${b.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify({ type, value }),
        })
      ));
      await Promise.all([buscarBarbers(), buscarResults()]);
      setModal(null);
    } catch { alert('Erro ao salvar comissões.'); }
    finally { setSaving(false); }
  };

  // Excluir
  const excluir = async (barberId, nome) => {
    if (!window.confirm(`Remover comissão de "${nome}"?`)) return;
    try {
      await fetch(`/api/financeiro/comissao/${barberId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tok()}` },
      });
      await Promise.all([buscarBarbers(), buscarResults()]);
    } catch { alert('Erro ao remover comissão.'); }
  };

  // Abrir modal: se um barbeiro específico estiver selecionado, edita ele diretamente
  const abrirModal = () => {
    if (filterBarber !== 'todos') {
      const b = barbers.find(x => x.id === Number(filterBarber));
      if (b) return setModal({ barber: b });
    }
    setModal('lote');
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
    datasets: [{
      data: filteredResults.map(b => b.faturamento),
      backgroundColor: COLORS,
      borderRadius: 4,
    }],
  };
  const donutData = filteredResults.filter(b => b.comissao > 0);
  const comissaoDoughnut = {
    labels: donutData.map(b => b.nome),
    datasets: [{
      data: donutData.map(b => b.comissao),
      backgroundColor: COLORS,
      borderWidth: 0,
    }],
  };

  // Vista barbeiro — própria linha de resultado
  const myResult = isBarber ? results[0] || null : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Vista do barbeiro ──────────────────────────────────────────── */}
      {isBarber && (
        loadingResult
          ? <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
          : <MyComissaoCard result={myResult} />
      )}

      {/* ── Filtro + ação em lote (só gestores) ───────────────────────── */}
      {!isBarber && (
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className={s.inputGroup}>
            <label>Filtrar barbeiro</label>
            <select value={filterBarber} onChange={e => setFilterBarber(e.target.value)}>
              <option value="todos">Todos</option>
              {barbers.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
          </div>
          <button
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            onClick={abrirModal}
          >
            <FiUsers size={14} />
            {filterBarber === 'todos' ? 'Definir para Todos' : 'Definir Comissão'}
          </button>
        </div>
      )}

      {/* ── Tabela CRUD de configurações (só gestores) ────────────────── */}
      {!isBarber && (
        <div>
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            Configurações de Comissão
          </h3>
          {loadingConfig ? (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
          ) : (
            <div className={s.tableWrap}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Profissional</th>
                    <th style={{ textAlign: 'center' }}>Tipo</th>
                    <th style={{ textAlign: 'right'  }}>Comissão</th>
                    <th style={{ width: 80 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBarbers.length === 0 && (
                    <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--color-muted)', padding: '1.5rem' }}>Nenhum barbeiro encontrado.</td></tr>
                  )}
                  {filteredBarbers.map(b => {
                    const hasComissao = !!b.commissionType;
                    const cfgDisplay  = fmtConfig(b.commissionType, b.commissionPercentage, b.commissionValue);
                    return (
                      <tr key={b.id}>
                        <td style={{ fontWeight: 600 }}>{b.nome}</td>
                        <td style={{ textAlign: 'center' }}>
                          {hasComissao ? (
                            <span className={s.badge} style={{
                              background: b.commissionType === 'fixed' ? 'rgba(37,99,235,0.15)' : 'rgba(124,58,237,0.15)',
                              color:      b.commissionType === 'fixed' ? 'var(--accent)'        : '#7c3aed',
                            }}>
                              {b.commissionType === 'fixed' ? 'Valor Fixo' : 'Percentagem'}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--color-muted)', fontSize: '0.82rem' }}>—</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 700 }}>
                          {cfgDisplay ?? <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>Não definida</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '0.25rem 0.5rem' }}
                              title="Editar"
                              onClick={() => setModal({ barber: b })}
                            >
                              <FiEdit2 size={13} />
                            </button>
                            {hasComissao && (
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '0.25rem 0.5rem', color: '#dc2626' }}
                                title="Remover"
                                onClick={() => excluir(b.id, b.nome)}
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
      )}

      {/* ── KPIs do período ─────────────────────────────────────────────── */}
      {!isBarber && (
        <div className={s.kpiGrid}>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Faturamento Total</span>
            <span className={s.kpiValue} style={{ color: 'var(--success)' }}>{fmtR(totalFaturamento)}</span>
          </div>
          <div className={s.kpiCard}>
            <span className={s.kpiLabel}>Total Comissões</span>
            <span className={s.kpiValue} style={{ color: '#7c3aed' }}>{fmtR(totalComissao)}</span>
          </div>
          {totalFaturamento > 0 && (
            <div className={s.kpiCard}>
              <span className={s.kpiLabel}>% sobre Faturamento</span>
              <span className={s.kpiValue} style={{ color: '#f59e0b' }}>
                {((totalComissao / totalFaturamento) * 100).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

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
        {!isBarber && (
          <h3 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
            Resultados do Período
          </h3>
        )}

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
                  const isFixed    = b.commissionType === 'fixed';
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
                          isFixed ? (
                            <span>
                              {fmtR(b.commissionValue)}
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginLeft: '0.25rem' }}>/atend.</span>
                            </span>
                          ) : (
                            <span style={{ fontWeight: 700 }}>{fmtPct(b.percentual)}</span>
                          )
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

      {/* ── Modal ────────────────────────────────────────────────────────── */}
      {modal !== null && (
        <ComissaoModal
          barber={modal === 'lote' ? null : modal.barber}
          onSave={modal === 'lote'
            ? salvarLote
            : ({ type, value }) => salvar(modal.barber.id, { type, value })}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
    </div>
  );
}
