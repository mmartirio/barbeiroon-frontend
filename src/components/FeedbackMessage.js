import React, { useEffect } from 'react';

import './FeedbackMessage.css';
import { useTranslation } from 'react-i18next';

/**
 * Componente reutilizável para exibir mensagens de feedback (erro, sucesso, info).
 * Props:
 * - message: string (mensagem a ser exibida)
 * - type: 'error' | 'success' | 'info' (define cor e ícone)
 * - onClose: função opcional para fechar a mensagem
 */

export default function FeedbackMessage({ message, type = 'info', onClose }) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!message || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);
  if (!message) return null;
  // Se não houver mensagem customizada, usa padrão do i18n
  const defaultMsg = type === 'success' ? t('feedback.success') : type === 'error' ? t('feedback.error') : t('feedback.info');
  return (
    <div className={`feedback-message feedback-${type}`} role="alert">
      <span className="feedback-icon">
        {type === 'success' && '✔️'}
        {type === 'error' && '❌'}
        {type === 'info' && 'ℹ️'}
      </span>
      <span className="feedback-text">{message || defaultMsg}</span>
      {onClose && (
        <button className="feedback-close" onClick={onClose} aria-label={t('feedback.close') || 'Fechar mensagem'}>×</button>
      )}
    </div>
  );
}
