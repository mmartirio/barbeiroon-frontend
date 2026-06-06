import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const KEY       = 'bb_ann_jun2026';
const MAX_SHOWS = 3;
const END_DATE  = new Date('2026-06-13T23:59:59');

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const now = new Date();
    if (now > END_DATE) return;

    const count = parseInt(localStorage.getItem(KEY) || '0', 10);
    if (count >= MAX_SHOWS) return;

    localStorage.setItem(KEY, String(count + 1));
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      onClick={() => setVisible(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.25s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%', maxWidth: 480,
          borderRadius: 20,
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Fundo degradê */}
        <div style={{
          background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 45%, #5b21b6 100%)',
          padding: '2.5rem 2rem 2rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center',
          gap: '1rem',
        }}>
          {/* Botão fechar */}
          <button
            onClick={() => setVisible(false)}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(255,255,255,0.15)', border: 'none',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer',
            }}
          >
            <FiX size={16} />
          </button>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/icon.png" alt="Barbeiroon" style={{ height: 52, borderRadius: 12 }} />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
              Barbeiro<span style={{ color: '#c4b5fd' }}>ON</span>
            </span>
          </div>

          {/* Divisor decorativo */}
          <div style={{ width: 48, height: 3, background: 'rgba(255,255,255,0.3)', borderRadius: 99 }} />

          {/* Mensagem */}
          <div>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.5rem', margin: 0, lineHeight: 1.2 }}>
              Estamos com novidades!
            </p>
            <p style={{ color: '#ddd6fe', fontSize: '1rem', marginTop: '0.6rem', lineHeight: 1.5 }}>
              Consulte as novas funcionalidades do sistema
            </p>
          </div>

          {/* Ícones decorativos */}
          <div style={{ fontSize: '1.6rem', letterSpacing: '0.4rem' }}>✂️ 🎉 ✨</div>

          {/* Botão */}
          <button
            onClick={() => setVisible(false)}
            style={{
              marginTop: '0.25rem',
              background: '#fff', color: '#7c3aed',
              border: 'none', borderRadius: 99,
              padding: '0.65rem 2rem',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            }}
          >
            Entendido!
          </button>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', margin: 0 }}>
            Esta mensagem aparece nas suas próximas visitas.
          </p>
        </div>
      </div>
    </div>
  );
}
