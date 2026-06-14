import { useState, useEffect, useCallback } from 'react';
import {
  RiPriceTag3Line, RiAddLine, RiEditLine, RiDeleteBinLine,
  RiCloseLine, RiCheckLine, RiStarLine, RiArrowDownSLine, RiArrowRightSLine,
} from 'react-icons/ri';
import { useGestorAuth } from '../../context/GestorAuthContext';

// Cada grupo espelha um item do sidebar.
// label = string exibida no plano (também é o valor armazenado em features[]).
// name  = texto curto exibido no UI (quando diferente de label).
// base      = sempre ativo, não editável, cor cinza.
// mandatory = sempre ativo, não editável, cor accent, auto-incluído ao salvar.
const FEATURES = [
  {
    key: 'painel',
    label: 'Painel Principal',
    group: true,
    children: [
      { key: 'dashboard', label: 'Dashboard', name: 'Dashboard', base: true },
    ],
  },
  {
    key: 'meu_link',
    label: 'Meu Link',
    group: true,
    children: [
      { key: 'meu_link_item', label: 'Meu Link', name: 'Meu Link', mandatory: true },
    ],
  },
  {
    key: 'agenda',
    label: 'Agenda',
    group: true,
    children: [
      { key: 'agendamento_painel',  label: 'Agendamento pelo painel',            name: 'Pelo painel',          base: true },
      { key: 'expediente',          label: 'Configuração de expediente',          name: 'Expediente',           base: true },
      { key: 'agendamento_publico', label: 'Agendamento online por clientes',     name: 'Online por clientes'             },
      { key: 'clientes_agendados',  label: 'Clientes agendados por período',      name: 'Clientes agendados'              },
      { key: 'alertas_pendentes',   label: 'Alertas de solicitações pendentes',   name: 'Alertas de pendentes'            },
    ],
  },
  {
    key: 'clientes',
    label: 'Clientes',
    group: true,
    children: [
      { key: 'cadastro_clientes', label: 'Cadastro de clientes',        name: 'Cadastro', base: true },
      { key: 'lista_clientes',    label: 'Lista e busca de clientes',   name: 'Lista',    base: true },
    ],
  },
  {
    key: 'usuarios',
    label: 'Usuários',
    group: true,
    children: [
      { key: 'grupos_permissao',    label: 'Grupos de permissão',                  name: 'Grupos de permissão', base: true },
      { key: 'multiplos_usuarios',  label: 'Múltiplos usuários e profissionais',   name: 'Múltiplos usuários'              },
      { key: 'comissoes',           label: 'Comissões de profissionais',            name: 'Comissões'                       },
    ],
  },
  {
    key: 'servicos',
    label: 'Serviços',
    group: true,
    children: [
      { key: 'cadastro_servicos', label: 'Cadastro de serviços',          name: 'Cadastro',   base: true },
      { key: 'lista_servicos',    label: 'Lista e filtro de serviços',    name: 'Lista',      base: true },
      { key: 'planos_servico',    label: 'Planos de serviço para clientes', name: 'Planos de serviço'    },
      { key: 'promocoes',         label: 'Promoções e descontos',          name: 'Promoções'             },
    ],
  },
  {
    key: 'vendas',
    label: 'Vendas',
    group: true,
    children: [
      { key: 'vendas_produtos', label: 'Vendas de Produtos', name: 'Vendas de Produtos' },
    ],
  },
  {
    key: 'produtos',
    label: 'Produtos',
    group: true,
    children: [
      { key: 'produtos_item', label: 'Gestão de Produtos e Estoque', name: 'Produtos e Estoque' },
    ],
  },
  {
    key: 'financeiro',
    label: 'Financeiro',
    group: true,
    children: [
      { key: 'financeiro_resumo',    label: 'financeiro.resumo',    name: 'Resumo'        },
      { key: 'financeiro_receitas',  label: 'financeiro.receitas',  name: 'Receitas'      },
      { key: 'financeiro_comissao',  label: 'financeiro.comissao',  name: 'Comissão'      },
      { key: 'financeiro_despesas',  label: 'financeiro.despesas',  name: 'Despesas'      },
      { key: 'financeiro_ranking',   label: 'financeiro.ranking',   name: 'Ranking'       },
      { key: 'financeiro_produtos',  label: 'financeiro.produtos',  name: 'Produtos'      },
      { key: 'financeiro_fluxo',     label: 'financeiro.fluxo',     name: 'Fluxo de Caixa'},
    ],
  },
  {
    key: 'relatorios',
    label: 'Relatórios',
    group: true,
    children: [
      { key: 'relatorios_item', label: 'Relatórios avançados', name: 'Relatórios avançados' },
    ],
  },
  {
    key: 'conta',
    label: 'Conta',
    group: true,
    children: [
      { key: 'dados_empresa',      label: 'Dados da empresa editáveis',               name: 'Dados da empresa',    base: true },
      { key: 'upload_logo',        label: 'Upload de logo e imagem de fundo',         name: 'Logo e imagem'                  },
      { key: 'whatsapp_barbearia', label: 'Notificações WhatsApp para a barbearia',   name: 'WhatsApp (barbearia)'           },
      { key: 'whatsapp_cliente',   label: 'Confirmação WhatsApp para o cliente',      name: 'WhatsApp (cliente)'             },
    ],
  },
  {
    key: 'suporte',
    label: 'Suporte',
    group: true,
    children: [
      { key: 'suporte_item', label: 'Suporte técnico integrado', name: 'Suporte técnico', base: true },
    ],
  },
];

// Labels que devem ser auto-incluídos em todo plano ao salvar
const MANDATORY_LABELS = FEATURES.flatMap(g =>
  g.children.filter(c => c.mandatory).map(c => c.label)
);

function totalSelectable() {
  return FEATURES.reduce((acc, g) =>
    acc + g.children.filter(c => !c.base && !c.mandatory).length, 0
  );
}
const TOTAL_SELECTABLE = totalSelectable();

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

// Estado inicial: todos os grupos expandidos
const ALL_EXPANDED = Object.fromEntries(FEATURES.map(g => [g.key, true]));

export default function GestorPlans() {
  const { authFetch } = useGestorAuth();
  const [plans,          setPlans]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modal,          setModal]          = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [confirm,        setConfirm]        = useState(null);
  const [expandedGroups, setExpandedGroups] = useState(ALL_EXPANDED);

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

  function toggleGroup(group) {
    const selectable = group.children.filter(c => !c.base && !c.mandatory).map(c => c.label);
    if (!selectable.length) return;
    const allChecked = selectable.every(l => form.features.includes(l));
    setForm(f => ({
      ...f,
      features: allChecked
        ? f.features.filter(l => !selectable.includes(l))
        : [...new Set([...f.features, ...selectable])],
    }));
  }

  function toggleGroupExpanded(key) {
    setExpandedGroups(g => ({ ...g, [key]: !g[key] }));
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
        features:        [...new Set([...form.features, ...MANDATORY_LABELS])],
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

  // ── Item filho do grupo ────────────────────────────────────────────────────
  function renderChild(child) {
    const { key, label, name, base, mandatory } = child;
    const isDisabled   = base || mandatory;
    const checked      = isDisabled || form.features.includes(label);
    const displayLabel = name || label;

    return (
      <label
        key={key}
        onClick={() => !isDisabled && toggleFeature(label)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.45rem',
          padding: '0.3rem 0.45rem',
          borderRadius: 'var(--radius-xs)',
          cursor: isDisabled ? 'default' : 'pointer',
          background: isDisabled
            ? (mandatory ? 'rgba(124,58,237,0.07)' : 'rgba(100,100,100,0.07)')
            : checked ? 'rgba(124,58,237,0.12)' : 'transparent',
          transition: 'background 0.15s',
          fontSize: '0.78rem',
          userSelect: 'none',
          opacity: base ? 0.65 : 1,
        }}
      >
        <span style={{
          width: 14, height: 14, borderRadius: 3, flexShrink: 0,
          border: `1.5px solid ${checked ? (base ? 'var(--color-muted)' : 'var(--accent)') : 'var(--border)'}`,
          background: checked ? (base ? 'var(--color-muted)' : 'var(--accent)') : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
        }}>
          {checked && <RiCheckLine size={9} color="#fff" />}
        </span>
        <span style={{ flex: 1 }}>{displayLabel}</span>
        {base && (
          <span style={{ fontSize: '0.6rem', color: 'var(--color-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            padrão
          </span>
        )}
        {mandatory && (
          <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            obrigatório
          </span>
        )}
      </label>
    );
  }

  // ── Grupo (equivalente a um item do sidebar) ───────────────────────────────
  function renderGroup(group) {
    const selectable   = group.children.filter(c => !c.base && !c.mandatory);
    const hasSelectable = selectable.length > 0;
    const checkedCount = selectable.filter(c => form.features.includes(c.label)).length;
    const allChecked   = !hasSelectable || checkedCount === selectable.length;
    const someChecked  = checkedCount > 0;
    const isExpanded   = !!expandedGroups[group.key];
    const isBaseOnly   = !hasSelectable;

    const headerBg = isBaseOnly
      ? 'rgba(100,100,100,0.07)'
      : allChecked ? 'rgba(124,58,237,0.12)' : someChecked ? 'rgba(124,58,237,0.06)' : 'var(--bg-card)';

    const boxBorderColor = someChecked ? 'var(--accent)' : 'var(--border)';
    const boxBg          = allChecked && hasSelectable ? 'var(--accent)' : 'transparent';

    return (
      <div
        key={group.key}
        style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
        }}
      >
        {/* Cabeçalho clicável */}
        <div
          onClick={() => hasSelectable && toggleGroup(group)}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.45rem 0.625rem',
            background: headerBg,
            cursor: hasSelectable ? 'pointer' : 'default',
            userSelect: 'none',
          }}
        >
          {/* Checkbox select-all */}
          <span style={{
            width: 15, height: 15, borderRadius: 3, flexShrink: 0,
            border: `1.5px solid ${isBaseOnly ? 'var(--color-muted)' : boxBorderColor}`,
            background: isBaseOnly ? 'var(--color-muted)' : boxBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s',
            opacity: isBaseOnly ? 0.5 : 1,
          }}>
            {(allChecked || isBaseOnly) && <RiCheckLine size={9} color="#fff" />}
            {someChecked && !allChecked && !isBaseOnly && (
              <span style={{ width: 7, height: 2, background: 'var(--accent)', borderRadius: 1 }} />
            )}
          </span>

          {/* Label do grupo */}
          <span style={{ fontWeight: 600, fontSize: '0.82rem', flex: 1 }}>{group.label}</span>

          {/* Contador */}
          {hasSelectable && (
            <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>
              {checkedCount}/{selectable.length}
            </span>
          )}
          {isBaseOnly && (
            <span style={{ fontSize: '0.68rem', color: 'var(--color-muted)' }}>padrão</span>
          )}

          {/* Expand/collapse */}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); toggleGroupExpanded(group.key); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '0.1rem', color: 'var(--color-muted)',
              display: 'flex', alignItems: 'center',
            }}
          >
            {isExpanded ? <RiArrowDownSLine size={15} /> : <RiArrowRightSLine size={15} />}
          </button>
        </div>

        {/* Filhos */}
        {isExpanded && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '0.2rem',
            padding: '0.45rem',
            background: 'var(--bg-input)',
            borderTop: '1px solid var(--border)',
          }}>
            {group.children.map(child => renderChild(child))}
          </div>
        )}
      </div>
    );
  }

  const selectedCount = form.features.filter(l => !MANDATORY_LABELS.includes(l)).length;

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

      {/* ── Modal criar/editar ──────────────────────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-box" style={{ maxWidth: 580 }}>
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

                {/* ── Recursos por seção do sistema ───────────────────── */}
                <div className="form-group">
                  <label className="form-label" style={{ marginBottom: '0.5rem' }}>Recursos por seção</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {FEATURES.map(group => renderGroup(group))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.4rem', display: 'block' }}>
                    {selectedCount} de {TOTAL_SELECTABLE} recursos selecionados
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

      {/* ── Confirm delete ──────────────────────────────────────────────────── */}
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
