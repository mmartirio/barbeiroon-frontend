import { useState, useCallback, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  RiDashboardLine,
  RiBuildingLine,
  RiPriceTag3Line,
  RiBankCardLine,
  RiUserSettingsLine,
  RiLogoutBoxLine,
  RiMenuLine,
  RiCloseLine,
  RiComputerLine,
  RiTicketLine,
  RiWhatsappLine,
} from 'react-icons/ri';
import { useGestorAuth } from '../../context/GestorAuthContext';
import './Layout.css';

const GESTOR_TOKEN = () => sessionStorage.getItem('gestor_token');

const NAV = [
  { to: '/gestor',               icon: RiDashboardLine,   label: 'Dashboard' },
  { to: '/gestor/empresas',      icon: RiBuildingLine,    label: 'Empresas' },
  { to: '/gestor/monitoramento', icon: RiComputerLine,    label: 'Monitoramento' },
  { to: '/gestor/planos',        icon: RiPriceTag3Line,   label: 'Planos' },
  { to: '/gestor/cobrancas',     icon: RiBankCardLine,    label: 'Cobranças' },
  { to: '/gestor/admins',        icon: RiUserSettingsLine, label: 'Admins' },
  { to: '/gestor/suporte',       icon: RiTicketLine,       label: 'Chamados' },
];

/* ── WhatsApp QR + Pairing modal ── */
function GestorWhatsAppModal({ onClose }) {
  const [tab,         setTab]         = useState('qr');
  const [qrState,     setQrState]     = useState('idle');
  const [qrCode,      setQrCode]      = useState('');
  const [qrMsg,       setQrMsg]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [codeState,   setCodeState]   = useState('idle');
  const [pairingCode, setPairingCode] = useState('');
  const [codeMsg,     setCodeMsg]     = useState('');

  const fetchQr = useCallback(async () => {
    setQrState('loading'); setQrCode(''); setQrMsg('');
    try {
      const r = await fetch('/api/gestor/whatsapp/qrcode', { headers: { Authorization: `Bearer ${GESTOR_TOKEN()}` } });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setQrMsg(d.message || `Erro ${r.status}`); setQrState('error'); return; }
      if (d.connected) { setQrState('connected'); return; }
      if (d.qrcode) {
        setQrCode(d.qrcode.startsWith('data:') ? d.qrcode : `data:image/png;base64,${d.qrcode}`);
        setQrState('qr'); return;
      }
      setQrMsg(d.message || 'QR não disponível. Clique em Atualizar.'); setQrState('pending');
    } catch { setQrMsg('Erro de rede.'); setQrState('error'); }
  }, []);

  const fetchPairing = async () => {
    if (!phone.trim()) { setCodeMsg('Informe o número.'); setCodeState('error'); return; }
    setCodeState('loading'); setPairingCode(''); setCodeMsg('');
    try {
      const r = await fetch('/api/gestor/whatsapp/pairingcode', {
        method: 'POST',
        headers: { Authorization: `Bearer ${GESTOR_TOKEN()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setCodeMsg(d.message || `Erro ${r.status}`); setCodeState('error'); return; }
      if (d.connected) { setCodeState('done'); setCodeMsg('connected'); return; }
      if (d.pairingCode) { setPairingCode(d.pairingCode); setCodeState('done'); return; }
      setCodeMsg(d.message || 'Código não disponível. Tente novamente.'); setCodeState('error');
    } catch { setCodeMsg('Erro de rede.'); setCodeState('error'); }
  };

  useEffect(() => { if (tab === 'qr') fetchQr(); }, [tab, fetchQr]);

  const close = () => { setTab('qr'); setQrState('idle'); setQrCode(''); setQrMsg(''); setCodeState('idle'); setPairingCode(''); setCodeMsg(''); setPhone(''); onClose(); };

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Conectar WhatsApp</h3>
          <button className="modal-close" onClick={close}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {[['qr','📷 QR Code'], ['code','🔢 Código']].map(([k, lbl]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, padding: '0.6rem', fontSize: '0.85rem', fontWeight: 500, background: 'none',
              border: 'none', borderRadius: 0, cursor: 'pointer', marginBottom: -1,
              color: tab === k ? 'var(--accent)' : 'var(--color-muted)',
              borderBottom: tab === k ? '2px solid var(--accent)' : '2px solid transparent',
            }}>{lbl}</button>
          ))}
        </div>

        <div className="modal-body" style={{ alignItems: 'center', textAlign: 'center' }}>
          {/* ── QR ── */}
          {tab === 'qr' && (
            <>
              {qrState === 'loading'   && <p style={{ color: 'var(--color-muted)', padding: '2rem 0' }}>Gerando QR Code...</p>}
              {qrState === 'connected' && <p style={{ color: '#4ade80', fontWeight: 600 }}>✅ WhatsApp conectado!</p>}
              {qrState === 'qr' && (
                <>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                    Abra o WhatsApp → <strong>Aparelhos conectados</strong> → <strong>Conectar aparelho</strong>
                  </p>
                  <div style={{ padding: '0.75rem', background: '#fff', borderRadius: 8, display: 'inline-block' }}>
                    <img src={qrCode} alt="QR WhatsApp" style={{ width: 200, height: 200, display: 'block' }} />
                  </div>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Expira em ~60s</p>
                </>
              )}
              {(qrState === 'pending' || qrState === 'error') && (
                <p style={{ color: qrState === 'error' ? '#f87171' : 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>{qrMsg}</p>
              )}
              {qrState !== 'loading' && qrState !== 'connected' && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: '0.75rem' }} onClick={fetchQr}>Atualizar</button>
              )}
            </>
          )}

          {/* ── Pairing Code ── */}
          {tab === 'code' && codeState !== 'done' && (
            <>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.5 }}>
                Informe o número do WhatsApp. Um código de 8 dígitos será gerado.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <input className="form-input" type="tel" placeholder="Ex: 79991071656" value={phone}
                  onChange={e => setPhone(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchPairing()}
                  disabled={codeState === 'loading'} style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" onClick={fetchPairing} disabled={codeState === 'loading'} style={{ whiteSpace: 'nowrap' }}>
                  {codeState === 'loading' ? 'Aguarde...' : 'Gerar código'}
                </button>
              </div>
              {codeState === 'error' && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '0.75rem' }}>{codeMsg}</p>}
              {codeState === 'loading' && <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Iniciando sessão... aguarde alguns segundos.</p>}
            </>
          )}
          {tab === 'code' && codeState === 'done' && codeMsg === 'connected' && (
            <p style={{ color: '#4ade80', fontWeight: 600 }}>✅ WhatsApp conectado!</p>
          )}
          {tab === 'code' && codeState === 'done' && pairingCode && (
            <>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                No celular: WhatsApp → <strong>Aparelhos conectados</strong> → <strong>Conectar com número de telefone</strong>
              </p>
              <div style={{ background: 'var(--bg-input)', border: '1px solid var(--accent)', borderRadius: 10, padding: '1rem 1.5rem', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginBottom: 4 }}>Código de pareamento</p>
                <p style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, letterSpacing: '0.2em', color: 'var(--accent)' }}>{pairingCode}</p>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.75rem', marginTop: 4 }}>Expira em ~60 segundos</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => { setCodeState('idle'); setPairingCode(''); setCodeMsg(''); }}>Gerar novo código</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useGestorAuth();
  const navigate = useNavigate();
  const [open,       setOpen]       = useState(false);
  const [showWaModal, setShowWaModal] = useState(false);

  function handleLogout() { logout(); navigate('/gestor'); }

  return (
    <div className="layout">
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>
        <div className="sidebar-logo">
          <img src="/icon.png" alt="Barbeiro ON" style={{ height: 32 }} />
          <span>Painel Gestor</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/gestor'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
              onClick={() => setOpen(false)}>
              <Icon size={18} /><span>{label}</span>
            </NavLink>
          ))}
          <button className="nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
            onClick={() => { setOpen(false); setShowWaModal(true); }}>
            <RiWhatsappLine size={18} /><span>WhatsApp</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.email?.[0]?.toUpperCase() ?? 'G'}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name ?? 'Gestor'}</span>
              <span className="sidebar-user-role">Superadmin</span>
            </div>
          </div>
          <button className="nav-item nav-item--logout" onClick={handleLogout}>
            <RiLogoutBoxLine size={18} /><span>Sair</span>
          </button>
        </div>
      </aside>

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}

      <div className="layout-main">
        <header className="layout-header">
          <button className="btn-menu" onClick={() => setOpen(o => !o)}>
            {open ? <RiCloseLine size={20} /> : <RiMenuLine size={20} />}
          </button>
          <span className="header-title">Painel Gestor</span>
        </header>
        <main className="layout-content"><Outlet /></main>
      </div>

      {showWaModal && <GestorWhatsAppModal onClose={() => setShowWaModal(false)} />}
    </div>
  );
}
