import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { FiPlus, FiAlertCircle, FiX } from 'react-icons/fi';
import s from './Dashboard.module.css';

const tok = () => sessionStorage.getItem('token');
const fmtCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));
const fmtDate = (v) => { if (!v) return ''; const [y,m,d] = String(v).split('-'); return `${d}/${m}/${y}`; };

const statusLabel = { confirmed: 'Confirmado', pending: 'Pendente', cancelled: 'Cancelado', completed: 'Concluído', agendado: 'Agendado', concluido: 'Concluído', cancelado: 'Cancelado' };
const statusClass = { confirmed: 'badge-green', pending: 'badge-amber', cancelled: 'badge-red', completed: 'badge-blue', agendado: 'badge-blue', concluido: 'badge-green', cancelado: 'badge-red' };

function StatCard({ title, value, icon, loading }) {
  return (
    <div className={s.statCard}>
      <div className={s.statIcon}>{icon}</div>
      <div className={s.statBody}>
        <span className={s.statTitle}>{title}</span>
        <span className={s.statValue}>{loading ? '—' : value}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, authReady, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats]   = useState({ totalClients: 0, totalAppointments: 0, monthlyRevenue: 0, servicesPerformed: 0, loading: true });
  const [recent, setRecent] = useState([]);
  const [topSvc, setTopSvc] = useState(null);
  const [birthdays, setBirthdays] = useState([]);
  const [pending, setPending]     = useState(0);
  const [showBirthdays, setShowBirthdays] = useState(false);

  const load = useCallback(async (t) => {
    try {
      const res = await fetch('/api/dashboard/stats', { headers: { Authorization: `Bearer ${t}` } });
      if (!res.ok) return;
      const d = await res.json();
      setStats({
        totalClients:       Number(d.totalClients ?? 0),
        totalAppointments:  Number(d.totalAppointments ?? 0),
        monthlyRevenue:     Number(d.monthlyRevenue ?? 0),
        servicesPerformed:  Number(d.servicesPerformed ?? 0),
        loading: false,
      });
      setRecent(Array.isArray(d.recentAppointments) ? d.recentAppointments : []);
      setTopSvc(Array.isArray(d.topServices) && d.topServices[0] ? d.topServices[0] : null);
      setBirthdays(Array.isArray(d.birthdays) ? d.birthdays : []);
    } catch { /* noop */ }
  }, []);

  const loadPending = useCallback(async (t) => {
    try {
      const isAdmin = !!user?.permissions?.canViewAppointments;
      const url = isAdmin ? '/api/appointment/requests/pending' : '/api/appointment/requests/pending/own';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${t}` } });
      const d   = await res.json().catch(() => ({}));
      setPending((d.requests || []).length);
    } catch { /* noop */ }
  }, [user?.permissions?.canViewAppointments]);

  useEffect(() => {
    if (!authReady) return;
    const t = sessionStorage.getItem('token') || token;
    if (!t) return;
    load(t); loadPending(t);
    const id = setInterval(() => { load(t); loadPending(t); }, 15000);
    const onVis = () => { if (document.visibilityState === 'visible') { load(t); loadPending(t); } };
    document.addEventListener('visibilitychange', onVis);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis); };
  }, [authReady, token, load, loadPending]);

  return (
    <Layout>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Dashboard</h1>
          <p className={s.sub}>Bem-vindo de volta, {user?.name?.split(' ')[0] || 'Admin'}!</p>
        </div>
        <button className={`btn btn-primary ${s.newBtn}`} onClick={() => navigate('/novo-agendamento')}>
          <FiPlus size={16} /> Novo Agendamento
        </button>
      </div>

      {pending > 0 && (
        <div className={s.pendingBanner} onClick={() => navigate('/solicitacoes-pendentes')}>
          <FiAlertCircle size={18} />
          <span>{pending} solicitação{pending > 1 ? 'ões' : ''} aguardando aprovação</span>
          <span className={s.pendingArrow}>→</span>
        </div>
      )}

      <div className={s.statsGrid}>
        <StatCard title="Total de Clientes"    value={stats.totalClients}              icon="👥" loading={stats.loading} />
        <StatCard title="Agendamentos Hoje"    value={stats.totalAppointments}         icon="📅" loading={stats.loading} />
        <StatCard title="Faturamento Mensal"   value={fmtCurrency(stats.monthlyRevenue)} icon="💰" loading={stats.loading} />
        <StatCard title="Serviços Realizados"  value={stats.servicesPerformed}         icon="✂️" loading={stats.loading} />
      </div>

      <div className={s.grid}>
        {/* Próximos Agendamentos */}
        <div className="card">
          <div className="card-header"><span className="card-title">Próximos Agendamentos</span></div>
          <div className="card-body" style={{ padding: 0 }}>
            {recent.length === 0
              ? <div className="empty-state" style={{ padding: '2rem' }}><p>Nenhum agendamento próximo</p></div>
              : recent.map(a => (
                <div key={a.id} className={s.apptRow}>
                  <div className={s.apptInfo}>
                    <span className={s.apptClient}>{a.client || a.customerName || 'Cliente'}</span>
                    <span className={s.apptSvc}>{a.service || a.serviceName}</span>
                  </div>
                  <div className={s.apptMeta}>
                    <span className={s.apptTime}>🕐 {a.time || a.appointmentTime}</span>
                    <span className={`badge ${statusClass[a.status] || 'badge-gray'}`}>{statusLabel[a.status] || a.status}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Serviço Top */}
        <div className="card">
          <div className="card-header"><span className="card-title">Serviço mais vendido</span></div>
          <div className="card-body">
            {topSvc
              ? <div className={s.topSvc}>
                  <span className={s.topSvcIcon}>✂️</span>
                  <div>
                    <div className={s.topSvcName}>{topSvc.name}</div>
                    <div className={s.topSvcMeta}>{topSvc.count} solicitações · {topSvc.revenue || ''}</div>
                  </div>
                </div>
              : <div className="empty-state"><p>Sem dados</p></div>
            }
          </div>
        </div>

        {/* Aniversariantes */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => setShowBirthdays(true)}>
          <div className="card-header"><span className="card-title">Aniversariantes do Mês</span></div>
          <div className="card-body" style={{ padding: '0.75rem 1.25rem' }}>
            {birthdays.length === 0
              ? <div className="empty-state" style={{ padding: '1.5rem 0' }}><p>Nenhum aniversariante</p></div>
              : <>
                  {birthdays.slice(0, 3).map((b, i) => (
                    <div key={i} className={s.birthdayRow}>
                      <span>🎂</span>
                      <div><div className={s.bdName}>{b.name}</div><div className={s.bdDate}>{fmtDate(b.date) || b.date}</div></div>
                    </div>
                  ))}
                  {birthdays.length > 3 && <p className={s.bdMore}>+ {birthdays.length - 3} mais — clique para ver todos</p>}
                </>
            }
          </div>
        </div>
      </div>

      {/* Birthdays modal */}
      {showBirthdays && (
        <div className="modal-overlay" onClick={() => setShowBirthdays(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Aniversariantes do Mês</h3>
              <button className="modal-close" onClick={() => setShowBirthdays(false)}><FiX size={18} /></button>
            </div>
            <div className="modal-body">
              {birthdays.map((b, i) => (
                <div key={i} className={s.birthdayRow} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                  <span>🎂</span>
                  <div><div className={s.bdName}>{b.name}</div><div className={s.bdDate}>{fmtDate(b.date) || b.date}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
