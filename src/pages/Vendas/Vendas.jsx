import React, { useState, useCallback, useRef } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiShoppingCart, FiCamera, FiSearch, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import BarcodeScanner from '../Produtos/BarcodeScanner';

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);

const FORMAS = [
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'cartao_debito',  label: 'Cartão Débito' },
  { value: 'pix',            label: 'PIX' },
];

export default function Vendas() {
  const [carrinho,       setCarrinho]       = useState([]);
  const [buscaInput,     setBuscaInput]     = useState('');
  const [resultado,      setResultado]      = useState(null);
  const [scanner,        setScanner]        = useState(false);
  const [buscando,       setBuscando]       = useState(false);
  const [finalizando,    setFinalizando]    = useState(false);
  const [sucesso,        setSucesso]        = useState(null);
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  const inputRef = useRef(null);

  const buscarProduto = useCallback(async (term) => {
    if (!term) return;
    setBuscando(true);
    setResultado(null);
    try {
      const r = await fetch(`/api/produtos/barcode/${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await r.json();
      if (d.found) { setResultado(d.produto); return; }

      const r2 = await fetch(`/api/produtos?q=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d2 = await r2.json();
      if (d2.data?.length >= 1) setResultado(d2.data[0]); // já vem com flag vencido do GET /
      else setResultado(null);
    } finally {
      setBuscando(false);
    }
  }, []);

  const handleBusca = (e) => { e.preventDefault(); buscarProduto(buscaInput.trim()); };

  const handleScan = useCallback((code) => {
    setScanner(false);
    setBuscaInput(code);
    buscarProduto(code);
  }, [buscarProduto]);

  const addCarrinho = (produto) => {
    setCarrinho(c => {
      const existente = c.find(i => i.produto.id === produto.id);
      if (existente) return c.map(i => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...c, { produto, quantidade: 1 }];
    });
    setResultado(null);
    setBuscaInput('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const removeCarrinho = (id) => setCarrinho(c => c.filter(i => i.produto.id !== id));

  const updateQtd = (id, qtd) => {
    const n = parseInt(qtd, 10);
    if (isNaN(n) || n <= 0) return;
    setCarrinho(c => c.map(i => i.produto.id === id ? { ...i, quantidade: n } : i));
  };

  const totalCarrinho = carrinho.reduce((s, i) => s + (Number(i.produto.precoVenda || i.produto.preco || 0) * i.quantidade), 0);

  const finalizar = async () => {
    if (carrinho.length === 0) return;
    setFinalizando(true);
    try {
      const res = await fetch('/api/produtos/venda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          itens: carrinho.map(i => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
          formaPagamento,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message || 'Erro ao finalizar venda.');
      setSucesso(fmtR(d.totalVenda));
      setCarrinho([]);
      setFormaPagamento('dinheiro');
      setTimeout(() => setSucesso(null), 4000);
    } catch (e) {
      alert(e.message);
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <Layout title="Vendas">
      <div style={{ maxWidth: 700 }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <FiShoppingCart size={16} /> Venda de Produtos
          </h4>

          {sucesso && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(22,163,74,0.15)', border: '1px solid var(--success)', borderRadius: 6, padding: '0.6rem 1rem', marginBottom: '1rem', color: 'var(--success)', fontWeight: 700 }}>
              <FiCheckCircle size={16} /> Venda realizada! Total: {sucesso}
            </div>
          )}

          {/* Busca */}
          <form onSubmit={handleBusca} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0.45rem 0.75rem' }}>
              <FiSearch size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={buscaInput}
                onChange={e => setBuscaInput(e.target.value)}
                placeholder="Código de barras ou nome do produto"
                style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color)', fontSize: '0.875rem', flex: 1 }}
                autoComplete="off"
                autoFocus
              />
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => setScanner(true)} title="Escanear código de barras">
              <FiCamera size={15} />
            </button>
            <button type="submit" className="btn btn-ghost" disabled={buscando}>
              {buscando ? '...' : 'Buscar'}
            </button>
          </form>

          {/* Produto encontrado */}
          {resultado && (
            resultado.vencido ? (
              <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #dc2626', borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '0.75rem' }}>
                <p style={{ fontWeight: 700, margin: '0 0 0.25rem', fontSize: '0.9rem', color: '#dc2626' }}>
                  ⚠ Produto com validade vencida
                </p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color)' }}>
                  <strong>{resultado.nome}</strong> não pode ser vendido pois a data de validade está expirada.
                  Remova ou descarte o produto pelo módulo de Produtos.
                </p>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.75rem 1rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9rem' }}>{resultado.nome}</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                    Estoque: {resultado.quantidade} · Preço de venda: {fmtR(resultado.precoVenda || resultado.preco)}
                  </p>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => addCarrinho(resultado)}
                  disabled={resultado.quantidade === 0}
                  style={{ flexShrink: 0 }}
                >
                  {resultado.quantidade === 0 ? 'Sem estoque' : '+ Adicionar'}
                </button>
              </div>
            )
          )}

          {/* Carrinho */}
          {carrinho.length > 0 ? (
            <>
              <table className="data-table" style={{ marginBottom: '0.75rem' }}>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th style={{ textAlign: 'center', width: 80 }}>Qtd</th>
                    <th style={{ textAlign: 'right' }}>Unit.</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {carrinho.map(item => {
                    const unit  = Number(item.produto.precoVenda || item.produto.preco || 0);
                    const total = unit * item.quantidade;
                    return (
                      <tr key={item.produto.id}>
                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.produto.nome}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min="1" max={item.produto.quantidade}
                            value={item.quantidade}
                            onChange={e => updateQtd(item.produto.id, e.target.value)}
                            style={{ width: 56, textAlign: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--color)', padding: '0.2rem 0.25rem', fontSize: '0.875rem' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>{fmtR(unit)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>{fmtR(total)}</td>
                        <td>
                          <button className="btn btn-ghost" onClick={() => removeCarrinho(item.produto.id)} style={{ padding: '0.15rem 0.35rem', color: '#dc2626' }}>
                            <FiTrash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Forma de pagamento */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                {FORMAS.map(op => (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => setFormaPagamento(op.value)}
                    style={{
                      padding: '0.35rem 0.85rem',
                      borderRadius: 20,
                      border: `2px solid ${formaPagamento === op.value ? 'var(--accent)' : 'var(--border)'}`,
                      background: formaPagamento === op.value ? 'var(--accent)' : 'var(--bg-input)',
                      color: formaPagamento === op.value ? '#fff' : 'var(--color)',
                      fontWeight: formaPagamento === op.value ? 700 : 400,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {op.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <p style={{ fontWeight: 700, fontSize: '1.1rem', margin: 0 }}>
                  Total: <span style={{ color: 'var(--success)' }}>{fmtR(totalCarrinho)}</span>
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost" onClick={() => setCarrinho([])}>Limpar</button>
                  <button className="btn btn-primary" onClick={finalizar} disabled={finalizando}>
                    {finalizando ? 'Processando...' : 'Finalizar Venda'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem 0' }}>
              Carrinho vazio. Busque um produto pelo código de barras ou nome.
            </p>
          )}
        </div>
      </div>

      {scanner && (
        <BarcodeScanner onResult={handleScan} onClose={() => setScanner(false)} />
      )}
    </Layout>
  );
}
