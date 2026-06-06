import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const DIAS = [
  { label: 'Domingo',  value: 0 },
  { label: 'Segunda',  value: 1 },
  { label: 'Terça',    value: 2 },
  { label: 'Quarta',   value: 3 },
  { label: 'Quinta',   value: 4 },
  { label: 'Sexta',    value: 5 },
  { label: 'Sábado',   value: 6 },
];

const DEFAULT_INICIO = '08:00';
const DEFAULT_FIM    = '18:00';
const DEFAULT_ALM_I  = '12:00';
const DEFAULT_ALM_F  = '13:00';

const makeDiaSchedule = () =>
  DIAS.map(d => ({
    diaSemana:        d.value,
    ativo:            false,
    inicioExpediente: DEFAULT_INICIO,
    fimExpediente:    DEFAULT_FIM,
    inicioAlmoco:     DEFAULT_ALM_I,
    fimAlmoco:        DEFAULT_ALM_F,
  }));

// Gera todas as datas de um dia da semana de hoje até o fim do próximo ano
const generateWeekdayDates = (weekday) => {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today.getFullYear() + 1, 11, 31); // 31/12 do próximo ano
  const cur = new Date(today);
  while (cur <= end) {
    if (cur.getDay() === weekday) {
      dates.push(cur.toISOString().slice(0, 10));
    }
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

const toHHMM = (v) => /^\d{2}:\d{2}$/.test(String(v || '').trim()) ? v.trim() : null;

export default function Agenda() {
  const [barbers,     setBarbers]     = useState([]);
  const [profId,      setProfId]      = useState('');
  const [applyToAll,  setApplyToAll]  = useState(false);
  const [showProf,    setShowProf]    = useState(false);
  const [loadingProf, setLoadingProf] = useState(false);

  // Horário por dia da semana
  const [diaSchedule,     setDiaSchedule]     = useState(makeDiaSchedule);
  const [loadingDiaSched, setLoadingDiaSched] = useState(false);
  const [savingDiaSched,  setSavingDiaSched]  = useState(false);

  // Calendário de datas específicas (compõe o card de horário por dia)
  const [diasCal,  setDiasCal]  = useState([]);
  const [calYear,  setCalYear]  = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [loadingCal, setLoadingCal] = useState(false);

  // Indisponibilidade
  const [indDia,    setIndDia]    = useState('');
  const [indIni,    setIndIni]    = useState('');
  const [indFim,    setIndFim]    = useState('');
  const [indMotivo, setIndMotivo] = useState('');
  const [indList,   setIndList]   = useState([]);

  // Encerramento antecipado
  const [encDia,    setEncDia]    = useState('');
  const [encHora,   setEncHora]   = useState('');
  const [encMotivo, setEncMotivo] = useState('');

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // ── Carrega barbeiros ────────────────────────────────────────────────────────
  const loadBarbers = useCallback(async () => {
    setLoadingProf(true);
    try {
      const res  = await fetch('/api/user/users?limit=200', { headers: { Authorization: `Bearer ${tok()}` } });
      const d    = await res.json().catch(() => ({}));
      const list = (d.users || []).filter(u => !!u.isBarber);
      setBarbers(list);
      if (list.length > 0 && !profId) setProfId(String(list[0].id));
    } finally { setLoadingProf(false); }
  }, [profId]);

  // ── Carrega horário por dia ───────────────────────────────────────────────────
  const loadDiaSchedule = useCallback(async (id) => {
    if (!id) return;
    setLoadingDiaSched(true);
    try {
      const res = await fetch(`/api/agenda/dia-schedule?professionalId=${id}`, { headers: { Authorization: `Bearer ${tok()}` } });
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        if (Array.isArray(d.schedule) && d.schedule.length === 7) {
          setDiaSchedule(d.schedule.map(s => ({
            ...s,
            inicioExpediente: s.inicioExpediente || DEFAULT_INICIO,
            fimExpediente:    s.fimExpediente    || DEFAULT_FIM,
            inicioAlmoco:     s.inicioAlmoco     || DEFAULT_ALM_I,
            fimAlmoco:        s.fimAlmoco        || DEFAULT_ALM_F,
          })));
          return;
        }
      }
      setDiaSchedule(makeDiaSchedule());
    } finally { setLoadingDiaSched(false); }
  }, []);

  // ── Carrega calendário ────────────────────────────────────────────────────────
  const loadCalendario = useCallback(async (id) => {
    setLoadingCal(true);
    try {
      const qs  = id ? `?professionalId=${id}` : '';
      const res = await fetch(`/api/agenda/calendario${qs}`, { headers: { Authorization: `Bearer ${tok()}` } });
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        setDiasCal(Array.isArray(d.diasCalendario) ? d.diasCalendario : []);
      } else {
        setDiasCal([]);
      }
    } finally { setLoadingCal(false); }
  }, []);

  useEffect(() => { loadBarbers(); }, []);
  useEffect(() => {
    if (!applyToAll && profId) {
      loadDiaSchedule(profId);
      loadCalendario(profId);
    } else if (applyToAll) {
      loadCalendario(null);
    }
  }, [profId, applyToAll]);

  // ── Helpers de calendário ─────────────────────────────────────────────────────
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };
  const toggleCalDay = (iso) =>
    setDiasCal(p => p.includes(iso) ? p.filter(x => x !== iso) : [...p, iso].sort());

  const buildCalGrid = () => {
    const firstDay    = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  // ── Atualiza campo — ao ativar/desativar sincroniza o calendário ────────────
  const updateDayField = (diaSemana, field, value) => {
    if (field === 'ativo') {
      if (value === true) {
        // Marca no calendário todos os dias do ano que correspondem ao dia ativado
        setDiasCal(prev => {
          const toAdd = generateWeekdayDates(diaSemana);
          return [...new Set([...prev, ...toAdd])].sort();
        });
      } else {
        // Remove do calendário todos os dias que correspondem ao dia desativado
        setDiasCal(prev => prev.filter(iso => new Date(iso + 'T00:00:00').getDay() !== diaSemana));
      }
    }
    setDiaSchedule(prev => prev.map(d => {
      if (d.diaSemana !== diaSemana) return d;
      if (field === 'ativo' && value === true) {
        return {
          ...d,
          ativo:            true,
          inicioExpediente: d.inicioExpediente || DEFAULT_INICIO,
          fimExpediente:    d.fimExpediente    || DEFAULT_FIM,
          inicioAlmoco:     d.inicioAlmoco     || DEFAULT_ALM_I,
          fimAlmoco:        d.fimAlmoco        || DEFAULT_ALM_F,
        };
      }
      return { ...d, [field]: value };
    }));
  };

  // ── Salva horário por dia + calendário ───────────────────────────────────────
  const saveSchedule = async () => {
    if (!applyToAll && !profId) { setError('Selecione um barbeiro'); return; }
    setSavingDiaSched(true); setError(''); setSuccess('');
    try {
      const profIdNum = applyToAll ? null : Number(profId);
      const [r1, r2] = await Promise.all([
        fetch('/api/agenda/dia-schedule', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify({ professionalId: profIdNum, applyToAll, schedule: diaSchedule }),
        }),
        fetch('/api/agenda/calendario', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify({ professionalId: profIdNum, diasCalendario: diasCal }),
        }),
      ]);
      const [d1, d2] = await Promise.all([r1.json().catch(() => ({})), r2.json().catch(() => ({}))]);
      if (!r1.ok) throw new Error(d1.message || 'Erro ao salvar horários');
      if (!r2.ok) throw new Error(d2.message || 'Erro ao salvar calendário');
      setSuccess('Expediente salvo com sucesso!');
    } catch (err) { setError(err.message); }
    finally { setSavingDiaSched(false); }
  };

  // ── Indisponibilidade ─────────────────────────────────────────────────────────
  const addIndisponibilidade = async () => {
    const ini = toHHMM(indIni), fm = toHHMM(indFim);
    if (!indDia || !ini || !fm || !indMotivo.trim()) { setError('Preencha dia, início, fim e motivo'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/agenda/indisponibilidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          dia: indDia,
          inicio: ini,
          fim: fm,
          motivo: indMotivo.trim(),
          professionalId: applyToAll ? null : (profId ? Number(profId) : null),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao salvar');
      setIndList(p => [...p, { dia: indDia, inicio: ini, fim: fm, motivo: indMotivo.trim() }]);
      setIndDia(''); setIndIni(''); setIndFim(''); setIndMotivo('');
      const cancelled = d.appointmentsCancelled || 0;
      setSuccess(cancelled > 0
        ? `Indisponibilidade salva! ${cancelled} agendamento(s) cancelado(s) e cliente(s) notificado(s).`
        : 'Indisponibilidade salva!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  // ── Encerramento antecipado ───────────────────────────────────────────────────
  const saveEncerramento = async () => {
    const hora = toHHMM(encHora);
    if (!encDia || !hora || !encMotivo.trim()) { setError('Preencha dia, hora e motivo'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/agenda/encerramento-antecipado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          dia: encDia,
          hora,
          motivo: encMotivo.trim(),
          professionalId: applyToAll ? null : (profId ? Number(profId) : null),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao salvar');
      setEncDia(''); setEncHora(''); setEncMotivo('');
      const cancelled = d.appointmentsCancelled || 0;
      setSuccess(cancelled > 0
        ? `Encerramento antecipado salvo! ${cancelled} agendamento(s) cancelado(s) e cliente(s) notificado(s).`
        : 'Encerramento antecipado salvo!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const profName = barbers.find(u => String(u.id) === profId)?.name || 'Selecione um barbeiro';

  const TimeInput = ({ label, value, onChange }) => (
    <div className="form-group" style={{ margin: 0 }}>
      <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '0.2rem' }}>{label}</label>
      <input
        className="form-input"
        type="time"
        style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );

  return (
    <Layout title="Configuração de Expediente">
      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Aplicar a */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Aplicar expediente a</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <button className={`btn btn-sm ${applyToAll ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setApplyToAll(true)}>Todos os barbeiros</button>
              <button className={`btn btn-sm ${!applyToAll ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setApplyToAll(false)}>Barbeiro específico</button>
            </div>
            {!applyToAll && (
              <div style={{ position: 'relative' }}>
                <button type="button" onClick={() => setShowProf(p => !p)}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0.6rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--color)', fontSize: '0.875rem', textAlign: 'left' }}>
                  <span>{loadingProf ? 'Carregando...' : profName}</span>
                  <FiChevronDown size={14} />
                </button>
                {showProf && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', zIndex: 50, maxHeight: 200, overflowY: 'auto' }}>
                    {barbers.map(u => (
                      <button key={u.id} type="button" onClick={() => { setProfId(String(u.id)); setShowProf(false); }}
                        style={{ width: '100%', padding: '0.6rem 0.75rem', textAlign: 'left', background: String(u.id) === profId ? 'var(--accent)' : 'transparent', color: 'var(--color)', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}>
                        {u.name}
                      </button>
                    ))}
                    {barbers.length === 0 && <p style={{ padding: '0.6rem 0.75rem', color: 'var(--color-muted)', fontSize: '0.85rem' }}>Nenhum barbeiro encontrado</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Horário por Dia da Semana + Calendário */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <h3>Horário por Dia da Semana</h3>
              {(loadingDiaSched || loadingCal) && <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Carregando...</span>}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>
              Ative os dias de expediente e configure horários diferentes para cada um.
            </p>

            {/* Dias da semana */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {diaSchedule.map(dia => (
                <div key={dia.diaSemana} style={{
                  background:   dia.ativo ? 'var(--bg-input)' : 'transparent',
                  border:       '1px solid var(--border)',
                  borderRadius: 'var(--radius-xs)',
                  padding:      '0.6rem 0.75rem',
                  opacity:      dia.ativo ? 1 : 0.55,
                  transition:   'opacity 0.15s',
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={dia.ativo}
                      onChange={e => updateDayField(dia.diaSemana, 'ativo', e.target.checked)}
                      style={{ width: 15, height: 15, accentColor: 'var(--accent)', flexShrink: 0 }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', width: 64, flexShrink: 0 }}>
                      {DIAS.find(d => d.value === dia.diaSemana)?.label}
                    </span>
                    {!dia.ativo
                      ? <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>Fechado</span>
                      : <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                          {dia.inicioExpediente}–{dia.fimExpediente}
                          {dia.inicioAlmoco && dia.fimAlmoco ? ` · almoço ${dia.inicioAlmoco}–${dia.fimAlmoco}` : ''}
                        </span>
                    }
                  </label>
                  {dia.ativo && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.5rem', marginTop: '0.6rem' }}>
                      <TimeInput label="Início"        value={dia.inicioExpediente} onChange={v => updateDayField(dia.diaSemana, 'inicioExpediente', v)} />
                      <TimeInput label="Fim"           value={dia.fimExpediente}    onChange={v => updateDayField(dia.diaSemana, 'fimExpediente',    v)} />
                      <TimeInput label="Almoço início" value={dia.inicioAlmoco}     onChange={v => updateDayField(dia.diaSemana, 'inicioAlmoco',     v)} />
                      <TimeInput label="Almoço fim"    value={dia.fimAlmoco}        onChange={v => updateDayField(dia.diaSemana, 'fimAlmoco',        v)} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Separador */}
            <div style={{ borderTop: '1px solid var(--border)', margin: '1.25rem 0 1rem' }} />

            {/* Calendário de datas específicas */}
            <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.3rem' }}>Datas específicas</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
              Marque datas para adicionar ou remover dias de expediente. Quando preenchido, apenas as datas marcadas ficam disponíveis para agendamento.
            </p>

            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxWidth: 280, margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.5rem', background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-xs" onClick={prevMonth}><FiChevronLeft size={13} /></button>
                <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>
                  {new Date(calYear, calMonth).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
                <button className="btn btn-ghost btn-xs" onClick={nextMonth}><FiChevronRight size={13} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-input)' }}>
                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-muted)', padding: '0.2rem 0', borderBottom: '1px solid var(--border)' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)', padding: 1 }}>
                {buildCalGrid().map((day, i) => {
                  if (!day) return <div key={i} style={{ background: 'var(--bg)', minHeight: 28 }} />;
                  const iso    = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const marked = diasCal.includes(iso);
                  const today  = iso === new Date().toISOString().slice(0, 10);
                  return (
                    <button key={i} onClick={() => toggleCalDay(iso)} title={iso}
                      style={{
                        background:   marked ? 'var(--accent)' : 'var(--bg)',
                        color:        marked ? '#000' : today ? 'var(--accent)' : 'var(--color)',
                        border:       today && !marked ? '1px solid var(--accent)' : 'none',
                        borderRadius: 3,
                        minHeight:    28,
                        fontSize:     '0.75rem',
                        fontWeight:   marked || today ? 700 : 400,
                        cursor:       'pointer',
                        padding:      0,
                      }}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} /> Marcado
              </span>
              {diasCal.length > 0 && (
                <>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{diasCal.length} dia(s) marcado(s)</span>
                  <button style={{ fontSize: '0.72rem', color: 'var(--color-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => setDiasCal([])}>
                    Limpar tudo
                  </button>
                </>
              )}
            </div>

            {/* Botão único */}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={saveSchedule} disabled={savingDiaSched}>
              {savingDiaSched ? 'Salvando...' : 'Salvar Expediente'}
            </button>
          </div>
        </div>

        {/* Indisponibilidade */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Horário de Indisponibilidade</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
              Bloqueia um intervalo de horário em uma data específica (ex: consulta médica, almoço especial).
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Data</label>
                <input className="form-input" type="date" value={indDia} onChange={e => setIndDia(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Início</label>
                <input className="form-input" type="time" value={indIni} onChange={e => setIndIni(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Fim</label>
                <input className="form-input" type="time" value={indFim} onChange={e => setIndFim(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <textarea className="form-input" rows={2} value={indMotivo} onChange={e => setIndMotivo(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: '0.75rem' }} onClick={addIndisponibilidade} disabled={saving}>
              Adicionar indisponibilidade
            </button>
            {indList.length > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {indList.map((item, i) => (
                  <p key={i} style={{ fontSize: '0.8rem', color: 'var(--color-muted)', background: 'var(--bg-input)', padding: '0.4rem 0.6rem', borderRadius: 'var(--radius-xs)' }}>
                    {item.dia} — {item.inicio} às {item.fim} ({item.motivo})
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Encerramento antecipado */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Encerramento Antecipado</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>
              Encerra o expediente mais cedo em uma data específica.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Data</label>
                <input className="form-input" type="date" value={encDia} onChange={e => setEncDia(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Hora de encerramento</label>
                <input className="form-input" type="time" value={encHora} onChange={e => setEncHora(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <textarea className="form-input" rows={2} value={encMotivo} onChange={e => setEncMotivo(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: '0.75rem' }} onClick={saveEncerramento} disabled={saving}>
              Definir encerramento
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
