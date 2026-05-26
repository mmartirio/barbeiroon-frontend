import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiUpload, FiCopy, FiCheck } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const BASE = '/api';

export default function TelaCliente() {
  const [settings, setSettings] = useState({ name: '', slug: '', logo: '', background: '' });
  const [logoFile,    setLogoFile]    = useState(null);
  const [bgFile,      setBgFile]      = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bgPreview,   setBgPreview]   = useState('');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState({ type: '', text: '' });
  const [copied,      setCopied]      = useState(false);

  useEffect(() => {
    fetch(`${BASE}/tenant/settings`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).catch(() => ({}))
      .then(d => {
        const t = d.tenant || d.settings || d;
        setSettings({ name: t.name || '', slug: t.slug || '', logo: t.logo || t.logoUrl || '', background: t.background || t.backgroundUrl || '' });
      })
      .finally(() => setLoading(false));
  }, []);

  const pickFile = (setter, previewSetter) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setter(file);
    previewSetter(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg({ type: '', text: '' });
    setSaving(true);
    try {
      if (logoFile || bgFile) {
        const fd = new FormData();
        if (logoFile) fd.append('logo', logoFile);
        if (bgFile)   fd.append('background', bgFile);
        const uRes = await fetch(`${BASE}/tenant/upload-assets`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${tok()}` },
          body: fd,
        });
        if (uRes.ok) {
          const ud = await uRes.json().catch(() => ({}));
          setSettings(p => ({ ...p, logo: ud.logo || ud.logoUrl || p.logo, background: ud.background || ud.backgroundUrl || p.background }));
          setLogoFile(null); setBgFile(null);
        }
      }
      setMsg({ type: 'success', text: 'Tela do cliente atualizada com sucesso!' });
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    finally { setSaving(false); }
  };

  const shareUrl = settings.slug ? `${window.location.origin}/cliente/${settings.slug}` : '';

  const copyLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  if (loading) return <Layout title="Tela do Cliente"><div className="empty-state"><p>Carregando...</p></div></Layout>;

  return (
    <Layout title="Tela do Cliente">
      <div style={{ maxWidth: 520 }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

            {/* Share link */}
            {shareUrl && (
              <div style={{ background: 'var(--background)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.4rem' }}>Link de agendamento do cliente</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ flex: 1, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</span>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={copyLink} style={{ flexShrink: 0 }}>
                    {copied ? <FiCheck size={14} color="var(--success)" /> : <FiCopy size={14} />}
                    <span style={{ marginLeft: 4 }}>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Logo */}
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Logo</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--background)', border: '2px dashed var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(logoPreview || settings.logo)
                    ? <img src={logoPreview || settings.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <span style={{ color: 'var(--color-muted)', fontSize: '0.7rem' }}>Sem logo</span>
                  }
                </div>
                <label style={{ cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile(setLogoFile, setLogoPreview)} />
                  <span className="btn btn-ghost btn-sm"><FiUpload size={14} style={{ marginRight: 4 }} />Escolher logo</span>
                </label>
              </div>
            </div>

            {/* Background */}
            <div>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Imagem de fundo</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 80, height: 80, borderRadius: 12, background: 'var(--background)', border: '2px dashed var(--border-color)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {(bgPreview || settings.background)
                    ? <img src={bgPreview || settings.background} alt="Fundo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: 'var(--color-muted)', fontSize: '0.7rem' }}>Sem imagem</span>
                  }
                </div>
                <label style={{ cursor: 'pointer' }}>
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile(setBgFile, setBgPreview)} />
                  <span className="btn btn-ghost btn-sm"><FiUpload size={14} style={{ marginRight: 4 }} />Escolher fundo</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar alterações'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
