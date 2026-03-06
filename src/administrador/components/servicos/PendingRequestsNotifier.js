import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import alertMp3 from '../../../assets/sound/alert.mp3';

const formatDate = (value) => {
  if (!value) return '';
  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

const PendingRequestsNotifier = () => {
  const { user } = useAuth();
  const notifiedRequests = useRef(new Set());
  const [queue, setQueue] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const alertAudioRef = useRef(null);

  const currentRequest = useMemo(() => queue[0], [queue]);

  const getAlertAudio = () => {
    if (!alertAudioRef.current) {
      const audio = new Audio(alertMp3);
      audio.loop = true;
      audio.preload = 'auto';
      audio.volume = 0.6;
      alertAudioRef.current = audio;
    }
    return alertAudioRef.current;
  };

  const startBellLoop = () => {
    const audio = getAlertAudio();
    if (!audio) return;
    if (!audio.paused) return;
    audio.currentTime = 0;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch((error) => {
        console.warn('Audio bloqueado pelo navegador:', error);
      });
    }
  };

  const stopBellLoop = () => {
    const audio = alertAudioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  useEffect(() => {
    if (!user?.id) return;

    let active = true;
    const pollPending = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const isAdmin = !!user?.permissions?.canViewAppointments;
        const url = isAdmin
          ? '/api/appointment/requests/pending'
          : '/api/appointment/requests/pending/own';
        const response = await fetch(url, {
          headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !active) return;

        const requests = data.requests || [];
        setQueue((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const merged = [...prev];
          let hasNew = false;
          for (const request of requests) {
            if (existingIds.has(request.id)) continue;
            if (notifiedRequests.current.has(request.id)) continue;
            merged.push(request);
            hasNew = true;
          }
          return merged;
        });
      } catch (error) {
        console.error('Erro ao consultar solicitacoes pendentes:', error);
      }
    };

    pollPending();
    const intervalId = setInterval(pollPending, 15000);
    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [user?.id, user?.permissions?.canViewAppointments]);

  useEffect(() => {
    if (currentRequest) {
      document.body.classList.add('pending-modal-open');
      startBellLoop();
    } else {
      document.body.classList.remove('pending-modal-open');
      stopBellLoop();
    }
    return () => {
      document.body.classList.remove('pending-modal-open');
      stopBellLoop();
    };
  }, [currentRequest]);

  const handleDecision = async (approved) => {
    if (!currentRequest || processingId) return;
    const token = sessionStorage.getItem('token');
    setProcessingId(currentRequest.id);
    try {
      const endpoint = approved ? 'approve' : 'reject';
      await fetch(`/api/appointment/requests/${currentRequest.id}/${endpoint}`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      });
    } catch (error) {
      console.error('Erro ao processar solicitacao:', error);
    } finally {
      stopBellLoop();
      notifiedRequests.current.add(currentRequest.id);
      setQueue((prev) => prev.filter((item) => item.id !== currentRequest.id));
      setProcessingId(null);
    }
  };

  if (!currentRequest) return null;

  return (
    <div className="pending-request-overlay">
      <div className="pending-request-modal" role="dialog" aria-modal="true">
        <h3>Solicitacao de agendamento</h3>
        <p>Este horario excede o expediente. Deseja aprovar?</p>
        <div className="pending-request-details">
          <div><strong>Cliente:</strong> {currentRequest.customerPhone}</div>
          <div><strong>Servico:</strong> {currentRequest.serviceName || 'Servico'}</div>
          <div><strong>Barbeiro:</strong> {currentRequest.professionalName || 'Profissional'}</div>
          <div><strong>Data:</strong> {formatDate(currentRequest.appointmentDate)}</div>
          <div><strong>Horario:</strong> {currentRequest.appointmentTime}</div>
          <div><strong>Duracao:</strong> {currentRequest.durationMinutes} min</div>
        </div>
        <div className="pending-request-actions">
          <button
            type="button"
            className="pending-request-btn reject"
            onClick={() => handleDecision(false)}
            disabled={processingId === currentRequest.id}
          >
            Recusar
          </button>
          <button
            type="button"
            className="pending-request-btn approve"
            onClick={() => handleDecision(true)}
            disabled={processingId === currentRequest.id}
          >
            Aprovar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PendingRequestsNotifier;
