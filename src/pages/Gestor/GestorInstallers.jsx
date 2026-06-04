import { useState } from 'react';
import { useGestorAuth } from '../../context/GestorAuthContext';

function fmt(bytes) {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function GestorInstallers() {
  const { authFetch } = useGestorAuth();
  const [file,    setFile]    = useState(null);
  const [status,  setStatus]  = useState('idle');
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.apk')) {
      setMessage('Apenas arquivos .apk são permitidos.');
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus('idle');
    setMessage('');
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    try {
      const fd = new FormData();
      fd.append('apk', file, file.name);
      const res = await authFetch('/api/gestor/instaladores/upload', { method: 'POST', body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || `Erro ${res.status}`);
      setStatus('success');
      setMessage(d.message || 'APK publicado com sucesso.');
      setFile(null);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Instaladores</h1>
        <p className="page-subtitle">Publique uma nova versão do APK Android na VPS</p>
      </div>

      <div className="card" style={{ maxWidth: 520 }}>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', margin: 0 }}>
            Destino: <code>/opt/barbeiroon/downloads/barbeiroon_1.0.0.apk</code>
          </p>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', cursor: 'pointer' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Arquivo APK</span>
            <div style={{
              border: '2px dashed var(--border)',
              borderRadius: 8,
              padding: '1.5rem',
              textAlign: 'center',
              background: file ? 'var(--bg-input)' : 'transparent',
            }}>
              {file ? (
                <>
                  <p style={{ fontWeight: 600, margin: '0 0 4px' }}>{file.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', margin: 0 }}>{fmt(file.size)}</p>
                </>
              ) : (
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', margin: 0 }}>
                  Clique para selecionar um arquivo .apk
                </p>
              )}
              <input type="file" accept=".apk" style={{ display: 'none' }} onChange={handleFileChange} />
            </div>
          </label>

          {status === 'success' && (
            <p style={{ color: '#4ade80', fontSize: '0.875rem', fontWeight: 500, margin: 0 }}>{message}</p>
          )}
          {status === 'error' && (
            <p style={{ color: '#f87171', fontSize: '0.875rem', margin: 0 }}>{message}</p>
          )}

          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={!file || status === 'uploading'}
            style={{ alignSelf: 'flex-start' }}
          >
            {status === 'uploading' ? 'Enviando...' : 'Publicar APK'}
          </button>

        </div>
      </div>
    </div>
  );
}
