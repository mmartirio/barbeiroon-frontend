import React, { useState, useEffect, useCallback } from 'react';
import { FiPackage, FiRefreshCw } from 'react-icons/fi';

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtD = v => { if (!v) return '—'; const [y, m, d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };

const FORMA_LABEL = {
  dinheiro:       'Dinheiro',
  cartao_credito: 'Crédito',
  cartao_debito:  'Débito',
  pix:            'PIX',
};

export default function ProdutosTab({ periodo }) {
  const [rows,    setRows]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/produtos/vendas?periodo=${periodo}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || `Erro ${r.status}`);
      setRows(d.data || []);
      setTotal(Number(d.totalVendas || 0));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [periodo]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiPackage size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Vendas de Produtos</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} title="Atualizar">
          <FiRefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Card de total */}
      <div className="card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total no período</p>
          <p style={{ margin: '0.2rem 0 0', fontWeight: 800, fontSize: '1.4rem', color: 'var(--success)' }}>
            {loading ? '...' : fmtR(total)}
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Registros</p>
          <p style={{ margin: '0.2rem 0 0', fontWeight: 700, fontSize: '1.1rem' }}>
            {loading ? '...' : rows.length}
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {/* Tabela */}
      {loading ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>Carregando...</p>
      ) : rows.length === 0 ? (
        <div className="card" style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
          Nenhuma venda de produto registrada neste período.
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th style={{ textAlign: 'center' }}>Qtd</th>
                <th style={{ textAlign: 'right' }}>Unit.</th>
                <th style={{ textAlign: 'right' }}>Total</th>
                <th>Pagamento</th>
                <th>Vendedor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id}>
                  <td data-label="Data" style={{ whiteSpace: 'nowrap', color: 'var(--color-muted)', fontSize: '0.82rem' }}>{fmtD(row.data)}</td>
                  <td data-label="Produto" style={{ fontWeight: 600 }}>{row.nomeProduto || '—'}</td>
                  <td data-label="Qtd" style={{ textAlign: 'center' }}>{row.quantidade_vendida}</td>
                  <td data-label="Unit." style={{ textAlign: 'right', color: 'var(--color-muted)', fontSize: '0.85rem' }}>{fmtR(row.valor_unitario)}</td>
                  <td data-label="Total" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{fmtR(row.valor_total)}</td>
                  <td data-label="Pagamento" style={{ fontSize: '0.82rem' }}>{FORMA_LABEL[row.forma_pagamento] || row.forma_pagamento || '—'}</td>
                  <td data-label="Vendedor" style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>{row.vendedor || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
