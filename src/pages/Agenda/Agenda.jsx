import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';

const tok = () => sessionStorage.getItem('token');
const BASE = '/api';

const DAYS = [
  { key: 'monday',    label: 'Segunda-feira' },
  { key: 'tuesday',   label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday',  label: 'Quinta-feira' },
  { key: 'friday',    label: 'Sexta-feira' },
  { key: 'saturday',  label: 'Sábado' },
  { key: 'sunday',    label: 'Domingo' },
];

const defaultDay = () => ({ enabled: false, open: '08:00', close: '18:00', breakStart: '', breakEnd: '' });

const defaultSchedule = () => Object.fromEntries(DAYS.map(d => [d.key, defaultDay()]));

export default function Agenda() {
  const [schedule, setSchedule] = useState(defaultSchedule());
  const [interval, setInterval_] = useState(30);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [msg,      setMsg]      = useState({ type: '', text: '' });

  useEffect(() => {
    fetch(`${BASE}/agenda`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).catch(() => ({}))
      .then(d => {
        const data = d.agenda || d.schedule || d;
        if (data && typeof data === 'object') {
          const merged = defaultSchedule();
          DAYS.forEach(({ key }) => {
            if (data[key]) merged[key] = { ...defaultDay(), ...data[key] };
          });
          setSchedule(merged);
          if (data.interval || d.interval) setInterval_(data.interval || d.interval || 30);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const setDay = (dayKey, field, value) => setSchedule(p => ({ ...p, [dayKey]: { ...p[dayKey], [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg({ type: '', text: '' });
    setSaving(true);
    try {
      const res = await fetch(`${BASE}/agenda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ ...schedule, interval }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro ao salvar'); }
      setMsg({ type: 'success', text: 'Agenda salva com sucesso!' });
    } catch (err) { setMsg({ type: 'error', text: err.message }); }
    finally { setSaving(false); }
  };

  if (loading) return <Layout title="Agenda"><div className="empty-state"><p>Carregando...</p></div></Layout>;

  return (
    <Layout title="Configuração da Agenda">
      <div style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>{msg.text}</div>}

          {/* Interval */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-body">
              <div className="form-field" style={{ margin: 0 }}>
                <label className="form-label">Intervalo entre horários</label>
                <select className="form-input" style={{ maxWidth: 180 }} value={interval} onChange={e => setInterval_(Number(e.target.value))}>
                  {[15, 20, 30, 45, 60].map(v => <option key={v} value={v}>{v} minutos</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Days */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {DAYS.map(({ key, label }) => {
              const day = schedule[key];
              return (
                <div key={key} className="card">
                  <div className="card-body">
                    {/* Day toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: day.enabled ? '0.75rem' : 0 }}>
                      <input
                        type="checkbox" id={key} checked={day.enabled}
                        onChange={e => setDay(key, 'enabled', e.target.checked)}
                        style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                      />
                      <label htmlFor={key} style={{ fontWeight: 600, cursor: 'pointer', flex: 1 }}>{label}</label>
                      {!day.enabled && <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Fechado</span>}
                    </div>

                    {day.enabled && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 0.75rem' }}>
                        <div className="form-field" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Abertura</label>
                          <input className="form-input" type="time" value={day.open} onChange={e => setDay(key, 'open', e.target.value)} />
                        </div>
                        <div className="form-field" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Fechamento</label>
                          <input className="form-input" type="time" value={day.close} onChange={e => setDay(key, 'close', e.target.value)} />
                        </div>
                        <div className="form-field" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Pausa início</label>
                          <input className="form-input" type="time" value={day.breakStart} onChange={e => setDay(key, 'breakStart', e.target.value)} placeholder="--:--" />
                        </div>
                        <div className="form-field" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Pausa fim</label>
                          <input className="form-input" type="time" value={day.breakEnd} onChange={e => setDay(key, 'breakEnd', e.target.value)} placeholder="--:--" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={saving}>{saving ? 'Salvando...' : 'Salvar agenda'}</button>
        </form>
      </div>
    </Layout>
  );
}
