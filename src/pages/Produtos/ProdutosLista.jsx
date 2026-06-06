import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { FiPlus, FiEdit2, FiTrash2, FiCamera, FiSearch, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import BarcodeScanner from './BarcodeScanner';

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtD = v => {
  if (!v) return '—';
  const str = String(v).split('T')[0];
  const [y, m, d] = str.split('-');
  return `${d}/${m}/${y}`;
};

export default function ProdutosLista() {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [produtos,  setProdutos]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [busca,     setBusca]     = useState('');
  const [scanner,   setScanner]   = useState(false);

  const carregar = useCallback(() => {
    setLoading(true);
    fetch(`/api/produtos${busca ? `?q=${encodeURIComponent(busca)}` : ''}`, {
      headers: { Authorization: `Bearer ${tok()}` },
    })
      .then(r => r.json())
      .then(d => setProdutos(d.data || []))
      .finally(() => setLoading(false));
  }, [busca]);

  useEffect(() => { carregar(); }, [carregar]);

  const handleScanResult = useCallback((code) => {
    setScanner(false);
    setBusca(code);
  }, []);

  const excluir = async (id, nome) => {
    if (!window.confirm(`Excluir "${nome}"?`)) return;
    await fetch(`/api/produtos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tok()}` },
    });
    carregar();
  };

  const vencidosCount     = produtos.filter(p => p.vencido).length;
  const venceEmBreveCount = produtos.filter(p => p.venceEmBreve).length;
  const semEstoqueCount   = produtos.filter(p => p.quantidade === 0).length;

  return (
    <Layout title="Produtos">
      {/* Alertas */}
      {(vencidosCount > 0 || venceEmBreveCount > 0 || semEstoqueCount > 0) && (
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          {vencidosCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(220,38,38,0.12)', border: '1px solid #dc2626', borderRadius: 6, padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: '#dc2626', fontWeight: 600 }}>
              <FiAlertTriangle size={14} /> {vencidosCount} produto(s) vencido(s)
            </div>
          )}
          {venceEmBreveCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(245,158,11,0.12)', border: '1px solid #f59e0b', borderRadius: 6, padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>
              <FiAlertTriangle size={14} /> {venceEmBreveCount} produto(s) vencem em 30 dias
            </div>
          )}
          {semEstoqueCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(124,58,237,0.12)', border: '1px solid #7c3aed', borderRadius: 6, padding: '0.4rem 0.75rem', fontSize: '0.82rem', color: '#7c3aed', fontWeight: 600 }}>
              <FiPackage size={14} /> {semEstoqueCount} produto(s) sem estoque
            </div>
          )}
        </div>
      )}

      {/* Barra de ações */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0.45rem 0.75rem' }}>
          <FiSearch size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
          <input
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome, fabricante..."
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color)', fontSize: '0.875rem', flex: 1 }}
          />
        </div>
        <button
          className="btn btn-ghost"
          title="Escanear código de barras"
          onClick={() => setScanner(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FiCamera size={15} />
        </button>
        <button
          className="btn btn-primary"
          onClick={() => navigate(`/${slug}/produtos-cadastro`)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FiPlus size={14} /> Novo Produto
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
      ) : produtos.length === 0 ? (
        <div className="empty-state"><p>Nenhum produto encontrado.</p></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Cód. Barras</th>
                <th style={{ textAlign: 'center' }}>Estoque</th>
                <th>Fabricante</th>
                <th>Validade</th>
                <th style={{ textAlign: 'right' }}>Custo</th>
                <th style={{ textAlign: 'right' }}>Venda</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id} style={{ opacity: p.vencido ? 0.6 : 1 }}>
                  <td style={{ fontWeight: 600 }}>
                    {p.nome}
                    {p.peso && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginLeft: '0.4rem' }}>{p.peso}</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontFamily: 'monospace' }}>
                    {p.codigoBarras || '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      fontWeight: 700,
                      color: p.quantidade === 0 ? '#dc2626' : p.quantidade <= 3 ? '#f59e0b' : 'var(--success)',
                    }}>
                      {p.quantidade}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{p.fabricante || '—'}</td>
                  <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {p.dataValidade ? (
                      <span style={{
                        color: p.vencido ? '#dc2626' : p.venceEmBreve ? '#f59e0b' : 'var(--color)',
                        fontWeight: (p.vencido || p.venceEmBreve) ? 700 : 400,
                      }}>
                        {fmtD(p.dataValidade)}
                        {p.vencido     && ' ⚠ Vencido'}
                        {p.venceEmBreve && ' ⚠ Vence em breve'}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>{fmtR(p.preco)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>{fmtR(p.precoVenda)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button
                      className="btn btn-ghost"
                      onClick={() => navigate(`/${slug}/produtos-cadastro/${p.id}`)}
                      style={{ padding: '0.2rem 0.4rem', marginRight: '0.25rem' }}
                    >
                      <FiEdit2 size={13} />
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => excluir(p.id, p.nome)}
                      style={{ padding: '0.2rem 0.4rem', color: '#dc2626' }}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scanner && (
        <BarcodeScanner
          onResult={handleScanResult}
          onClose={() => setScanner(false)}
        />
      )}
    </Layout>
  );
}
