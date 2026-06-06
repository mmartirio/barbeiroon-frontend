import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import s from './Disponibilidade.module.css';
import { FiChevronLeft, FiChevronRight, FiCalendar } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const PERIODOS = [
  { label: 'Hoje',   value: 'diario' },
  { label: 'Semana', value: 'semanal' },
  { label: 'Mês',    value: 'mensal' },
];

const toStr = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Disponibilidade() {
  const navigate    = useNavigate();
  const { slug }    = useParams();
  const { user }    = useAuth();
  const tenantSlug  = slug || user?.tenantSlug || '';
  const isOnlyBarber = user?.isBarber && !user?.permissions?.canManageTenant;

  const [periodo,         setPeriodo]         = useState('diario');
  const [baseDate,        setBaseDate]        = useState(toStr(new Date()));
  const [profId,          setProfId]          = useState('');
  const [profs,           setProfs]           = useState([]);
  const [dias,            setDias]            = useState([]);
  const [effectiveProfId, setEffectiveProfId] = useState(null);
  const [loading,         setLoading]         = useState(false);

  useEffect(() => {
    if (!isOnlyBarber) {
      fetch('/api/user/barbers', { headers: { Authorization: `Bearer ${tok()}` } })
        .then(r => r.json()).catch(() => ({}))
        .then(d => {
          const list = d.users || d.barbers || d.data || [];
          setProfs(list);
          if (list.length > 0) setProfId(String(list[0].id));
        });
    }
  }, [isOnlyBarber]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ periodo, data: baseDate });
      if (!isOnlyBarber && profId) params.set('professionalId', profId);
      const res  = await fetch(`/api/agenda/horarios-livres?${params}`, {
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const json = await res.json().catch(() => ({}));
      setDias(json.data || []);
      setEffectiveProfId(json.professionalId || null);
    } catch {
      setDias([]);
    } finally {
      setLoading(false);
    }
  }, [periodo, baseDate, profId, isOnlyBarber]);

  useEffect(() => {
    if (isOnlyBarber || profId) load();
  }, [load, isOnlyBarber, profId]);

  const navPeriod = (dir) => {
    const d = new Date(baseDate + 'T00:00:00');
    if (periodo === 'diario')  d.setDate(d.getDate() + dir);
    if (periodo === 'semanal') d.setDate(d.getDate() + dir * 7);
    if (periodo === 'mensal')  d.setMonth(d.getMonth() + dir);
    setBaseDate(toStr(d));
  };

  const handleSlotClick = (dateStr, hora) => {
    const params = new URLSearchParams({ date: dateStr, time: hora });
    if (effectiveProfId) params.set('professionalId', String(effectiveProfId));
    navigate(`/${tenantSlug}/novo-agendamento?${params}`);
  };

  return (
    <Layout title="Disponibilidade">
      {/* ── Toolbar ── */}
      <div className={s.toolbar}>
        <div className={s.periodBtns}>
          {PERIODOS.map(p => (
            <button
              key={p.value}
              className={`${s.periodBtn} ${periodo === p.value ? s.periodBtnActive : ''}`}
              onClick={() => { setPeriodo(p.value); }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {!isOnlyBarber && profs.length > 0 && (
          <select
            className={s.profSelect}
            value={profId}
            onChange={e => setProfId(e.target.value)}
          >
            {profs.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        <div className={s.navBtns}>
          <button className={s.navBtn} onClick={() => navPeriod(-1)} title="Anterior">
            <FiChevronLeft />
          </button>
          <button className={s.navBtn} onClick={() => navPeriod(1)} title="Próximo">
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className={s.legend}>
        <span className={s.legendFree} />
        <span className={s.legendLabel}>Livre — clique para agendar</span>
        <span className={s.legendBusy} />
        <span className={s.legendLabel}>Ocupado</span>
      </div>

      {/* ── States ── */}
      {loading && (
        <div className={s.stateBox}>
          <div className={s.spinner} />
          <p>Carregando horários...</p>
        </div>
      )}

      {!loading && dias.length === 0 && (
        <div className={s.stateBox}>
          <FiCalendar size={36} style={{ color: 'var(--color-muted)', marginBottom: 12 }} />
          <p style={{ fontWeight: 600 }}>Nenhum expediente encontrado</p>
          <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginTop: 4 }}>
            Configure seu expediente em{' '}
            <button
              className={s.linkBtn}
              onClick={() => navigate(`/${tenantSlug}/agenda`)}
            >
              Agenda → Expediente
            </button>
          </p>
        </div>
      )}

      {/* ── Day cards ── */}
      {!loading && (
        <div className={s.daysList}>
          {dias.map(dia => (
            <div key={dia.data} className={s.dayCard}>
              {/* Header */}
              <div className={s.dayHeader}>
                <div className={s.dayTitle}>
                  <span className={s.dayName}>{dia.diaSemana}</span>
                  <span className={s.dayDate}>{dia.dia}/{dia.mes}</span>
                  <span className={s.dayRange}>{dia.inicioExpediente} – {dia.fimExpediente}</span>
                </div>
                <div className={s.dayBadge}>
                  <span className={dia.slotsLivres > 0 ? s.badgeFree : s.badgeFull}>
                    {dia.slotsLivres} livre{dia.slotsLivres !== 1 ? 's' : ''}
                  </span>
                  <span className={s.badgeTotal}>/{dia.totalSlots}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className={s.progressBar}>
                <div
                  className={s.progressFill}
                  style={{ width: `${dia.percentualLivre}%` }}
                />
              </div>

              {/* Slots */}
              <div className={s.slotsGrid}>
                {dia.slots.map(slot =>
                  slot.livre ? (
                    <button
                      key={slot.hora}
                      className={`${s.slot} ${s.slotFree}`}
                      onClick={() => handleSlotClick(dia.data, slot.hora)}
                      title={`Agendar às ${slot.hora}`}
                    >
                      {slot.hora}
                    </button>
                  ) : (
                    <div
                      key={slot.hora}
                      className={`${s.slot} ${s.slotBusy}`}
                      title={slot.servico || 'Ocupado'}
                    >
                      <span className={s.slotTime}>{slot.hora}</span>
                      {slot.servico && (
                        <span className={s.slotSvc}>{slot.servico}</span>
                      )}
                    </div>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
