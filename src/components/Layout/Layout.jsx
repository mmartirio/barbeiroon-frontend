import React, { useState, useEffect, useCallback } from 'react';
import s from './Layout.module.css';
import Sidebar from '../Sidebar/Sidebar';
import SuporteModal from '../Suporte/SuporteModal';

const tok = () => sessionStorage.getItem('token');

export default function Layout({ children, title }) {
  const [suporteOpen,  setSuporteOpen]  = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [tab, setTab]         = useState('qr'); // 'qr' | 'code'
  const [qrState, setQrState] = useState('idle'); // idle | loading | qr | connected | error | pending
  const [qrCode,  setQrCode]  = useState('');
  const [qrMsg,   setQrMsg]   = useState('');

  // pairing code state
  const [phone,       setPhone]       = useState('');
  const [codeState,   setCodeState]   = useState('idle'); // idle | loading | done | error
  const [pairingCode, setPairingCode] = useState('');
  const [codeMsg,     setCodeMsg]     = useState('');

  const fetchQr = useCallback(async () => {
    setQrState('loading');
    setQrCode('');
    setQrMsg('');
    try {
      const r = await fetch('/api/whatsapp/qrcode', {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setQrMsg(d.message || `Erro ${r.status}`); setQrState('error'); return; }
      if (d.connected) { setQrState('connected'); return; }
      if (d.qrcode) {
        const src = d.qrcode.startsWith('data:') ? d.qrcode : `data:image/png;base64,${d.qrcode}`;
        setQrCode(src);
        setQrState('qr');
        return;
      }
      setQrMsg(d.message || 'QR code ainda não disponível. Clique em Atualizar.');
      setQrState('pending');
    } catch {
      setQrMsg('Não foi possível conectar ao servidor.');
      setQrState('error');
    }
  }, []);

  const fetchPairingCode = async () => {
    if (!phone.trim()) { setCodeMsg('Informe o número de telefone.'); setCodeState('error'); return; }
    setCodeState('loading');
    setPairingCode('');
    setCodeMsg('');
    try {
      const r = await fetch('/api/whatsapp/pairingcode', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setCodeMsg(d.message || `Erro ${r.status}`); setCodeState('error'); return; }
      if (d.connected) { setCodeState('done'); setCodeMsg('connected'); return; }
      if (d.pairingCode) { setPairingCode(d.pairingCode); setCodeState('done'); return; }
      setCodeMsg(d.message || 'Código não disponível. Tente novamente.'); setCodeState('error');
    } catch {
      setCodeMsg('Não foi possível conectar ao servidor.');
      setCodeState('error');
    }
  };

  const closeModal = () => {
    setWhatsappOpen(false);
    setTab('qr');
    setQrState('idle'); setQrCode(''); setQrMsg('');
    setCodeState('idle'); setPairingCode(''); setCodeMsg(''); setPhone('');
  };

  useEffect(() => {
    if (whatsappOpen && tab === 'qr') fetchQr();
  }, [whatsappOpen, tab, fetchQr]);

  return (
    <div className={s.shell}>
      <Sidebar
        onWhatsApp={() => setWhatsappOpen(true)}
        onSupport={() => setSuporteOpen(true)}
        externalOpen={sidebarOpen}
        onExternalClose={() => setSidebarOpen(false)}
      />
      <main className={s.main}>
        <div className={s.content}>
          {title && <h1 className={s.pageTitle}>{title}</h1>}
          {children}
        </div>
      </main>

      {suporteOpen && <SuporteModal onClose={() => setSuporteOpen(false)} />}

      {whatsappOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Conectar WhatsApp</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
              {[['qr', '📷 QR Code'], ['code', '🔢 Código']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  style={{
                    flex: 1, padding: '0.6rem', fontSize: '0.85rem', fontWeight: 500,
                    color: tab === key ? 'var(--accent)' : 'var(--color-muted)',
                    borderBottom: tab === key ? '2px solid var(--accent)' : '2px solid transparent',
                    background: 'none', border: 'none', borderRadius: 0, cursor: 'pointer',
                    marginBottom: -1,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center' }}>

              {/* ── Aba QR ── */}
              {tab === 'qr' && (
                <>
                  {qrState === 'loading' && <p style={{ color: 'var(--color-muted)', padding: '2rem 0' }}>Gerando QR code...</p>}

                  {qrState === 'connected' && (
                    <>
                      <p style={{ color: '#4ade80', fontWeight: 600, fontSize: '1rem' }}>✅ WhatsApp conectado!</p>
                      <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: 8 }}>
                        Sua conta já está vinculada e pronta para enviar notificações.
                      </p>
                    </>
                  )}

                  {qrState === 'qr' && (
                    <>
                      <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                        Abra o WhatsApp → <strong>Aparelhos conectados</strong> → <strong>Conectar aparelho</strong> → escaneie o código.
                      </p>
                      <div style={{ padding: '0.75rem', background: '#fff', borderRadius: 8, display: 'inline-block' }}>
                        <img src={qrCode} alt="QR Code WhatsApp" style={{ width: 200, height: 200, display: 'block' }} />
                      </div>
                      <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                        O QR code expira em ~60 segundos.
                      </p>
                    </>
                  )}

                  {(qrState === 'pending' || qrState === 'error') && (
                    <p style={{ color: qrState === 'error' ? '#f87171' : 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                      {qrMsg}
                    </p>
                  )}

                  {qrState !== 'loading' && qrState !== 'connected' && (
                    <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={fetchQr}>
                      Atualizar
                    </button>
                  )}
                </>
              )}

              {/* ── Aba Código ── */}
              {tab === 'code' && (
                <>
                  {codeState !== 'done' && (
                    <>
                      <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                        Informe o número do WhatsApp que será conectado. Um código de 8 dígitos será gerado para você digitar no app.
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                        <input
                          className="form-input"
                          type="tel"
                          placeholder="Ex: 11999998888"
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && fetchPairingCode()}
                          disabled={codeState === 'loading'}
                          style={{ flex: 1 }}
                        />
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={fetchPairingCode}
                          disabled={codeState === 'loading'}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          {codeState === 'loading' ? 'Gerando...' : 'Gerar código'}
                        </button>
                      </div>
                      {codeState === 'error' && (
                        <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.75rem' }}>{codeMsg}</p>
                      )}
                    </>
                  )}

                  {codeState === 'done' && codeMsg === 'connected' && (
                    <>
                      <p style={{ color: '#4ade80', fontWeight: 600, fontSize: '1rem' }}>✅ WhatsApp conectado!</p>
                      <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: 8 }}>
                        Sua conta já está vinculada e pronta para enviar notificações.
                      </p>
                    </>
                  )}

                  {codeState === 'done' && pairingCode && (
                    <>
                      <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                        Abra o WhatsApp no celular → <strong>Aparelhos conectados</strong> → <strong>Conectar aparelho</strong> → <strong>Conectar com número de telefone</strong> e digite o código abaixo:
                      </p>
                      <div style={{
                        background: 'var(--bg-input)', border: '1px solid var(--accent)',
                        borderRadius: 10, padding: '1rem 1.5rem', marginBottom: '1rem',
                      }}>
                        <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Código de pareamento</p>
                        <p style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--accent)' }}>
                          {pairingCode}
                        </p>
                        <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginTop: 4 }}>Expira em ~60 segundos</p>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => { setCodeState('idle'); setPairingCode(''); setCodeMsg(''); }}
                      >
                        Gerar novo código
                      </button>
                    </>
                  )}
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
