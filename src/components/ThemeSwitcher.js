
import React, { useState } from 'react';
import { useTheme } from '../hooks/useTheme';

export default function ThemeSwitcher() {
  const { theme, changeTheme, backgroundImage, changeBackground, user } = useTheme();
  const [bgInput, setBgInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Upload handler
  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file || !user?.tenantId) return;
    setUploading(true);
    setUploadError('');
    const formData = new FormData();
    formData.append('background', file);
    try {
      const res = await fetch(`/api/tenant/${user.tenantId}/background`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        changeBackground(data.backgroundImage);
      } else {
        const err = await res.json();
        setUploadError(err.message || 'Erro ao enviar imagem');
      }
    } catch (err) {
      setUploadError('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ margin: '1em 0', padding: '1em', background: 'var(--secondary)', borderRadius: 8 }}>
      <h3 style={{ color: 'var(--primary)' }}>Personalização de Tema</h3>
      <div style={{ marginBottom: 8 }}>
        <button onClick={() => changeTheme('light')} style={{ marginRight: 8 }}>Claro</button>
        <button onClick={() => changeTheme('dark')}>Escuro</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="URL da imagem de fundo"
          value={bgInput}
          onChange={e => setBgInput(e.target.value)}
          style={{ width: 220, marginRight: 8 }}
        />
        <button onClick={() => changeBackground(bgInput)}>Aplicar Plano de Fundo</button>
        <button onClick={() => { setBgInput(''); changeBackground(''); }} style={{ marginLeft: 8 }}>Remover</button>
      </div>
      <div style={{ marginBottom: 8 }}>
        <input type="file" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
        {uploading && <span style={{ marginLeft: 8, color: 'var(--accent)' }}>Enviando...</span>}
        {uploadError && <span style={{ marginLeft: 8, color: 'red' }}>{uploadError}</span>}
      </div>
      {backgroundImage && (
        <div style={{ fontSize: 12, color: 'var(--accent)' }}>
          Plano de fundo atual: <span>{backgroundImage}</span>
        </div>
      )}
    </div>
  );
}
