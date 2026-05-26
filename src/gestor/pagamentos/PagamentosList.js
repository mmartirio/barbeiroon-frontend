import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GestorLayout, { gestorApi } from '../GestorLayout';
import PagamentosForm from './PagamentosForm';

const TYPE_BADGE = { pix: 'sa-badge-green', boleto: 'sa-badge-blue' };
const TYPE_ICON  = { pix: '⚡', boleto: '📄' };

export default function PagamentosList() {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await gestorApi('/payment-methods');
            if (r.status === 401) { localStorage.removeItem('gestor_token'); navigate('/gestor'); return; }
            const d = await r.json();
            setMethods(d.paymentMethods || []);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id, label) => {
        if (!window.confirm(`Excluir a forma de pagamento "${label}"?`)) return;
        setDeleting(id);
        try {
            const r = await gestorApi(`/payment-methods/${id}`, { method: 'DELETE' });
            const d = await r.json();
            if (r.ok) { setMsg({ type: 'success', text: d.message }); load(); }
            else setMsg({ type: 'error', text: d.message });
        } finally { setDeleting(null); }
    };

    const configSummary = (method) => {
        if (method.type === 'pix') {
            const cfg = method.config || {};
            return cfg.pixKeyType ? `${cfg.pixKeyType}: ${cfg.pixKey || ''}` : cfg.pixKey || '—';
        }
        if (method.type === 'boleto') {
            const cfg = method.config || {};
            const bank = cfg.bank ? cfg.bank.toUpperCase() : '';
            const days = cfg.dueDays ? `Vence em ${cfg.dueDays} dias` : '';
            return [bank, days].filter(Boolean).join(' · ') || '—';
        }
        return '—';
    };

    return (
        <GestorLayout title="Formas de Pagamento">
            {msg.text && (
                <div className={msg.type === 'success' ? 'sa-success-msg' : 'sa-error-msg'}
                    onClick={() => setMsg({ type: '', text: '' })}>
                    {msg.text}
                </div>
            )}

            <div className="sa-search-row">
                <button className="sa-btn sa-btn-primary" onClick={() => setModal('create')}>+ Nova Forma de Pagamento</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {loading && <div className="sa-loading">Carregando...</div>}
                {!loading && methods.map(m => (
                    <div key={m.id} className="sa-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: 12, background: '#0f172a',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                                }}>
                                    {TYPE_ICON[m.type] || '💳'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15 }}>{m.label}</div>
                                    <span className={`sa-badge ${TYPE_BADGE[m.type] || 'sa-badge-blue'}`} style={{ marginTop: 4 }}>
                                        {m.type?.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="sa-actions">
                                <button className="sa-btn sa-btn-ghost" onClick={() => setModal(m)}>✏️</button>
                                <button className="sa-btn sa-btn-danger" disabled={deleting === m.id}
                                    onClick={() => handleDelete(m.id, m.label)}>🗑️</button>
                            </div>
                        </div>

                        <div style={{ background: '#0f172a', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>
                                {m.type === 'pix' ? 'Chave PIX' : 'Configuração'}
                            </div>
                            <div style={{ fontSize: 13, color: '#94a3b8' }}>{configSummary(m)}</div>
                            {m.type === 'pix' && m.config?.beneficiaryName && (
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                                    Favorecido: {m.config.beneficiaryName}
                                </div>
                            )}
                            {m.type === 'boleto' && m.config?.instructions && (
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>
                                    {m.config.instructions.substring(0, 80)}{m.config.instructions.length > 80 ? '...' : ''}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className={`sa-badge ${m.isActive ? 'sa-badge-green' : 'sa-badge-red'}`}>
                                {m.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                            <span style={{ fontSize: 11, color: '#475569' }}>ID #{m.id}</span>
                        </div>
                    </div>
                ))}
                {!loading && !methods.length && (
                    <div className="sa-card" style={{ textAlign: 'center', gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
                        <p style={{ color: '#64748b', margin: 0 }}>Nenhuma forma de pagamento cadastrada.</p>
                        <p style={{ color: '#475569', fontSize: 12, marginTop: 8 }}>
                            Clique em "+ Nova Forma de Pagamento" para começar.
                        </p>
                    </div>
                )}
            </div>

            {modal !== null && (
                <PagamentosForm
                    method={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => {
                        setModal(null); load();
                        setMsg({ type: 'success', text: modal === 'create' ? 'Forma de pagamento criada!' : 'Forma de pagamento atualizada!' });
                    }}
                />
            )}
        </GestorLayout>
    );
}
