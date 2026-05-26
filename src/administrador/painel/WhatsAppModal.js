import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiX, FiRefreshCw, FiWifi, FiWifiOff, FiSmartphone } from 'react-icons/fi';

const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

const authFetch = (path, opts = {}) =>
    fetch(path, {
        ...opts,
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });

export default function WhatsAppModal({ onClose }) {
    const [status, setStatus] = useState(null);
    const [qrcode, setQrcode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [disconnecting, setDisconnecting] = useState(false);
    const intervalRef = useRef(null);

    const fetchStatus = useCallback(async () => {
        try {
            const r = await authFetch('/api/whatsapp/status');
            const data = await r.json();
            setStatus(data);
            return data;
        } catch {
            setError('Erro ao verificar status do WhatsApp.');
            return null;
        }
    }, []);

    const fetchQrCode = useCallback(async () => {
        setError('');
        try {
            const r = await authFetch('/api/whatsapp/qrcode');
            const data = await r.json();
            if (data.connected) {
                setQrcode(null); // já conectado, status vai atualizar
            } else if (data.qrcode) {
                setQrcode(data.qrcode);
            } else {
                // 202 (aguardando), 4xx, 5xx — exibe a mensagem de retorno
                setError(data.message || 'QR Code não disponível. Tente novamente em alguns segundos.');
                setQrcode(null);
            }
        } catch {
            setError('Erro ao carregar QR Code. Verifique a conexão com o servidor.');
        }
    }, []);

    const refresh = useCallback(async () => {
        setLoading(true);
        const s = await fetchStatus();
        if (s && !s.connected) {
            await fetchQrCode();
        } else {
            setQrcode(null);
        }
        setLoading(false);
    }, [fetchStatus, fetchQrCode]);

    useEffect(() => {
        refresh();
        intervalRef.current = setInterval(refresh, 20000);
        return () => clearInterval(intervalRef.current);
    }, [refresh]);

    const handleDisconnect = async () => {
        if (!window.confirm('Deseja desconectar o WhatsApp?')) return;
        setDisconnecting(true);
        try {
            await authFetch('/api/whatsapp/disconnect', { method: 'DELETE' });
            await refresh();
        } catch {
            setError('Erro ao desconectar.');
        } finally {
            setDisconnecting(false);
        }
    };

    const isConnected = status?.connected;
    const isConfigured = status?.configured;

    return (
        <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
        >
            <div
                style={{ background: '#1e2330', borderRadius: 16, padding: '32px 28px', minWidth: 340, maxWidth: 400, width: '90%', boxShadow: '0 8px 40px #0008', position: 'relative', color: '#fff' }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
                >
                    <FiX size={20} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <FiSmartphone size={22} color="#25d366" />
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>WhatsApp</h2>
                </div>

                {/* Status badge */}
                {status && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, padding: '8px 14px', borderRadius: 8, background: isConnected ? 'rgba(37,211,102,0.12)' : 'rgba(239,68,68,0.12)', border: `1.5px solid ${isConnected ? '#25d366' : '#ef4444'}` }}>
                        {isConnected ? <FiWifi size={16} color="#25d366" /> : <FiWifiOff size={16} color="#ef4444" />}
                        <span style={{ fontSize: 14, fontWeight: 600, color: isConnected ? '#25d366' : '#ef4444' }}>
                            {isConnected ? 'Conectado' : isConfigured ? `Desconectado (${status.state || 'offline'})` : 'API não configurada'}
                        </span>
                    </div>
                )}

                {error && (
                    <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#888' }}>
                        <FiRefreshCw size={28} style={{ animation: 'spin 1s linear infinite' }} />
                        <p style={{ marginTop: 10, fontSize: 14 }}>Carregando...</p>
                    </div>
                ) : isConnected ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 14, color: '#aaa', marginBottom: 20 }}>
                            Seu WhatsApp está conectado. As mensagens automáticas de confirmação, lembrete e cancelamento estão ativas.
                        </p>
                        <button
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            style={{ background: 'linear-gradient(90deg,#e74c3c,#ff7675)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: disconnecting ? 0.7 : 1 }}
                        >
                            {disconnecting ? 'Desconectando...' : 'Desconectar'}
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 13, color: '#aaa', marginBottom: 16 }}>
                            Escaneie o QR Code com o WhatsApp do celular que servirá de ponte.
                            <br />
                            <span style={{ color: '#888', fontSize: 12 }}>Atualizando automaticamente a cada 20 segundos.</span>
                        </p>
                        {qrcode ? (
                            <div style={{ display: 'inline-block', padding: 10, background: '#fff', borderRadius: 12, marginBottom: 16 }}>
                                <img
                                    src={qrcode.startsWith('data:') ? qrcode : `data:image/png;base64,${qrcode}`}
                                    alt="QR Code WhatsApp"
                                    style={{ width: 220, height: 220, display: 'block' }}
                                />
                            </div>
                        ) : (
                            <div style={{ padding: '24px 0', color: '#888', fontSize: 14 }}>
                                QR Code não disponível. Clique em atualizar.
                            </div>
                        )}
                        <button
                            onClick={refresh}
                            style={{ background: 'none', border: '1.5px solid #444', color: '#aaa', borderRadius: 8, padding: '7px 18px', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                            <FiRefreshCw size={14} /> Atualizar
                        </button>
                    </div>
                )}

                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    );
}
