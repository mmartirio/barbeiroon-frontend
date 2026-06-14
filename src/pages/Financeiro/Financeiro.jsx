import React, { useState, useContext } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { AuthContext } from '../../context/AuthContext';
import s from './Financeiro.module.css';
import ResumoTab     from './tabs/ResumoTab';
import ReceitasTab   from './tabs/ReceitasTab';
import DespesasTab   from './tabs/DespesasTab';
import ComissaoTab   from './tabs/ComissaoTab';
import FluxoCaixaTab from './tabs/FluxoCaixaTab';
import RankingTab    from './tabs/RankingTab';
import ProdutosTab   from './tabs/ProdutosTab';

const PERIODOS = [
  { label: 'Hoje',      value: 'diario' },
  { label: 'Semana',    value: 'semanal' },
  { label: 'Mês',          value: 'mensal' },
  { label: 'Mês Anterior', value: 'mes_anterior' },
  { label: 'Trimestre',    value: 'trimestral' },
  { label: 'Semestre',  value: 'semestral' },
  { label: 'Ano',       value: 'anual' },
];

const ABAS = [
  { label: 'Resumo',         value: 'resumo' },
  { label: 'Receitas',       value: 'receitas' },
  { label: 'Despesas',       value: 'despesas' },
  { label: 'Comissão',       value: 'comissao' },
  { label: 'Fluxo de Caixa', value: 'fluxo' },
  { label: 'Ranking',        value: 'ranking' },
  { label: 'Produtos',       value: 'produtos' },
];

export default function Financeiro() {
  const { user } = useContext(AuthContext);
  const isBarber    = !!user?.isBarber;
  const permissions = user?.permissions || {};
  const planFeatures = user?.planFeatures || [];

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug } = useParams();
  const aba = searchParams.get('tab') || 'resumo';

  // Se o plano tiver algum financeiro.* configurado, só mostra as tabs permitidas.
  // Se não tiver nenhum financeiro.*, mostra todas (retrocompatível).
  const finFeatures = planFeatures.filter(f => f.startsWith('financeiro.'));
  const hasTabFeature = (tabValue) => {
    if (finFeatures.length === 0) return true;
    return planFeatures.includes(`financeiro.${tabValue}`);
  };

  const visibleAbas = ABAS.filter(a => hasTabFeature(a.value));

  const [periodo, setPeriodo] = useState('mensal');

  const setAba = (value) => {
    navigate(`/${slug}/financeiro?tab=${value}`, { replace: true });
  };

  // Se a aba atual não está disponível no plano, redireciona para a primeira disponível
  const abaAtual = visibleAbas.find(a => a.value === aba)
    ? aba
    : (visibleAbas[0]?.value || 'resumo');

  if (abaAtual !== aba) {
    navigate(`/${slug}/financeiro?tab=${abaAtual}`, { replace: true });
  }

  const tabProps = { periodo, isBarber, permissions };

  function renderAba() {
    if (!hasTabFeature(abaAtual)) {
      return (
        <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid #dc2626', borderRadius:'var(--radius-sm)', padding:'1rem 1.25rem', color:'var(--danger,#dc2626)', fontSize:'0.875rem' }}>
          🔒 Esta seção não está disponível no seu plano atual.
        </div>
      );
    }
    switch (abaAtual) {
      case 'resumo':      return <ResumoTab     {...tabProps} />;
      case 'receitas':    return <ReceitasTab   {...tabProps} />;
      case 'despesas':    return <DespesasTab   {...tabProps} />;
      case 'comissao':    return <ComissaoTab   {...tabProps} />;
      case 'fluxo':       return <FluxoCaixaTab {...tabProps} />;
      case 'ranking':     return <RankingTab    {...tabProps} />;
      case 'produtos':    return <ProdutosTab   {...tabProps} />;
      default:            return <ResumoTab     {...tabProps} />;
    }
  }

  return (
    <Layout title="Financeiro">
      {/* Abas */}
      <div className={s.tabs}>
        {visibleAbas.map(a => (
          <button
            key={a.value}
            className={`${s.tab} ${abaAtual === a.value ? s.tabActive : ''}`}
            onClick={() => setAba(a.value)}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Seletor de período — oculto na aba Relatórios */}
      {aba !== 'relatorios' && (
        <div className={s.periodBar}>
          {PERIODOS.map(p => (
            <button
              key={p.value}
              className={`${s.periodBtn} ${periodo === p.value ? s.periodBtnActive : ''}`}
              onClick={() => setPeriodo(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {renderAba()}
    </Layout>
  );
}
