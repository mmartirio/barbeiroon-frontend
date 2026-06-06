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
import RelatoriosTab from './tabs/RelatoriosTab';
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
  { label: 'Relatórios',     value: 'relatorios' },
];

export default function Financeiro() {
  const { user } = useContext(AuthContext);
  const isBarber = !!user?.isBarber;

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { slug } = useParams();
  const aba = searchParams.get('tab') || 'resumo';

  const [periodo, setPeriodo] = useState('mensal');

  const setAba = (value) => {
    navigate(`/${slug}/financeiro?tab=${value}`, { replace: true });
  };

  const tabProps = { periodo, isBarber };

  function renderAba() {
    switch (aba) {
      case 'resumo':      return <ResumoTab     {...tabProps} />;
      case 'receitas':    return <ReceitasTab   {...tabProps} />;
      case 'despesas':    return <DespesasTab   {...tabProps} />;
      case 'comissao':    return <ComissaoTab   {...tabProps} />;
      case 'fluxo':       return <FluxoCaixaTab {...tabProps} />;
      case 'ranking':     return <RankingTab    {...tabProps} />;
      case 'produtos':    return <ProdutosTab   {...tabProps} />;
      case 'relatorios':  return <RelatoriosTab />;
      default:            return <ResumoTab     {...tabProps} />;
    }
  }

  return (
    <Layout title="Financeiro">
      {/* Abas */}
      <div className={s.tabs}>
        {ABAS.map(a => (
          <button
            key={a.value}
            className={`${s.tab} ${aba === a.value ? s.tabActive : ''}`}
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
