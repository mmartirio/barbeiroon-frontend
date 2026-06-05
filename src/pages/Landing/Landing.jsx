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


const NAV_LINKS = ['Recursos', 'Planos', 'Funcionalidades', 'Como funciona', 'Depoimentos', 'Downloads'];

const CAL_DAYS = [18,19,20,21,22,23,24];
const APPTS = [
  { time: '09:00', name: 'Ricardo Martins', service: 'Corte + Barba' },
  { time: '10:30', name: 'Lucas Gabriel',   service: 'Corte Degradê' },
  { time: '14:00', name: 'Felipe Augusto',  service: 'Barba' },
];


function PhoneFront() {
  return (
    <div className="phone-front phone-screenshot">
      <img
        src="/screenshots/screen-dashboard.png"
        alt="Painel do Barbeiro ON"
        className="phone-screenshot-img"
      />
    </div>
  );
}

function PhoneBack() {
  return (
    <div className="phone-back phone-screenshot">
      <img
        src="/screenshots/screen-relatorios.png"
        alt="Relatórios Barbeiro ON"
        className="phone-screenshot-img"
      />
    </div>
  );
}

const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

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
          {NAV_LINKS.map(l => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/ /g, '-')}`}
              onClick={e => { e.preventDefault(); scrollTo(l.toLowerCase().replace(/ /g, '-')); }}
            >{l}</a>
          ))}
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
        {NAV_LINKS.map(l => (
          <a
            key={l}
            href={`#${l.toLowerCase().replace(/ /g, '-')}`}
            onClick={e => { e.preventDefault(); setMenuOpen(false); scrollTo(l.toLowerCase().replace(/ /g, '-')); }}
          >{l}</a>
        ))}
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
      <section className="lp-app-section" id="downloads">
        <div className="lp-app-inner">
          <div className="lp-section-eyebrow">Disponível em todas as plataformas</div>
          <h2 className="lp-section-title">Leve a barbearia no bolso</h2>
          <p className="lp-app-sub">Gerencie agendamentos, clientes e relatórios de onde estiver.</p>

          <div className="lp-app-cards">
            {/* Android */}
            <div className="lp-app-card">
              <p className="lp-app-card-label">Android</p>
              <p className="lp-app-card-desc">Baixe o APK e instale diretamente no seu celular.</p>
              <a href="https://api-barbeiroon.com.br/downloads/barbeiroon_1.0.1.apk" className="lp-app-btn lp-app-btn-android" download>
                Baixar APK
              </a>
              <span className="lp-app-version">v1.0.1</span>
            </div>

            {/* iOS PWA */}
            <div className="lp-app-card">
              <p className="lp-app-card-label">iPhone (iOS)</p>
              <p className="lp-app-card-desc">Instale pelo Safari, sem App Store.</p>
              <div className="lp-pwa-steps">
                <div className="lp-pwa-step"><span className="lp-pwa-num">1</span><span>Abra <strong>barbeiroon.com</strong> no <strong>Safari</strong></span></div>
                <div className="lp-pwa-step"><span className="lp-pwa-num">2</span><span>Toque no ícone <strong>Compartilhar ⬆</strong> (barra inferior)</span></div>
                <div className="lp-pwa-step"><span className="lp-pwa-num">3</span><span>Toque em <strong>"Adicionar à Tela de Início"</strong></span></div>
                <div className="lp-pwa-step"><span className="lp-pwa-num">4</span><span>Toque em <strong>"Adicionar"</strong></span></div>
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
