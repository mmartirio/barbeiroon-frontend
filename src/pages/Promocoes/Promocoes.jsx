import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiEdit2, FiTrash2, FiRefreshCw, FiChevronDown, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const fmtP = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const toBrDate = (d) => { if (!d) return ''; const [y,m,dy] = d.split('-'); return `${dy}/${m}/${y}`; };
const toApiDate = (d) => { if (!d) return ''; const [dy,m,y] = d.split('/'); return `${y}-${m}-${dy}`; };
const fromApiDate = (s) => { if (!s) return ''; const [y,m,d] = s.split('T')[0].split('-'); return `${d}/${m}/${y}`; };

const CRITERIOS = [
  { label: 'Aniversariantes do mês',        value: 'aniversariantes' },
  { label: 'Após compras',                   value: 'x_compras' },
  { label: 'Na compra do serviço',           value: 'servico_x' },
  { label: 'Efetiva no prazo estimado',      value: 'prazo_estimado' },
  { label: 'Número específico de clientes',  value: 'num_clientes' },
];

const TARGET_ALL = 'target_all_customers';
const TARGET_PFX = 'target_customer:';

const INITIAL = {
  nome: '', preco: '', tipoPreco: 'fixo', tipo: 'desconto_compra',
  validadeInicio: '', validadeFim: '', criterios: [],
  xCompras: '', servicoX: '', numClientes: '', clienteId: TARGET_ALL, repetir: 0,
  comboServicos: '', servicoPremiado: '',
};

const parseTarget = (criteria = []) => {
  let clienteId = TARGET_ALL;
  const clean = criteria.filter(item => {
    if (item === TARGET_ALL) { clienteId = TARGET_ALL; return false; }
    if (item.startsWith(TARGET_PFX)) { clienteId = item.replace(TARGET_PFX, '').trim(); return false; }
    return true;
  });
  return { clienteId, clean };
};

export default function Promocoes() {
  const [promotions, setPromotions]   = useState([]);
  const [customers,  setCustomers]    = useState([]);
  const [loading,    setLoading]      = useState(true);
  const [saving,     setSaving]       = useState(false);
  const [error,      setError]        = useState('');
  const [success,    setSuccess]      = useState('');
  const [form,       setForm]         = useState(INITIAL);
  const [editingId,  setEditingId]    = useState(null);
  const [confirm,    setConfirm]      = useState(null);
  const [showCust,   setShowCust]     = useState(false);
  const [showTipoP,  setShowTipoP]    = useState(false);
  const [showTipo,   setShowTipo]     = useState(false);
  const [showRep,    setShowRep]      = useState(false);
  const [tab,        setTab]          = useState('form');

  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const toggleCrit = (v) => setF('criterios', form.criterios.includes(v) ? form.criterios.filter(c => c !== v) : [...form.criterios, v]);

  const load = async () => {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/promotion?limit=100', { headers: { Authorization: `Bearer ${tok()}` } }),
        fetch('/api/customer?limit=500',  { headers: { Authorization: `Bearer ${tok()}` } }),
      ]);
      const [pData, cData] = await Promise.all([pRes.json().catch(()=>({})), cRes.json().catch(()=>({}))]);
      setPromotions(pData.promotions || pData.data || []);
      setCustomers(cData.customers || cData.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => { setForm(INITIAL); setEditingId(null); setError(''); setSuccess(''); };

  const validate = () => {
    if (!form.nome.trim()) return 'Informe o nome da promoção.';
    if (!form.validadeInicio) return 'Informe a data inicial de validade.';
    if (form.criterios.includes('x_compras') && (!form.xCompras || Number(form.xCompras) < 1)) return 'Informe a quantidade de compras.';
    if (form.criterios.includes('servico_x') && !form.servicoX.trim()) return 'Informe o nome do serviço.';
    if (form.criterios.includes('num_clientes') && (!form.numClientes || Number(form.numClientes) < 1)) return 'Informe o número de clientes.';
    if (form.tipo === 'combo_servico') {
      if (!form.comboServicos.trim()) return 'Informe ao menos um serviço necessário para o combo.';
      if (!form.servicoPremiado.trim()) return 'Informe o serviço premiado.';
    }
    if (form.tipoPreco !== 'gratis') {
      const precoNum = Number((form.preco || '0').replace(',', '.'));
      if (form.tipoPreco === 'percentual' && (precoNum <= 0 || precoNum > 100)) return 'Para percentual, informe um valor entre 1 e 100.';
    }
    return null;
  };

  const buildPayload = () => {
    const targetCrit = form.clienteId === TARGET_ALL ? TARGET_ALL : `${TARGET_PFX}${form.clienteId}`;
    const isCombo = form.tipo === 'combo_servico';
    // Converte textarea (uma por linha) em array JSON
    const comboArray = isCombo
      ? form.comboServicos.split('\n').map(s => s.trim()).filter(Boolean)
      : null;
    return {
      nome:           form.nome.trim(),
      preco:          form.tipoPreco === 'gratis' ? 0 : Number((form.preco || '0').replace(',', '.')),
      tipoPreco:      form.tipoPreco,
      tipo:           form.tipo,
      validadeInicio: form.validadeInicio ? toApiDate(form.validadeInicio) : null,
      validadeFim:    form.validadeFim ? toApiDate(form.validadeFim) : null,
      criterios:      [...form.criterios, targetCrit],
      xCompras:       form.criterios.includes('x_compras') ? Number(form.xCompras) : null,
      servicoX:       form.criterios.includes('servico_x') ? form.servicoX.trim() : null,
      numClientes:    form.criterios.includes('num_clientes') ? Number(form.numClientes) : null,
      comboServicos:  comboArray,
      servicoPremiado: isCombo ? form.servicoPremiado.trim() : null,
      repetir:        form.repetir,
    };
  };

  const save = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const url = editingId ? `/api/promotion/${editingId}` : '/api/promotion';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(buildPayload()),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao salvar');
      setSuccess(editingId ? 'Promoção atualizada!' : 'Promoção criada!');
      resetForm();
      await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const startEdit = (item) => {
    const { clienteId, clean } = parseTarget(Array.isArray(item.criteria) ? item.criteria : []);
    setEditingId(item.id);
    setTab('form');
    setForm({
      nome:           item.name || '',
      preco:          item.price !== null ? String(Number(item.price).toFixed(2)).replace('.', ',') : '',
      tipoPreco:      item.priceType || 'fixo',
      tipo:           item.discountType || 'desconto_compra',
      validadeInicio: fromApiDate(item.validFrom),
      validadeFim:    fromApiDate(item.validUntil),
      criterios:      clean,
      xCompras:       item.xPurchases != null ? String(item.xPurchases) : '',
      servicoX:       item.serviceX || '',
      numClientes:    item.customerCount != null ? String(item.customerCount) : '',
      clienteId,
      repetir:        item.repetir != null ? Number(item.repetir) : 0,
      comboServicos:  Array.isArray(item.comboServices) ? item.comboServices.join('\n') : (item.comboServices || ''),
      servicoPremiado: item.rewardServiceName || '',
    });
    setError(''); setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (item) => {
    try {
      const res = await fetch(`/api/promotion/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ active: !Boolean(item.active) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro');
      setPromotions(prev => prev.map(p => p.id === item.id ? { ...p, active: !p.active } : p));
    } catch (e) { setError(e.message); }
  };

  const del = async (item) => {
    try {
      await fetch(`/api/promotion/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok()}` } });
      setPromotions(prev => prev.filter(p => p.id !== item.id));
      if (editingId === item.id) resetForm();
    } finally { setConfirm(null); }
  };

  const custName = useMemo(() => {
    if (!form.clienteId || form.clienteId === TARGET_ALL) return 'Todos os usuários';
    const c = customers.find(x => String(x.id || x.phone) === String(form.clienteId));
    return c?.name || 'Cliente não encontrado';
  }, [customers, form.clienteId]);

  const repLabel = form.repetir === 0 ? 'Nunca' : form.repetir === 1 ? '1 vez (em 1 mês)' : `${form.repetir} vezes (em ${form.repetir} meses)`;

  const Sel = ({ label, value, onClick }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <button type="button" onClick={onClick}
        style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', padding:'0.6rem 0.75rem', display:'flex', alignItems:'center', justifyContent:'space-between', color:'var(--color)', fontSize:'0.875rem', textAlign:'left' }}>
        <span>{value}</span>
        <FiChevronDown size={14} />
      </button>
    </div>
  );

  const DropMenu = ({ show, items, onSelect }) => show ? (
    <div style={{ marginTop: -12, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', marginBottom:'0.75rem', overflow:'hidden' }}>
      {items.map((item, i) => (
        <button key={i} type="button" onClick={() => onSelect(item)}
          style={{ width:'100%', padding:'0.6rem 0.75rem', textAlign:'left', background:'transparent', color:'var(--color)', fontSize:'0.875rem', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
          {item.label}
        </button>
      ))}
    </div>
  ) : null;

  const tabStyle = (key) => ({
    padding: '0.5rem 1.25rem',
    fontWeight: tab === key ? 700 : 400,
    color: tab === key ? 'var(--accent)' : 'var(--color-muted)',
    borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'color 0.15s',
  });

  return (
    <Layout title="Promoções">
      <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.25rem' }}>
          <button style={tabStyle('form')} onClick={() => setTab('form')}>
            {editingId ? 'Editar Promoção' : 'Nova Promoção'}
          </button>
          <button style={tabStyle('list')} onClick={() => setTab('list')}>
            Promoções Cadastradas {promotions.length > 0 && `(${promotions.length})`}
          </button>
        </div>

        <div className="card" style={{ display: tab === 'form' ? 'block' : 'none' }}>
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>{editingId ? 'Editar Promoção' : 'Nova Promoção'}</h3>
            {error   && <div className="alert alert-error"   style={{ marginBottom:'0.75rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom:'0.75rem' }}>{success}</div>}

            <div className="form-group">
              <label className="form-label">Nome da Promoção</label>
              <input className="form-input" value={form.nome} onChange={e => setF('nome', e.target.value)} placeholder="Ex: Corte aniversário" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Preço</label>
                {form.tipoPreco === 'gratis'
                  ? <p style={{ padding: '0.6rem 0.75rem', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', color: 'var(--success)', fontSize: '0.875rem' }}>Grátis (sem cobrança)</p>
                  : <>
                      <input className="form-input" value={form.preco} onChange={e => setF('preco', e.target.value)} placeholder={form.tipoPreco === 'percentual' ? '10' : '0,00'} />
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>{form.tipoPreco === 'percentual' ? 'Ex.: 10 (1 a 100)' : 'Ex.: 25,00'}</p>
                    </>
                }
              </div>
              <div>
                <Sel label="Tipo de Preço" value={
                  form.tipoPreco === 'fixo' ? 'Fixo (R$)' :
                  form.tipoPreco === 'gratis' ? 'Grátis' : 'Percentual (%)'
                } onClick={() => setShowTipoP(p => !p)} />
                <DropMenu show={showTipoP} items={[
                  {label:'Fixo (R$)', value:'fixo'},
                  {label:'Percentual (%)',value:'percentual'},
                  {label:'Grátis',value:'gratis'},
                ]} onSelect={item=>{setF('tipoPreco',item.value);setShowTipoP(false);}} />
              </div>
            </div>

            <Sel label="Tipo" value={
              form.tipo === 'desconto_compra' ? 'Desconto na compra' :
              form.tipo === 'desconto_proxima' ? 'Desconto na próxima compra' :
              'Combo de Serviços (ganhe serviço)'
            } onClick={() => setShowTipo(p => !p)} />
            <DropMenu show={showTipo} items={[
              {label:'Desconto na compra',value:'desconto_compra'},
              {label:'Desconto na próxima compra',value:'desconto_proxima'},
              {label:'Combo de Serviços (ganhe serviço)',value:'combo_servico'},
            ]} onSelect={item=>{setF('tipo',item.value);setShowTipo(false);}} />

            <Sel label="Usuário da Promoção" value={custName} onClick={() => setShowCust(p => !p)} />
            {showCust && (
              <div style={{ marginTop: -12, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', marginBottom:'0.75rem', maxHeight: 200, overflowY:'auto' }}>
                <button type="button" onClick={() => { setF('clienteId', TARGET_ALL); setShowCust(false); }}
                  style={{ width:'100%', padding:'0.6rem 0.75rem', textAlign:'left', background: form.clienteId === TARGET_ALL ? 'var(--accent)' : 'transparent', color:'var(--color)', fontSize:'0.875rem', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
                  Todos os usuários
                </button>
                {customers.map(c => {
                  const cid = String(c.id || c.phone);
                  return (
                    <button key={cid} type="button" onClick={() => { setF('clienteId', cid); setShowCust(false); }}
                      style={{ width:'100%', padding:'0.6rem 0.75rem', textAlign:'left', background: form.clienteId === cid ? 'var(--accent)' : 'transparent', color:'var(--color)', fontSize:'0.875rem', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Validade inicial (DD/MM/AAAA)</label>
                <input className="form-input" value={form.validadeInicio} onChange={e => setF('validadeInicio', e.target.value)} placeholder="01/06/2026" />
              </div>
              <div className="form-group">
                <label className="form-label">Validade final (DD/MM/AAAA)</label>
                <input className="form-input" value={form.validadeFim} onChange={e => setF('validadeFim', e.target.value)} placeholder="30/06/2026" />
              </div>
            </div>

            <Sel label="Repetir para o mesmo usuário" value={repLabel} onClick={() => setShowRep(p => !p)} />
            {showRep && (
              <div style={{ marginTop: -12, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', marginBottom:'0.75rem', maxHeight: 220, overflowY:'auto' }}>
                {[0,...Array.from({length:12},(_,i)=>i+1)].map(val => (
                  <button key={val} type="button" onClick={() => { setF('repetir', val); setShowRep(false); }}
                    style={{ width:'100%', padding:'0.5rem 0.75rem', textAlign:'left', background: form.repetir === val ? 'var(--accent)' : 'transparent', color:'var(--color)', fontSize:'0.85rem', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer' }}>
                    {val === 0 ? 'Nunca' : val === 1 ? '1 vez (em 1 mês)' : `${val} vezes (em ${val} meses)`}
                  </button>
                ))}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Critérios</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {CRITERIOS.map(c => (
                  <label key={c.value} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-input)', borderRadius:'var(--radius-xs)', padding:'0.5rem 0.75rem', cursor:'pointer', border:'1px solid var(--border)' }}>
                    <span style={{ fontSize:'0.875rem' }}>{c.label}</span>
                    <input type="checkbox" checked={form.criterios.includes(c.value)} onChange={() => toggleCrit(c.value)} style={{ width:16, height:16, accentColor:'var(--accent)' }} />
                  </label>
                ))}
              </div>
            </div>

            {form.criterios.includes('x_compras') && (
              <div className="form-group">
                <label className="form-label">Quantidade de compras</label>
                <input className="form-input" type="number" min="1" value={form.xCompras} onChange={e => setF('xCompras', e.target.value)} placeholder="5" />
              </div>
            )}
            {form.criterios.includes('servico_x') && (
              <div className="form-group">
                <label className="form-label">Nome do serviço</label>
                <input className="form-input" value={form.servicoX} onChange={e => setF('servicoX', e.target.value)} placeholder="Ex: Barba premium" />
              </div>
            )}
            {form.criterios.includes('num_clientes') && (
              <div className="form-group">
                <label className="form-label">Número de clientes</label>
                <input className="form-input" type="number" min="1" value={form.numClientes} onChange={e => setF('numClientes', e.target.value)} placeholder="20" />
              </div>
            )}

            {form.tipo === 'combo_servico' && (
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-xs)', padding: '0.75rem', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.5rem' }}>🎁 Configuração do Combo</p>
                <div className="form-group">
                  <label className="form-label">Serviços necessários (um por linha)</label>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={form.comboServicos}
                    onChange={e => setF('comboServicos', e.target.value)}
                    placeholder={'Corte degradê\nBarba\nSobrancelha'}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: 4 }}>O cliente precisa ter concluído todos esses serviços nos últimos 30 dias.</p>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Serviço premiado</label>
                  <input
                    className="form-input"
                    value={form.servicoPremiado}
                    onChange={e => setF('servicoPremiado', e.target.value)}
                    placeholder="Ex: Hidratação"
                  />
                  <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: 4 }}>Nome do serviço que o cliente ganhará grátis ou com desconto.</p>
                </div>
              </div>
            )}

            <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.5rem' }}>
              {editingId && <button className="btn btn-ghost" style={{ flex:1 }} onClick={resetForm}>Cancelar</button>}
              <button className="btn btn-primary" style={{ flex:1 }} onClick={save} disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar Edição' : 'Criar Promoção'}</button>
            </div>
          </div>
        </div>

        <div className="card" style={{ display: tab === 'list' ? 'block' : 'none' }}>
          <div className="card-body">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <h3>Promoções Cadastradas</h3>
              <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw size={14} /></button>
            </div>

            {loading && <p style={{ color:'var(--color-muted)', fontSize:'0.875rem' }}>Carregando...</p>}
            {!loading && promotions.length === 0 && <p style={{ color:'var(--color-muted)', fontSize:'0.875rem' }}>Nenhuma promoção cadastrada</p>}

            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {promotions.map(item => {
                const { clienteId } = parseTarget(Array.isArray(item.criteria) ? item.criteria : []);
                const custN = clienteId === TARGET_ALL ? 'Todos' : (customers.find(c => String(c.id || c.phone) === String(clienteId))?.name || `Cliente #${clienteId}`);
                return (
                  <div key={item.id} style={{ background:'var(--bg-input)', borderRadius:'var(--radius-xs)', padding:'0.75rem', borderLeft:`3px solid ${item.active ? 'var(--success)' : 'var(--border)'}` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontWeight:700, marginBottom:'0.3rem' }}>{item.name || '-'}</p>
                        <p style={{ fontSize:'0.78rem', color:'var(--color-muted)' }}>
                          {item.discountType === 'combo_servico'
                            ? <>🎁 Combo → <strong style={{ color: 'var(--color)' }}>{item.rewardServiceName || '?'}</strong> {item.priceType === 'gratis' ? 'grátis' : item.priceType === 'percentual' ? `${Math.round(Number(item.price))}% off` : `−${fmtP(item.price)}`}</>
                            : <>{item.priceType === 'gratis' ? 'Grátis' : item.priceType === 'percentual' ? `${Math.round(Number(item.price))}%` : fmtP(item.price)} de desconto · {custN}</>
                          }
                        </p>
                        <p style={{ fontSize:'0.78rem', color:'var(--color-muted)' }}>{toBrDate(item.validFrom)} – {item.validUntil ? toBrDate(item.validUntil) : 'indeterminado'}</p>
                        <label style={{ display:'flex', alignItems:'center', gap:'0.4rem', cursor:'pointer', marginTop:'0.4rem' }}>
                          <input type="checkbox" checked={!!item.active} onChange={() => toggleActive(item)} style={{ width:14, height:14, accentColor:'var(--success)' }} />
                          <span style={{ fontSize:'0.78rem' }}>{item.active ? 'Ativo' : 'Inativo'}</span>
                        </label>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => startEdit(item)}><FiEdit2 size={13} /></button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => setConfirm(item)}><FiTrash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-box" style={{ maxWidth:380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Excluir promoção?</h3><button className="modal-close" onClick={() => setConfirm(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              <p style={{ color:'var(--color-muted)' }}>Excluir <strong style={{ color:'var(--color)' }}>{confirm.name}</strong>?</p>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={() => setConfirm(null)}>Cancelar</button>
                <button className="btn btn-danger" style={{ flex:1 }} onClick={() => del(confirm)}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
