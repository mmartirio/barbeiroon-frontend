import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiPlus, FiEdit2, FiTrash2, FiCamera, FiSearch, FiAlertTriangle, FiPackage } from 'react-icons/fi';
import BarcodeScanner from './BarcodeScanner';

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtD = v => { if (!v) return '—'; const [y,m,d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };

const EMPTY_FORM = {
  nome: '', peso: '', quantidade: '', fabricante: '',
  dataFabricacao: '', dataValidade: '', codigoBarras: '',
  preco: '', precoVenda: '', descricao: '',
};

export default function Produtos() {
  const [produtos,    setProdutos]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busca,       setBusca]       = useState('');
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [editId,      setEditId]      = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [scanner,     setScanner]     = useState(false);
  const [scanTarget,  setScanTarget]  = useState('form'); // 'form' | 'busca'
  const [buscandoCod, setBuscandoCod] = useState(false);

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

  // Busca por código de barras e preenche formulário
  const buscarBarcode = useCallback(async (code) => {
    setBuscandoCod(true);
    try {
      const res = await fetch(`/api/produtos/barcode/${encodeURIComponent(code)}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await res.json();
      if (d.found) {
        // Produto já cadastrado: abre modal de edição
        const p = d.produto;
        setForm({
          nome:           p.nome || '',
          peso:           p.peso || '',
          quantidade:     String(p.quantidade ?? ''),
          fabricante:     p.fabricante || '',
          dataFabricacao: p.dataFabricacao ? String(p.dataFabricacao).slice(0,10) : '',
          dataValidade:   p.dataValidade   ? String(p.dataValidade).slice(0,10)   : '',
          codigoBarras:   p.codigoBarras   || code,
          preco:          String(p.preco     || ''),
          precoVenda:     String(p.precoVenda || ''),
          descricao:      p.descricao || '',
        });
        setEditId(p.id);
        setModal(true);
      } else if (d.sugestao) {
        // Sugestão da Open Food Facts
        setForm(f => ({
          ...f,
          codigoBarras: code,
          nome:         d.sugestao.nome       || f.nome,
          fabricante:   d.sugestao.fabricante || f.fabricante,
          peso:         d.sugestao.peso       || f.peso,
        }));
      }
    } finally { setBuscandoCod(false); }
  }, []);

  const handleScanResult = useCallback((code) => {
    setScanner(false);
    if (scanTarget === 'form') {
      setForm(f => ({ ...f, codigoBarras: code }));
      buscarBarcode(code);
    } else {
      setBusca(code);
    }
  }, [scanTarget, buscarBarcode]);

  const abrirNovo = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal(true);
  };

  const abrirEditar = (p) => {
    setForm({
      nome:           p.nome || '',
      peso:           p.peso || '',
      quantidade:     String(p.quantidade ?? ''),
      fabricante:     p.fabricante || '',
      dataFabricacao: p.dataFabricacao ? String(p.dataFabricacao).slice(0,10) : '',
      dataValidade:   p.dataValidade   ? String(p.dataValidade).slice(0,10)   : '',
      codigoBarras:   p.codigoBarras   || '',
      preco:          String(p.preco     || ''),
      precoVenda:     String(p.precoVenda || ''),
      descricao:      p.descricao || '',
    });
    setEditId(p.id);
    setModal(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório.');
    setSaving(true);
    try {
      const url    = editId ? `/api/produtos/${editId}` : '/api/produtos';
      const method = editId ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erro');
      setModal(false);
      carregar();
    } catch (e) { alert(e.message || 'Erro ao salvar.'); }
    finally { setSaving(false); }
  };

  const excluir = async (id) => {
    if (!window.confirm('Excluir este produto?')) return;
    await fetch(`/api/produtos/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
    carregar();
  };

  const vencidosCount    = produtos.filter(p => p.vencido).length;
  const venceEmBreveCount = produtos.filter(p => p.venceEmBreve).length;
  const semEstoqueCount  = produtos.filter(p => p.quantidade === 0).length;

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
            placeholder="Buscar produto..."
            style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--color)', fontSize: '0.875rem', flex: 1 }}
          />
        </div>
        <button
          className="btn btn-ghost"
          title="Escanear código de barras"
          onClick={() => { setScanTarget('busca'); setScanner(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <FiCamera size={15} />
        </button>
        <button className="btn btn-primary" onClick={abrirNovo} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <FiPlus size={14} /> Novo Produto
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
      ) : produtos.length === 0 ? (
        <div className="empty-state"><p>Nenhum produto cadastrado.</p></div>
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
                    {p.peso && <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginLeft: '0.4rem' }}>{p.peso}</span>}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--color-muted)', fontFamily: 'monospace' }}>{p.codigoBarras || '—'}</td>
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
                      <span style={{ color: p.vencido ? '#dc2626' : p.venceEmBreve ? '#f59e0b' : 'var(--color)', fontWeight: (p.vencido || p.venceEmBreve) ? 700 : 400 }}>
                        {fmtD(p.dataValidade)}
                        {p.vencido && ' ⚠ Vencido'}
                        {p.venceEmBreve && ' ⚠ Vence em breve'}
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontSize: '0.85rem' }}>{fmtR(p.preco)}</td>
                  <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 700 }}>{fmtR(p.precoVenda)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost" onClick={() => abrirEditar(p)} style={{ padding: '0.2rem 0.4rem', marginRight: '0.25rem' }}><FiEdit2 size={13} /></button>
                    <button className="btn btn-ghost" onClick={() => excluir(p.id)} style={{ padding: '0.2rem 0.4rem', color: '#dc2626' }}><FiTrash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal cadastro/edição */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 560, padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>{editId ? 'Editar Produto' : 'Novo Produto'}</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {/* Nome — linha inteira */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 600 }}>Nome *</label>
                <input
                  className="form-control"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Nome do produto"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--color)', fontSize: '0.875rem', padding: '0.5rem 0.65rem' }}
                />
              </div>

              {/* Código de barras com câmera */}
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 600 }}>Código de Barras</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    value={form.codigoBarras}
                    onChange={e => setForm(f => ({ ...f, codigoBarras: e.target.value }))}
                    onBlur={e => { if (e.target.value) buscarBarcode(e.target.value); }}
                    placeholder="Digite ou escaneie"
                    style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--color)', fontSize: '0.875rem', padding: '0.5rem 0.65rem', fontFamily: 'monospace' }}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => { setScanTarget('form'); setScanner(true); }}
                    title="Escanear com câmera"
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <FiCamera size={15} />
                    {buscandoCod && <span style={{ fontSize: '0.75rem' }}>...</span>}
                  </button>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', margin: 0 }}>
                  Ao digitar ou escanear, o sistema busca o produto automaticamente.
                </p>
              </div>

              {[
                { label: 'Fabricante',       key: 'fabricante',     placeholder: 'Ex: L\'Oreal' },
                { label: 'Peso / Volume',    key: 'peso',           placeholder: 'Ex: 300ml' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 600 }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--color)', fontSize: '0.875rem', padding: '0.5rem 0.65rem' }} />
                </div>
              ))}

              {[
                { label: 'Quantidade em Estoque', key: 'quantidade', type: 'number', placeholder: '0' },
                { label: 'Preço de Custo (R$)',   key: 'preco',      type: 'number', placeholder: '0,00' },
                { label: 'Preço de Venda (R$)',   key: 'precoVenda', type: 'number', placeholder: '0,00' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 600 }}>{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} placeholder={placeholder}
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--color)', fontSize: '0.875rem', padding: '0.5rem 0.65rem' }} />
                </div>
              ))}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 600 }}>Data de Fabricação</label>
                <input type="date" value={form.dataFabricacao} onChange={e => setForm(f => ({ ...f, dataFabricacao: e.target.value }))}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--color)', fontSize: '0.875rem', padding: '0.5rem 0.65rem' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 600 }}>Data de Validade</label>
                <input type="date" value={form.dataValidade} onChange={e => setForm(f => ({ ...f, dataValidade: e.target.value }))}
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--color)', fontSize: '0.875rem', padding: '0.5rem 0.65rem' }} />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 600 }}>Descrição</label>
                <textarea value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} rows={2}
                  placeholder="Observações sobre o produto"
                  style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--color)', fontSize: '0.875rem', padding: '0.5rem 0.65rem', resize: 'vertical' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner de câmera */}
      {scanner && (
        <BarcodeScanner
          onResult={handleScanResult}
          onClose={() => setScanner(false)}
        />
      )}
    </Layout>
  );
}
