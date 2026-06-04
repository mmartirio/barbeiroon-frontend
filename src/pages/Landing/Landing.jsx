import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  RiCalendarCheckLine,
  RiWhatsappLine,
  RiGroupLine,
  RiCalendarCloseLine,
  RiBarChartLine,
  RiRocketLine,
  RiArrowRightLine,
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


const NAV_LINKS = ['Recursos', 'Planos', 'Funcionalidades', 'Como funciona', 'Depoimentos'];

const CAL_DAYS = [18,19,20,21,22,23,24];
const APPTS = [
  { time: '09:00', name: 'Ricardo Martins', service: 'Corte + Barba' },
  { time: '10:30', name: 'Lucas Gabriel',   service: 'Corte Degradê' },
  { time: '14:00', name: 'Felipe Augusto',  service: 'Barba' },
];


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
            {[['#60a5fa','Corte','65%'],['#4ade80','Barba','20%'],['#60a5fa','Combo','15%']].map(([color, label, pct]) => (
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
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="lp">
      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <img src="/icon.png" alt="Barbeiro ON" style={{ height: 38 }} />
          <span>Barbeiro <span><em>ON</em></span></span>
        </div>

        <div className="lp-nav-links">
          {NAV_LINKS.map(l => <a key={l} href={`#${l.toLowerCase().replace(' ','-')}`}>{l}</a>)}
        </div>

        <div className="lp-nav-cta">
          <Link to="/login" className="btn-outline" style={{ padding: '9px 18px', fontSize: '0.82rem' }}>
            Entrar
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

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
            <Link to="/registrar">
              <button className="btn-plan-cta">
                Escolha seu plano <RiArrowRightLine />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── App Mobile ── */}
      <section className="lp-app-section" id="app">
        <div className="lp-app-inner">
          <div className="lp-section-eyebrow">Disponível em todas as plataformas</div>
          <h2 className="lp-section-title">Leve a barbearia no bolso</h2>
          <p className="lp-app-sub">Gerencie agendamentos, clientes e relatórios de onde estiver.</p>

          <div className="lp-app-cards">
            {/* Android */}
            <div className="lp-app-card">
              <div className="lp-app-card-icon">🤖</div>
              <h3>Android</h3>
              <p>Baixe o APK e instale diretamente no seu celular Android.</p>
              <a
                href="https://barbeiroon.com/downloads/barbeiroon_1.0.0.apk"
                className="lp-app-btn lp-app-btn-android"
                download
              >
                ⬇ Baixar APK (Android)
              </a>
              <span className="lp-app-version">v1.0.0 · 87 MB</span>
            </div>

            {/* iOS PWA */}
            <div className="lp-app-card">
              <div className="lp-app-card-icon">🍎</div>
              <h3>iPhone (iOS)</h3>
              <p>Instale como app direto pelo Safari, sem precisar da App Store.</p>
              <div className="lp-pwa-steps">
                <div className="lp-pwa-step"><span className="lp-pwa-num">1</span><span>Abra <strong>barbeiroon.com</strong> no <strong>Safari</strong></span></div>
                <div className="lp-pwa-step"><span className="lp-pwa-num">2</span><span>Toque no ícone de compartilhar <strong>⬆</strong> (barra inferior)</span></div>
                <div className="lp-pwa-step"><span className="lp-pwa-num">3</span><span>Role e toque em <strong>"Adicionar à Tela de Início"</strong></span></div>
                <div className="lp-pwa-step"><span className="lp-pwa-num">4</span><span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span></div>
                <div className="lp-pwa-step"><span className="lp-pwa-num">5</span><span>O ícone do app aparece na sua tela inicial 🎉</span></div>
              </div>
              <a href="https://barbeiroon.com/login" className="lp-app-btn lp-app-btn-ios" target="_blank" rel="noopener noreferrer">
                Abrir no Safari
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <footer className="lp-bottom">
        <div className="lp-bottom-inner">
          <div className="lp-bottom-brand">
            <div className="lp-bottom-brand-icon" style={{ background: 'none', border: 'none', padding: 0 }}>
              <img src="/icon.png" alt="Barbeiro ON" style={{ height: 48 }} />
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

        </div>
      </footer>
    </div>
  );
}
