import React, { useState, useEffect, useCallback } from 'react';
import s from '../Financeiro.module.css';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiCheck, FiTrash2 } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const tok   = () => sessionStorage.getItem('token');
const fmtR  = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtPct = v => {
  const n = parseFloat(v || 0);
  return n % 1 === 0 ? `${Math.round(n)}%` : `${n.toFixed(1)}%`;
};
const COLORS = ['#f59e0b', '#9ca3af', '#b45309', '#2563eb', '#7c3aed', '#16a34a', '#0891b2', '#db2777'];
const MEDALS = ['🥇', '🥈', '🥉'];

const donutOpts = {
  responsive: true,
  plugins: {
    legend: { position: 'right', labels: { color: '#9ca3af', font: { size: 10 }, boxWidth: 12 } },
    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmtR(ctx.parsed)}` } },
  },
};

// ─── Input R$ / % ─────────────────────────────────────────────────────────────
function ValorInput({ type, value, onChange, disabled }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 110 }}>
      {type === 'fixed' && (
        <span style={{ position: 'absolute', left: '0.5rem', fontSize: '0.8rem', color: 'var(--color-muted)', pointerEvents: 'none' }}>R$</span>
      )}
      <input
        type="number"
        min="0"
        max={type === 'percentage' ? 100 : undefined}
        step={type === 'percentage' ? 1 : 0.01}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={type === 'fixed' ? '0,00' : '0'}
        className={s.pctInput}
        style={{
          width: '100%',
          paddingLeft:  type === 'fixed'      ? '2rem'    : '0.5rem',
          paddingRight: type === 'percentage' ? '1.75rem' : '0.5rem',
        }}
      />
      {type === 'percentage' && (
        <span style={{ position: 'absolute', right: '0.5rem', fontSize: '0.8rem', color: 'var(--color-muted)', pointerEvents: 'none' }}>%</span>
      )}
    </div>
  );
}

// ─── Linha de item editável (serviço ou produto) ──────────────────────────────
function ItemRow({ item, baseLabel, onSave, onDelete, saving }) {
  const [type,  setType]  = useState(item.commissionType  || 'fixed');
  const [value, setValue] = useState(item.commissionValue != null ? String(item.commissionValue) : '');
  const hasComissao = item.commissionType != null;

  // Formata comissão atual do item
  const configStr = !hasComissao ? null
    : item.commissionType === 'fixed'
      ? fmtR(item.commissionValue)
      : fmtPct(item.commissionValue);

  return (
    <tr>
      <td>
        <div style={{ fontWeight: 600 }}>{item.nome}</div>
        <div style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{baseLabel}</div>
      </td>
      <td style={{ textAlign: 'center', width: 150 }}>
        <select
          value={type}
          onChange={e => { setType(e.target.value); setValue(''); }}
          disabled={saving}
          style={{
            background: 'var(--bg-input)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xs)', color: 'var(--color)',
            fontSize: '0.8rem', padding: '0.3rem 0.5rem', width: '100%',
          }}
        >
          <option value="fixed">Valor Fixo (R$)</option>
          <option value="percentage">Percentagem (%)</option>
        </select>
      </td>
      <td style={{ textAlign: 'center', width: 130 }}>
        <ValorInput type={type} value={value} onChange={setValue} disabled={saving} />
      </td>
      <td style={{ textAlign: 'center', width: 110 }}>
        {hasComissao ? (
          <span className={s.badge} style={{
            background: item.commissionType === 'fixed' ? 'rgba(37,99,235,0.15)' : 'rgba(124,58,237,0.15)',
            color:      item.commissionType === 'fixed' ? 'var(--accent)'        : '#7c3aed',
          }}>
            {configStr}
          </span>
        ) : (
          <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>Não definida</span>
        )}
      </td>
      <td>
        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
          <button
            className="btn btn-ghost"
            style={{ padding: '0.25rem 0.55rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            onClick={() => onSave(item.id, type, value)}
            disabled={saving || !value}
            title="Salvar"
          >
            <FiCheck size={13} />
            {saving ? '...' : 'Salvar'}
          </button>
          {hasComissao && (
            <button
              className="btn btn-ghost"
              style={{ padding: '0.25rem 0.45rem', color: '#dc2626' }}
              onClick={() => onDelete(item.id, item.nome)}
              disabled={saving}
              title="Remover comissão"
            >
              <FiTrash2 size={13} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Tabela de configuração de itens ─────────────────────────────────────────
function ConfigTable({ items, baseLabel, onSave, onDelete, saving, loading, emptyMsg }) {
  if (loading) return <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>;
  if (!items.length) return <p className={s.emptyState}>{emptyMsg}</p>;
  return (
    <div className={s.tableWrap}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th style={{ textAlign: 'center', width: 150 }}>Tipo</th>
            <th style={{ textAlign: 'center', width: 130 }}>Valor de Comissão</th>
            <th style={{ textAlign: 'center', width: 110 }}>Configurado</th>
            <th style={{ width: 110 }}></th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              baseLabel={typeof baseLabel === 'function' ? baseLabel(item) : baseLabel}
              onSave={onSave}
              onDelete={onDelete}
              saving={!!saving[item.id]}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab principal ────────────────────────────────────────────────────────────
export default function ComissaoTab({ isBarber, permissions = {} }) {
  const canManage = !isBarber || !!permissions?.canManageTenant;

  // Configuração por serviço
  const [servicos,     setServicos]     = useState([]);
  const [loadingSvc,   setLoadingSvc]   = useState(canManage);
  const [savingSvc,    setSavingSvc]    = useState({});

  // Configuração por produto
  const [produtos,     setProdutos]     = useState([]);
  const [loadingProd,  setLoadingProd]  = useState(canManage);
  const [savingProd,   setSavingProd]   = useState({});

  // Resultados do mês atual
  const [results,      setResults]      = useState([]);
  const [loadingRes,   setLoadingRes]   = useState(true);
  const [mesInfo,      setMesInfo]      = useState(null);

  // Subtab
  const [subTab, setSubTab] = useState('servicos'); // 'servicos' | 'produtos' | 'resultados'

  const buscarServicos = useCallback(async () => {
    if (!canManage) return;
    setLoadingSvc(true);
    try {
      const r = await fetch('/api/financeiro/comissao/servicos', { headers: { Authorization: `Bearer ${tok()}` } });
      const d = await r.json();
      setServicos(d.data || []);
    } finally { setLoadingSvc(false); }
  }, [canManage]);

  const buscarProdutos = useCallback(async () => {
    if (!canManage) return;
    setLoadingProd(true);
    try {
      const r = await fetch('/api/financeiro/comissao/produtos', { headers: { Authorization: `Bearer ${tok()}` } });
      const d = await r.json();
      setProdutos(d.data || []);
    } finally { setLoadingProd(false); }
  }, [canManage]);

  const buscarResultados = useCallback(async () => {
    setLoadingRes(true);
    try {
      const r = await fetch('/api/financeiro/comissao', { headers: { Authorization: `Bearer ${tok()}` } });
      const d = await r.json();
      setResults(d.data || []);
      setMesInfo(d.mesAtual || null);
    } finally { setLoadingRes(false); }
  }, []);

  useEffect(() => { buscarServicos();   }, [buscarServicos]);
  useEffect(() => { buscarProdutos();   }, [buscarProdutos]);
  useEffect(() => { buscarResultados(); }, [buscarResultados]);

  // Handlers genéricos para serviços
  const salvarSvc = async (id, type, value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return alert('Informe um valor válido.');
    if (type === 'percentage' && num > 100) return alert('Percentual deve ser entre 0 e 100.');
    setSavingSvc(sv => ({ ...sv, [id]: true }));
    try {
      await fetch(`/api/financeiro/comissao/servicos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ type, value: num }),
      });
      await Promise.all([buscarServicos(), buscarResultados()]);
    } catch { alert('Erro ao salvar.'); }
    finally { setSavingSvc(sv => ({ ...sv, [id]: false })); }
  };

  const excluirSvc = async (id, nome) => {
    if (!window.confirm(`Remover comissão de "${nome}"?`)) return;
    setSavingSvc(sv => ({ ...sv, [id]: true }));
    try {
      await fetch(`/api/financeiro/comissao/servicos/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      await Promise.all([buscarServicos(), buscarResultados()]);
    } catch { alert('Erro ao remover.'); }
    finally { setSavingSvc(sv => ({ ...sv, [id]: false })); }
  };

  // Handlers genéricos para produtos
  const salvarProd = async (id, type, value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return alert('Informe um valor válido.');
    if (type === 'percentage' && num > 100) return alert('Percentual deve ser entre 0 e 100.');
    setSavingProd(sv => ({ ...sv, [id]: true }));
    try {
      await fetch(`/api/financeiro/comissao/produtos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ type, value: num }),
      });
      await Promise.all([buscarProdutos(), buscarResultados()]);
    } catch { alert('Erro ao salvar.'); }
    finally { setSavingProd(sv => ({ ...sv, [id]: false })); }
  };

  const excluirProd = async (id, nome) => {
    if (!window.confirm(`Remover comissão de "${nome}"?`)) return;
    setSavingProd(sv => ({ ...sv, [id]: true }));
    try {
      await fetch(`/api/financeiro/comissao/produtos/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` },
      });
      await Promise.all([buscarProdutos(), buscarResultados()]);
    } catch { alert('Erro ao remover.'); }
    finally { setSavingProd(sv => ({ ...sv, [id]: false })); }
  };

  // KPIs do mês
  const totalFat    = results.reduce((a, b) => a + Number(b.faturamento    || 0), 0);
  const totalCom    = results.reduce((a, b) => a + Number(b.comissao       || 0), 0);
  const totalComSvc = results.reduce((a, b) => a + Number(b.comissaoServicos || 0), 0);
  const totalComProd= results.reduce((a, b) => a + Number(b.comissaoProdutos || 0), 0);

  // Gráfico donut — distribuição de comissões por barbeiro
  const donutData = results.filter(b => b.comissao > 0);
  const donut = {
    labels: donutData.map(b => b.nome),
    datasets: [{ data: donutData.map(b => b.comissao), backgroundColor: COLORS, borderWidth: 0 }],
  };

  // Formata período
  const periodoStr = mesInfo
    ? (() => {
        const [ay, am, ad] = mesInfo.startDate.split('-');
        const [by, bm, bd] = mesInfo.endDate.split('-');
        return `${ad}/${am}/${ay} – ${bd}/${bm}/${by}`;
      })()
    : '';

  const SUB_TABS = canManage
    ? [
        { value: 'servicos',   label: 'Por Serviço' },
        { value: 'produtos',   label: 'Por Produto' },
        { value: 'resultados', label: 'Resultados do Mês' },
      ]
    : [{ value: 'resultados', label: 'Minha Comissão' }];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {SUB_TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setSubTab(t.value)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600,
              color: subTab === t.value ? 'var(--accent)' : 'var(--color-muted)',
              borderBottom: subTab === t.value ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: '-1px', transition: 'color 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Configuração por Serviço ──────────────────────────────────────── */}
      {subTab === 'servicos' && canManage && (
        <div>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            Defina a comissão de cada serviço. O valor configurado é pago ao barbeiro que realizou o serviço.
          </p>
          <ConfigTable
            items={servicos}
            baseLabel={item => `Preço: ${fmtR(item.preco)}`}
            onSave={salvarSvc}
            onDelete={excluirSvc}
            saving={savingSvc}
            loading={loadingSvc}
            emptyMsg="Nenhum serviço encontrado."
          />
        </div>
      )}

      {/* ── Configuração por Produto ──────────────────────────────────────── */}
      {subTab === 'produtos' && canManage && (
        <div>
          <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            Defina a comissão de cada produto. O valor é pago ao barbeiro que realizou a venda.
          </p>
          <ConfigTable
            items={produtos}
            baseLabel={item => `Preço de venda: ${fmtR(item.precoVenda)}`}
            onSave={salvarProd}
            onDelete={excluirProd}
            saving={savingProd}
            loading={loadingProd}
            emptyMsg="Nenhum produto cadastrado."
          />
        </div>
      )}

      {/* ── Resultados do mês atual ───────────────────────────────────────── */}
      {subTab === 'resultados' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Período e aviso */}
          {mesInfo && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.6rem',
              background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)',
              borderRadius: 'var(--radius-xs)', padding: '0.5rem 0.75rem',
              fontSize: '0.8rem', color: '#93c5fd',
            }}>
              <span>📅</span>
              <span>Comissões referentes ao mês atual: <strong>{periodoStr}</strong>. Regras não são aplicadas retroativamente.</span>
            </div>
          )}

          {/* KPIs */}
          <div className={s.kpiGrid}>
            {[
              { label: 'Faturamento do Mês', value: fmtR(totalFat),    color: 'var(--success)' },
              { label: 'Total Comissões',    value: fmtR(totalCom),    color: '#7c3aed' },
              { label: 'Comissão Serviços',  value: fmtR(totalComSvc), color: 'var(--accent)' },
              { label: 'Comissão Produtos',  value: fmtR(totalComProd),color: '#0891b2' },
            ].filter(k => !isBarber || k.label !== 'Faturamento do Mês' ? true : true).map(k => (
              <div key={k.label} className={s.kpiCard}>
                <span className={s.kpiLabel}>{k.label}</span>
                <span className={s.kpiValue} style={{ color: k.color }}>{k.value}</span>
              </div>
            ))}
          </div>

          {/* Gráfico donut */}
          {canManage && donutData.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="card">
                <div className="card-body">
                  <h4 style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>Distribuição de Comissões</h4>
                  <Doughnut data={donut} options={donutOpts} />
                </div>
              </div>
            </div>
          )}

          {/* Tabela de resultados */}
          {loadingRes ? (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
          ) : results.length === 0 ? (
            <p className={s.emptyState}>Nenhum atendimento ou venda no mês atual.</p>
          ) : (
            <div className={s.tableWrap}>
              <table className="data-table">
                <thead>
                  <tr>
                    {canManage && <th style={{ width: 36 }}>#</th>}
                    <th>Profissional</th>
                    <th style={{ textAlign: 'center' }}>Atend.</th>
                    <th style={{ textAlign: 'right' }}>Faturamento</th>
                    <th style={{ textAlign: 'right' }}>Com. Serviços</th>
                    <th style={{ textAlign: 'right' }}>Com. Produtos</th>
                    <th style={{ textAlign: 'right', color: '#7c3aed' }}>Total Comissão</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((b, i) => (
                    <tr key={b.id}>
                      {canManage && (
                        <td style={{ textAlign: 'center', fontSize: '1rem' }}>{MEDALS[i] || i + 1}</td>
                      )}
                      <td style={{ fontWeight: 600 }}>{b.nome}</td>
                      <td style={{ textAlign: 'center' }}>{b.qtdAtendimentos}</td>
                      <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>{fmtR(b.faturamento)}</td>
                      <td style={{ textAlign: 'right' }}>
                        {b.comissaoServicos > 0 ? fmtR(b.comissaoServicos) : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {b.comissaoProdutos > 0 ? fmtR(b.comissaoProdutos) : <span style={{ color: 'var(--color-muted)' }}>—</span>}
                      </td>
                      <td style={{ textAlign: 'right', color: '#7c3aed', fontWeight: 800 }}>
                        {b.comissao > 0 ? fmtR(b.comissao) : <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
