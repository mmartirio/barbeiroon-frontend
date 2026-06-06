import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { FiX } from 'react-icons/fi';

export default function BarcodeScanner({ onResult, onClose }) {
  const videoRef  = useRef(null);
  const readerRef = useRef(null);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromConstraints(
      { video: { facingMode: 'environment' } },
      videoRef.current,
      (result, err) => {
        if (result) {
          onResult(result.getText());
        }
      }
    ).catch(e => {
      setErro('Não foi possível acessar a câmera. Verifique as permissões.');
    });

    return () => {
      try { BrowserMultiFormatReader.releaseAllStreams(); } catch {}
    };
  }, [onResult]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', zIndex: 2000, padding: '1rem',
    }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 480 }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
        >
          <FiX size={28} />
        </button>
        <p style={{ color: '#fff', textAlign: 'center', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
          Aponte a câmera para o código de barras
        </p>
        {erro ? (
          <p style={{ color: '#f87171', textAlign: 'center' }}>{erro}</p>
        ) : (
          <video
            ref={videoRef}
            style={{ width: '100%', borderRadius: 8, border: '2px solid #2563eb' }}
            autoPlay
            muted
            playsInline
          />
        )}
        {/* Mira */}
        {!erro && (
          <div style={{
            position: 'absolute', top: '50%', left: '10%', right: '10%',
            height: 2, background: 'rgba(37,99,235,0.8)', transform: 'translateY(-50%)',
            boxShadow: '0 0 8px rgba(37,99,235,0.9)',
          }} />
        )}
      </div>
    </div>
  );
}
