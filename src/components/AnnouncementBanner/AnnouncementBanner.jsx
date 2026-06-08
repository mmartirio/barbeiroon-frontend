import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';

const SESSION_KEY = 'ann_shown_ids';
const tok = () => sessionStorage.getItem('token');

export default function AnnouncementBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    const t = tok();
    if (!t) return;

    // IDs já exibidos nessa sessão (evita re-exibir na mesma sessão)
    let shownIds = [];
    try { shownIds = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]'); } catch { shownIds = []; }

    fetch('/api/avisos/active', { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.ok ? r.json() : [])
      .then(rows => {
        const next = (rows || []).find(r => !shownIds.includes(r.id));
        if (!next) return;

        // Registra visualização no servidor
        fetch(`/api/avisos/${next.id}/view`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${t}` },
        }).catch(() => {});

        // Marca como exibido na sessão
        shownIds.push(next.id);
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(shownIds)); } catch { }

        setBanner(next);
      })
      .catch(() => {});
  }, []);

  if (!banner) return null;

  const hasText = banner.title || banner.subtitle || banner.body;

  return (
    <div
      onClick={() => setBanner(null)}
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
        <button
          onClick={() => setBanner(null)}
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

        {banner.imageUrl && (
          <img src={banner.imageUrl} alt="" style={{ width: '100%', display: 'block' }} />
        )}

        {hasText && (
          <div style={{ padding: '1rem 1.25rem' }}>
            {banner.title && (
              <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111', margin: '0 0 0.25rem' }}>{banner.title}</p>
            )}
            {banner.subtitle && (
              <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#444', margin: '0 0 0.5rem' }}>{banner.subtitle}</p>
            )}
            {banner.body && (
              <p style={{ fontSize: '0.85rem', color: '#555', margin: 0, lineHeight: 1.5 }}>{banner.body}</p>
            )}
          </div>
        )}

        <div style={{ padding: '1rem', textAlign: 'center', background: '#fff', borderTop: hasText ? '1px solid #eee' : 'none' }}>
          <button
            onClick={() => setBanner(null)}
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
