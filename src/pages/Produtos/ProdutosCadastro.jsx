import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { FiCamera, FiArrowLeft } from 'react-icons/fi';
import BarcodeScanner from './BarcodeScanner';

const tok = () => sessionStorage.getItem('token');

const EMPTY_FORM = {
  nome: '', peso: '', quantidade: '', fabricante: '',
  dataFabricacao: '', dataValidade: '', codigoBarras: '',
  preco: '', precoVenda: '', descricao: '',
};

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
    <label style={{ fontSize: '0.78rem', color: 'var(--color-muted)', fontWeight: 600 }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  background: 'var(--bg-input)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xs)',
  color: 'var(--color)',
  fontSize: '0.875rem',
  padding: '0.5rem 0.65rem',
  width: '100%',
  boxSizing: 'border-box',
};

export default function ProdutosCadastro() {
  const navigate = useNavigate();
  const { slug, id } = useParams();
  const isEdit = !!id;

  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [loading,     setLoading]     = useState(isEdit);
  const [scanner,     setScanner]     = useState(false);
  const [buscandoCod, setBuscandoCod] = useState(false);

  // Load product for editing
  useEffect(() => {
    if (!isEdit) return;
    fetch(`/api/produtos`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json())
      .then(d => {
        const p = (d.data || []).find(x => String(x.id) === String(id));
        if (p) {
          setForm({
            nome:           p.nome           || '',
            peso:           p.peso           || '',
            quantidade:     String(p.quantidade ?? ''),
            fabricante:     p.fabricante     || '',
            dataFabricacao: p.dataFabricacao ? String(p.dataFabricacao).slice(0, 10) : '',
            dataValidade:   p.dataValidade   ? String(p.dataValidade).slice(0, 10)   : '',
            codigoBarras:   p.codigoBarras   || '',
            preco:          String(p.preco      || ''),
            precoVenda:     String(p.precoVenda || ''),
            descricao:      p.descricao      || '',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const buscarBarcode = useCallback(async (code) => {
    if (!code) return;
    setBuscandoCod(true);
    try {
      const res = await fetch(`/api/produtos/barcode/${encodeURIComponent(code)}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await res.json();
      if (d.found && !isEdit) {
        // Produto já cadastrado: redireciona para edição
        navigate(`/${slug}/produtos-cadastro/${d.produto.id}`, { replace: true });
      } else if (d.sugestao) {
        setForm(f => ({
          ...f,
          codigoBarras: code,
          nome:         d.sugestao.nome       || f.nome,
          fabricante:   d.sugestao.fabricante || f.fabricante,
          peso:         d.sugestao.peso       || f.peso,
        }));
      }
    } finally { setBuscandoCod(false); }
  }, [isEdit, navigate, slug]);

  const handleScan = useCallback((code) => {
    setScanner(false);
    setForm(f => ({ ...f, codigoBarras: code }));
    buscarBarcode(code);
  }, [buscarBarcode]);

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const salvar = async () => {
    if (!form.nome.trim()) return alert('Nome é obrigatório.');
    setSaving(true);
    try {
      const url    = isEdit ? `/api/produtos/${id}` : '/api/produtos';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Erro');
      navigate(`/${slug}/produtos-lista`);
    } catch (e) {
      alert(e.message || 'Erro ao salvar.');
    } finally { setSaving(false); }
  };

  if (loading) return <Layout title="Produto"><p style={{ color: 'var(--color-muted)' }}>Carregando...</p></Layout>;

  return (
    <Layout title={isEdit ? 'Editar Produto' : 'Novo Produto'}>
      <div style={{ maxWidth: 600 }}>
        <button
          className="btn btn-ghost"
          onClick={() => navigate(`/${slug}/produtos-lista`)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}
        >
          <FiArrowLeft size={14} /> Voltar para lista
        </button>

        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>

            {/* Nome - full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Nome *">
                <input
                  style={inputStyle}
                  value={form.nome}
                  onChange={e => set('nome', e.target.value)}
                  placeholder="Nome do produto"
                  autoFocus
                />
              </Field>
            </div>

            {/* Código de barras - full width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Código de Barras">
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    style={{ ...inputStyle, fontFamily: 'monospace', flex: 1 }}
                    value={form.codigoBarras}
                    onChange={e => set('codigoBarras', e.target.value)}
                    onBlur={e => { if (e.target.value && !isEdit) buscarBarcode(e.target.value); }}
                    placeholder="Digite ou escaneie com a câmera"
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setScanner(true)}
                    title="Escanear com câmera"
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <FiCamera size={15} />
                    {buscandoCod && <span style={{ fontSize: '0.72rem' }}>...</span>}
                  </button>
                </div>
                {!isEdit && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', margin: '0.25rem 0 0' }}>
                    Ao digitar ou escanear, dados do produto são buscados automaticamente.
                  </p>
                )}
              </Field>
            </div>

            <Field label="Fabricante">
              <input style={inputStyle} value={form.fabricante} onChange={e => set('fabricante', e.target.value)} placeholder="Ex: L'Oreal" />
            </Field>

            <Field label="Peso / Volume">
              <input style={inputStyle} value={form.peso} onChange={e => set('peso', e.target.value)} placeholder="Ex: 300ml" />
            </Field>

            <Field label="Quantidade em Estoque">
              <input style={inputStyle} type="number" min="0" value={form.quantidade} onChange={e => set('quantidade', e.target.value)} placeholder="0" />
            </Field>

            <Field label="Preço de Custo (R$)">
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.preco} onChange={e => set('preco', e.target.value)} placeholder="0,00" />
            </Field>

            <Field label="Preço de Venda (R$)">
              <input style={inputStyle} type="number" min="0" step="0.01" value={form.precoVenda} onChange={e => set('precoVenda', e.target.value)} placeholder="0,00" />
            </Field>

            <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              <Field label="Data de Fabricação">
                <input style={inputStyle} type="date" value={form.dataFabricacao} onChange={e => set('dataFabricacao', e.target.value)} />
              </Field>
              <Field label="Data de Validade">
                <input style={inputStyle} type="date" value={form.dataValidade} onChange={e => set('dataValidade', e.target.value)} />
              </Field>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <Field label="Descrição / Observações">
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                  value={form.descricao}
                  onChange={e => set('descricao', e.target.value)}
                  rows={3}
                  placeholder="Informações adicionais sobre o produto"
                />
              </Field>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => navigate(`/${slug}/produtos-lista`)}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={salvar} disabled={saving}>
              {saving ? 'Salvando...' : isEdit ? 'Salvar Alterações' : 'Cadastrar Produto'}
            </button>
          </div>
        </div>
      </div>

      {scanner && (
        <BarcodeScanner
          onResult={handleScan}
          onClose={() => setScanner(false)}
        />
      )}
    </Layout>
  );
}
