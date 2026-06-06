import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const KEY         = 'bb_ann_jun2026_v2';
const SESSION_KEY = 'bb_ann_jun2026_v2_shown';
const MAX_SHOWS   = 3;
const END_DATE    = new Date('2026-06-13T23:59:59');

export default function AnnouncementBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const now = new Date();
    if (now > END_DATE) return;

    // Already shown in this login session
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const count = parseInt(localStorage.getItem(KEY) || '0', 10);
    if (count >= MAX_SHOWS) return;

    localStorage.setItem(KEY, String(count + 1));
    sessionStorage.setItem(SESSION_KEY, '1');
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
          background: '#fff',
        }}
      >
        {/* Botão fechar */}
        <button
          onClick={() => setVisible(false)}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.45)', border: 'none',
            borderRadius: '50%', width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', cursor: 'pointer', zIndex: 1,
          }}
        >
          <FiX size={16} />
        </button>

        {/* Imagem do banner */}
        <img
          src="/banner-novidades.png"
          alt="Estamos com novidades!"
          style={{ width: '100%', display: 'block' }}
        />

        {/* Botão */}
        <div style={{ padding: '1rem', textAlign: 'center', background: '#fff' }}>
          <button
            onClick={() => setVisible(false)}
            style={{
              background: '#16a34a', color: '#fff',
              border: 'none', borderRadius: 99,
              padding: '0.65rem 2.5rem',
              fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            }}
          >
            Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}
