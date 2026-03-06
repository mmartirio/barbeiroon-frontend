import React, { useState } from 'react';
import { useTheme } from '../../hooks/useTheme';


import FeedbackMessage from '../../components/FeedbackMessage';
import { useAuth } from '../../hooks/useAuth';

export default function TenantConfigPanel() {
  const { user } = useAuth();
  const { theme, setCustomTheme, logo, setTenantLogo } = useTheme();
  const [logoUrl, setLogoUrl] = useState(logo || '');
  const [primary, setPrimary] = useState(theme.primary);
  const [secondary, setSecondary] = useState(theme.secondary);
  const [accent, setAccent] = useState(theme.accent);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    try {
      // Salva no backend
      const res = await fetch(`/api/tenant/${user.tenantId}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logoUrl,
          theme: { primary, secondary, accent }
        })
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      setTenantLogo(logoUrl);
      setCustomTheme({ primary, secondary, accent });
      setMsg('Configurações salvas com sucesso!');
    } catch (e) {
      setMsg('Erro ao salvar configurações.');
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSave} style={{ background: 'var(--secondary)', padding: 24, borderRadius: 8, margin: '2em 0' }}>
      <h2 style={{ color: 'var(--primary)' }}>Personalização da Barbearia</h2>
      <div style={{ marginBottom: 12 }}>
        <label>Logo (URL): </label>
        <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} style={{ width: 300 }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label>Cor Primária: </label>
        <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} />
        <label style={{ marginLeft: 16 }}>Cor Secundária: </label>
        <input type="color" value={secondary} onChange={e => setSecondary(e.target.value)} />
        <label style={{ marginLeft: 16 }}>Cor de Destaque: </label>
        <input type="color" value={accent} onChange={e => setAccent(e.target.value)} />
      </div>
      <button type="submit" disabled={saving} style={{ marginTop: 12 }}>Salvar</button>
      <FeedbackMessage
        message={msg}
        type={msg && msg.toLowerCase().includes('sucesso') ? 'success' : msg ? 'error' : 'info'}
        onClose={() => setMsg('')}
      />
    </form>
  );
}
