import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiUpload } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const BASE = '/api';

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function Conta() {
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', cnpj: '', address: '', city: '', state: '', zipCode: '' });
  const [logo,    setLogo]    = useState('');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState({ type: '', text: '' });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`${BASE}/tenant/settings`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).catch(() => ({}))
      .then(d => {
        const t = d.tenant || d.settings || d;
        setForm({
          name:    t.name    || '',
          email:   t.email   || '',
          phone:   t.phone   || '',
          cnpj:    t.cnpj    || '',
          address: t.address || '',
          city:    t.city    || '',
          state:   t.state   || '',
          zipCode: t.zipCode || t.zip || '',
        });
        setLogo(t.logo || t.logoUrl || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg({ type: '', text: '' });
    setSaving(true);
    try {
      if (logoFile) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        const uRes = await fetch(`${BASE}/tenant/upload-assets`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tok()}` },
          body: fd,
        });
        if (uRes.ok) {
          const ud = await uRes.json().catch(() => ({}));
          setLogo(ud.logo || ud.logoUrl || logo);
        }
      }

      const res = await fetch(`${BASE}/tenant/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro ao salvar'); }
      setMsg({ type: 'success', text: 'Configurações salvas com sucesso!' });
      setLogoFile(null);
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    finally { setSaving(false); }
  };

  const displayLogo = logoPreview || logo;

  if (loading) return <Layout title="Conta"><div className="empty-state"><p>Carregando...</p></div></Layout>;

  return (
    <Layout title="Configurações da Conta">
      <div style={{ maxWidth: 560 }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '0.75rem' }}>{msg.text}</div>}

            {/* Logo upload */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: 96, height: 96, borderRadius: 12, background: 'var(--background)', border: '2px dashed var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {displayLogo
                  ? <img src={displayLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  : <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>Sem logo</span>
                }
              </div>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={pickLogo} />
                <span className="btn btn-ghost btn-sm"><FiUpload size={14} style={{ marginRight: 4 }} />Alterar logo</span>
              </label>
            </div>

            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Dados da empresa</p>
            <div className="form-field"><label className="form-label">Nome da barbearia</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">E-mail</label><input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Telefone</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">CNPJ</label><input className="form-input" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} /></div>

            <p style={{ fontWeight: 600, margin: '0.75rem 0 0.25rem' }}>Endereço</p>
            <div className="form-field"><label className="form-label">Endereço</label><input className="form-input" placeholder="Rua, número" value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0 0.75rem' }}>
              <div className="form-field"><label className="form-label">Cidade</label><input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} /></div>
              <div className="form-field">
                <label className="form-label">Estado</label>
                <select className="form-input" style={{ width: 72 }} value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">UF</option>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field"><label className="form-label">CEP</label><input className="form-input" style={{ width: 110 }} value={form.zipCode} onChange={e => set('zipCode', e.target.value)} /></div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.75rem' }} disabled={saving}>{saving ? 'Salvando...' : 'Salvar configurações'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
