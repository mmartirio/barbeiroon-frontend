import React, { useState } from 'react';
import { gestorApi } from '../GestorLayout';
import { FEATURE_CATEGORIES, FEATURES_MAP, AUTO_FEATURE_KEYS } from '../constants/features';

const PLAN_ORDER = [
    { value: 0, label: '1º — Grátis' },
    { value: 1, label: '2º — Básico' },
    { value: 2, label: '3º — Essencial' },
    { value: 3, label: '4º — Premium' },
];

const EMPTY = {
    name: '', description: '', priceMonthly: '', priceAnnual: '',
    maxUsers: '', maxAppointments: '', trialMonths: '', sortOrder: 99, features: [], isActive: true,
};

// Descrições padrão para cada plano
const DEFAULT_DESCRIPTIONS = {
    'Grátis': 'Plano gratuito para você testar o sistema sem compromisso. Ideal para barbeiro autônomo que está começando.',
    'Básico': 'Ideal para barbearia de pequeno porte com até 2 barbeiros e fluxo moderado de clientes. Por menos de R$ 2 por dia, organize sua agenda e reduza faltas.',
    'Essencial': '⭐ MAIS VENDIDO ⭐ Ideal para barbearia em crescimento com até 5 barbeiros. Controle comissões, estoque e aumente seu faturamento.',
    'Premium': '👑 Ideal para redes ou barbearias de grande porte com até 8 barbeiros e atendimento ilimitado. Suporte prioritário e múltiplas filiais.',
};

// Preços sugeridos por plano
const DEFAULT_PRICES = {
    'Grátis': { monthly: 0, annual: 0 },
    'Básico': { monthly: 49.90, annual: 499 },
    'Essencial': { monthly: 89.90, annual: 899 },
    'Premium': { monthly: 139.90, annual: 1399 },
};

// Limites sugeridos por plano
const DEFAULT_LIMITS = {
    'Grátis': { users: 1, appointments: 100, trialMonths: null },
    'Básico': { users: 2, appointments: 700, trialMonths: null },
    'Essencial': { users: 5, appointments: 1400, trialMonths: null },
    'Premium': { users: 8, appointments: null, trialMonths: null }, // null = ilimitado
};

// Recursos por plano (keys que devem vir do seu FEATURES_MAP)
const DEFAULT_FEATURES = {
    'Grátis': [
        'Agendamento pelo painel',
        'Agendamento online por clientes',
        'Validação de confiado de horário',
        'Configuração de expediente',
        'Lista e busca de clientes',
        'Histórico do cliente',
        'Cadastro de serviços',
        'Lista e filtro de serviços',
        'Notificações WhatsApp para a barbeira',
        'Confirmação WhatsApp para o cliente',
        'Upload de logo e imagem de fundo',
        'Dados da empresa editáveis',
    ],
    'Básico': [
        'Agendamento pelo painel',
        'Agendamento online por clientes',
        'Validação de confiado de horário',
        'Configuração de expediente',
        'Lista e busca de clientes',
        'Histórico do cliente',
        'Cadastro de serviços',
        'Lista e filtro de serviços',
        'Notificações WhatsApp para a barbeira',
        'Confirmação WhatsApp para o cliente',
        'Upload de logo e imagem de fundo',
        'Dados da empresa editáveis',
    ],
    'Essencial': [
        'Agendamento pelo painel',
        'Agendamento online por clientes',
        'Validação de confiado de horário',
        'Configuração de expediente',
        'Lista e busca de clientes',
        'Histórico do cliente',
        'Cadastro de serviços',
        'Lista e filtro de serviços',
        'Notificações WhatsApp para a barbeira',
        'Confirmação WhatsApp para o cliente',
        'Upload de logo e imagem de fundo',
        'Dados da empresa editáveis',
        'Relatório de comissão por barbeiro',
        'Gestão de produtos (estoque/vendas)',
        'Lembrete automático (disparo)',
        'Dashboard com indicadores',
    ],
    'Premium': [
        'Agendamento pelo painel',
        'Agendamento online por clientes',
        'Validação de confiado de horário',
        'Configuração de expediente',
        'Lista e busca de clientes',
        'Histórico do cliente',
        'Cadastro de serviços',
        'Lista e filtro de serviços',
        'Notificações WhatsApp para a barbeira',
        'Confirmação WhatsApp para o cliente',
        'Upload de logo e imagem de fundo',
        'Dados da empresa editáveis',
        'Relatório de comissão por barbeiro',
        'Gestão de produtos (estoque/vendas)',
        'Lembrete automático (disparo)',
        'Dashboard com indicadores',
        'Múltiplas filiais (unidades)',
        'Suporte prioritário (chat/WhatsApp)',
        'Agendamentos ilimitados',
        'Relatórios avançados comparativos',
    ],
};

function FeatureSelector({ selected, onChange }) {
    const [search, setSearch] = useState('');

    const toggle = (key) => {
        onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
    };

    const filtered = search.trim()
        ? FEATURE_CATEGORIES.map(cat => ({
            ...cat,
            features: cat.features.filter(f =>
                f.key.toLowerCase().includes(search.toLowerCase()) ||
                f.desc.toLowerCase().includes(search.toLowerCase())
            ),
        })).filter(cat => cat.features.length > 0)
        : FEATURE_CATEGORIES;

    return (
        <div>
            {/* Chips dos selecionados */}
            {selected.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                    {selected.map(key => {
                        const feat = FEATURES_MAP[key];
                        return (
                            <span key={key} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                background: '#1e3a5f', color: '#60a5fa',
                                fontSize: 12, borderRadius: 6, padding: '4px 10px',
                            }}>
                                {feat?.icon} {key}
                                <button
                                    type="button"
                                    onClick={() => toggle(key)}
                                    style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0, marginLeft: 2 }}
                                >×</button>
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Busca */}
            <input
                className="sa-input"
                placeholder="Buscar recurso..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ marginBottom: 8 }}
            />

            {/* Lista agrupada */}
            <div style={{
                border: '1px solid #334155', borderRadius: 8,
                maxHeight: 320, overflowY: 'auto', background: '#0f172a',
            }}>
                {filtered.length === 0 && (
                    <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                        Nenhum recurso encontrado.
                    </div>
                )}
                {filtered.map(cat => (
                    <div key={cat.id}>
                        {/* Cabeçalho da categoria */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 14px', background: '#0f172a',
                            borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 1,
                        }}>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                {cat.icon} {cat.label}
                            </span>
                            <button
                                type="button"
                                onClick={() => {
                                    const allKeys = cat.features.map(f => f.key);
                                    const allSelected = allKeys.every(k => selected.includes(k));
                                    if (allSelected) {
                                        onChange(selected.filter(k => !allKeys.includes(k)));
                                    } else {
                                        const newKeys = allKeys.filter(k => !selected.includes(k));
                                        onChange([...selected, ...newKeys]);
                                    }
                                }}
                                style={{
                                    background: 'none', border: 'none', color: '#6366f1',
                                    fontSize: 11, cursor: 'pointer', fontWeight: 600,
                                }}
                            >
                                {cat.features.every(f => selected.includes(f.key)) ? 'Desmarcar todos' : 'Selecionar todos'}
                            </button>
                        </div>

                        {/* Itens */}
                        {cat.features.map((feat, idx) => {
                            const isChecked = selected.includes(feat.key);
                            return (
                                <label
                                    key={feat.key}
                                    style={{
                                        display: 'flex', alignItems: 'flex-start', gap: 12,
                                        padding: '11px 14px', cursor: 'pointer',
                                        borderBottom: idx < cat.features.length - 1 ? '1px solid #1e293b' : 'none',
                                        background: isChecked ? '#1e293b' : 'transparent',
                                        transition: 'background 0.1s',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggle(feat.key)}
                                        style={{ marginTop: 2, accentColor: '#6366f1', width: 15, height: 15, flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, color: isChecked ? '#f8fafc' : '#94a3b8', fontWeight: isChecked ? 600 : 400 }}>
                                            {feat.icon} {feat.key}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#475569', marginTop: 2, lineHeight: 1.4 }}>
                                            {feat.desc}
                                        </div>
                                    </div>
                                    {isChecked && (
                                        <span style={{ fontSize: 14, color: '#4ade80', flexShrink: 0 }}>✓</span>
                                    )}
                                </label>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: 8, fontSize: 12, color: '#475569' }}>
                {selected.length} recurso{selected.length !== 1 ? 's' : ''} selecionado{selected.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
}

// Botão para preencher com valores padrão
function DefaultPlanButton({ planName, onFill }) {
    const names = {
        'Grátis': 'Grátis',
        'Básico': 'Básico',
        'Essencial': 'Essencial',
        'Premium': 'Premium'
    };
    
    if (!names[planName]) return null;
    
    return (
        <button
            type="button"
            onClick={() => onFill({
                name: planName,
                description: DEFAULT_DESCRIPTIONS[planName],
                priceMonthly: DEFAULT_PRICES[planName].monthly,
                priceAnnual: DEFAULT_PRICES[planName].annual,
                maxUsers: DEFAULT_LIMITS[planName].users,
                maxAppointments: DEFAULT_LIMITS[planName].appointments,
                trialMonths: DEFAULT_LIMITS[planName].trialMonths,
                features: DEFAULT_FEATURES[planName],
                sortOrder: { 'Grátis': 0, 'Básico': 1, 'Essencial': 2, 'Premium': 3 }[planName],
                isActive: true,
            })}
            style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 6,
                padding: '4px 12px',
                fontSize: 11,
                color: '#94a3b8',
                cursor: 'pointer',
                marginLeft: 8,
            }}
        >
            ⚡ Preencher padrão
        </button>
    );
}

export default function PlanosForm({ plan, onClose, onSaved }) {
    const isEdit = !!plan;
    const [form, setForm] = useState(plan ? {
        name: plan.name || '',
        description: plan.description || '',
        priceMonthly: plan.priceMonthly ?? '',
        priceAnnual: plan.priceAnnual ?? '',
        maxUsers: plan.maxUsers ?? '',
        maxAppointments: plan.maxAppointments ?? '',
        trialMonths: plan.trialMonths ?? '',
        sortOrder: plan.sortOrder ?? 99,
        features: Array.isArray(plan.features) ? plan.features : [],
        isActive: plan.isActive !== false,
    } : EMPTY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const fillWithDefaults = (defaults) => {
        setForm(f => ({ ...f, ...defaults }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.name) { setError('Nome é obrigatório.'); return; }
        setLoading(true);
        try {
            const allFeatures = [...new Set([...AUTO_FEATURE_KEYS, ...form.features])];
            const body = {
                ...form,
                features: allFeatures,
                priceMonthly: Number(form.priceMonthly || 0),
                priceAnnual: Number(form.priceAnnual || 0),
                maxUsers: form.maxUsers ? Number(form.maxUsers) : null,
                trialMonths: form.trialMonths ? Number(form.trialMonths) : null,
                sortOrder: Number(form.sortOrder ?? 99),
                maxAppointments: form.maxAppointments ? Number(form.maxAppointments) : null,
            };
            const r = await gestorApi(isEdit ? `/plans/${plan.id}` : '/plans', {
                method: isEdit ? 'PUT' : 'POST',
                body: JSON.stringify(body),
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

    return (
        <div className="sa-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="sa-modal" style={{ maxWidth: 700 }}>
                <div className="sa-modal-header" style={{ position: 'relative' }}>
                    <h2 className="sa-modal-title">{isEdit ? 'Editar Plano' : 'Novo Plano'}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            position: 'absolute', top: 0, right: 0,
                            background: 'none', border: 'none',
                            color: '#475569', cursor: 'pointer',
                            fontSize: 12, lineHeight: 1, padding: '1, 3',
                            borderRadius: 2, transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
                        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                        title="Fechar"
                    >✕</button>
                </div>

                {error && <div className="sa-error-msg">{error}</div>}

                {/* Botões de preenchimento rápido (apenas para novo plano) */}
                {!isEdit && (
                    <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                        <span style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>⚡ Modelos prontos:</span>
                        {['Grátis', 'Básico', 'Essencial', 'Premium'].map(name => (
                            <DefaultPlanButton key={name} planName={name} onFill={fillWithDefaults} />
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Nome e descrição */}
                    <div className="sa-form-grid">
                        <div className="sa-field-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Nome *</label>
                            <input className="sa-input" value={form.name}
                                onChange={e => set('name', e.target.value)} placeholder="Ex: Premium" />
                        </div>
                        <div className="sa-field-group" style={{ gridColumn: '1 / -1' }}>
                            <label>Descrição</label>
                            <textarea className="sa-input" value={form.description}
                                onChange={e => set('description', e.target.value)}
                                placeholder="Descreva os benefícios do plano..." rows={2}
                                style={{ resize: 'vertical' }} />
                        </div>
                    </div>

                    {/* Preços */}
                    <p style={{ fontSize: 12, color: '#64748b', margin: '16px 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>Preços</p>
                    <div className="sa-form-grid">
                        <div className="sa-field-group">
                            <label>Preço Mensal (R$)</label>
                            <input className="sa-input" type="number" min="0" step="0.01"
                                value={form.priceMonthly} onChange={e => set('priceMonthly', e.target.value)} placeholder="0.00" />
                            {form.priceMonthly === 0 && <small style={{ color: '#4ade80' }}>💰 Grátis!</small>}
                        </div>
                        <div className="sa-field-group">
                            <label>Preço Anual (R$)</label>
                            <input className="sa-input" type="number" min="0" step="0.01"
                                value={form.priceAnnual} onChange={e => set('priceAnnual', e.target.value)} placeholder="0.00" />
                            {form.priceMonthly > 0 && form.priceAnnual > 0 && (
                                <small style={{ color: '#60a5fa' }}>
                                    Economia: {Math.round((1 - form.priceAnnual / (form.priceMonthly * 12)) * 100)}%
                                </small>
                            )}
                        </div>
                    </div>

                    {/* Limites */}
                    <p style={{ fontSize: 12, color: '#64748b', margin: '16px 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>Limites</p>
                    <div className="sa-form-grid">
                        <div className="sa-field-group">
                            <label>Máx. Usuários</label>
                            <input className="sa-input" type="number" min="0" value={form.maxUsers}
                                onChange={e => set('maxUsers', e.target.value)} placeholder="Ilimitado" />
                            {form.maxUsers && <small>👤 até {form.maxUsers} barbeiro{form.maxUsers !== 1 ? 's' : ''}</small>}
                        </div>
                        <div className="sa-field-group">
                            <label>Máx. Agendamentos/mês</label>
                            <input className="sa-input" type="number" min="0" value={form.maxAppointments}
                                onChange={e => set('maxAppointments', e.target.value)} placeholder="Ilimitado" />
                            {form.maxAppointments && <small>📅 {form.maxAppointments.toLocaleString()} atendimentos/mês</small>}
                        </div>
                        <div className="sa-field-group">
                            <label>Posição na tela</label>
                            <select className="sa-input" value={form.sortOrder}
                                onChange={e => set('sortOrder', e.target.value)}>
                                {PLAN_ORDER.map(o => (
                                    <option key={o.value} value={o.value}>{o.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="sa-field-group">
                            <label>Duração do plano</label>
                            <select className="sa-input" value={form.trialMonths ?? ''}
                                onChange={e => set('trialMonths', e.target.value)}>
                                <option value="">Ilimitado (assinatura)</option>
                                {[1,2,3,6,9,12,18,24].map(m => (
                                    <option key={m} value={m}>{m} {m === 1 ? 'mês' : 'meses'} (plano temporário)</option>
                                ))}
                            </select>
                        </div>
                        <div className="sa-field-group">
                            <label>Status</label>
                            <select className="sa-input" value={form.isActive ? 'active' : 'inactive'}
                                onChange={e => set('isActive', e.target.value === 'active')}>
                                <option value="active">✅ Ativo (visível para clientes)</option>
                                <option value="inactive">❌ Inativo (oculto)</option>
                            </select>
                        </div>
                    </div>

                    {/* Recursos */}
                    <p style={{ fontSize: 12, color: '#64748b', margin: '20px 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Recursos Inclusos
                    </p>
                    <FeatureSelector
                        selected={form.features}
                        onChange={features => set('features', features)}
                    />

                    <div className="sa-modal-footer">
                        <button type="button" className="sa-btn sa-btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="sa-btn sa-btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Plano')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}