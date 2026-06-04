import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import { FiUsers, FiCalendar, FiDollarSign, FiScissors, FiAlertCircle, FiPlusCircle, FiX, FiMessageCircle, FiClock, FiAward, FiGift } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const fmtP = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

export default function Dashboard() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { user } = useAuth();
const tenantSlug = slug || user?.tenantSlug || '';
  const [stats,    setStats]    = useState(null);
  const [pending,  setPending]  = useState(0);
  const [nextAppt, setNextAppt] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [bdModal,  setBdModal]  = useState(false);

  const load = useCallback(async () => {
    try {
      const h = { Authorization: `Bearer ${tok()}`, 'Cache-Control': 'no-cache' };
      const [sRes, pRes, ownRes] = await Promise.all([
        fetch('/api/dashboard/stats', { headers: h, cache: 'no-cache' }),
        fetch('/api/appointment/requests/pending/own', { headers: h, cache: 'no-cache' }),
        fetch('/api/appointment/own', { headers: h, cache: 'no-cache' }),
      ]);
      const sd = await sRes.json().catch(() => ({}));
      const pd = await pRes.json().catch(() => ({}));
      const od = await ownRes.json().catch(() => ({}));
      setStats(sd.stats || sd);
      setPending((pd.requests || pd.data || []).length);

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
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 15_000);
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [load]);

  const s = stats || {};
  const birthdays = s.birthdays || [];
  const topSvc    = s.topServices?.[0];

  const STATS = [
    { label: 'Total de Clientes',   value: s.totalClients      ?? '—', icon: FiUsers,       color: '#2563eb' },
    { label: 'Agendamentos Hoje',   value: s.totalAppointments ?? '—', icon: FiCalendar,    color: '#7c3aed' },
    { label: 'Faturamento Mensal',  value: fmtP(s.monthlyRevenue),     icon: FiDollarSign,  color: '#16a34a' },
    { label: 'Serviços Realizados', value: s.servicesPerformed ?? '—', icon: FiScissors,    color: '#f59e0b' },
  ];

  return (
    <Layout>

      <h2 style={{ marginBottom: 20, fontSize: '1.35rem', fontWeight: 700 }}>Dashboard</h2>

      {/* Ações */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/${tenantSlug}/novo-agendamento`)}>
          <FiPlusCircle size={14} /> Novo Agendamento
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

      {loading ? (
        <p style={{ color: 'var(--color-muted)' }}>Carregando...</p>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 28 }}>
            {STATS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
                  <Icon size={17} />
                </div>
                <div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--color-muted)', marginTop: 3 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Info cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>

            {/* Próximo agendamento */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, cursor: 'pointer' }}
                 onClick={() => navigate(`/${tenantSlug}/servico-agendados`)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#2563eb22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <FiClock size={14} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Próximo agendamento</span>
              </div>
              {nextAppt ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{nextAppt.customer?.name || nextAppt.customerPhone || '—'}</div>
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginTop: 4 }}>
                    {nextAppt.service?.name || '—'} · {String(nextAppt.appointmentTime || '').slice(0, 5)}
                  </div>
                </>
              ) : <p style={{ color: 'var(--color-muted)', fontSize: '0.84rem' }}>Nenhum agendamento hoje</p>}
            </div>

            {/* Serviço mais vendido */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#f59e0b22', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                  <FiAward size={14} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Serviço mais vendido</span>
              </div>
              {topSvc ? (
                <>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{topSvc.name || topSvc.serviceName}</div>
                  <div style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginTop: 4 }}>{topSvc.count || topSvc.total || 0} atendimentos</div>
                </>
              ) : <p style={{ color: 'var(--color-muted)', fontSize: '0.84rem' }}>Sem dados</p>}
            </div>

            {/* Aniversariantes */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 20, cursor: birthdays.length > 0 ? 'pointer' : 'default' }}
                 onClick={() => birthdays.length > 0 && setBdModal(true)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#ec489922', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ec4899' }}>
                  <FiGift size={14} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Aniversariantes do Mês</span>
              </div>
              {birthdays.length > 0
                ? <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.95rem' }}>{birthdays.length} cliente{birthdays.length > 1 ? 's' : ''} — clique para ver</div>
                : <p style={{ color: 'var(--color-muted)', fontSize: '0.84rem' }}>Nenhum este mês</p>
              }
            </div>

          </div>
        </>
      )}

      {/* Modal aniversariantes */}
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
