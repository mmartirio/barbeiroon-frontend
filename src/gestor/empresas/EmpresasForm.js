import React, { useState, useEffect } from 'react';
import { gestorApi } from '../GestorLayout';

const EMPTY = {
    name: '', companyName: '', cnpj: '', slug: '', email: '', phone: '',
    address: '', neighborhood: '', city: '', state: '', zipCode: '',
    ownerName: '', ownerEmail: '', ownerPhone: '',
    planId: '', planType: 'free', isActive: true,
};

export default function EmpresasForm({ tenant, onClose, onSaved }) {
    const isEdit = !!tenant;
    const [form, setForm] = useState(tenant ? {
        name: tenant.name || '', companyName: tenant.companyName || '', cnpj: tenant.cnpj || '',
        slug: tenant.slug || '', email: tenant.email || '', phone: tenant.phone || '',
        address: tenant.address || '', neighborhood: tenant.neighborhood || '', city: tenant.city || '',
        state: tenant.state || '', zipCode: tenant.zipCode || '',
        ownerName: tenant.ownerName || '', ownerEmail: tenant.ownerEmail || '', ownerPhone: tenant.ownerPhone || '',
        planId: tenant.planId || '', planType: tenant.planType || 'free', isActive: tenant.isActive !== false,
    } : EMPTY);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        gestorApi('/plans').then(r => r.json()).then(d => setPlans(d.plans || [])).catch(() => {});
    }, []);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name) { setError('Nome fantasia é obrigatório.'); return; }
        if (!form.slug) { setError('Slug é obrigatório.'); return; }
        if (!form.email) { setError('Email é obrigatório.'); return; }
        setLoading(true);
        try {
            const r = await gestorApi(isEdit ? `/tenants/${tenant.id}` : '/tenants', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(form),
            });
            const d = await r.json();
            if (!r.ok) { setError(d.message || 'Erro ao salvar.'); return; }
            onSaved(d);
        } catch {
            setError('Erro de conexão.');
        } finally {
            setLoading(false);
        }
    };

    const Field = ({ label, field, type = 'text', placeholder, required }) => (
        <div className="sa-field-group">
            <label>{label}{required && ' *'}</label>
            <input className="sa-input" type={type} placeholder={placeholder} value={form[field]}
                onChange={e => set(field, e.target.value)} />
        </div>
    );

    return (
        <div className="sa-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="sa-modal">
                <div className="sa-modal-header">
                    <h2 className="sa-modal-title">{isEdit ? 'Editar Empresa' : 'Nova Empresa'}</h2>
                    <button className="sa-modal-close" onClick={onClose}>×</button>
                </div>

                {error && <div className="sa-error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>Dados da Empresa</p>
                    <div className="sa-form-grid">
                        <Field label="Nome Fantasia" field="name" placeholder="Barbearia do João" required />
                        <Field label="Razão Social" field="companyName" placeholder="João Barber LTDA" />
                        <Field label="CNPJ" field="cnpj" placeholder="00.000.000/0000-00" />
                        <Field label="Slug" field="slug" placeholder="joao-barber" required />
                        <Field label="Email" field="email" type="email" placeholder="contato@barbearia.com" required />
                        <Field label="Telefone" field="phone" placeholder="(11) 99999-9999" />
                    </div>

                    <p style={{ fontSize: 12, color: '#64748b', margin: '20px 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>Endereço</p>
                    <div className="sa-form-grid">
                        <Field label="Endereço" field="address" placeholder="Rua, número, complemento" />
                        <Field label="Bairro" field="neighborhood" placeholder="Centro" />
                        <Field label="Cidade" field="city" placeholder="São Paulo" />
                        <Field label="Estado" field="state" placeholder="SP" />
                        <Field label="CEP" field="zipCode" placeholder="01310-100" />
                    </div>

                    <p style={{ fontSize: 12, color: '#64748b', margin: '20px 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>Proprietário</p>
                    <div className="sa-form-grid">
                        <Field label="Nome do Proprietário" field="ownerName" placeholder="João Silva" />
                        <Field label="Email do Proprietário" field="ownerEmail" type="email" placeholder="joao@email.com" />
                        <Field label="Telefone do Proprietário" field="ownerPhone" placeholder="(11) 99999-9999" />
                    </div>

                    <p style={{ fontSize: 12, color: '#64748b', margin: '20px 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>Configurações</p>
                    <div className="sa-form-grid">
                        <div className="sa-field-group">
                            <label>Plano Cadastrado</label>
                            <select className="sa-input" value={form.planId} onChange={e => set('planId', e.target.value)}>
                                <option value="">Sem plano vinculado</option>
                                {plans.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="sa-field-group">
                            <label>Categoria do Plano</label>
                            <select className="sa-input" value={form.planType} onChange={e => set('planType', e.target.value)}>
                                <option value="free">Free</option>
                                <option value="basic">Basic</option>
                                <option value="premium">Premium</option>
                                <option value="enterprise">Enterprise</option>
                            </select>
                        </div>
                        <div className="sa-field-group">
                            <label>Status</label>
                            <select className="sa-input" value={form.isActive ? 'active' : 'inactive'} onChange={e => set('isActive', e.target.value === 'active')}>
                                <option value="active">Ativa</option>
                                <option value="inactive">Inativa</option>
                            </select>
                        </div>
                    </div>

                    <div className="sa-modal-footer">
                        <button type="button" className="sa-btn sa-btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="sa-btn sa-btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Empresa')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
