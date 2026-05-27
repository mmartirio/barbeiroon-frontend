import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const POLL_MS = 15_000;

export default function PendingNotifier() {
  const [pending, setPending] = useState([]);
  const [shown,   setShown]   = useState(false);
  const seenIds   = useRef(new Set());
  const navigate  = useNavigate();

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        const res = await fetch('/api/appointment/requests/pending/own', {
          headers: { Authorization: `Bearer ${tok()}` },
        });
        if (!res.ok) return;
        const d = await res.json().catch(() => ({}));
        const reqs = d.requests || d.data || [];
        if (!mounted) return;
        const newOnes = reqs.filter(r => !seenIds.current.has(r.id));
        if (newOnes.length > 0) {
          newOnes.forEach(r => seenIds.current.add(r.id));
          setPending(reqs);
          setShown(true);
        }
      } catch { /* silent */ }
    };
    check();
    const id = setInterval(check, POLL_MS);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  if (!shown || pending.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
      background: 'var(--bg-card)', border: '1px solid var(--warning)',
      borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
      boxShadow: 'var(--shadow)', maxWidth: 320,
      animation: 'slideUp 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div>
          <p style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: '0.3rem' }}>
            {pending.length} solicitação{pending.length > 1 ? 'ões' : ''} pendente{pending.length > 1 ? 's' : ''}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Aguardando sua aprovação</p>
        </div>
        <button
          className="modal-close"
          onClick={() => setShown(false)}
          style={{ flexShrink: 0 }}
        >
          <FiX size={16} />
        </button>
      </div>
      <button
        className="btn btn-warning btn-sm"
        style={{ marginTop: '0.75rem', width: '100%' }}
        onClick={() => { setShown(false); navigate('/solicitacoes-pendentes'); }}
      >
        Ver solicitações
      </button>
    </div>
  );
}
