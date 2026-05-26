import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import alertMp3 from '../assets/sound/alert.mp3';

const fmt = (v) => {
  if (!v) return '';
  const [y, m, d] = String(v).split('-');
  return (!y || !m || !d) ? v : `${d}/${m}/${y}`;
};

export default function PendingNotifier() {
  const { user } = useAuth();
  const notified = useRef(new Set());
  const [queue, setQueue] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const audioRef = useRef(null);
  const current = useMemo(() => queue[0], [queue]);

  const getAudio = () => {
    if (!audioRef.current) {
      const a = new Audio(alertMp3);
      a.loop = true; a.volume = 0.6;
      audioRef.current = a;
    }
    return audioRef.current;
  };

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const poll = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const isAdmin = !!user?.permissions?.canViewAppointments;
        const url = isAdmin ? '/api/appointment/requests/pending' : '/api/appointment/requests/pending/own';
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !active) return;
        const reqs = data.requests || [];
        setQueue(prev => {
          const ids = new Set(prev.map(r => r.id));
          const merged = [...prev];
          for (const r of reqs) {
            if (ids.has(r.id) || notified.current.has(r.id)) continue;
            merged.push(r);
          }
          return merged;
        });
      } catch { /* noop */ }
    };
    poll();
    const id = setInterval(poll, 15000);
    return () => { active = false; clearInterval(id); };
  }, [user?.id, user?.permissions?.canViewAppointments]);

  useEffect(() => {
    if (current) {
      const a = getAudio();
      if (a.paused) a.play().catch(() => {});
    } else {
      const a = audioRef.current;
      if (a) { a.pause(); a.currentTime = 0; }
    }
    return () => { const a = audioRef.current; if (a) { a.pause(); a.currentTime = 0; } };
  }, [current]);

  const decide = async (approve) => {
    if (!current || processingId) return;
    const token = sessionStorage.getItem('token');
    setProcessingId(current.id);
    try {
      await fetch(`/api/appointment/requests/${current.id}/${approve ? 'approve' : 'reject'}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
    } finally {
      notified.current.add(current.id);
      setQueue(prev => prev.filter(r => r.id !== current.id));
      setProcessingId(null);
    }
  };

  if (!current) return null;

  return (
    <div className="pending-request-overlay">
      <div className="pending-request-modal">
        <h3>Solicitação de agendamento</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
          Este horário excede o expediente. Deseja aprovar?
        </p>
        <div className="pending-request-details">
          <div><strong>Cliente:</strong> {current.customerPhone}</div>
          <div><strong>Serviço:</strong> {current.serviceName || '—'}</div>
          <div><strong>Barbeiro:</strong> {current.professionalName || '—'}</div>
          <div><strong>Data:</strong> {fmt(current.appointmentDate)}</div>
          <div><strong>Horário:</strong> {current.appointmentTime}</div>
          <div><strong>Duração:</strong> {current.durationMinutes} min</div>
        </div>
        <div className="pending-request-actions">
          <button className="pending-request-btn reject" onClick={() => decide(false)} disabled={!!processingId}>Recusar</button>
          <button className="pending-request-btn approve" onClick={() => decide(true)}  disabled={!!processingId}>Aprovar</button>
        </div>
      </div>
    </div>
  );
}
