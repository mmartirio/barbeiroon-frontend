import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiSearch } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const tok = () => sessionStorage.getItem('token');
const BASE = '/api';
const fmtP = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));
const fmtDate = (v) => { if (!v) return ''; const [y, m, d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };

const STATUS_LABEL = { completed: 'Concluído', canceled: 'Cancelado', scheduled: 'Agendado' };
const STATUS_BADGE = { completed: 'badge-green', canceled: 'badge-red', scheduled: 'badge-blue' };

const PALETTE = ['#2563eb','#ee4c02','#16a34a','#f59e0b','#8b5cf6','#ec4899','#14b8a6','#f97316','#06b6d4','#84cc16'];

export default function Relatorios() {
  const [appointments, setAppointments] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [customers,    setCustomers]   = useState([]);
  const [services,     setServices]    = useState([]);
  const [loading,      setLoading]     = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const [filters, setFilters] = useState({ startDate: firstOfMonth, endDate: today, professionalId: '', customerId: '', serviceId: '' });

  const setF = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate)     params.set('startDate', filters.startDate);
      if (filters.endDate)       params.set('endDate', filters.endDate);
      if (filters.professionalId) params.set('professionalId', filters.professionalId);
      if (filters.customerId)    params.set('customerId', filters.customerId);
      if (filters.serviceId)     params.set('serviceId', filters.serviceId);
      params.set('limit', '500');
      const res = await fetch(`${BASE}/report/appointments?${params}`, { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setAppointments(d.appointments || d.data || []);
    } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => {
    Promise.all([
      fetch(`${BASE}/user/users?isBarber=true&limit=100`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE}/customer/customers?limit=500`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json()).catch(() => ({})),
      fetch(`${BASE}/service/services?limit=200`, { headers: { Authorization: `Bearer ${tok()}` } }).then(r => r.json()).catch(() => ({})),
    ]).then(([u, c, sv]) => {
      setProfessionals(u.users || u.data || []);
      setCustomers(c.customers || c.data || []);
      setServices(sv.services || sv.data || []);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const completed  = appointments.filter(a => a.status === 'completed');
  const canceled   = appointments.filter(a => a.status === 'canceled');
  const scheduled  = appointments.filter(a => a.status === 'scheduled');
  const totalRev   = completed.reduce((s, a) => s + Number(a.price || a.servicePrice || 0), 0);

  const byService = completed.reduce((acc, a) => {
    const name = a.serviceName || a.service?.name || 'Sem serviço';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const serviceLabels = Object.keys(byService);
  const serviceData   = Object.values(byService);

  const byProf = completed.reduce((acc, a) => {
    const name = a.professionalName || a.professional?.name || 'Sem profissional';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  const profLabels = Object.keys(byProf);
  const profData   = Object.values(byProf);

  const chartOpts = { plugins: { legend: { labels: { color: '#fff', font: { size: 12 } } } }, maintainAspectRatio: false };
  const barOpts   = { ...chartOpts, scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.05)' } } } };

  return (
    <Layout title="Relatórios">
      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className="form-field" style={{ margin: 0 }}><label className="form-label">Data início</label><input className="form-input" type="date" value={filters.startDate} onChange={e => setF('startDate', e.target.value)} /></div>
            <div className="form-field" style={{ margin: 0 }}><label className="form-label">Data fim</label><input className="form-input" type="date" value={filters.endDate} onChange={e => setF('endDate', e.target.value)} /></div>
            <div className="form-field" style={{ margin: 0 }}>
              <label className="form-label">Profissional</label>
              <select className="form-input" value={filters.professionalId} onChange={e => setF('professionalId', e.target.value)}>
                <option value="">Todos</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ margin: 0 }}>
              <label className="form-label">Cliente</label>
              <select className="form-input" value={filters.customerId} onChange={e => setF('customerId', e.target.value)}>
                <option value="">Todos</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-field" style={{ margin: 0 }}>
              <label className="form-label">Serviço</label>
              <select className="form-input" value={filters.serviceId} onChange={e => setF('serviceId', e.target.value)}>
                <option value="">Todos</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={load} disabled={loading} style={{ height: 40 }}><FiSearch size={14} style={{ marginRight: 4 }} />Filtrar</button>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'Total', value: appointments.length, badge: 'badge-blue' },
          { label: 'Concluídos', value: completed.length, badge: 'badge-green' },
          { label: 'Cancelados', value: canceled.length, badge: 'badge-red' },
          { label: 'Agendados', value: scheduled.length, badge: 'badge-amber' },
          { label: 'Receita', value: fmtP(totalRev), badge: 'badge-green' },
        ].map(card => (
          <div key={card.label} className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{card.label}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 700 }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      {!loading && completed.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Serviços (concluídos)</h3></div>
            <div className="card-body" style={{ height: 220 }}>
              <Pie data={{ labels: serviceLabels, datasets: [{ data: serviceData, backgroundColor: PALETTE }] }} options={chartOpts} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="card-title">Por profissional</h3></div>
            <div className="card-body" style={{ height: 220 }}>
              <Bar data={{ labels: profLabels, datasets: [{ label: 'Atendimentos', data: profData, backgroundColor: PALETTE }] }} options={barOpts} />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && appointments.length === 0 && <div className="empty-state"><p>Nenhum agendamento no período</p></div>}

      {!loading && appointments.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Data</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Valor</th><th>Status</th></tr></thead>
            <tbody>
              {appointments.map(a => (
                <tr key={a.id}>
                  <td style={{ fontSize: '0.85rem' }}>{fmtDate(a.date || a.scheduledAt)}</td>
                  <td><span style={{ fontWeight: 600 }}>{a.customerName || a.customer?.name || '—'}</span></td>
                  <td>{a.serviceName || a.service?.name || '—'}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{a.professionalName || a.professional?.name || '—'}</td>
                  <td>{fmtP(a.price || a.servicePrice)}</td>
                  <td><span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>{STATUS_LABEL[a.status] || a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
