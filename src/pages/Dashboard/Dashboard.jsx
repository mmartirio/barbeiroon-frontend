import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import s from './Dashboard.module.css';
import { FiUsers, FiCalendar, FiDollarSign, FiScissors, FiAlertCircle, FiPlusCircle, FiX, FiMessageCircle, FiClock, FiAward, FiGift, FiCheckSquare, FiShoppingBag } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const fmtP = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

export default function Dashboard() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();
  const tenantSlug = slug || user?.tenantSlug || '';
  const [stats,      setStats]      = useState(null);
  const [pending,    setPending]    = useState(0);
  const [nextAppt,   setNextAppt]   = useState(null);
  const [freeSlots,  setFreeSlots]  = useState(null);
  const [vendidos,   setVendidos]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [bdModal,    setBdModal]    = useState(false);
  const [svcModal,   setSvcModal]   = useState(false);

  const canSeePending = user != null && (!user?.isBarber || !!user?.permissions?.canManageTenant);

  const load = useCallback(async () => {
    try {
      const h = { Authorization: `Bearer ${tok()}`, 'Cache-Control': 'no-cache' };
      const today = new Date().toISOString().split('T')[0];
      const [sRes, pRes, ownRes, slotRes, prodRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers: h, cache: 'no-cache' }),
        canSeePending ? fetch('/api/appointment/requests/pending/own', { headers: h, cache: 'no-cache' }) : Promise.resolve(null),
        fetch('/api/appointment/own', { headers: h, cache: 'no-cache' }),
        fetch(`/api/agenda/horarios-livres?periodo=diario&data=${today}`, { headers: h, cache: 'no-cache' }),
        fetch('/api/produtos/vendas?periodo=mensal', { headers: h, cache: 'no-cache' }),
      ]);
      const sd   = await sRes.json().catch(() => ({}));
      const pd   = pRes ? await pRes.json().catch(() => ({})) : {};
      const od   = await ownRes.json().catch(() => ({}));
      const sld  = slotRes.ok  ? await slotRes.json().catch(() => ({}))  : {};
      const prod = prodRes.ok  ? await prodRes.json().catch(() => ({}))  : {};
      setVendidos((prod.data || []).reduce((s, r) => s + Number(r.quantidade_vendida || 0), 0));
      setStats(sd.stats || sd);
      setPending((pd.requests || pd.data || []).length);
      const dias = sld.data || [];
      const totalLivres = dias.reduce((acc, d) => acc + (d.slotsLivres || 0), 0);
      const totalSlots  = dias.reduce((acc, d) => acc + (d.totalSlots  || 0), 0);
      setFreeSlots({ livres: totalLivres, total: totalSlots });
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const upcoming = (od.appointments || [])
        .filter(a => {
          if (a.status === 'cancelado' || a.status === 'concluido') return false;
          const t = String(a.appointmentTime || '').slice(0, 5);
          const [h, m] = t.split(':').map(Number);
          return h * 60 + m >= nowMins;
        })
        .sort((a, b) => String(a.appointmentTime).localeCompare(String(b.appointmentTime)));
      setNextAppt(upcoming[0] || null);
    } finally { setLoading(false); }
  }, [canSeePending]);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);

  const st = stats || {};
  const birthdays = st.birthdays || [];
  const topSvc    = st.topServices?.[0];

  const STATS = [
    { label: 'Total de Clientes',   value: st.totalClients      ?? '—', icon: FiUsers,      color: '#7c3aed' },
    { label: 'Agendamentos Hoje',   value: st.totalAppointments ?? '—', icon: FiCalendar,   color: '#7c3aed' },
    { label: 'Faturamento Mensal',  value: fmtP(st.monthlyRevenue),     icon: FiDollarSign, color: '#f59e0b' },
    { label: 'Serviços Realizados', value: st.servicesPerformed ?? '—', icon: FiScissors,   color: '#f59e0b' },
  ];

  return (
    <Layout>
      {/* ── Hero mobile ──────────────────────────────────── */}
      <div className={s.mobileHero}>
        <div>
          <p className={s.mobileHeroTitle}>Painel do Administrador</p>
          <p className={s.mobileHeroSub}>
            Bem-vindo de volta{user?.name ? `, ${user.name}` : ''}! Aqui está o resumo de hoje.
          </p>
        </div>
        <div className={s.mobileHeroLogo}>
          <img src="/icon.png" alt="Barbeiro ON" style={{ height: 44 }} />
          <span className={s.mobileHeroLogoText}>Barbeiro ON</span>
        </div>
      </div>

      {/* ── Título desktop ──────────────────────────────── */}
      <h2 className={s.desktopTitle} style={{ marginBottom: 20, fontSize: '1.35rem', fontWeight: 700 }}>Dashboard</h2>

      {/* ── Ações ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className={`btn btn-primary ${s.newApptBtn}`}
          onClick={() => {
            const onlyBarber = user?.isBarber && !user?.permissions?.canManageTenant;
            navigate(`/${tenantSlug}/${onlyBarber ? 'disponibilidade' : 'novo-agendamento'}`);
          }}
        >
          + Novo Agendamento
        </button>
        {pending > 0 && (
          <button
            onClick={() => navigate(`/${tenantSlug}/solicitacoes-pendentes`)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--warning-soft)', border: '1px solid var(--warning)', borderRadius: 'var(--radius-sm)', padding: '0.4rem 0.9rem', color: 'var(--warning)', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <FiAlertCircle size={14} /> {pending} solicitação{pending > 1 ? 'ões' : ''} pendente{pending > 1 ? 's' : ''}
          </button>
        )}
      </div>

      {loading ? <p style={{ color: 'var(--color-muted)' }}>Carregando...</p> : (
        <>
          {/* ── Stats ─────────────────────────────────────── */}
          <div className={s.statsGrid}>
            {STATS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={s.statCard} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className={s.statIcon} style={{ background: `${color}22`, color }}>
                  <Icon size={17} />
                </div>
                <div className={s.statBody}>
                  <span className={s.statValue}>{value}</span>
                  <span className={s.statLabel}>{label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Info cards ──────────────────────────────── */}
          <div className={s.infoGrid}>

            <div className={s.infoCard} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer' }}
                 onClick={() => navigate(`/${tenantSlug}/disponibilidade?periodo=diario`)}>
              <div className={s.infoCardHeader}>
                <div style={{ color: '#16a34a' }}><FiCheckSquare size={20} /></div>
                <span className={s.infoCardTitle}>Horários Livres Hoje</span>
              </div>
              {freeSlots !== null ? (
                <>
                  <span className={s.infoCardHighlight} style={{ color: freeSlots.livres > 0 ? '#4ade80' : 'var(--color-muted)' }}>
                    {freeSlots.livres} livre{freeSlots.livres !== 1 ? 's' : ''}
                  </span>
                  <span className={s.infoCardValue}>de {freeSlots.total} horários</span>
                </>
              ) : <span className={s.infoCardValue}>Sem expediente hoje</span>}
            </div>

            <div className={s.infoCard} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
                 onClick={() => navigate(`/${tenantSlug}/servico-agendados`)}>
              <div className={s.infoCardHeader}>
                <div style={{ color: '#2563eb' }}><FiClock size={20} /></div>
                <span className={s.infoCardTitle}>Próximo agendamento</span>
              </div>
              {nextAppt ? (
                <>
                  <span className={s.infoCardHighlight}>{nextAppt.customer?.name || nextAppt.customerPhone || '—'}</span>
                  <span className={s.infoCardValue}>{nextAppt.service?.name || '—'} · {String(nextAppt.appointmentTime || '').slice(0, 5)}</span>
                </>
              ) : <span className={s.infoCardValue}>Nenhum agendamento hoje</span>}
            </div>

            <div className={s.infoCard} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: topSvc ? 'pointer' : 'default' }}
                 onClick={() => topSvc && setSvcModal(true)}>
              <div className={s.infoCardHeader}>
                <div style={{ color: '#f59e0b' }}><FiAward size={20} /></div>
                <span className={s.infoCardTitle}>Serviços mais vendidos</span>
              </div>
              {topSvc
                ? <><span className={s.infoCardHighlight}>{topSvc.name || topSvc.serviceName}</span><span className={s.infoCardValue}>{topSvc.count || topSvc.total || 0} atendimentos</span></>
                : <span className={s.infoCardValue}>Sem dados</span>}
            </div>

            <div className={s.infoCard} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: birthdays.length > 0 ? 'pointer' : 'default' }}
                 onClick={() => birthdays.length > 0 && setBdModal(true)}>
              <div className={s.infoCardHeader}>
                <div style={{ color: '#7c3aed' }}><FiGift size={20} /></div>
                <span className={s.infoCardTitle}>Aniversariantes do Mês</span>
              </div>
              {birthdays.length > 0
                ? <span className={s.infoCardHighlight}>{birthdays.length} cliente{birthdays.length > 1 ? 's' : ''}</span>
                : <span className={s.infoCardValue}>Nenhum aniversariante este mês</span>}
            </div>

            <div className={s.infoCard} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'default' }}>
              <div className={s.infoCardHeader}>
                <div style={{ color: '#7c3aed' }}><FiShoppingBag size={20} /></div>
                <span className={s.infoCardTitle}>Produtos Vendidos</span>
              </div>
              {vendidos === null
                ? <span className={s.infoCardValue}>Carregando...</span>
                : vendidos > 0
                  ? <><span className={s.infoCardHighlight}>{vendidos}</span><span className={s.infoCardValue}>unidades vendidas no mês</span></>
                  : <span className={s.infoCardValue}>Nenhuma venda este mês</span>}
            </div>

          </div>
        </>
      )}

      {svcModal && (
        <div className="modal-overlay" onClick={() => setSvcModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Serviços mais vendidos</h3>
              <button className="modal-close" onClick={() => setSvcModal(false)}><FiX size={18} /></button>
            </div>
            <div className="modal-body">
              {(st.topServices || []).map((svc, i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`;
                const barPct = Math.round((svc.count / (st.topServices[0]?.count || 1)) * 100);
                return (
                  <div key={svc.name} style={{ padding: '0.65rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: i < 3 ? '1.15rem' : '0.85rem', minWidth: 28, textAlign: 'center', fontWeight: 700, color: 'var(--color-muted)' }}>{medal}</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{svc.name}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontWeight: 700, color: 'var(--color)', fontSize: '0.9rem' }}>{svc.count} atend.</span>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted)' }}>{svc.revenue}</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${barPct}%`, height: '100%', background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : i === 2 ? '#b45309' : '#7c3aed', borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {bdModal && (
        <div className="modal-overlay" onClick={() => setBdModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Aniversariantes do Mês</h3>
              <button className="modal-close" onClick={() => setBdModal(false)}><FiX size={18} /></button>
            </div>
            <div className="modal-body">
              {birthdays.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{b.name}</p>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{b.phone} · {b.birthDate ? new Date(b.birthDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}</p>
                  </div>
                  {b.phone && (
                    <a href={`https://wa.me/55${b.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Feliz aniversário, ${b.name}! 🎉`)}`}
                       target="_blank" rel="noreferrer" className="btn btn-success btn-sm">
                      <FiMessageCircle size={13} /> WhatsApp
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
