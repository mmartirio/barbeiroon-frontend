import React from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: '#b91c1c',
      color: '#fff',
      textAlign: 'center',
      padding: '10px 16px',
      fontSize: '14px',
      fontWeight: 600,
      letterSpacing: '0.01em',
    }}>
      Sem conexão com a internet — as alterações não serão salvas
    </div>
  );
}
