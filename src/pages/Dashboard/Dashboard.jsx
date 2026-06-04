import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import s from './Dashboard.module.css';
import { FiUsers, FiCalendar, FiDollarSign, FiScissors, FiAlertCircle, FiPlusCircle, FiX, FiMessageCircle } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const fmtP  = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

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
    { label: 'Total de Clientes',    value: s.totalClients       ?? '—', icon: <FiUsers size={20} />,       color: '#22c55e' },
    { label: 'Agendamentos Hoje',    value: s.totalAppointments  ?? '—', icon: <FiCalendar size={20} />,    color: '#2563eb' },
    { label: 'Faturamento Mensal',   value: fmtP(s.monthlyRevenue),      icon: <FiDollarSign size={20} />,  color: '#16a34a' },
    { label: 'Serviços Realizados',  value: s.servicesPerformed  ?? '—', icon: <FiScissors size={20} />,    color: '#ee4c02' },
  ];

  return (
    <Layout title={`Painel do Barbeiro${user?.name ? ` — ${user.name}` : ''}`}>
      {/* Top actions */}
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
        <div className="empty-state"><p>Carregando...</p></div>
      ) : (
        <>
          {/* Stats grid */}
          <div className={s.statsGrid}>
            {STATS.map(st => (
              <div key={st.label} className="card">
                <div className={`card-body ${s.statCard}`}>
                  <div className={s.statIcon} style={{ background: `${st.color}22`, color: st.color }}>
                    {st.icon}
                  </div>
                  <div>
                    <p className={s.statLabel}>{st.label}</p>
                    <p className={s.statValue}>{st.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compact info row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Next appointment */}
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/${tenantSlug}/servico-agendados`)}>
              <div className="card-header"><p className="card-title">Próximo agendamento</p></div>
              <div className="card-body">
                {nextAppt ? (
                  <>
                    <p style={{ fontWeight: 600 }}>{nextAppt.customer?.name || nextAppt.customerPhone || '—'}</p>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>
                      {nextAppt.service?.name || '—'} · {String(nextAppt.appointmentTime || '').slice(0, 5)}
                    </p>
                  </>
                ) : <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Nenhum agendamento hoje</p>}
              </div>
            </div>

            {/* Top service */}
            <div className="card">
              <div className="card-header"><p className="card-title">Serviço mais vendido</p></div>
              <div className="card-body">
                {topSvc ? (
                  <>
                    <p style={{ fontWeight: 600 }}>{topSvc.name || topSvc.serviceName}</p>
                    <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{topSvc.count || topSvc.total || 0} atendimentos</p>
                  </>
                ) : <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Sem dados</p>}
              </div>
            </div>

            {/* Birthdays */}
            <div className="card" style={{ cursor: birthdays.length > 0 ? 'pointer' : 'default' }} onClick={() => birthdays.length > 0 && setBdModal(true)}>
              <div className="card-header"><p className="card-title">Aniversariantes do Mês</p></div>
              <div className="card-body">
                {birthdays.length > 0 ? (
                  <p style={{ fontWeight: 600, color: 'var(--accent)' }}>{birthdays.length} cliente{birthdays.length > 1 ? 's' : ''} — clique para ver</p>
                ) : <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Nenhum este mês</p>}
              </div>
            </div>
          </div>

        </>
      )}

      {/* Birthdays modal */}
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
                    <a
                      href={`https://wa.me/55${b.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Feliz aniversário, ${b.name}! 🎉`)}`}
                      target="_blank" rel="noreferrer"
                      className="btn btn-success btn-sm"
                    >
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
