import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiChevronDown, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const DIAS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

const toHHMM = (v) => /^\d{2}:\d{2}$/.test(String(v || '').trim()) ? v.trim() : null;
const toIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '').trim()) ? v.trim() : null;

export default function Agenda() {
  const [barbers,      setBarbers]      = useState([]);
  const [profId,       setProfId]       = useState('');
  const [applyToAll,   setApplyToAll]   = useState(false);
  const [showProf,     setShowProf]     = useState(false);
  const [loadingProf,  setLoadingProf]  = useState(false);
  const [loadingExp,   setLoadingExp]   = useState(false);

  const [diasSel,      setDiasSel]      = useState([]);
  const [todosDias,    setTodosDias]    = useState(false);
  const [diasCal,      setDiasCal]      = useState([]);
  const [calYear,      setCalYear]      = useState(() => new Date().getFullYear());
  const [calMonth,     setCalMonth]     = useState(() => new Date().getMonth()); // 0-11

  const [inicio,       setInicio]       = useState('08:00');
  const [fim,          setFim]          = useState('18:00');
  const [almocoInicio, setAlmocoInicio] = useState('12:00');
  const [almocoFim,    setAlmocoFim]    = useState('13:00');

  const [indDia,    setIndDia]    = useState('');
  const [indIni,    setIndIni]    = useState('');
  const [indFim,    setIndFim]    = useState('');
  const [indMotivo, setIndMotivo] = useState('');
  const [indList,   setIndList]   = useState([]);

  const [encDia,    setEncDia]    = useState('');
  const [encHora,   setEncHora]   = useState('');
  const [encMotivo, setEncMotivo] = useState('');

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const loadBarbers = useCallback(async () => {
    setLoadingProf(true);
    try {
      const res = await fetch('/api/user/users?limit=200', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      const list = (d.users || []).filter(u => !!u.isBarber);
      setBarbers(list);
      if (list.length > 0 && !profId) setProfId(String(list[0].id));
    } finally { setLoadingProf(false); }
  }, [profId]);

  const loadExpediente = useCallback(async (id) => {
    if (!id) return;
    setLoadingExp(true);
    try {
      const res = await fetch(`/api/agenda?professionalId=${id}`, { headers: { Authorization: `Bearer ${tok()}` } });
      if (res.ok) {
        const d = await res.json().catch(() => ({}));
        setDiasSel(Array.isArray(d.diasSelecionados) ? d.diasSelecionados : []);
        setDiasCal(Array.isArray(d.diasCalendario) ? d.diasCalendario : []);
        setInicio(d.inicioExpediente || '08:00');
        setFim(d.fimExpediente || '18:00');
        setAlmocoInicio(d.inicioAlmoco || '12:00');
        setAlmocoFim(d.fimAlmoco || '13:00');
      } else {
        setDiasSel([]); setDiasCal([]);
        setInicio('08:00'); setFim('18:00'); setAlmocoInicio('12:00'); setAlmocoFim('13:00');
      }
    } finally { setLoadingExp(false); }
  }, []);

  useEffect(() => { loadBarbers(); }, []);
  useEffect(() => { if (profId) loadExpediente(profId); }, [profId]);

  const toggleDia = (v) => {
    setDiasSel(p => p.includes(v) ? p.filter(d => d !== v) : [...p, v]);
  };

  // Gera todos os dias do ano corrente que correspondem aos dias da semana selecionados
  const applyDefaultSchedule = (checked, diasSelecionados) => {
    if (!checked) { setDiasCal([]); return; }
    const year = new Date().getFullYear();
    const dates = [];
    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(year, m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, m, d);
        if (diasSelecionados.includes(date.getDay())) {
          dates.push(`${year}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`);
        }
      }
    }
    setDiasCal(dates);
  };

  const toggleCalDay = (isoDate) =>
    setDiasCal(p => p.includes(isoDate) ? p.filter(x => x !== isoDate) : [...p, isoDate].sort());

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
    else setCalMonth(m => m + 1);
  };

  // Gera os dias do mês atual para o calendário
  const buildCalGrid = () => {
    const firstDay = new Date(calYear, calMonth, 1).getDay(); // dia da semana do 1º
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null); // vazios iniciais
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  };

  const saveExpediente = async () => {
    const ini = toHHMM(inicio), fm = toHHMM(fim);
    if (!ini || !fm) { setError('Horários inválidos. Use HH:MM'); return; }
    if (!applyToAll && !profId) { setError('Selecione um barbeiro'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          diasCalendario:   diasCal,
          diasSelecionados: diasSel,
          inicioExpediente: ini,
          fimExpediente:    fm,
          inicioAlmoco:     toHHMM(almocoInicio),
          fimAlmoco:        toHHMM(almocoFim),
          applyToAll,
          professionalId:   applyToAll ? null : Number(profId),
          todosDiasAno:     todosDias,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao salvar');
      setSuccess('Expediente salvo com sucesso!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const addIndisponibilidade = async () => {
    const dia = toIsoDate(indDia), ini = toHHMM(indIni), fm = toHHMM(indFim);
    if (!dia || !ini || !fm || !indMotivo.trim()) { setError('Preencha dia, início, fim e motivo'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/agenda/indisponibilidade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ dia, inicio: ini, fim: fm, motivo: indMotivo.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao salvar');
      setIndList(p => [...p, { dia, inicio: ini, fim: fm, motivo: indMotivo.trim() }]);
      setIndDia(''); setIndIni(''); setIndFim(''); setIndMotivo('');
      setSuccess('Indisponibilidade salva!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const saveEncerramento = async () => {
    const dia = toIsoDate(encDia), hora = toHHMM(encHora);
    if (!dia || !hora || !encMotivo.trim()) { setError('Preencha dia, hora e motivo'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/agenda/encerramento-antecipado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ dia, hora, motivo: encMotivo.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao salvar');
      setEncDia(''); setEncHora(''); setEncMotivo('');
      setSuccess('Encerramento antecipado salvo!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const profName = barbers.find(u => String(u.id) === profId)?.name || 'Selecione um barbeiro';

  const TimeInput = ({ label, value, onChange }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input className="form-input" value={value} onChange={e => onChange(e.target.value)} placeholder="HH:MM" maxLength={5} />
    </div>
  );

  return (
    <Layout title="Configuração de Expediente">
      <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Dias da semana */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Dias da semana com expediente</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {DIAS.map(d => (
                <button key={d.value} type="button"
                  className={`btn btn-sm ${diasSel.includes(d.value) ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => toggleDia(d.value)}
                >{d.label}</button>
              ))}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: '1rem' }}>
              <input type="checkbox" checked={todosDias} onChange={e => {
                setTodosDias(e.target.checked);
                applyDefaultSchedule(e.target.checked, diasSel);
              }} style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
              <span style={{ fontSize: '0.875rem' }}>Agendamento padrão — marca no calendário todos os dias do ano conforme dias selecionados</span>
            </label>

            {/* ── Calendário interativo ── */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', maxWidth: 280 }}>
              {/* Cabeçalho */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.3rem 0.5rem', background: 'var(--bg-input)', borderBottom: '1px solid var(--border)' }}>
                <button className="btn btn-ghost btn-xs" onClick={prevMonth}><FiChevronLeft size={13} /></button>
                <span style={{ fontWeight: 600, fontSize: '0.78rem' }}>
                  {new Date(calYear, calMonth).toLocaleString('pt-BR', { month: 'short', year: 'numeric' })}
                </span>
                <button className="btn btn-ghost btn-xs" onClick={nextMonth}><FiChevronRight size={13} /></button>
              </div>

              {/* Dias da semana */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--bg-input)' }}>
                {['D','S','T','Q','Q','S','S'].map((d, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-muted)', padding: '0.2rem 0', borderBottom: '1px solid var(--border)' }}>{d}</div>
                ))}
              </div>

              {/* Células */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, background: 'var(--border)', padding: 1 }}>
                {buildCalGrid().map((day, i) => {
                  if (!day) return <div key={i} style={{ background: 'var(--bg)', minHeight: 28 }} />;
                  const iso = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                  const marked = diasCal.includes(iso);
                  const today  = iso === new Date().toISOString().slice(0, 10);
                  return (
                    <button key={i} onClick={() => toggleCalDay(iso)} title={iso}
                      style={{
                        background: marked ? 'var(--accent)' : 'var(--bg)',
                        color:      marked ? '#000' : today ? 'var(--accent)' : 'var(--color)',
                        border:     today && !marked ? '1px solid var(--accent)' : 'none',
                        borderRadius: 3,
                        minHeight: 28,
                        fontSize: '0.75rem',
                        fontWeight: marked || today ? 700 : 400,
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                        padding: 0,
                      }}>
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legenda */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.4rem', fontSize: '0.72rem', color: 'var(--color-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent)', display: 'inline-block' }} /> Com expediente
              </span>
              {diasCal.length > 0 && <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{diasCal.length} dia(s)</span>}
            </div>
          </div>
        </div>

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

        {/* Horários */}
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>Horário de Expediente</h3>
              {loadingExp && <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Carregando...</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <TimeInput label="Início expediente" value={inicio} onChange={setInicio} />
              <TimeInput label="Fim expediente"    value={fim}    onChange={setFim}    />
              <TimeInput label="Início almoço"     value={almocoInicio} onChange={setAlmocoInicio} />
              <TimeInput label="Fim almoço"        value={almocoFim}    onChange={setAlmocoFim}    />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} onClick={saveExpediente} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Expediente'}
            </button>
          </div>
        </div>

        {/* Indisponibilidade */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Horário de Indisponibilidade</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Dia (AAAA-MM-DD)</label>
                <input className="form-input" value={indDia} onChange={e => setIndDia(e.target.value)} placeholder="2026-04-21" />
              </div>
              <TimeInput label="Início"  value={indIni}    onChange={setIndIni}    />
              <TimeInput label="Fim"     value={indFim}    onChange={setIndFim}    />
            </div>
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <textarea className="form-input" rows={2} value={indMotivo} onChange={e => setIndMotivo(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={addIndisponibilidade} disabled={saving}>Adicionar indisponibilidade</button>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Dia (AAAA-MM-DD)</label>
                <input className="form-input" value={encDia} onChange={e => setEncDia(e.target.value)} placeholder="2026-05-01" />
              </div>
              <TimeInput label="Hora de encerramento" value={encHora} onChange={setEncHora} />
            </div>
            <div className="form-group">
              <label className="form-label">Motivo</label>
              <textarea className="form-input" rows={2} value={encMotivo} onChange={e => setEncMotivo(e.target.value)} style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={saveEncerramento} disabled={saving}>Definir encerramento</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
