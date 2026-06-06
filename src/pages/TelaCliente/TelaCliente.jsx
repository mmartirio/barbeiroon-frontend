import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiUpload, FiShare2, FiCopy } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const toAbsUrl = (v) => {
  if (!v) return '';
  if (v.startsWith('http') || v.startsWith('data:')) return v;
  return `/uploads/${v.replace(/^\/uploads\//, '')}`;
};

const toSlug = (name) => (name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function TelaCliente() {
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [tenantData,  setTenantData]  = useState({ name: '', slug: '', logo: '', backgroundImage: '' });
  const [logoFile,    setLogoFile]    = useState(null);
  const [bgFile,      setBgFile]      = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bgPreview,   setBgPreview]   = useState('');
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    fetch('/api/tenant/settings', { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).catch(() => ({}))
      .then(d => {
        setTenantData({ name: d.name || '', slug: d.slug || '', logo: d.logo || '', backgroundImage: d.backgroundImage || '' });
      })
      .finally(() => setLoading(false));
  }, []);

  const slug = toSlug(tenantData.slug?.trim() || tenantData.name);
  const clientLink = slug ? `${window.location.origin}/agendar/${slug}` : '';

  const pickFile = (type, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError('Arquivo muito grande. Máximo 10 MB.'); return; }
    const url = URL.createObjectURL(file);
    if (type === 'logo') { setLogoFile(file); setLogoPreview(url); }
    else { setBgFile(file); setBgPreview(url); }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!logoFile && !bgFile) { setError('Selecione pelo menos uma imagem para salvar'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const fd = new FormData();
      if (logoFile) fd.append('logo',       logoFile, logoFile.name);
      if (bgFile)   fd.append('background', bgFile,   bgFile.name);
      const res = await fetch('/api/tenant/upload-assets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}` },
        body: fd,
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao salvar');
      setTenantData(p => ({ ...p, logo: d.logo || p.logo, backgroundImage: d.backgroundImage || p.backgroundImage }));
      setLogoFile(null); setBgFile(null); setLogoPreview(''); setBgPreview('');
      setSuccess('Personalização salva com sucesso!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const copyLink = () => {
    if (!clientLink) return;
    navigator.clipboard.writeText(clientLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const openWhatsApp = () => {
    if (!clientLink) return;
    const text = `Agende seu horário na ${tenantData.name || 'barbearia'}! ${clientLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (loading) return <Layout title="Meu Link"><div className="empty-state"><p>Carregando...</p></div></Layout>;

  const logoSrc = logoPreview || toAbsUrl(tenantData.logo);
  const bgSrc   = bgPreview   || toAbsUrl(tenantData.backgroundImage);

  return (
    <Layout title="Meu Link">
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Configure logo e plano de fundo da página de agendamento público.</p>

        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Logo */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '0.5rem' }}>Logomarca</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Exibida acima do formulário de agendamento.</p>
            {logoSrc && <img src={logoSrc} alt="Logo" style={{ width: '100%', height: 160, objectFit: 'contain', background: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', marginBottom: '0.75rem' }} />}
            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiUpload size={14} /> {logoSrc ? 'Alterar Logo' : 'Enviar Logo'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pickFile('logo', e)} />
            </label>
          </div>
        </div>

        {/* Background */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '0.5rem' }}>Plano de Fundo</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Imagem de fundo da página pública de agendamento.</p>
            {bgSrc && <img src={bgSrc} alt="Fundo" style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-xs)', marginBottom: '0.75rem' }} />}
            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiUpload size={14} /> {bgSrc ? 'Alterar Fundo' : 'Enviar Fundo'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => pickFile('bg', e)} />
            </label>
          </div>
        </div>

        {/* Link */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '0.75rem' }}>Link de Agendamento</h3>
            {clientLink ? (
              <>
                <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', padding: '0.6rem 0.75rem', fontSize: '0.85rem', color: '#d6e1ff', marginBottom: '0.75rem', wordBreak: 'break-all' }}>{clientLink}</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }} onClick={copyLink}>
                    <FiCopy size={13} /> {copied ? 'Copiado!' : 'Copiar link'}
                  </button>
                  <button className="btn btn-sm" style={{ flex: 1, background: '#16a34a', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: 'var(--radius-xs)', cursor: 'pointer' }} onClick={openWhatsApp}>
                    <FiShare2 size={13} /> WhatsApp
                  </button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Não foi possível gerar o link. Configure o nome da empresa em Conta.</p>
            )}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving || (!logoFile && !bgFile)} style={{ opacity: (!logoFile && !bgFile) ? 0.5 : 1 }}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </Layout>
  );
}
