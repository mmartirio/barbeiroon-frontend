import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GestorLayout, { gestorApi } from '../GestorLayout';
import EmpresasForm from './EmpresasForm';

const PLAN_BADGE  = { free: 'sa-badge-yellow', basic: 'sa-badge-blue', premium: 'sa-badge-purple', enterprise: 'sa-badge-green' };
const PLAN_LABEL  = { free: 'Free', basic: 'Basic', premium: 'Premium', enterprise: 'Enterprise' };

export default function EmpresasList() {
    const [tenants, setTenants] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [page, setPage] = useState(1);
    const [modal, setModal] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const navigate = useNavigate();
    const limit = 15;

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page, limit,
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
                ...(planFilter && { planType: planFilter }),
            });
            const r = await gestorApi(`/tenants?${params}`);
            if (r.status === 401) { localStorage.removeItem('gestor_token'); navigate('/gestor'); return; }
            const d = await r.json();
            setTenants(d.tenants || []);
            setTotal(d.total || 0);
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter, planFilter, navigate]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Excluir a empresa "${name}"? Esta ação é irreversível.`)) return;
        setDeleting(id);
        try {
            const r = await gestorApi(`/tenants/${id}`, { method: 'DELETE' });
            const d = await r.json();
            if (r.ok) { setMsg({ type: 'success', text: d.message }); load(); }
            else setMsg({ type: 'error', text: d.message });
        } finally { setDeleting(null); }
    };

    const totalPages = Math.ceil(total / limit);
    const fmt = d => new Date(d).toLocaleDateString('pt-BR');

    return (
        <GestorLayout title="Empresas">
            {msg.text && (
                <div className={msg.type === 'success' ? 'sa-success-msg' : 'sa-error-msg'}
                    onClick={() => setMsg({ type: '', text: '' })}>
                    {msg.text}
                </div>
            )}

            <div className="sa-search-row">
                <input className="sa-input" placeholder="Buscar por nome, email ou CNPJ..."
                    value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ maxWidth: 300 }} />
                <select className="sa-input" value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ maxWidth: 160 }}>
                    <option value="">Todos os status</option>
                    <option value="active">Ativas</option>
                    <option value="inactive">Inativas</option>
                </select>
                <select className="sa-input" value={planFilter}
                    onChange={e => { setPlanFilter(e.target.value); setPage(1); }} style={{ maxWidth: 160 }}>
                    <option value="">Todos os planos</option>
                    <option value="free">Free</option>
                    <option value="basic">Basic</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                </select>
                <button className="sa-btn sa-btn-primary" onClick={() => setModal('create')}>+ Nova Empresa</button>
            </div>

            <div style={{ marginBottom: 12, fontSize: 13, color: '#64748b' }}>
                {total} empresa{total !== 1 ? 's' : ''} encontrada{total !== 1 ? 's' : ''}
            </div>

            <div className="sa-card" style={{ padding: 0 }}>
                <div className="sa-table-wrap">
                    <table className="sa-table">
                        <thead>
                            <tr>
                                <th>Empresa</th>
                                <th>Contato</th>
                                <th>Proprietário</th>
                                <th>Plano</th>
                                <th>Status</th>
                                <th>Cadastro</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={7} className="sa-loading">Carregando...</td></tr>}
                            {!loading && tenants.map(t => (
                                <tr key={t.id}>
                                    <td>
                                        <div style={{ fontWeight: 600, color: '#f8fafc' }}>{t.name}</div>
                                        <div style={{ fontSize: 11, color: '#64748b' }}>{t.slug}</div>
                                        {t.cnpj && <div style={{ fontSize: 11, color: '#475569' }}>{t.cnpj}</div>}
                                    </td>
                                    <td>
                                        <div>{t.email}</div>
                                        {t.phone && <div style={{ fontSize: 12, color: '#64748b' }}>{t.phone}</div>}
                                    </td>
                                    <td>
                                        <div>{t.ownerName || '—'}</div>
                                        {t.ownerPhone && <div style={{ fontSize: 11, color: '#64748b' }}>{t.ownerPhone}</div>}
                                    </td>
                                    <td>
                                        {t.plan ? (
                                            <div>
                                                <span className="sa-badge sa-badge-purple">{t.plan.name}</span>
                                                {!t.plan.isActive && (
                                                    <div style={{ fontSize: 10, color: '#f87171', marginTop: 2 }}>plano inativo</div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className={`sa-badge ${PLAN_BADGE[t.planType] || 'sa-badge-blue'}`}>
                                                {PLAN_LABEL[t.planType] || t.planType}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`sa-badge ${t.isActive ? 'sa-badge-green' : 'sa-badge-red'}`}>
                                            {t.isActive ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </td>
                                    <td>{fmt(t.createdAt)}</td>
                                    <td>
                                        <div className="sa-actions">
                                            <button className="sa-btn sa-btn-ghost" onClick={() => setModal(t)}>✏️</button>
                                            <button className="sa-btn sa-btn-danger" disabled={deleting === t.id}
                                                onClick={() => handleDelete(t.id, t.name)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && !tenants.length && (
                                <tr><td colSpan={7} className="sa-empty">Nenhuma empresa encontrada.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '16px' }}>
                        <button className="sa-btn sa-btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
                        <span style={{ padding: '8px 12px', color: '#94a3b8', fontSize: 13 }}>{page} / {totalPages}</span>
                        <button className="sa-btn sa-btn-ghost" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Próximo →</button>
                    </div>
                )}
            </div>

            {modal !== null && (
                <EmpresasForm
                    tenant={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => {
                        setModal(null); load();
                        setMsg({ type: 'success', text: modal === 'create' ? 'Empresa criada!' : 'Empresa atualizada!' });
                    }}
                />
            )}
        </GestorLayout>
    );
}
