import { useState, useEffect, useCallback } from 'react';
import {
  RiPriceTag3Line, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiCloseLine, RiCheckLine, RiStarLine,
} from 'react-icons/ri';
import { useGestorAuth } from '../../context/GestorAuthContext';

const FEATURES = [
  // Recursos base — incluídos em todos os planos (não editáveis)
  { key: 'dashboard',             label: 'Dashboard',                              base: true },
  { key: 'agendamento_painel',    label: 'Agendamento pelo painel',                base: true },
  { key: 'conflito_horario',      label: 'Validação de conflito de horário',       base: true },
  { key: 'expediente',            label: 'Configuração de expediente',             base: true },
  { key: 'cadastro_clientes',     label: 'Cadastro de clientes',                   base: true },
  { key: 'lista_clientes',        label: 'Lista e busca de clientes',              base: true },
  { key: 'cadastro_servicos',     label: 'Cadastro de serviços',                   base: true },
  { key: 'lista_servicos',        label: 'Lista e filtro de serviços',             base: true },
  { key: 'dados_empresa',         label: 'Dados da empresa editáveis',             base: true },
  // Recursos selecionáveis por plano
  { key: 'agendamento_publico',   label: 'Agendamento online por clientes' },
  { key: 'historico_cliente',     label: 'Histórico do cliente' },
  { key: 'clientes_agendados',    label: 'Clientes agendados por período' },
  { key: 'upload_logo',           label: 'Upload de logo e imagem de fundo' },
  { key: 'whatsapp_barbearia',    label: 'Notificações WhatsApp para a barbearia' },
  { key: 'whatsapp_cliente',      label: 'Confirmação WhatsApp para o cliente' },
  { key: 'alertas_pendentes',     label: 'Alertas de solicitações pendentes' },
  { key: 'multiplos_usuarios',    label: 'Múltiplos usuários e profissionais' },
  { key: 'relatorios',            label: 'Relatórios avançados' },
  { key: 'financeiro',            label: 'Módulo Financeiro' },
  { key: 'produtos',              label: 'Gestão de Produtos e Estoque' },
  { key: 'vendas_produtos',       label: 'Vendas de Produtos' },
  { key: 'comissoes',             label: 'Comissões de profissionais' },
  { key: 'planos_servico',        label: 'Planos de serviço para clientes' },
  { key: 'promocoes',             label: 'Promoções e descontos' },
  { key: 'grupos_permissao',      label: 'Grupos de permissão' },
  { key: 'tela_cliente',          label: 'Tela do cliente' },
  { key: 'suporte',               label: 'Suporte técnico integrado',          base: true },
];

const EMPTY_FORM = {
  name: '', description: '',
  priceMonthly: '', priceAnnual: '',
  maxUsers: '', maxAppointments: '',
  trialMonths: '', sortOrder: '0',
  isActive: true, isDefault: false, isPublic: true,
  features: [],
};

function fmt(val) {
  const n = parseFloat(val);
  return isNaN(n) ? '—' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function GestorPlans() {
  const { authFetch } = useGestorAuth();
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null); // null | { mode: 'create' | 'edit', id? }
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await authFetch('/api/gestor/plans');
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Erro ${res.status}`);
      setPlans(Array.isArray(data?.plans) ? data.plans : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError('');
    setModal({ mode: 'create' });
  }

  function openEdit(plan) {
    setForm({
      name:             plan.name ?? '',
      description:      plan.description ?? '',
      priceMonthly:     plan.priceMonthly ?? '',
      priceAnnual:      plan.priceAnnual ?? '',
      maxUsers:         plan.maxUsers ?? '',
      maxAppointments:  plan.maxAppointments ?? '',
      trialMonths:      plan.trialMonths ?? '',
      sortOrder:        plan.sortOrder ?? '0',
      isActive:         plan.isActive ?? true,
      isDefault:        plan.isDefault ?? false,
      isPublic:         plan.isPublic ?? true,
      features:         Array.isArray(plan.features) ? plan.features : [],
    });
    setError('');
    setModal({ mode: 'edit', id: plan.id });
  }

  function setField(field) {
    return e => setForm(f => ({
      ...f,
      [field]: field === 'isActive' || field === 'isDefault' || field === 'isPublic'
        ? e.target.value === 'true'
        : e.target.value,
    }));
  }

  function toggleFeature(label) {
    setForm(f => ({
      ...f,
      features: f.features.includes(label)
        ? f.features.filter(l => l !== label)
        : [...f.features, label],
    }));
  }

  function toNum(v) {
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = {
        name:            form.name,
        description:     form.description || null,
        priceMonthly:    toNum(form.priceMonthly) ?? 0,
        priceAnnual:     toNum(form.priceAnnual) ?? 0,
        maxUsers:        toNum(form.maxUsers),
        maxAppointments: toNum(form.maxAppointments),
        trialMonths:     toNum(form.trialMonths),
        sortOrder:       toNum(form.sortOrder) ?? 0,
        isActive:        form.isActive,
        isDefault:       form.isDefault,
        isPublic:        form.isPublic,
        features:        form.features,
      };
      const url    = modal.mode === 'create' ? '/api/gestor/plans' : `/api/gestor/plans/${modal.id}`;
      const method = modal.mode === 'create' ? 'POST' : 'PUT';
      const res    = await authFetch(url, { method, body: JSON.stringify(body) });
      const data   = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar.');
      setModal(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm) return;
    try {
      const res  = await authFetch(`/api/gestor/plans/${confirm.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao excluir.');
      setConfirm(null);
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <RiPriceTag3Line size={20} color="var(--accent)" />
          <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Planos</h1>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <RiAddLine size={15} /> Novo plano
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
      ) : plans.length === 0 ? (
        <div className="empty-state">Nenhum plano cadastrado.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Mensal</th>
                <th>Anual</th>
                <th>Usuários</th>
                <th>Recursos</th>
                <th>Status</th>
                <th>Visib.</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id}>
                  <td data-label="Nome">
                    <span style={{ fontWeight: 500 }}>{plan.name}</span>
                    {plan.isDefault && (
                      <span className="badge badge-amber" style={{ marginLeft: '0.5rem' }}>
                        <RiStarLine size={10} style={{ marginRight: 2 }} />Padrão
                      </span>
                    )}
                  </td>
                  <td data-label="Mensal">{fmt(plan.priceMonthly)}</td>
                  <td data-label="Anual">{fmt(plan.priceAnnual)}</td>
                  <td data-label="Usuários" style={{ color: 'var(--color-muted)' }}>
                    {plan.maxUsers ?? '∞'}
                  </td>
                  <td data-label="Recursos" style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                    {Array.isArray(plan.features) ? plan.features.length : 0} selecionados
                  </td>
                  <td data-label="Status">
                    <span className={`badge ${plan.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {plan.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td data-label="Visib.">
                    <span className={`badge ${plan.isPublic !== false ? 'badge-blue' : 'badge-gray'}`}>
                      {plan.isPublic !== false ? 'Público' : 'Privado'}
                    </span>
                  </td>
                  <td data-label="">
                    <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-icon btn-xs" title="Editar" onClick={() => openEdit(plan)}>
                        <RiEditLine size={14} />
                      </button>
                      <button className="btn btn-danger btn-icon btn-xs" title="Excluir" onClick={() => setConfirm(plan)}>
                        <RiDeleteBinLine size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3>{modal.mode === 'create' ? 'Novo plano' : 'Editar plano'}</h3>
              <button className="modal-close" onClick={() => setModal(null)}><RiCloseLine size={18} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Nome *</label>
                  <input className="form-input" type="text" value={form.name} onChange={setField('name')} required placeholder="Ex: Plano Básico" />
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição</label>
                  <textarea className="form-input" rows={2} value={form.description} onChange={setField('description')} placeholder="Descrição opcional" style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Preço mensal (R$) *</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={form.priceMonthly} onChange={setField('priceMonthly')} required placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preço anual (R$)</label>
                    <input className="form-input" type="number" min="0" step="0.01" value={form.priceAnnual} onChange={setField('priceAnnual')} placeholder="0.00" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Máx. usuários</label>
                    <input className="form-input" type="number" min="1" value={form.maxUsers} onChange={setField('maxUsers')} placeholder="∞ ilimitado" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Máx. agendamentos</label>
                    <input className="form-input" type="number" min="1" value={form.maxAppointments} onChange={setField('maxAppointments')} placeholder="∞ ilimitado" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Trial (meses)</label>
                    <input className="form-input" type="number" min="0" value={form.trialMonths} onChange={setField('trialMonths')} placeholder="Sem trial" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Ordem</label>
                    <select className="form-input" value={String(form.sortOrder)} onChange={setField('sortOrder')}>
                      {Array.from({ length: plans.length + 1 }, (_, i) => (
                        <option key={i} value={String(i)}>{i + 1}ª posição</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={String(form.isActive)} onChange={setField('isActive')}>
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Padrão</label>
                    <select className="form-input" value={String(form.isDefault)} onChange={setField('isDefault')}>
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Visibilidade</label>
                    <select className="form-input" value={String(form.isPublic)} onChange={setField('isPublic')}>
                      <option value="true">Público</option>
                      <option value="false">Privado</option>
                    </select>
                  </div>
                </div>

                {/* Seletor de recursos */}
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Recursos inclusos</label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '0.4rem',
                    padding: '0.75rem',
                    background: 'var(--bg-input)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                  }}>
                    {FEATURES.map(({ key, label, base }) => {
                      const checked = base || form.features.includes(label);
                      return (
                        <label
                          key={key}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.35rem 0.5rem',
                            borderRadius: 'var(--radius-xs)',
                            cursor: base ? 'default' : 'pointer',
                            background: base
                              ? 'rgba(100,100,100,0.08)'
                              : checked ? 'rgba(124,58,237,0.12)' : 'transparent',
                            transition: 'background 0.15s',
                            fontSize: '0.8rem',
                            userSelect: 'none',
                            opacity: base ? 0.65 : 1,
                          }}
                        >
                          <span style={{
                            width: 16, height: 16, borderRadius: 4,
                            border: `1.5px solid ${checked ? (base ? 'var(--color-muted)' : 'var(--accent)') : 'var(--border)'}`,
                            background: checked ? (base ? 'var(--color-muted)' : 'var(--accent)') : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'all 0.15s',
                          }}>
                            {checked && <RiCheckLine size={10} color="#fff" />}
                          </span>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={base}
                            onChange={() => !base && toggleFeature(label)}
                            style={{ display: 'none' }}
                          />
                          {label}
                          {base && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--color-muted)', marginLeft: 'auto', fontWeight: 600 }}>
                              padrão
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem', display: 'block' }}>
                    {form.features.length} de {FEATURES.filter(f => !f.base).length} recursos selecionados
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end', paddingTop: '0.25rem' }}>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setModal(null)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirm && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <h3>Excluir plano</h3>
              <button className="modal-close" onClick={() => setConfirm(null)}><RiCloseLine size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.875rem' }}>
                Tem certeza que deseja excluir o plano <strong>{confirm.name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '0.625rem', justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancelar</button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete}>Excluir</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
