import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiTrash2, FiRefreshCw, FiCheckCircle, FiXCircle, FiCopy, FiSave, FiKey } from 'react-icons/fi';

const errStyle  = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 };
const infoStyle = { background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', color: '#93c5fd', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 };

const STATUS_COLOR = {
    PENDING:   { bg: 'rgba(245,158,11,0.15)',  color: '#fbbf24' },
    PAID:      { bg: 'rgba(22,163,74,0.15)',   color: '#4ade80' },
    CANCELLED: { bg: 'rgba(220,38,38,0.15)',   color: '#f87171' },
};
const STATUS_LABEL = { PENDING: 'Pendente', PAID: 'Pago', CANCELLED: 'Cancelado' };

const PLAN_LABEL = { monthly: 'Mensal', annual: 'Anual' };

const KEY_TYPE_OPTS = [
    { value: 'cpf',    label: 'CPF' },
    { value: 'cnpj',   label: 'CNPJ' },
    { value: 'email',  label: 'E-mail' },
    { value: 'phone',  label: 'Telefone' },
    { value: 'random', label: 'Chave Aleatória' },
];

function Badge({ status }) {
    const s = STATUS_COLOR[status] || STATUS_COLOR.PENDING;
    return (
        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, background: s.bg, color: s.color, fontWeight: 600 }}>
            {STATUS_LABEL[status] || status}
        </span>
    );
}

function Modal({ title, onClose, children, wide }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', width: '100%', maxWidth: wide ? 560 : 440, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
}

function fmtMoney(cents) {
    if (cents == null) return '—';
    return (Number(cents) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');
}

// ─── Tab: Chave PIX ───────────────────────────────────────────────────────────

function PixConfigTab({ api }) {
    const [form, setForm]     = useState({ keyType: 'cpf', keyValue: '', ownerName: '', city: '', bankName: '' });
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        try {
            const d = await api('/pix/config');
            if (d) setForm({ keyType: d.keyType || 'cpf', keyValue: d.keyValue || '', ownerName: d.ownerName || '', city: d.city || '', bankName: d.bankName || '' });
        } catch { /* sem config ainda */ }
        setLoaded(true);
    }, [api]);

    useEffect(() => { load(); }, [load]);

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true); setError(''); setSuccess('');
        try {
            await api('/pix/config', { method: 'PUT', body: JSON.stringify(form) });
            setSuccess('Configuração salva com sucesso!');
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    if (!loaded) return <p style={{ color: 'var(--color-muted)' }}>Carregando...</p>;

    return (
        <div style={{ maxWidth: 520 }}>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.6 }}>
                Configure sua chave PIX. O sistema irá gerar um <strong>Pix Copia e Cola</strong> automaticamente em cada cobrança, sem depender de APIs externas.
            </p>

            {error   && <div style={errStyle}>{error}</div>}
            {success && <div style={{ ...infoStyle, borderColor: 'rgba(22,163,74,0.4)', color: '#4ade80', background: 'rgba(22,163,74,0.1)' }}>{success}</div>}

            <form onSubmit={handleSave}>
                <div className="form-group">
                    <label className="form-label">Tipo de chave *</label>
                    <select className="form-input" value={form.keyType} onChange={e => setForm(p => ({ ...p, keyType: e.target.value }))}>
                        {KEY_TYPE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Chave PIX *</label>
                    <input className="form-input" value={form.keyValue} onChange={e => setForm(p => ({ ...p, keyValue: e.target.value }))}
                        required placeholder={
                            form.keyType === 'cpf'    ? '000.000.000-00' :
                            form.keyType === 'cnpj'   ? '00.000.000/0000-00' :
                            form.keyType === 'email'  ? 'seu@email.com' :
                            form.keyType === 'phone'  ? '+55 11 99999-9999' :
                            'Chave aleatória (UUID)'
                        }
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Nome do titular * <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>máx. 25 caracteres</span></label>
                    <input className="form-input" value={form.ownerName} onChange={e => setForm(p => ({ ...p, ownerName: e.target.value }))}
                        required maxLength={25} placeholder="Ex: Barbeiroon Servicos" />
                    <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>{form.ownerName.length}/25 — aparece no app do cliente ao pagar</span>
                </div>

                <div className="form-group">
                    <label className="form-label">Cidade * <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>máx. 15 caracteres</span></label>
                    <input className="form-input" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                        required maxLength={15} placeholder="Ex: Sao Paulo" />
                </div>

                <div className="form-group">
                    <label className="form-label">Banco (opcional, apenas para exibição)</label>
                    <input className="form-input" value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                        placeholder="Ex: Nubank, Itaú, BB" maxLength={100} />
                </div>

                <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                    <FiSave size={14} /> {saving ? 'Salvando...' : 'Salvar configuração'}
                </button>
            </form>
        </div>
    );
}

// ─── Tab: Cobranças PIX ───────────────────────────────────────────────────────

const EMPTY_INVOICE = { tenantId: '', planType: 'monthly', amountCents: '', dueDate: '', description: '', notes: '' };

function CobrancasTab({ api }) {
    const [invoices, setInvoices]   = useState([]);
    const [tenants, setTenants]     = useState([]);
    const [loading, setLoading]     = useState(false);
    const [filterTenant, setFilterTenant] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [error, setError]         = useState('');
    const [modal, setModal]         = useState(null);
    const [form, setForm]           = useState(EMPTY_INVOICE);
    const [saving, setSaving]       = useState(false);
    const [copied, setCopied]       = useState(null);
    const [hasPixConfig, setHasPixConfig] = useState(null);

    const checkPixConfig = useCallback(async () => {
        try { const d = await api('/pix/config'); setHasPixConfig(!!d); }
        catch { setHasPixConfig(false); }
    }, [api]);

    const loadTenants = useCallback(async () => {
        try { const d = await api('/tenants?limit=200'); setTenants(d.tenants || []); }
        catch { /* silencioso */ }
    }, [api]);

    const loadInvoices = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const q = new URLSearchParams();
            if (filterTenant) q.set('tenantId', filterTenant);
            if (filterStatus) q.set('status', filterStatus);
            const d = await api(`/pix/invoices?${q}`);
            setInvoices(d.invoices || []);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [api, filterTenant, filterStatus]);

    useEffect(() => { checkPixConfig(); loadTenants(); }, [checkPixConfig, loadTenants]);
    useEffect(() => { loadInvoices(); }, [loadInvoices]);

    const handleTenantSelect = (tenantId) => {
        const t = tenants.find(t => String(t.id) === String(tenantId));
        if (!t) { setForm(p => ({ ...p, tenantId })); return; }
        setForm(p => ({ ...p, tenantId }));
    };

    const openCreate = () => {
        if (!hasPixConfig) { alert('Configure a chave PIX primeiro na aba "Chave PIX".'); return; }
        setForm(EMPTY_INVOICE); setError(''); setModal('create');
    };
    const closeModal = () => { setModal(null); setError(''); setSaving(false); };

    const handleCreate = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            const amountCents = Math.round(Number(String(form.amountCents).replace(',', '.')) * 100);
            if (!amountCents || amountCents < 100) throw new Error('Valor mínimo é R$ 1,00.');
            const payload = {
                tenantId:    form.tenantId || undefined,
                planType:    form.planType,
                amountCents,
                dueDate:     form.dueDate,
                description: form.description || undefined,
                notes:       form.notes || undefined,
            };
            await api('/pix/invoices', { method: 'POST', body: JSON.stringify(payload) });
            closeModal(); loadInvoices();
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleMarkPaid = async (inv) => {
        if (!window.confirm(`Marcar cobrança de ${fmtMoney(inv.amountCents)} como PAGA?`)) return;
        try {
            await api(`/pix/invoices/${inv.id}/paid`, { method: 'PUT' });
            loadInvoices();
        } catch (e) { alert('Erro: ' + e.message); }
    };

    const handleCancel = async (inv) => {
        if (!window.confirm('Cancelar esta cobrança?')) return;
        try {
            await api(`/pix/invoices/${inv.id}`, { method: 'DELETE' });
            loadInvoices();
        } catch (e) { alert('Erro: ' + e.message); }
    };

    const handleCopy = (id, text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(id);
            setTimeout(() => setCopied(null), 2000);
        });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Cobranças via Pix Copia e Cola</span>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={loadInvoices} style={{ padding: '6px 10px' }}><FiRefreshCw size={13} /></button>
                    <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiPlus size={14} /> Nova Cobrança</button>
                </div>
            </div>

            {!hasPixConfig && (
                <div style={infoStyle}>
                    Configure sua chave PIX na aba <strong>Chave PIX</strong> antes de emitir cobranças.
                </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <select className="form-input" value={filterTenant} onChange={e => setFilterTenant(e.target.value)} style={{ flex: '1 1 180px', minWidth: 0 }}>
                    <option value="">Todas as empresas</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ flex: '0 0 150px' }}>
                    <option value="">Todos os status</option>
                    <option value="PENDING">Pendente</option>
                    <option value="PAID">Pago</option>
                    <option value="CANCELLED">Cancelado</option>
                </select>
            </div>

            {error && <div style={errStyle}>{error}</div>}
            {loading && <p style={{ color: 'var(--color-muted)' }}>Carregando...</p>}

            {!loading && invoices.length === 0 && (
                <p style={{ color: 'var(--color-muted)', textAlign: 'center', padding: 40 }}>Nenhuma cobrança encontrada.</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {invoices.map(inv => {
                    const canAction = inv.status === 'PENDING';
                    return (
                        <div key={inv.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <strong style={{ fontSize: '0.88rem' }}>{inv.customerName || inv.tenant?.name || `#${inv.id}`}</strong>
                                        {inv.tenant?.name && inv.customerName !== inv.tenant?.name && (
                                            <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>{inv.tenant.name}</span>
                                        )}
                                        <span style={{ fontSize: '0.72rem', padding: '1px 6px', borderRadius: 4, background: 'rgba(34,197,94,0.12)', color: '#86efac' }}>
                                            {PLAN_LABEL[inv.planType] || inv.planType}
                                        </span>
                                        <Badge status={inv.status} />
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--color-muted)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                                        <span><strong style={{ color: 'var(--color)' }}>{fmtMoney(inv.amountCents)}</strong></span>
                                        <span>Venc: {fmtDate(inv.dueDate)}</span>
                                        {inv.description && <span>{inv.description}</span>}
                                        {inv.paidAt && <span>Pago em: {new Date(inv.paidAt).toLocaleDateString('pt-BR')}</span>}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                    {canAction && (
                                        <>
                                            <button className="btn" onClick={() => handleMarkPaid(inv)} title="Marcar como pago" style={{ padding: '6px 10px', color: '#4ade80' }}>
                                                <FiCheckCircle size={13} />
                                            </button>
                                            <button className="btn" onClick={() => handleCancel(inv)} title="Cancelar" style={{ padding: '6px 10px', color: '#f87171' }}>
                                                <FiXCircle size={13} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {inv.pixEmv && (
                                <div style={{ marginTop: 10, padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                        <span style={{ fontSize: '0.72rem', color: '#86efac', fontWeight: 600 }}>⚡ Pix Copia e Cola</span>
                                        <button
                                            onClick={() => handleCopy(inv.id, inv.pixEmv)}
                                            style={{ background: 'none', border: 'none', color: copied === inv.id ? '#4ade80' : '#60a5fa', fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                        >
                                            <FiCopy size={11} /> {copied === inv.id ? 'Copiado!' : 'Copiar'}
                                        </button>
                                    </div>
                                    <code style={{ fontSize: '0.7rem', wordBreak: 'break-all', opacity: 0.75, display: 'block' }}>
                                        {inv.pixEmv.slice(0, 100)}…
                                    </code>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {modal === 'create' && (
                <Modal title="Nova Cobrança PIX" onClose={closeModal} wide>
                    <form onSubmit={handleCreate}>
                        {error && <div style={errStyle}>{error}</div>}

                        <div className="form-group">
                            <label className="form-label">Empresa</label>
                            <select className="form-input" value={form.tenantId} onChange={e => handleTenantSelect(e.target.value)}>
                                <option value="">Selecione a empresa...</option>
                                {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            {[{ v: 'monthly', l: 'Mensal' }, { v: 'annual', l: 'Anual' }].map(({ v, l }) => (
                                <button key={v} type="button" onClick={() => setForm(p => ({ ...p, planType: v }))}
                                    style={{ flex: 1, padding: '8px 0', border: '1px solid', borderRadius: 8, cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600,
                                        borderColor: form.planType === v ? '#3b82f6' : 'var(--border)',
                                        background:  form.planType === v ? 'rgba(59,130,246,0.12)' : 'transparent',
                                        color:       form.planType === v ? '#60a5fa' : 'var(--color-muted)',
                                    }}>
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                            <div className="form-group">
                                <label className="form-label">Valor (R$) *</label>
                                <input className="form-input" value={form.amountCents} onChange={e => setForm(p => ({ ...p, amountCents: e.target.value }))}
                                    required placeholder="99,90" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Vencimento *</label>
                                <input className="form-input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Descrição <span style={{ color: 'var(--color-muted)', fontWeight: 400 }}>(aparece no PIX)</span></label>
                                <input className="form-input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Ex: Plano mensal maio/2025" maxLength={40} />
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label className="form-label">Observações internas</label>
                                <textarea className="form-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    rows={2} placeholder="Notas internas, não aparece no PIX" style={{ resize: 'vertical' }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                            <button type="button" className="btn" onClick={closeModal}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Gerando...' : '⚡ Gerar Pix Copia e Cola'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function GestorBilling({ api }) {
    const [tab, setTab] = useState('cobrancas');

    const tabStyle = (key) => ({
        padding: '8px 18px',
        border: 'none',
        borderBottom: tab === key ? '2px solid var(--color-primary, #3b82f6)' : '2px solid transparent',
        background: 'none',
        color: tab === key ? 'var(--color-primary, #3b82f6)' : 'var(--color-muted)',
        fontWeight: tab === key ? 600 : 400,
        cursor: 'pointer',
        fontSize: '0.88rem',
        transition: 'color 0.15s',
    });

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Cobranças</h2>
            </div>

            <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
                <button style={tabStyle('cobrancas')} onClick={() => setTab('cobrancas')}>Cobranças</button>
                <button style={tabStyle('pix')}       onClick={() => setTab('pix')}><FiKey size={12} style={{ marginRight: 5 }} />Chave PIX</button>
            </div>

            {tab === 'cobrancas' && <CobrancasTab api={api} />}
            {tab === 'pix'       && <PixConfigTab api={api} />}
        </div>
    );
}
