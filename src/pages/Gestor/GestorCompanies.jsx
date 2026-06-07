import React, { useState, useEffect, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw, FiKey } from 'react-icons/fi';
import { useGestorAuth } from '../../context/GestorAuthContext';

const fmtDate = (v) => { if (!v) return '—'; const [y, m, d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };
const toSlug = (v) => (v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const errStyle = { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '10px 14px', borderRadius: 8, fontSize: '0.84rem', marginBottom: 14 };
const TH ={ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' };
const TD = { padding: '10px 14px', verticalAlign: 'middle', fontSize: '0.84rem' };
const EMPTY = { name: '', companyName: '', cnpj: '', slug: '', email: '', phone: '', address: '', neighborhood: '', city: '', state: '', zipCode: '', ownerName: '', ownerEmail: '', ownerPhone: '', planId: '', isActive: true, ownerIsBarber: true };

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
    const [planFilter] = useState('');
    const [modal, setModal] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [editId, setEditId] = useState(null);
    const [delTarget, setDelTarget] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [bootstrapCreds, setBootstrapCreds] = useState(null);
    const [slugEdited, setSlugEdited] = useState(false);
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

    const openCreate = () => {
        const defaultPlan = plans.find(p => p.isDefault);
        setForm({ ...EMPTY, planId: defaultPlan?.id ? String(defaultPlan.id) : '' });
        setEditId(null); setError(''); setSlugEdited(false); setModal('form');
    };
    const openEdit = (t) => {
        setForm({ name: t.name || '', companyName: t.companyName || '', cnpj: t.cnpj || '', slug: t.slug || '', email: t.email || '', phone: t.phone || '', address: t.address || '', neighborhood: t.neighborhood || '', city: t.city || '', state: t.state || '', zipCode: t.zipCode || '', ownerName: t.ownerName || '', ownerEmail: t.ownerEmail || '', ownerPhone: t.ownerPhone || '', planId: t.planId ? String(t.planId) : '', isActive: t.isActive, ownerIsBarber: t.ownerIsBarber ?? true });
        setEditId(t.id); setError(''); setSlugEdited(true); setModal('form');
    };
    const closeModal = () => { setModal(null); setError(''); };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true); setError('');
        try {
            const payload = { ...form, planId: form.planId || null };
            if (editId) {
                await api(`/tenants/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
                closeModal();
            } else {
                const result = await api('/tenants', { method: 'POST', body: JSON.stringify(payload) });
                setBootstrapCreds(result.bootstrapCredentials || null);
                setModal('bootstrap');
            }
            load();
        } catch (e) { setError(e.message); }
        finally { setSaving(false); }
    };

    const handleBootstrap = async (t) => {
        setError('');
        try {
            const result = await api(`/tenants/${t.id}/bootstrap`, { method: 'POST' });
            const creds = result.bootstrapCredentials || result;
            if (!creds?.email) throw new Error('Resposta inválida do servidor.');
            setBootstrapCreds(creds);
            setModal('bootstrap');
        } catch (e) { setError(e.message); }
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
            {error && !modal && <div style={{ ...errStyle, marginBottom: 16 }} onClick={() => setError('')}>{error} <span style={{ float: 'right', cursor: 'pointer' }}>×</span></div>}
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
                                    <button className="btn" onClick={() => openEdit(t)} style={{ padding: '4px 8px', marginRight: 4 }} title="Editar"><FiEdit2 size={13} /></button>
                                    <button className="btn" onClick={() => handleBootstrap(t)} style={{ padding: '4px 8px', marginRight: 4, color: '#facc15' }} title="Gerar acesso bootstrap"><FiKey size={13} /></button>
                                    <button className="btn" onClick={() => { setDelTarget(t); setError(''); setModal('delete'); }} style={{ padding: '4px 8px', color: '#f87171' }} title="Excluir"><FiTrash2 size={13} /></button>
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
                            <Field label="Nome *"><input className="form-input" value={form.name} onChange={e => { const name = e.target.value; setForm(p => ({ ...p, name, ...(!slugEdited && { slug: toSlug(name) }) })); }} required /></Field>
                            <Field label="Razão Social"><input className="form-input" {...inp('companyName')} /></Field>
                            <Field label="CNPJ"><input className="form-input" {...inp('cnpj')} placeholder="00.000.000/0000-00" /></Field>
                            <Field label="Slug *"><input className="form-input" value={form.slug} onChange={e => { setSlugEdited(true); setForm(p => ({ ...p, slug: e.target.value })); }} required placeholder="minha-barbearia" /></Field>
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
                        <div style={{ marginTop: 10, padding: '12px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                                <input type="checkbox" checked={form.ownerIsBarber} onChange={e => setForm(p => ({ ...p, ownerIsBarber: e.target.checked }))} />
                                Proprietário é barbeiro / profissional
                            </label>
                            <p style={{ margin: '6px 0 0', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                                Se marcado, o proprietário aparecerá na lista de profissionais disponíveis para agendamento pelos clientes.
                            </p>
                        </div>
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', margin: '14px 0 10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plano</p>
                        <Field label="Plano vinculado">
                            <select className="form-input" value={form.planId} onChange={e => setForm(p => ({ ...p, planId: e.target.value }))}>
                                <option value="">— Selecione um plano —</option>
                                {plans.filter(p => p.isActive).map(p => (
                                    <option key={p.id} value={String(p.id)}>
                                        {p.name}{p.isDefault ? ' (padrão)' : ''}
                                    </option>
                                ))}
                            </select>
                        </Field>
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

            {modal === 'bootstrap' && bootstrapCreds && (
                <Modal title="Credenciais de acesso bootstrap" onClose={() => { setModal(null); setBootstrapCreds(null); }}>
                    <p style={{ marginBottom: 16, color: 'var(--color-muted)', fontSize: '0.88rem' }}>
                        Compartilhe as credenciais de acesso inicial com o administrador da empresa. No primeiro acesso, ele deverá criar um usuário próprio.
                    </p>
                    <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</span>
                            <strong style={{ fontSize: '0.9rem' }}>{bootstrapCreds.email}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</span>
                            <strong style={{ fontSize: '0.9rem', fontFamily: 'monospace' }}>{bootstrapCreds.password}</strong>
                        </div>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#f59e0b', marginBottom: 20 }}>
                        Anote estas credenciais agora. Elas não serão exibidas novamente.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={() => { setModal(null); setBootstrapCreds(null); }}>Entendido</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
