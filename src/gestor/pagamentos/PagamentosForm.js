import React, { useState } from 'react';
import { gestorApi } from '../GestorLayout';

const EMPTY = { type: 'pix', label: '', config: {}, isActive: true };

const PIX_KEY_TYPES = ['CPF', 'CNPJ', 'Email', 'Telefone', 'Chave Aleatória'];

export default function PagamentosForm({ method, onClose, onSaved }) {
    const isEdit = !!method;
    const [form, setForm] = useState(method ? {
        type: method.type || 'pix',
        label: method.label || '',
        config: method.config || {},
        isActive: method.isActive !== false,
    } : EMPTY);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const setConfig = (k, v) => setForm(f => ({ ...f, config: { ...f.config, [k]: v } }));

    const handleTypeChange = (type) => {
        set('type', type);
        setForm(f => ({ ...f, type, config: {} }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!form.label) { setError('Rótulo é obrigatório.'); return; }
        if (form.type === 'pix' && !form.config.pixKey) { setError('Chave PIX é obrigatória.'); return; }
        setLoading(true);
        try {
            const r = await gestorApi(isEdit ? `/payment-methods/${method.id}` : '/payment-methods', {
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

    return (
        <div className="sa-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="sa-modal">
                <div className="sa-modal-header">
                    <h2 className="sa-modal-title">{isEdit ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}</h2>
                    <button className="sa-modal-close" onClick={onClose}>×</button>
                </div>

                {error && <div className="sa-error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>Informações Gerais</p>
                    <div className="sa-form-grid">
                        <div className="sa-field-group">
                            <label>Tipo *</label>
                            <select className="sa-input" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
                                <option value="pix">PIX</option>
                                <option value="boleto">Boleto</option>
                            </select>
                        </div>
                        <div className="sa-field-group">
                            <label>Rótulo *</label>
                            <input className="sa-input" value={form.label} onChange={e => set('label', e.target.value)}
                                placeholder={form.type === 'pix' ? 'PIX - Empresa XYZ' : 'Boleto Bancário'} />
                        </div>
                        <div className="sa-field-group">
                            <label>Status</label>
                            <select className="sa-input" value={form.isActive ? 'active' : 'inactive'}
                                onChange={e => set('isActive', e.target.value === 'active')}>
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </div>
                    </div>

                    {form.type === 'pix' && (
                        <>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '20px 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>Configuração PIX</p>
                            <div className="sa-form-grid">
                                <div className="sa-field-group">
                                    <label>Tipo de Chave</label>
                                    <select className="sa-input" value={form.config.pixKeyType || ''}
                                        onChange={e => setConfig('pixKeyType', e.target.value)}>
                                        <option value="">Selecione</option>
                                        {PIX_KEY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="sa-field-group">
                                    <label>Chave PIX *</label>
                                    <input className="sa-input" value={form.config.pixKey || ''}
                                        onChange={e => setConfig('pixKey', e.target.value)}
                                        placeholder="Digite a chave PIX" />
                                </div>
                                <div className="sa-field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Nome do Favorecido</label>
                                    <input className="sa-input" value={form.config.beneficiaryName || ''}
                                        onChange={e => setConfig('beneficiaryName', e.target.value)}
                                        placeholder="Nome completo ou razão social" />
                                </div>
                            </div>
                        </>
                    )}

                    {form.type === 'boleto' && (
                        <>
                            <p style={{ fontSize: 12, color: '#64748b', margin: '20px 0 12px', textTransform: 'uppercase', fontWeight: 700 }}>Configuração Boleto</p>
                            <div className="sa-form-grid">
                                <div className="sa-field-group">
                                    <label>Banco</label>
                                    <select className="sa-input" value={form.config.bank || ''}
                                        onChange={e => setConfig('bank', e.target.value)}>
                                        <option value="">Selecione o banco</option>
                                        <option value="itau">Itaú</option>
                                        <option value="bradesco">Bradesco</option>
                                        <option value="bb">Banco do Brasil</option>
                                        <option value="santander">Santander</option>
                                        <option value="caixa">Caixa Econômica</option>
                                        <option value="sicredi">Sicredi</option>
                                        <option value="sicoob">Sicoob</option>
                                    </select>
                                </div>
                                <div className="sa-field-group">
                                    <label>Vencimento (dias)</label>
                                    <input className="sa-input" type="number" min="1" value={form.config.dueDays || ''}
                                        onChange={e => setConfig('dueDays', e.target.value)} placeholder="Ex: 3" />
                                </div>
                                <div className="sa-field-group" style={{ gridColumn: '1 / -1' }}>
                                    <label>Instruções de Pagamento</label>
                                    <textarea className="sa-input" rows={3} value={form.config.instructions || ''}
                                        onChange={e => setConfig('instructions', e.target.value)}
                                        placeholder="Não aceitar após o vencimento. Multa de 2% após..."
                                        style={{ resize: 'vertical' }} />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="sa-modal-footer">
                        <button type="button" className="sa-btn sa-btn-ghost" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="sa-btn sa-btn-primary" disabled={loading}>
                            {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Forma de Pagamento')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
