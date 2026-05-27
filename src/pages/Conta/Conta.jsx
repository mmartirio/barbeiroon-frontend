import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiChevronDown, FiUpload, FiTrash2 } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

const PLANOS = {
  free:       { label: 'Gratuito',   color: '#64748b', desc: 'Até 2 usuários' },
  basic:      { label: 'Básico',     color: '#2563eb', desc: 'Até 5 usuários' },
  premium:    { label: 'Premium',    color: '#7c3aed', desc: 'Até 15 usuários' },
  enterprise: { label: 'Enterprise', color: '#059669', desc: 'Usuários ilimitados' },
};

export default function Conta() {
  const [form, setForm] = useState({
    name: '', companyName: '', cnpj: '', phone: '',
    address: '', neighborhood: '', city: '', state: '', logo: '',
  });
  const [planType,     setPlanType]     = useState('free');
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [showEstados,  setShowEstados]  = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/tenant/settings', { headers: { Authorization: `Bearer ${tok()}` } });
      const data = await res.json().catch(() => ({}));
      setForm({
        name:         data.name         || '',
        companyName:  data.companyName  || '',
        cnpj:         data.cnpj         || '',
        phone:        data.phone        || '',
        address:      data.address      || '',
        neighborhood: data.neighborhood || '',
        city:         data.city         || '',
        state:        data.state        || '',
        logo:         data.logo         || '',
      });
      setPlanType(data.planType || 'free');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Imagem muito grande. Máximo 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set('logo', ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome da empresa é obrigatório'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar');
      setSuccess('Dados salvos com sucesso!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const plano = PLANOS[planType] || PLANOS.free;

  if (loading) return <Layout title="Conta"><div className="empty-state"><p>Carregando...</p></div></Layout>;

  return (
    <Layout title="Conta">
      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Logo */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Logomarca</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              {form.logo ? (
                <img src={form.logo.startsWith('data:') || form.logo.startsWith('http') ? form.logo : `/uploads/${form.logo.replace(/^\/uploads\//, '')}`}
                  alt="Logo" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
              ) : (
                <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', gap: '0.25rem' }}>
                  <FiUpload size={32} />
                  <span style={{ fontSize: '0.75rem' }}>Sem logo</span>
                </div>
              )}
              <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', textAlign: 'center' }}>Recomendado: quadrado 1:1, mín. 200×200 px, máx. 5 MB. JPG ou PNG.</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiUpload size={13} /> Selecionar imagem
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={pickLogo} />
                </label>
                {form.logo && (
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => set('logo', '')}><FiTrash2 size={13} /></button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company data */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Dados da Empresa</h3>
            <div className="form-group">
              <label className="form-label">Nome da Empresa *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome fantasia" />
            </div>
            <div className="form-group">
              <label className="form-label">Razão Social</label>
              <input className="form-input" value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Razão social (opcional)" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input className="form-input" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(00) 00000-0000" maxLength={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Endereço</h3>
            <div className="form-group">
              <label className="form-label">Logradouro e Número</label>
              <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Ex.: Rua das Flores, 123" />
            </div>
            <div className="form-group">
              <label className="form-label">Bairro</label>
              <input className="form-input" value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} placeholder="Bairro" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Cidade" />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Estado</label>
                <button type="button" onClick={() => setShowEstados(p => !p)}
                  style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', padding:'0.6rem 0.75rem', display:'flex', alignItems:'center', justifyContent:'space-between', color: form.state ? 'var(--color)' : 'var(--color-muted)', fontSize:'0.875rem' }}>
                  <span>{form.state || 'UF'}</span>
                  <FiChevronDown size={14} />
                </button>
                {showEstados && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', zIndex:50, maxHeight:180, overflowY:'auto' }}>
                    {ESTADOS_BR.map(uf => (
                      <button key={uf} type="button" onClick={() => { set('state', uf); setShowEstados(false); }}
                        style={{ width:'100%', padding:'0.5rem 0.75rem', textAlign:'left', background: form.state === uf ? 'var(--accent)' : 'transparent', color: form.state === uf ? '#fff' : 'var(--color)', fontSize:'0.875rem', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', fontWeight: form.state === uf ? 700 : 400 }}>
                        {uf}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Plano Contratado</h3>
            <div style={{ border: `1.5px solid ${plano.color}`, borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: `${plano.color}18`, marginBottom: '0.5rem' }}>
              <span style={{ fontWeight: 800, color: plano.color, fontSize: '1.1rem' }}>{plano.label}</span>
              <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>{plano.desc}</span>
            </div>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Para alterar o plano, entre em contato com o suporte.</p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'stretch' }}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </Layout>
  );
}
