import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RiCheckLine, RiArrowRightLine } from 'react-icons/ri';
import './Registrar.css';

const STATES_BR = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
  'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
  'RO','RR','RS','SC','SE','SP','TO',
];

const DUE_DAYS = Array.from({ length: 28 }, (_, i) => i + 1);

const CONTRACT = `TERMO DE ADESÃO AO SERVIÇO — BARBEIRO ON

Ao marcar a caixa de aceitação abaixo, o representante legal da empresa confirma que leu, compreendeu e aceita integralmente as condições a seguir:

1. OBJETO
O presente termo regula a prestação de serviços de acesso à plataforma Barbeiro On, sistema de gestão para barbearias, conforme o plano contratado.

2. PAGAMENTO
2.1. O serviço é cobrado mensalmente (ou anualmente, conforme opção selecionada) por meio de PIX.
2.2. A cobrança será enviada via WhatsApp para o número informado no cadastro, na data de vencimento escolhida.
2.3. O não pagamento até 5 (cinco) dias após o vencimento poderá resultar na suspensão temporária do acesso à plataforma.
2.4. Não há cobrança automática — o contratante recebe o aviso de cobrança via WhatsApp e realiza o pagamento voluntariamente.

3. SEM FIDELIDADE
3.1. Não há prazo mínimo de fidelidade. O serviço pode ser cancelado pelo contratante a qualquer momento.

4. CANCELAMENTO
4.1. Para solicitar o cancelamento, o contratante deve comunicar formalmente via WhatsApp, com antecedência mínima de 5 (cinco) dias úteis antes da próxima data de vencimento.
4.2. Caso o cancelamento não seja comunicado no prazo previsto, a cobrança do período subsequente será gerada e permanecerá devida.
4.3. O cancelamento não gera direito à restituição de valores já pagos por períodos em curso.
4.4. O acesso à plataforma será encerrado ao término do período já pago.

5. RESPONSABILIDADES
5.1. A Barbeiro On se compromete a manter a plataforma disponível e operacional, ressalvadas manutenções programadas e eventos de força maior.
5.2. O contratante é responsável pela veracidade dos dados cadastrais e pelo uso adequado da plataforma.

6. ACEITE ELETRÔNICO
A marcação da caixa abaixo constitui aceite eletrônico com validade jurídica equivalente a uma assinatura física (Lei nº 14.063/2020).`;

const EMPTY_FORM = {
  name: '', email: '', phone: '', cnpj: '',
  address: '', neighborhood: '', city: '', state: '', zipCode: '',
  ownerName: '', ownerEmail: '', ownerPhone: '',
  ownerPassword: '', confirmPassword: '',
  billingCycle: 'monthly',
  billingDueDay: '5',
  contractAccepted: false,
};

function fmtPrice(val) {
  const n = Number(val || 0);
  const [int, dec] = n.toFixed(2).split('.');
  return { int, dec, full: `${int},${dec}` };
}

function Navbar() {
  return (
    <nav className="reg-nav">
      <div className="reg-nav-brand">
        <div className="reg-nav-badge">B</div>
        <div>
          Barbeiro <em>ON</em>
          <small>Plataforma de gestão para barbearias</small>
        </div>
      </div>
      <div className="reg-nav-right">
        Já tem conta?&nbsp;<Link to="/login">Entrar</Link>
      </div>
    </nav>
  );
}

function Steps({ current }) {
  const steps = ['Escolha o Plano', 'Dados do Cadastro'];
  return (
    <div className="reg-steps">
      {steps.map((label, i) => {
        const n = i + 1;
        const cls = n < current ? 'done' : n === current ? 'active' : '';
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div className={`reg-step-item ${cls}`}>
              <div className="reg-step-circle">{n < current ? '✓' : n}</div>
              <span>{label}</span>
            </div>
            {i < steps.length - 1 && <div className="reg-step-line" />}
          </div>
        );
      })}
    </div>
  );
}

export default function Registrar() {
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [priceView, setPriceView] = useState('monthly');
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch('/api/public/plans')
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d?.plans) ? d.plans : [];
        setPlans(list);
        if (list.length > 0) setSelectedPlan(list[0]);
      })
      .catch(() => setPlansError('Não foi possível carregar os planos. Verifique a conexão e recarregue a página.'))
      .finally(() => setLoadingPlans(false));
  }, []);

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: '' }));
  }

  function validate() {
    const e = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.name.trim())                                       e.name            = 'Nome fantasia é obrigatório';
    if (!form.email.trim() || !emailRe.test(form.email))        e.email           = 'Informe um e-mail válido';
    if (!form.phone.trim())                                      e.phone           = 'Telefone é obrigatório';
    if (!form.ownerName.trim())                                  e.ownerName       = 'Nome do responsável é obrigatório';
    if (!form.ownerEmail.trim() || !emailRe.test(form.ownerEmail)) e.ownerEmail   = 'Informe um e-mail válido';
    if (!form.ownerPassword || form.ownerPassword.length < 6)   e.ownerPassword   = 'Senha deve ter no mínimo 6 caracteres';
    if (form.ownerPassword !== form.confirmPassword)             e.confirmPassword = 'Senhas não coincidem';
    if (!form.contractAccepted)                                  e.contractAccepted = 'Você precisa aceitar o contrato para continuar';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      document.querySelector('.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        name: form.name.trim(),
        companyName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        cnpj: form.cnpj.trim() || undefined,
        address: form.address.trim() || undefined,
        neighborhood: form.neighborhood.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state || undefined,
        zipCode: form.zipCode.trim() || undefined,
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim(),
        ownerPhone: form.ownerPhone.trim() || undefined,
        ownerPassword: form.ownerPassword,
        planId: selectedPlan?.id || undefined,
        planType: 'basic',
        billingCycle: form.billingCycle,
        billingDueDay: Number(form.billingDueDay),
      };
      const res = await fetch('/api/tenant/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao realizar cadastro');
      setResult(data);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 1: Plan selection ────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="reg-page">
        <Navbar />
        <div className="reg-body">
          <Steps current={1} />

          <h2 className="reg-title">Escolha o plano ideal</h2>
          <p className="reg-subtitle">Sem fidelidade. Cancele quando quiser.</p>

          <div className="billing-toggle">
            <span className={priceView === 'monthly' ? 'active-label' : ''}>Mensal</span>
            <button
              className={`toggle-pill ${priceView === 'annual' ? 'annual' : ''}`}
              onClick={() => setPriceView(v => v === 'monthly' ? 'annual' : 'monthly')}
              aria-label="Alternar período de cobrança"
            />
            <span className={priceView === 'annual' ? 'active-label' : ''}>Anual</span>
            {priceView === 'annual' && <span className="annual-badge">2 meses grátis</span>}
          </div>

          {loadingPlans && <div className="reg-loading">Carregando planos...</div>}
          {plansError  && <div className="reg-error-state">{plansError}</div>}

          {!loadingPlans && !plansError && (
            <>
              <div className="plans-grid">
                {plans.map(plan => {
                  const monthly = Number(plan.priceMonthly || 0);
                  const annual  = Number(plan.priceAnnual  || 0);
                  const price   = priceView === 'annual' ? annual / 12 : monthly;
                  const { int, dec } = fmtPrice(price);
                  const isSel   = selectedPlan?.id === plan.id;
                  const features = Array.isArray(plan.features) && plan.features.length > 0
                    ? plan.features : [];

                  return (
                    <div
                      key={plan.id}
                      className={`plan-card ${isSel ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <div className="plan-card-header">
                        <span className="plan-card-name">{plan.name}</span>
                        {plan.maxUsers && (
                          <span className="plan-users-badge">
                            até {plan.maxUsers} barbeiro{plan.maxUsers > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="plan-price">
                          <span className="plan-price-cur">R$</span>
                          <span className="plan-price-val">{int}<span style={{ fontSize: '1.2rem' }}>,{dec}</span></span>
                          <span className="plan-price-period">/mês</span>
                        </div>
                        {priceView === 'annual' && annual > 0 && (
                          <div className="plan-price-annual-note">
                            R$ {fmtPrice(annual).full}/ano — 10× o preço mensal
                          </div>
                        )}
                      </div>

                      {features.length > 0 && (
                        <ul className="plan-features">
                          {features.slice(0, 6).map((f, i) => (
                            <li key={i}>
                              <span className="plan-feat-check"><RiCheckLine size={9} /></span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      <button className="plan-select-btn" onClick={e => { e.stopPropagation(); setSelectedPlan(plan); }}>
                        {isSel ? '✓ Selecionado' : 'Selecionar'}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="reg-continue-area">
                <button
                  className="reg-continue-btn"
                  disabled={!selectedPlan}
                  onClick={() => { setStep(2); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Continuar com {selectedPlan?.name || '—'} <RiArrowRightLine />
                </button>
                <span className="reg-login-hint">
                  Já tem conta? <Link to="/login">Entrar</Link>
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Step 3: Success ───────────────────────────────────────────────
  if (step === 3) {
    const t = result?.tenant;
    return (
      <div className="reg-page">
        <Navbar />
        <div className="reg-body">
          <div className="reg-success">
            <div className="reg-success-icon">🎉</div>
            <h2>Cadastro realizado!</h2>
            <p>
              Sua barbearia foi cadastrada com sucesso. Em breve você receberá
              os detalhes de cobrança via WhatsApp.
            </p>
            {t && (
              <div className="reg-success-box">
                <h4>Seus dados de acesso</h4>
                <div className="reg-success-row">
                  <span>Barbearia</span>
                  <span>{t.name}</span>
                </div>
                <div className="reg-success-row">
                  <span>E-mail</span>
                  <span>{result?.adminUser?.email || form.ownerEmail}</span>
                </div>
                <div className="reg-success-row">
                  <span>Plano</span>
                  <span>{selectedPlan?.name || '—'}</span>
                </div>
                <div className="reg-success-row">
                  <span>Cobrança</span>
                  <span>{form.billingCycle === 'annual' ? 'Anual' : 'Mensal'} — dia {form.billingDueDay}</span>
                </div>
              </div>
            )}
            <p style={{ fontSize: '0.82rem' }}>
              Use o e-mail e a senha cadastrados para acessar o sistema.
            </p>
            <Link to="/login" className="reg-login-btn">
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Registration form ─────────────────────────────────────
  const planPrice = selectedPlan
    ? (form.billingCycle === 'annual'
        ? Number(selectedPlan.priceAnnual  || 0) / 12
        : Number(selectedPlan.priceMonthly || 0))
    : 0;

  return (
    <div className="reg-page">
      <Navbar />
      <div className="reg-body">
        <Steps current={2} />

        <form onSubmit={handleSubmit} noValidate className="reg-form-wrapper">

          {selectedPlan && (
            <div className="reg-plan-summary">
              <div className="reg-plan-summary-info">
                <span className="reg-plan-summary-name">{selectedPlan.name}</span>
                <span className="reg-plan-summary-price">
                  R$ {fmtPrice(planPrice).full}/mês
                  {form.billingCycle === 'annual' && ' — cobrança anual'}
                </span>
              </div>
              <button
                type="button"
                className="reg-plan-change"
                onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                Trocar plano
              </button>
            </div>
          )}

          {/* ── Dados da Barbearia ── */}
          <div className="reg-section">
            <h3 className="reg-section-title">Dados da Barbearia</h3>
            <div className="reg-fields">
              <div className="reg-field full">
                <label>Nome fantasia *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  className={errors.name ? 'has-error' : ''} placeholder="Ex: Barbearia do João" autoFocus />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="reg-field">
                <label>E-mail da barbearia *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  className={errors.email ? 'has-error' : ''} placeholder="contato@barbearia.com" />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="reg-field">
                <label>Telefone / WhatsApp *</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  className={errors.phone ? 'has-error' : ''} placeholder="(11) 99999-9999" />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
              <div className="reg-field">
                <label>CNPJ (opcional)</label>
                <input type="text" value={form.cnpj} onChange={e => set('cnpj', e.target.value)}
                  placeholder="00.000.000/0001-00" />
              </div>
              <div className="reg-field full">
                <label>Endereço (rua e número)</label>
                <input type="text" value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="Rua das Flores, 123" />
              </div>
              <div className="reg-field">
                <label>Bairro</label>
                <input type="text" value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)}
                  placeholder="Centro" />
              </div>
              <div className="reg-field">
                <label>Cidade</label>
                <input type="text" value={form.city} onChange={e => set('city', e.target.value)}
                  placeholder="São Paulo" />
              </div>
              <div className="reg-field">
                <label>Estado</label>
                <select value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">Selecione</option>
                  {STATES_BR.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="reg-field">
                <label>CEP</label>
                <input type="text" value={form.zipCode} onChange={e => set('zipCode', e.target.value)}
                  placeholder="00000-000" />
              </div>
            </div>
          </div>

          {/* ── Dados do Responsável ── */}
          <div className="reg-section">
            <h3 className="reg-section-title">Dados do Responsável</h3>
            <div className="reg-fields">
              <div className="reg-field full">
                <label>Nome completo *</label>
                <input type="text" value={form.ownerName} onChange={e => set('ownerName', e.target.value)}
                  className={errors.ownerName ? 'has-error' : ''} placeholder="João da Silva" />
                {errors.ownerName && <span className="field-error">{errors.ownerName}</span>}
              </div>
              <div className="reg-field">
                <label>E-mail de acesso *</label>
                <input type="email" value={form.ownerEmail} onChange={e => set('ownerEmail', e.target.value)}
                  className={errors.ownerEmail ? 'has-error' : ''} placeholder="joao@email.com" />
                {errors.ownerEmail && <span className="field-error">{errors.ownerEmail}</span>}
              </div>
              <div className="reg-field">
                <label>Telefone do responsável</label>
                <input type="tel" value={form.ownerPhone} onChange={e => set('ownerPhone', e.target.value)}
                  placeholder="(11) 99999-9999" />
              </div>
              <div className="reg-field">
                <label>Senha *</label>
                <input type="password" value={form.ownerPassword} onChange={e => set('ownerPassword', e.target.value)}
                  className={errors.ownerPassword ? 'has-error' : ''} placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password" />
                {errors.ownerPassword && <span className="field-error">{errors.ownerPassword}</span>}
              </div>
              <div className="reg-field">
                <label>Confirmar senha *</label>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'has-error' : ''} placeholder="Repita a senha"
                  autoComplete="new-password" />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
            </div>
          </div>

          {/* ── Cobrança ── */}
          <div className="reg-section">
            <h3 className="reg-section-title">Preferências de Cobrança</h3>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
                Periodicidade
              </label>
              <div className="billing-options">
                {[
                  { val: 'monthly', label: 'Mensal',  note: `R$ ${fmtPrice(Number(selectedPlan?.priceMonthly || 0)).full}/mês` },
                  { val: 'annual',  label: 'Anual',   note: `R$ ${fmtPrice(Number(selectedPlan?.priceAnnual  || 0)).full}/ano (2 meses grátis)` },
                ].map(opt => (
                  <div key={opt.val} className={`billing-option ${form.billingCycle === opt.val ? 'selected' : ''}`}
                    onClick={() => set('billingCycle', opt.val)}>
                    <span className="billing-option-label">{opt.label}</span>
                    <span className="billing-option-note">{opt.note}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="reg-fields" style={{ gridTemplateColumns: '180px 1fr' }}>
              <div className="reg-field">
                <label>Dia do vencimento</label>
                <select value={form.billingDueDay} onChange={e => set('billingDueDay', e.target.value)}>
                  {DUE_DAYS.map(d => <option key={d} value={d}>Dia {d}</option>)}
                </select>
              </div>
            </div>
            <div className="pix-notice">
              <span className="pix-notice-icon">💡</span>
              <span className="pix-notice-text">
                <strong>Pagamento exclusivamente via PIX.</strong> A cobrança é enviada via WhatsApp
                no número da barbearia. Não há débito automático — você paga quando receber o aviso.
              </span>
            </div>
          </div>

          {/* ── Contrato ── */}
          <div className="reg-section">
            <h3 className="reg-section-title">Contrato de Prestação de Serviços</h3>
            <div className="contract-box">{CONTRACT}</div>
            <div>
              <label className="contract-check">
                <input type="checkbox" checked={form.contractAccepted}
                  onChange={e => set('contractAccepted', e.target.checked)} />
                <span>
                  Li e aceito os termos do Contrato de Prestação de Serviços, incluindo as condições
                  de cancelamento e pagamento via PIX.
                </span>
              </label>
              {errors.contractAccepted && <div className="contract-error">{errors.contractAccepted}</div>}
            </div>
          </div>

          {/* ── Submit ── */}
          <div className="reg-submit-area">
            {submitError && <div className="reg-submit-error">{submitError}</div>}
            <button type="submit" className="reg-submit-btn" disabled={submitting}>
              {submitting ? 'Cadastrando...' : 'Criar Conta'}
            </button>
            <button type="button" className="reg-back-link"
              onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              ← Voltar para os planos
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
