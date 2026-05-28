import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw } from 'react-icons/fi';
import { useGestorAuth } from '../../context/GestorAuthContext';

const fmtDate = (v) => { if (!v) return '—'; const [y, m, d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };
const errStyle = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 };
const PLAN_TYPES = ['free', 'basic', 'premium', 'enterprise'];
const TH = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const TD = { padding: '10px 14px', verticalAlign: 'middle', fontSize: '0.84rem' };
const EMPTY = { name: '', companyName: '', cnpj: '', slug: '', email: '', phone: '', address: '', neighborhood: '', city: '', state: '', zipCode: '', ownerName: '', ownerEmail: '', ownerPhone: '', planType: 'free', planId: '', isActive: true };

function Modal({ title, onClose, children }) {
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, overflowY: 'auto' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '24px 28px', width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{title}</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1 }}>×</button>
                </div>
                {children}
            </div>
        </div>
    );
}

function Field({ label, children }) {
    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            {children}
        </div>
    );
}

export default function GestorCompanies() {
    const { authFetch } = useGestorAuth();

    const api = useCallback(async (path, opts = {}) => {
        const res = await authFetch('/api/gestor' + path, opts);
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || 'Erro na requisição');
        return json;
    }, [authFetch]);

    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [editId, setEditId] = useState(null);
    const [delTarget, setDelTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const LIMIT = 15;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page, limit: LIMIT });
            if (search) p.set('search', search);
            if (statusFilter) p.set('status', statusFilter);
            if (planFilter) p.set('planType', planFilter);
            const d = await api(`/tenants?${p}`);
            setTenants(d.tenants || []);
            setTotal(d.total || 0);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    }, [api, page, search, statusFilter, planFilter]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { api('/plans').then(d => setPlans(d.plans || [])).catch(() => {}); }, [api]);

    const openCreate = () => { setForm(EMPTY); setEditId(null); setError(''); setModal('form'); };
    const openEdit = (t) => {
        setForm({ name: t.name || '', companyName: t.companyName || '', cnpj: t.cnpj || '', slug: t.slug || '', email: t.email || '', phone: t.phone || '', address: t.address || '', neighborhood: t.neighborhood || '', city: t.city || '', state: t.state || '', zipCode: t.zipCode || '', ownerName: t.ownerName || '', ownerEmail: t.ownerEmail || '', ownerPhone: t.ownerPhone || '', planType: t.planType || 'free', planId: t.planId || '', isActive: t.isActive });
        setEditId(t.id); setError(''); setModal('form');
    };
    const closeModal = () => { setModal(null); setError(''); };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            const payload = { ...form, planId: form.planId || null };
            if (editId) await api(`/tenants/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
            else await api('/tenants', { method: 'POST', body: JSON.stringify(payload) });
            closeModal(); load();
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        setSaving(true);
        try { await api(`/tenants/${delTarget.id}`, { method: 'DELETE' }); closeModal(); load(); }
        catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const inp = (f) => ({ value: form[f], onChange: e => setForm(p => ({ ...p, [f]: e.target.value })) });
    const totalPages = Math.ceil(total / LIMIT);
    const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Empresas</h2>
                <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiPlus size={14} /> Nova Empresa</button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <FiSearch size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                    <input className="form-input" placeholder="Nome, email, CNPJ..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 30 }} />
                </div>
                <select className="form-input" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
                    <option value="">Status</option>
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa</option>
                </select>
                <select className="form-input" value={planFilter} onChange={e => { setPlanFilter(e.target.value); setPage(1); }} style={{ width: 130 }}>
                    <option value="">Plano</option>
                    {PLAN_TYPES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
                <button className="btn" onClick={load} style={{ padding: '0 12px' }}><FiRefreshCw size={14} /></button>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
                            <th style={TH}>Nome / Slug</th>
                            <th style={TH}>Email</th>
                            <th style={TH}>Plano</th>
                            <th style={TH}>Status</th>
                            <th style={TH}>Cadastro</th>
                            <th style={{ ...TH, textAlign: 'right' }}>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--color-muted)' }}>Carregando...</td></tr>
                        ) : tenants.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--color-muted)' }}>Nenhuma empresa encontrada.</td></tr>
                        ) : tenants.map(t => (
                            <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={TD}><div style={{ fontWeight: 600 }}>{t.name}</div><div style={{ color: 'var(--color-muted)', fontSize: '0.73rem' }}>/{t.slug}</div></td>
                                <td style={TD}>{t.email}</td>
                                <td style={TD}><span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(37,99,235,0.15)', color: '#60a5fa', fontSize: '0.73rem' }}>{t.plan?.name || t.planType}</span></td>
                                <td style={TD}><span style={{ padding: '2px 8px', borderRadius: 4, fontSize: '0.73rem', background: t.isActive ? 'rgba(22,163,74,0.15)' : 'rgba(220,38,38,0.15)', color: t.isActive ? '#4ade80' : '#f87171' }}>{t.isActive ? 'Ativa' : 'Inativa'}</span></td>
                                <td style={TD}>{fmtDate(t.createdAt)}</td>
                                <td style={{ ...TD, textAlign: 'right' }}>
                                    <button className="btn" onClick={() => openEdit(t)} style={{ padding: '4px 8px', marginRight: 6 }}><FiEdit2 size={13} /></button>
                                    <button className="btn" onClick={() => { setDelTarget(t); setError(''); setModal('delete'); }} style={{ padding: '4px 8px', color: '#f87171' }}><FiTrash2 size={13} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 14 }}>
                    <button className="btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
                    <span style={{ fontSize: '0.84rem', color: 'var(--color-muted)' }}>{page} / {totalPages} ({total} registros)</span>
                    <button className="btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
                </div>
            )}

            {modal === 'form' && (
                <Modal title={editId ? 'Editar Empresa' : 'Nova Empresa'} onClose={closeModal}>
                    <form onSubmit={handleSave}>
                        {error && <div style={errStyle}>{error}</div>}
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dados da Empresa</p>
                        <div style={g2}>
                            <Field label="Nome *"><input className="form-input" {...inp('name')} required /></Field>
                            <Field label="Razão Social"><input className="form-input" {...inp('companyName')} /></Field>
                            <Field label="CNPJ"><input className="form-input" {...inp('cnpj')} placeholder="00.000.000/0000-00" /></Field>
                            <Field label="Slug *"><input className="form-input" {...inp('slug')} required placeholder="minha-barbearia" /></Field>
                            <Field label="Email *"><input className="form-input" type="email" {...inp('email')} required /></Field>
                            <Field label="Telefone"><input className="form-input" {...inp('phone')} /></Field>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', margin: '14px 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endereço</p>
                        <div style={g2}>
                            <Field label="Endereço"><input className="form-input" {...inp('address')} /></Field>
                            <Field label="Bairro"><input className="form-input" {...inp('neighborhood')} /></Field>
                            <Field label="Cidade"><input className="form-input" {...inp('city')} /></Field>
                            <Field label="UF"><input className="form-input" {...inp('state')} maxLength={2} placeholder="SP" /></Field>
                            <Field label="CEP"><input className="form-input" {...inp('zipCode')} /></Field>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', margin: '14px 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Proprietário</p>
                        <div style={g2}>
                            <Field label="Nome"><input className="form-input" {...inp('ownerName')} /></Field>
                            <Field label="Email"><input className="form-input" type="email" {...inp('ownerEmail')} /></Field>
                            <Field label="Telefone"><input className="form-input" {...inp('ownerPhone')} /></Field>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', margin: '14px 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plano</p>
                        <div style={g2}>
                            <Field label="Tipo de Plano">
                                <select className="form-input" {...inp('planType')}>
                                    {PLAN_TYPES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                                </select>
                            </Field>
                            <Field label="Plano vinculado">
                                <select className="form-input" value={form.planId} onChange={e => setForm(p => ({ ...p, planId: e.target.value }))}>
                                    <option value="">Nenhum</option>
                                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </Field>
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', marginTop: 10, cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} />
                            Empresa ativa
                        </label>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                            <button type="button" className="btn" onClick={closeModal}>Cancelar</button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal === 'delete' && (
                <Modal title="Excluir Empresa" onClose={closeModal}>
                    {error && <div style={errStyle}>{error}</div>}
                    <p style={{ marginBottom: 20, color: 'var(--color-muted)' }}>Excluir <strong style={{ color: 'var(--color)' }}>{delTarget?.name}</strong>? Esta ação não pode ser desfeita.</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn" onClick={closeModal}>Cancelar</button>
                        <button className="btn" onClick={handleDelete} disabled={saving} style={{ background: '#dc2626', color: '#fff', border: 'none' }}>{saving ? 'Excluindo...' : 'Excluir'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
