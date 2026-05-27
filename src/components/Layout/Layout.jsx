import React, { useState, useEffect, useCallback } from 'react';
import s from './Layout.module.css';
import Sidebar from '../Sidebar/Sidebar';

const tok = () => sessionStorage.getItem('token');

export default function Layout({ children, title }) {
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [qrState, setQrState]  = useState('idle'); // idle | loading | qr | connected | error | pending
  const [qrCode,  setQrCode]   = useState('');
  const [qrMsg,   setQrMsg]    = useState('');

  const fetchQr = useCallback(async () => {
    setQrState('loading');
    setQrCode('');
    setQrMsg('');
    try {
      const r = await fetch('/api/whatsapp/qrcode', {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const d = await r.json().catch(() => ({}));

      if (!r.ok) {
        setQrMsg(d.message || `Erro ${r.status} ao gerar QR code.`);
        setQrState('error');
        return;
      }
      if (d.connected) {
        setQrState('connected');
        return;
      }
      if (d.qrcode) {
        const src = d.qrcode.startsWith('data:') ? d.qrcode : `data:image/png;base64,${d.qrcode}`;
        setQrCode(src);
        setQrState('qr');
        return;
      }
      setQrMsg(d.message || 'QR code ainda não disponível. Aguarde e clique em Atualizar.');
      setQrState('pending');
    } catch (err) {
      setQrMsg('Não foi possível conectar ao servidor.');
      setQrState('error');
    }
  }, []);

  useEffect(() => {
    if (whatsappOpen) fetchQr();
    else { setQrState('idle'); setQrCode(''); setQrMsg(''); }
  }, [whatsappOpen, fetchQr]);

  return (
    <div className={s.shell}>
      <Sidebar onWhatsApp={() => setWhatsappOpen(true)} />
      <main className={s.main}>
        <div className={s.content}>
          {title && <h1 className={s.pageTitle}>{title}</h1>}
          {children}
        </div>
      </main>

      {whatsappOpen && (
        <div className="modal-overlay" onClick={() => setWhatsappOpen(false)}>
          <div className="modal-box" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>QR Code WhatsApp</h3>
              <button className="modal-close" onClick={() => setWhatsappOpen(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center' }}>

              {qrState === 'loading' && (
                <p style={{ color: 'var(--color-muted)', padding: '2rem 0' }}>Gerando QR code...</p>
              )}

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
                    Escaneie com o WhatsApp no seu celular.
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
                <>
                  <p style={{ color: qrState === 'error' ? '#f87171' : 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    {qrMsg}
                  </p>
                </>
              )}

              {qrState !== 'loading' && qrState !== 'connected' && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={fetchQr}>
                  Atualizar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
