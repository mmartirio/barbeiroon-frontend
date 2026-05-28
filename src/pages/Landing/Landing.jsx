import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  RiCalendarCheckLine,
  RiWhatsappLine,
  RiGroupLine,
  RiCalendarCloseLine,
  RiBarChartLine,
  RiRocketLine,
  RiArrowRightLine,
  RiCheckLine,
  RiShieldCheckLine,
  RiScissorsCutLine,
  RiPlayCircleLine,
  RiStarFill,
  RiMenuLine,
  RiCloseLine,
} from 'react-icons/ri';
import './Landing.css';

const FEATURES = [
  { icon: RiCalendarCheckLine, label: 'Agendamentos online' },
  { icon: RiWhatsappLine,      label: 'Notificações via WhatsApp' },
  { icon: RiGroupLine,         label: 'Mais clientes para você' },
  { icon: RiCalendarCloseLine, label: 'Menos cancelamentos e faltas' },
  { icon: RiBarChartLine,      label: 'Organização e produtividade' },
  { icon: RiRocketLine,        label: 'Sua barbearia no próximo nível' },
];

const PLAN_FEATURES = {
  0: ['Agendamentos online', 'Perfil da barbearia', 'Notificações via WhatsApp', 'Agenda e horários', 'Suporte por chat'],
  1: ['Tudo do plano Básico', 'Clientes ilimitados', 'Relatórios de agendamentos', 'Lembretes automáticos (WhatsApp)', 'Controle de cancelamentos', 'Suporte prioritário'],
  2: ['Tudo do plano Profissional', 'Multi barbeiros', 'Dashboard financeiro', 'Promoções e cupons', 'Integração com WhatsApp Business', 'Suporte dedicado'],
};

const PLAN_DESC = [
  'Ideal para barbearias que estão começando.',
  'O plano perfeito para crescer e se organizar.',
  'Para barbearias que querem o máximo de resultados.',
];

const NAV_LINKS = ['Recursos', 'Planos', 'Funcionalidades', 'Como funciona', 'Depoimentos'];

const CAL_DAYS = [18,19,20,21,22,23,24];
const APPTS = [
  { time: '09:00', name: 'Ricardo Martins', service: 'Corte + Barba' },
  { time: '10:30', name: 'Lucas Gabriel',   service: 'Corte Degradê' },
  { time: '14:00', name: 'Felipe Augusto',  service: 'Barba' },
];

function fmtPrice(val) {
  const n = Number(val || 0);
  const [int, dec] = n.toFixed(2).split('.');
  return { int, dec };
}

function PhoneFront() {
  return (
    <div className="phone-front">
      <div className="phone-notch" />
      <div className="phone-screen">
        <div className="app-topbar">
          <div className="app-topbar-logo">B</div>
          <div className="app-topbar-text">
            Olá, João!
            <span>Aqui está o resumo do seu dia.</span>
          </div>
        </div>

        <div className="app-stats-row">
          <div className="app-stat-card">
            <span className="app-stat-val">12</span>
            <span className="app-stat-label">Agendamentos</span>
          </div>
          <div className="app-stat-card">
            <span className="app-stat-val">86</span>
            <span className="app-stat-label">Clientes</span>
          </div>
          <div className="app-stat-card">
            <span className="app-stat-val" style={{ fontSize: 10 }}>R$1.250</span>
            <span className="app-stat-label">Faturamento</span>
          </div>
        </div>

        <div className="app-section-title">Próximos agendamentos</div>
        {APPTS.map((a, i) => (
          <div className="app-appt-item" key={i}>
            <span className="app-appt-time">{a.time}</span>
            <div className="app-appt-info">
              <span className="app-appt-name">{a.name}</span>
              <span className="app-appt-service">{a.service}</span>
            </div>
            <div className="app-appt-wa">W</div>
          </div>
        ))}

        <div className="app-calendar">
          <div className="app-calendar-header">
            <span>Calendário</span>
            <span>Maio 2025</span>
          </div>
          <div className="app-calendar-days">
            {CAL_DAYS.map(d => (
              <div key={d} className={`app-cal-day ${d === 21 ? 'today' : d === 19 || d === 23 ? 'has-appt' : ''}`}>
                {d}
              </div>
            ))}
          </div>
        </div>

        <div className="app-tabbar">
          {[['🏠','Início'],['📅','Agenda'],['➕',''],['👤','Clientes'],['···','Mais']].map(([icon, label], i) => (
            <div key={i} className={`app-tab ${i === 0 ? 'active' : ''}`}>
              <div className="app-tab-icon">{icon}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PhoneBack() {
  return (
    <div className="phone-back">
      <div className="phone-screen" style={{ padding: '20px 10px 10px' }}>
        <div className="phone-back-screen">
          <div className="pbs-title">Desempenho — Este mês</div>
          <div className="pbs-big-num">R$ 12.540</div>
          <div className="pbs-big-sub">+18% em relação ao mês anterior</div>
          <div className="pbs-bars">
            {[35, 50, 42, 65, 48, 72, 60, 88].map((h, i) => (
              <div key={i} className="pbs-bar" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="pbs-legend">
            {[['#a78bfa','Corte','65%'],['#4ade80','Barba','20%'],['#60a5fa','Combo','15%']].map(([color, label, pct]) => (
              <div className="pbs-legend-item" key={label}>
                <div className="pbs-legend-dot" style={{ background: color }} />
                <span>{label}</span>
                <span className="pbs-pct">{pct}</span>
              </div>
            ))}
          </div>
          <div className="pbs-attendance">
            <div className="pbs-att-val">87%</div>
            <span className="pbs-att-label">Taxa de comparecimento</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [plans, setPlans] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/public/plans')
      .then(r => r.json())
      .then(d => setPlans(Array.isArray(d?.plans) ? d.plans : []))
      .catch(() => {});
  }, []);

  const displayPlans = plans.length > 0
    ? plans
    : [
        { id: 1, name: 'Básico',         priceMonthly: 39.9,  sortOrder: 0 },
        { id: 2, name: 'Profissional',   priceMonthly: 69.9,  sortOrder: 1 },
        { id: 3, name: 'Premium',        priceMonthly: 99.9,  sortOrder: 2 },
      ];

  const featuredIdx = Math.floor(displayPlans.length / 2);

  return (
    <div className="lp">
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <div className="lp-nav-logo-badge">B</div>
          <span>Barbeiro <span><em>ON</em></span></span>
        </div>

        <div className="lp-nav-links">
          {NAV_LINKS.map(l => <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`}>{l}</a>)}
        </div>

        <div className="lp-nav-cta">
          <Link to="/login" className="btn-outline" style={{ padding: '9px 18px', fontSize: '0.82rem' }}>
            Entrar
          </Link>
          <Link to="/registrar" className="btn-primary">
            Começar agora <RiArrowRightLine />
          </Link>
          <button className="lp-menu-btn" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`lp-nav-mobile ${menuOpen ? 'open' : ''}`}>
        {NAV_LINKS.map(l => <a key={l} href="#" onClick={() => setMenuOpen(false)}>{l}</a>)}
        <Link to="/login" onClick={() => setMenuOpen(false)} style={{ color: '#94a3b8' }}>Entrar</Link>
        <Link to="/registrar" onClick={() => setMenuOpen(false)} style={{ color: '#4ade80', fontWeight: 700 }}>
          Começar agora →
        </Link>
      </div>

      {/* ── Hero ── */}
      <section className="lp-hero" id="recursos">
        <div className="lp-hero-inner">
          <div className="lp-hero-left">
            <div className="lp-hero-badge">
              <RiScissorsCutLine size={13} />
              Software para barbeiros
            </div>

            <h1 className="lp-hero-title">
              Barbeiro<br /><em>ON</em>
            </h1>

            <p className="lp-hero-sub">
              Seu cliente <em>a um clique</em>
            </p>

            <p className="lp-hero-desc">
              O nosso software agenda a sua barbearia e se conecta
              com mais clientes, gerenciando os agendamentos,
              diminuindo os cancelamentos e organizando os seus
              horários. Utilizando o{' '}
              <span className="whatsapp-mention">whatsapp</span>{' '}
              para auxiliar nas notificações com o cliente e muito mais.
            </p>

            <div className="lp-hero-btns">
              <Link to="/registrar" className="btn-hero-primary">
                Começar agora <RiArrowRightLine />
              </Link>
              <button className="btn-hero-outline">
                <div className="btn-play-circle">
                  <RiPlayCircleLine size={12} />
                </div>
                Ver como funciona
              </button>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-hero-glow" />
            <PhoneBack />
            <PhoneFront />
          </div>
        </div>
      </section>

      {/* ── Features strip ── */}
      <section className="lp-features" id="funcionalidades">
        <div className="lp-features-inner">
          {FEATURES.map(({ icon: Icon, label }) => (
            <div className="feature-item" key={label}>
              <div className="feature-icon">
                <Icon />
              </div>
              <span className="feature-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="lp-pricing" id="planos">
        <div className="lp-pricing-inner">
          <div className="lp-section-eyebrow">Planos para sua barbearia</div>
          <h2 className="lp-section-title">Escolha o plano ideal para você</h2>

          <div className="lp-plans-grid">
            {displayPlans.map((plan, i) => {
              const isFeatured = i === featuredIdx;
              const { int, dec } = fmtPrice(plan.priceMonthly);
              const features = Array.isArray(plan.features) && plan.features.length > 0
                ? plan.features
                : PLAN_FEATURES[i] || PLAN_FEATURES[0];

              return (
                <div key={plan.id} className={`plan-card-lp ${isFeatured ? 'featured' : ''}`}>
                  {isFeatured && <div className="plan-featured-badge">Mais escolhido</div>}

                  <div className="plan-lp-header">
                    <div className="plan-lp-name">{plan.name.toUpperCase()}</div>
                    <p className="plan-lp-desc">{PLAN_DESC[i] || PLAN_DESC[0]}</p>
                  </div>

                  <div className="plan-lp-price">
                    <div className="plan-lp-price-row">
                      <span className="plan-lp-currency">R$</span>
                      <span className="plan-lp-amount">{int}</span>
                      <span className="plan-lp-currency" style={{ alignSelf: 'flex-end', marginBottom: 4 }}>,{dec}</span>
                    </div>
                    <span className="plan-lp-period">/mês</span>
                  </div>

                  <ul className="plan-lp-features">
                    {features.map((f, fi) => (
                      <li key={fi}>
                        <div className="plan-check"><RiCheckLine size={10} /></div>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link to={`/registrar`}>
                    <button className="plan-lp-btn">
                      Escolher {plan.name}
                    </button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <footer className="lp-bottom">
        <div className="lp-bottom-inner">
          <div className="lp-bottom-brand">
            <div className="lp-bottom-brand-icon">
              <RiScissorsCutLine />
            </div>
            <div className="lp-bottom-brand-text">
              <p>Barbearia organizada.</p>
              <span>Mais clientes. Mais resultados.</span>
            </div>
          </div>

          <div className="lp-bottom-social">
            <div className="lp-bottom-avatars">
              {['J','M','R'].map(l => (
                <div className="lp-avatar" key={l}>{l}</div>
              ))}
            </div>
            <div className="lp-bottom-stars">
              {[1,2,3,4,5].map(n => <RiStarFill key={n} />)}
            </div>
            <p>Barbeiros que já usam<br />e recomendam o Barbeiro ON</p>
          </div>

          <div className="lp-bottom-cta">
            <Link to="/registrar" className="btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem' }}>
              Começar agora <RiArrowRightLine />
            </Link>
            <div className="lp-bottom-secure">
              <RiShieldCheckLine size={14} />
              Cancelamento fácil e seguro
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
