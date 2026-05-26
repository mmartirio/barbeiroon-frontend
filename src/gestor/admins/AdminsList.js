import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import GestorLayout, { gestorApi } from '../GestorLayout';

function AdminForm({ admin, onClose, onSaved }) {
    const isEdit = !!admin;
    const [form, setForm] = useState({
        name: admin?.name || '',
        email: admin?.email || '',
        password: '',
        confirm: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!isEdit && (!form.name || !form.email || !form.password)) {
            setError('Preencha todos os campos.'); return;
        }
        if (form.password && form.password.length < 6) {
            setError('Senha deve ter pelo menos 6 caracteres.'); return;
        }
        if (form.password && form.password !== form.confirm) {
            setError('As senhas não coincidem.'); return;
        }
        setLoading(true);
        try {
            const body = { name: form.name, email: form.email };
            if (form.password) body.password = form.password;
            const r = await gestorApi(isEdit ? `/admin-users/${admin.id}` : '/admin-users', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body),
            });
            const d = await r.json();
            if (!r.ok) { setError(d.message || 'Erro ao salvar.'); return; }
            onSaved();
        } catch {
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="sa-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="sa-modal" style={{ maxWidth: 480 }}>
                <div className="sa-modal-header">
                    <h2 className="sa-modal-title">{isEdit ? 'Editar Administrador' : 'Novo Administrador'}</h2>
                    <button className="sa-modal-close" onClick={onClose}>×</button>
                </div>
                {error && <div className="sa-error-msg">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="sa-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="sa-field-group">
                            <label>Nome completo</label>
                            <input className="sa-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome do administrador" />
                        </div>
                        <div className="sa-field-group">
                            <label>Email</label>
                            <input className="sa-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemplo.com" />
                        </div>
                        <div className="sa-field-group">
                            <label>{isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha'}</label>
                            <input className="sa-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" />
                        </div>
                        <div className="sa-field-group">
                            <label>Confirmar senha</label>
                            <input className="sa-input" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} placeholder="Repita a senha" />
                        </div>
                    </div>
                    <div className="sa-modal-footer">
                        <button type="button" className="sa-btn sa-btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="sa-btn sa-btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Administrador')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function AdminsList() {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const r = await gestorApi('/admin-users');
            if (r.status === 401) { localStorage.removeItem('gestor_token'); navigate('/gestor'); return; }
            const d = await r.json();
            setAdmins(d.admins || []);
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => { load(); }, [load]);

    const toggleActive = async (admin) => {
        const action = admin.isActive ? 'desativar' : 'ativar';
        if (!window.confirm(`Deseja ${action} o administrador "${admin.name}"?`)) return;
        try {
            const r = await gestorApi(`/admin-users/${admin.id}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: !admin.isActive }),
            });
            const d = await r.json();
            if (r.ok) { load(); setMsg({ type: 'success', text: `Administrador ${admin.isActive ? 'desativado' : 'ativado'} com sucesso.` }); }
            else setMsg({ type: 'error', text: d.message });
        } catch {
            setMsg({ type: 'error', text: 'Erro de conexão.' });
        }
    };

    const handleDelete = async (admin) => {
        if (!window.confirm(`Excluir o administrador "${admin.name}"? Esta ação é irreversível.`)) return;
        try {
            const r = await gestorApi(`/admin-users/${admin.id}`, { method: 'DELETE' });
            const d = await r.json();
            if (r.ok) { load(); setMsg({ type: 'success', text: d.message }); }
            else setMsg({ type: 'error', text: d.message });
        } catch {
            setMsg({ type: 'error', text: 'Erro de conexão.' });
        }
    };

    const fmt = d => new Date(d).toLocaleDateString('pt-BR');

    return (
        <GestorLayout title="Administradores">
            {msg.text && (
                <div className={msg.type === 'success' ? 'sa-success-msg' : 'sa-error-msg'}
                    onClick={() => setMsg({ type: '', text: '' })}>
                    {msg.text}
                </div>
            )}

            <div className="sa-search-row">
                <button className="sa-btn sa-btn-primary" onClick={() => setModal('create')}>+ Novo Administrador</button>
            </div>

            <div className="sa-card" style={{ padding: 0 }}>
                <div className="sa-table-wrap">
                    <table className="sa-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Tipo</th>
                                <th>Status</th>
                                <th>Criado em</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan={6} className="sa-loading">Carregando...</td></tr>}
                            {!loading && admins.map(a => (
                                <tr key={a.id}>
                                    <td style={{ fontWeight: 600, color: '#f8fafc' }}>{a.name}</td>
                                    <td>{a.email}</td>
                                    <td>
                                        {a.isBootstrap
                                            ? <span className="sa-badge sa-badge-yellow">Bootstrap</span>
                                            : <span className="sa-badge sa-badge-blue">Admin</span>
                                        }
                                    </td>
                                    <td>
                                        <span className={`sa-badge ${a.isActive ? 'sa-badge-green' : 'sa-badge-red'}`}>
                                            {a.isActive ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>{fmt(a.createdAt)}</td>
                                    <td>
                                        <div className="sa-actions">
                                            {!a.isBootstrap && (
                                                <button className="sa-btn sa-btn-ghost" onClick={() => setModal(a)}>✏️</button>
                                            )}
                                            <button
                                                className={`sa-btn ${a.isActive ? 'sa-btn-danger' : 'sa-btn-success'}`}
                                                onClick={() => toggleActive(a)}
                                                style={{ fontSize: 12 }}
                                            >
                                                {a.isActive ? 'Desativar' : 'Ativar'}
                                            </button>
                                            {!a.isBootstrap && (
                                                <button className="sa-btn sa-btn-danger" onClick={() => handleDelete(a)}>🗑️</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && !admins.length && (
                                <tr><td colSpan={6} className="sa-empty">Nenhum administrador encontrado.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {modal !== null && (
                <AdminForm
                    admin={modal === 'create' ? null : modal}
                    onClose={() => setModal(null)}
                    onSaved={() => {
                        setModal(null); load();
                        setMsg({ type: 'success', text: modal === 'create' ? 'Administrador criado!' : 'Administrador atualizado!' });
                    }}
                />
            )}
        </GestorLayout>
    );
}
