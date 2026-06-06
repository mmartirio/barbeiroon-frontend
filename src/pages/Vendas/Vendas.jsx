import React, { useState, useCallback, useRef } from 'react';
import Layout from '../../components/Layout/Layout';
import {
  FiUser, FiSearch, FiTrash2, FiCheckCircle, FiCamera,
  FiScissors, FiPackage, FiX, FiShoppingCart,
} from 'react-icons/fi';
import BarcodeScanner from '../Produtos/BarcodeScanner';
import s from './Vendas.module.css';

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtFone = v => (v || '').replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) $2-$3');

const FORMAS = [
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Crédito' },
  { value: 'cartao_debito',  label: 'Débito' },
  { value: 'pix',            label: 'PIX' },
];

const SECTION_LABEL = { fontWeight: 700, fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--color-muted)', margin: '0 0 0.55rem', display: 'flex', alignItems: 'center', gap: '0.35rem' };

export default function Vendas() {
  // ── Cliente ──────────────────────────────────────────────────
  const [cliQuery, setCliQuery] = useState('');
  const [cliList,  setCliList]  = useState([]);
  const [cliBusy,  setCliBusy]  = useState(false);
  const [cliente,  setCliente]  = useState(null);
  const cliTimer = useRef(null);

  // ── Agendamentos ─────────────────────────────────────────────
  const [agendamentos,  setAgendamentos]  = useState([]);
  const [agSelecionado, setAgSelecionado] = useState(null);

  // ── Produtos / Carrinho ──────────────────────────────────────
  const [prodInput,     setProdInput]     = useState('');
  const [prodResultado, setProdResultado] = useState(null);
  const [prodBusy,      setProdBusy]      = useState(false);
  const [carrinho,      setCarrinho]      = useState([]);
  const [scanner,       setScanner]       = useState(false);
  const prodRef = useRef(null);

  // ── Pagamento / Finalização ───────────────────────────────────
  const [forma,       setForma]       = useState('dinheiro');
  const [finalizando, setFinalizando] = useState(false);
  const [sucesso,     setSucesso]     = useState(null);

  // ── Busca de clientes (debounce 280 ms) ──────────────────────
  const buscarClientes = useCallback(async q => {
    if (q.length < 2) { setCliList([]); return; }
    setCliBusy(true);
    try {
      const r = await fetch(`/api/customer?search=${encodeURIComponent(q)}&limit=6`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await r.json();
      setCliList(d.customers || d.data || []);
    } catch { setCliList([]); }
    finally   { setCliBusy(false); }
  }, []);

  const onCliInput = e => {
    const v = e.target.value;
    setCliQuery(v);
    clearTimeout(cliTimer.current);
    cliTimer.current = setTimeout(() => buscarClientes(v), 280);
  };

  const selecionarCliente = useCallback(async c => {
    setCliente(c); setCliQuery(''); setCliList([]);
    setAgendamentos([]); setAgSelecionado(null);
    try {
      const r = await fetch(
        `/api/appointment/by-customer?customerPhone=${encodeURIComponent(c.phone)}`,
        { headers: { Authorization: `Bearer ${tok()}` } }
      );
      if (!r.ok) return;
      const d = await r.json();
      const list = d.appointments || [];
      setAgendamentos(list);
      if (list.length > 0) setAgSelecionado(list[0]);
    } catch {}
  }, []);

  const removerCliente = () => {
    setCliente(null); setCliQuery('');
    setAgendamentos([]); setAgSelecionado(null);
  };

  // ── Busca de produtos ────────────────────────────────────────
  const buscarProduto = useCallback(async term => {
    if (!term) return;
    setProdBusy(true); setProdResultado(null);
    try {
      const r = await fetch(`/api/produtos/barcode/${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await r.json();
      if (d.found) { setProdResultado(d.produto); return; }
      const r2 = await fetch(`/api/produtos?q=${encodeURIComponent(term)}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d2 = await r2.json();
      setProdResultado(d2.data?.[0] || null);
    } finally { setProdBusy(false); }
  }, []);

  const handleScan = useCallback(code => {
    setScanner(false); setProdInput(code); buscarProduto(code);
  }, [buscarProduto]);

  const addCarrinho = prod => {
    setCarrinho(c => {
      const ex = c.find(i => i.produto.id === prod.id);
      if (ex) return c.map(i => i.produto.id === prod.id ? { ...i, qtd: i.qtd + 1 } : i);
      return [...c, { produto: prod, qtd: 1 }];
    });
    setProdResultado(null); setProdInput('');
    setTimeout(() => prodRef.current?.focus(), 50);
  };

  const removeItem = id => setCarrinho(c => c.filter(i => i.produto.id !== id));
  const setQtd    = (id, v) => {
    const n = parseInt(v, 10);
    if (!isNaN(n) && n > 0)
      setCarrinho(c => c.map(i => i.produto.id === id ? { ...i, qtd: n } : i));
  };

  // ── Totais ───────────────────────────────────────────────────
  const totalServico  = agSelecionado ? Number(agSelecionado.service?.price || 0) : 0;
  const totalProdutos = carrinho.reduce(
    (s, i) => s + Number(i.produto.precoVenda || i.produto.preco || 0) * i.qtd, 0
  );
  const total    = totalServico + totalProdutos;
  const temItens = agSelecionado || carrinho.length > 0;

  // ── Finalizar venda ──────────────────────────────────────────
  const finalizar = async () => {
    if (!temItens) return;
    setFinalizando(true);
    try {
      if (agSelecionado) {
        const r = await fetch(`/api/appointment/${agSelecionado.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify({ status: 'concluido' }),
        });
        if (!r.ok) {
          const d = await r.json();
          throw new Error(d.message || 'Erro ao concluir agendamento.');
        }
      }

      if (carrinho.length > 0) {
        const r = await fetch('/api/produtos/venda', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify({
            itens: carrinho.map(i => ({ produtoId: i.produto.id, quantidade: i.qtd })),
            formaPagamento: forma,
            observacao: agSelecionado ? `PDV — Agend. #${agSelecionado.id}` : undefined,
          }),
        });
        if (!r.ok) {
          const d = await r.json();
          throw new Error(d.message || 'Erro ao registrar venda.');
        }
      }

      setSucesso(fmtR(total));
      setCarrinho([]); setAgSelecionado(null); setAgendamentos([]);
      setCliente(null); setForma('dinheiro');
      setTimeout(() => setSucesso(null), 5000);
    } catch (e) {
      alert(e.message);
    } finally {
      setFinalizando(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <Layout title="PDV — Ponto de Venda">

      {sucesso && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(22,163,74,0.15)', border: '1px solid var(--success)', borderRadius: 8, padding: '0.75rem 1.1rem', marginBottom: '1rem', color: '#4ade80', fontWeight: 700, fontSize: '0.9rem' }}>
          <FiCheckCircle size={18} /> Venda finalizada! Total cobrado: {sucesso}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', maxWidth: 780 }}>

          {/* ── CLIENTE ── */}
          <div className="card" style={{ padding: '1rem' }}>
            <p style={SECTION_LABEL}><FiUser size={12} /> Cliente</p>

            {cliente ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>{cliente.name}</p>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: 'var(--color-muted)' }}>{fmtFone(cliente.phone)}</p>
                </div>
                <button
                  onClick={removerCliente}
                  style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: 4, lineHeight: 1 }}
                  title="Remover cliente"
                >
                  <FiX size={16} />
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0.45rem 0.75rem' }}>
                  <FiSearch size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                  <input
                    value={cliQuery}
                    onChange={onCliInput}
                    placeholder="Buscar cliente por nome ou telefone..."
                    style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color)', fontSize: '0.875rem', flex: 1 }}
                    autoComplete="off"
                  />
                  {cliBusy && <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>...</span>}
                </div>
                {cliList.length > 0 && (
                  <ul style={{ position: 'absolute', top: 'calc(100% + 2px)', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, zIndex: 20, listStyle: 'none', margin: 0, padding: 0, boxShadow: '0 6px 20px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
                    {cliList.map(c => (
                      <li key={c.phone} style={{ borderBottom: '1px solid var(--border)' }}>
                        <button
                          onClick={() => selecionarCliente(c)}
                          style={{ width: '100%', textAlign: 'left', padding: '0.55rem 0.9rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
                        >
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</span>
                          <span style={{ color: 'var(--color-muted)', fontSize: '0.78rem', flexShrink: 0 }}>{fmtFone(c.phone)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* ── AGENDAMENTOS DO CLIENTE ── */}
          {cliente && (
            <div className="card" style={{ padding: '1rem' }}>
              <p style={SECTION_LABEL}><FiScissors size={12} /> Agendamento{agendamentos.length !== 1 ? 's' : ''} de Hoje</p>

              {agendamentos.length === 0 ? (
                <p style={{ color: 'var(--color-muted)', fontSize: '0.84rem', margin: 0 }}>
                  Nenhum agendamento ativo para hoje.
                </p>
              ) : (
                agendamentos.map(ag => {
                  const sel = agSelecionado?.id === ag.id;
                  return (
                    <div
                      key={ag.id}
                      onClick={() => setAgSelecionado(sel ? null : ag)}
                      style={{ border: `1.5px solid ${sel ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 8, padding: '0.65rem 0.85rem', marginBottom: '0.4rem', background: sel ? 'rgba(124,58,237,0.07)' : 'var(--bg-input)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', transition: 'border-color 0.12s, background 0.12s' }}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem' }}>{ag.service?.name || '—'}</p>
                        <p style={{ margin: '0.12rem 0 0', fontSize: '0.76rem', color: 'var(--color-muted)' }}>
                          {String(ag.appointmentTime || '').slice(0, 5)} · {ag.professional?.name || '—'}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9rem' }}>{fmtR(ag.service?.price)}</span>
                        {sel && (
                          <p style={{ margin: '0.1rem 0 0', fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>✓ incluído</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── PRODUTOS ── */}
          <div className="card" style={{ padding: '1rem' }}>
            <p style={SECTION_LABEL}><FiPackage size={12} /> Produtos</p>

            {/* Busca */}
            <form
              onSubmit={e => { e.preventDefault(); buscarProduto(prodInput.trim()); }}
              style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}
            >
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0.45rem 0.75rem' }}>
                <FiSearch size={14} style={{ color: 'var(--color-muted)', flexShrink: 0 }} />
                <input
                  ref={prodRef}
                  value={prodInput}
                  onChange={e => setProdInput(e.target.value)}
                  placeholder="Código de barras ou nome do produto"
                  style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color)', fontSize: '0.875rem', flex: 1 }}
                  autoComplete="off"
                />
              </div>
              <button type="button" className="btn btn-ghost" onClick={() => setScanner(true)} title="Câmera">
                <FiCamera size={14} />
              </button>
              <button type="submit" className="btn btn-ghost" disabled={prodBusy}>
                {prodBusy ? '...' : 'Buscar'}
              </button>
            </form>

            {/* Produto encontrado */}
            {prodResultado && (
              prodResultado.vencido ? (
                <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #dc2626', borderRadius: 6, padding: '0.6rem 0.9rem', marginBottom: '0.5rem', color: '#f87171', fontSize: '0.84rem' }}>
                  ⚠ <strong>{prodResultado.nome}</strong> — validade vencida, não pode ser vendido.
                </div>
              ) : (
                <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.6rem 0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: '0.88rem' }}>{prodResultado.nome}</p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.76rem', color: 'var(--color-muted)' }}>
                      Estoque: {prodResultado.quantidade} · {fmtR(prodResultado.precoVenda || prodResultado.preco)}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => addCarrinho(prodResultado)}
                    disabled={prodResultado.quantidade === 0}
                    style={{ flexShrink: 0 }}
                  >
                    {prodResultado.quantidade === 0 ? 'Sem estoque' : '+ Adicionar'}
                  </button>
                </div>
              )
            )}

            {/* Carrinho de produtos */}
            {carrinho.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th style={{ textAlign: 'center', width: 76 }}>Qtd</th>
                    <th style={{ textAlign: 'right' }}>Unit.</th>
                    <th style={{ textAlign: 'right' }}>Subtotal</th>
                    <th style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {carrinho.map(item => {
                    const unit = Number(item.produto.precoVenda || item.produto.preco || 0);
                    const sub  = unit * item.qtd;
                    return (
                      <tr key={item.produto.id}>
                        <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{item.produto.nome}</td>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="number" min="1" max={item.produto.quantidade}
                            value={item.qtd}
                            onChange={e => setQtd(item.produto.id, e.target.value)}
                            style={{ width: 52, textAlign: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--color)', padding: '0.2rem', fontSize: '0.875rem' }}
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontSize: '0.83rem', color: 'var(--color-muted)' }}>{fmtR(unit)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)', fontSize: '0.88rem' }}>{fmtR(sub)}</td>
                        <td>
                          <button
                            className="btn btn-ghost"
                            onClick={() => removeItem(item.produto.id)}
                            style={{ padding: '0.1rem 0.3rem', color: '#dc2626' }}
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.82rem', margin: '0.4rem 0 0', textAlign: 'center' }}>
                Nenhum produto no carrinho.
              </p>
            )}
          </div>

        {/* ══════════ Resumo do Pedido ══════════ */}
        <div className="card" style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0' }}>
          <p style={{ ...SECTION_LABEL, marginBottom: '0.85rem' }}><FiShoppingCart size={12} /> Resumo do Pedido</p>

          {!temItens ? (
            <p style={{ color: 'var(--color-muted)', fontSize: '0.83rem', textAlign: 'center', padding: '1.25rem 0', margin: 0 }}>
              Selecione um cliente ou adicione produtos para iniciar.
            </p>
          ) : (
            <>
              {/* Linha: serviço */}
              {agSelecionado && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', paddingBottom: '0.5rem', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FiScissors size={11} style={{ flexShrink: 0 }} /> {agSelecionado.service?.name}
                    </p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
                      Serviço · {String(agSelecionado.appointmentTime || '').slice(0, 5)}
                    </p>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', flexShrink: 0 }}>{fmtR(totalServico)}</span>
                </div>
              )}

              {/* Linhas: produtos */}
              {carrinho.map(item => {
                const unit = Number(item.produto.precoVenda || item.produto.preco || 0);
                return (
                  <div key={item.produto.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <p style={{ margin: 0, fontSize: '0.84rem' }}>
                      {item.produto.nome}
                      <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginLeft: '0.3rem' }}>×{item.qtd}</span>
                    </p>
                    <span style={{ fontWeight: 600, fontSize: '0.84rem', flexShrink: 0 }}>{fmtR(unit * item.qtd)}</span>
                  </div>
                );
              })}

              {/* Total */}
              <div style={{ borderTop: '2px solid var(--border)', marginTop: '0.6rem', paddingTop: '0.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>Total</span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--success)' }}>{fmtR(total)}</span>
              </div>

              {/* Forma de pagamento */}
              <p style={{ ...SECTION_LABEL, margin: '0.9rem 0 0.4rem' }}>Pagamento</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginBottom: '0.9rem' }}>
                {FORMAS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setForma(f.value)}
                    style={{ padding: '0.4rem 0.5rem', borderRadius: 6, border: `1.5px solid ${forma === f.value ? 'var(--accent)' : 'var(--border)'}`, background: forma === f.value ? 'rgba(124,58,237,0.12)' : 'var(--bg-input)', color: forma === f.value ? 'var(--accent)' : 'var(--color)', fontSize: '0.8rem', fontWeight: forma === f.value ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s' }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Botão finalizar */}
          <button
            className="btn btn-primary"
            onClick={finalizar}
            disabled={!temItens || finalizando}
            style={{ width: '100%', padding: '0.65rem', fontSize: '0.92rem', fontWeight: 700, marginTop: temItens ? 0 : 'auto' }}
          >
            {finalizando ? 'Processando...' : 'Finalizar Venda'}
          </button>

          {temItens && (
            <button
              className="btn btn-ghost"
              onClick={() => { setCarrinho([]); setAgSelecionado(null); }}
              style={{ width: '100%', marginTop: '0.4rem', fontSize: '0.8rem', color: 'var(--color-muted)' }}
            >
              Limpar pedido
            </button>
          )}
        </div>
      </div>

      {scanner && <BarcodeScanner onResult={handleScan} onClose={() => setScanner(false)} />}
    </Layout>
  );
}
