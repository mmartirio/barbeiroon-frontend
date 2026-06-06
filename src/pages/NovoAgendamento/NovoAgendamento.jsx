import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';
import SearchModal from '../../components/SearchModal/SearchModal';
import { FiChevronDown, FiTag, FiPlus, FiX } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const fmtPhone = (p) => { if (!p) return ''; const c=p.replace(/\D/g,''); if(c.length<=2)return c; if(c.length<=7)return `(${c.slice(0,2)}) ${c.slice(2)}`; return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`; };
const fmtP = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const today = () => new Date().toISOString().split('T')[0];

const parseDuration = (v) => {
    if (!v) return 30;
    if (typeof v === 'number') return v;
    const parts = String(v).split(':');
    if (parts.length >= 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    return parseInt(v) || 30;
};

export default function NovoAgendamento() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  // Captura o horário da URL uma única vez no mount
  const initialUrlTime      = useState(() => searchParams.get('time') || '')[0];
  const urlTimeConsumedRef  = useRef(false);
  const tenantSlug = slug || user?.tenantSlug || '';
  const tenantId   = user?.tenantId || '';

  const [clients,  setClients]  = useState([]);
  const [services, setServices] = useState([]);
  const [profs,    setProfs]    = useState([]);
  const [promos,   setPromos]   = useState([]);
  const [times,    setTimes]    = useState([]);

  const [client,       setClient]       = useState(null);
  const [selectedSvcs, setSelectedSvcs] = useState([]); // array of service objects
  const [prof,         setProf]         = useState(null);
  const [date,         setDate]         = useState(today());
  const [time,         setTime]         = useState('');
  const [promo,        setPromo]        = useState(null);
  const [pendingPromos, setPendingPromos] = useState([]);

  const [modal,        setModal]        = useState('');
  const [loading,      setLoading]      = useState(false);
  const [timesLoading, setTimesLoading] = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');

  // Computed totals
  const totalDuration = selectedSvcs.reduce((acc, s) => acc + parseDuration(s.duration), 0);
  const totalPrice    = selectedSvcs.reduce((acc, s) => acc + Number(s.price || 0), 0);

  // Pre-fill date from URL param
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam) setDate(dateParam);
  }, [searchParams]);

  // Pre-fill professional after profs list loads
  useEffect(() => {
    const profIdParam = searchParams.get('professionalId');
    if (profIdParam && profs.length > 0) {
      const found = profs.find(p => String(p.id) === profIdParam);
      if (found) setProf(found);
    }
  }, [profs, searchParams]);

  useEffect(() => {
    Promise.all([
      fetch('/api/customer?limit=500', { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.json()).catch(()=>({})),
      fetch('/api/service?limit=200',  { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.json()).catch(()=>({})),
      fetch('/api/user/barbers',        { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.json()).catch(()=>({})),
      fetch('/api/promotion?limit=100', { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.json()).catch(()=>({})),
    ]).then(([c, s, p, pr]) => {
      setClients(c.customers || c.data || (Array.isArray(c)?c:[]));
      setServices(s.services || s.data || (Array.isArray(s)?s:[]));
      setProfs(p.users || p.barbers || p.data || (Array.isArray(p)?p:[]));
      const now = new Date().toISOString().split('T')[0];
      setPromos((pr.promotions || pr.data || []).filter(x => x.active !== false && (!x.validadeFim || x.validadeFim >= now)));
    });
  }, []);

  const loadTimes = useCallback(async () => {
    if (!prof || !date) return;
    setTimesLoading(true);
    setTime('');
    try {
      const params = new URLSearchParams({
          professionalId: prof.id,
          date,
          tenantId,
      });
      if (totalDuration > 0) params.set('duration', String(totalDuration));
      else if (selectedSvcs.length > 0) params.set('serviceId', selectedSvcs[0].id);

      const res = await fetch(`/api/public/appointment/available-times?${params}`);
      const d   = await res.json().catch(() => ({}));
      const available = d.availableTimes || [];

      if (initialUrlTime && !urlTimeConsumedRef.current) {
        urlTimeConsumedRef.current = true;
        const allTimes = available.includes(initialUrlTime)
          ? available
          : [initialUrlTime, ...available];
        setTimes(allTimes);
        setTime(initialUrlTime);
      } else {
        setTimes(available);
      }
    } catch { setTimes([]); }
    finally { setTimesLoading(false); }
  }, [prof, date, totalDuration, selectedSvcs, tenantId, initialUrlTime]);

  useEffect(() => { loadTimes(); }, [loadTimes]);

  useEffect(() => {
    if (!client) return;
    fetch(`/api/appointment/pending-promotions?customerPhone=${encodeURIComponent(client.phone||'')}`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r=>r.json()).catch(()=>({}))
      .then(d => setPendingPromos(d.pendingPromotions || []));
  }, [client]);

  const addService = (svc) => {
    if (!selectedSvcs.find(s => s.id === svc.id)) {
      setSelectedSvcs(prev => [...prev, svc]);
    }
    setModal('');
    setTime('');
  };

  const removeService = (id) => {
    setSelectedSvcs(prev => prev.filter(s => s.id !== id));
    setTime('');
  };

  const discountAmount = () => {
    if (!promo || selectedSvcs.length === 0) return 0;
    const base = totalPrice;
    if (promo.tipoPreco === 'Percentual (%)') return base * Number(promo.preco||0) / 100;
    if (promo.tipoPreco === 'Fixo (R$)')      return Math.min(base, Number(promo.preco||0));
    return 0;
  };

  const finalTotal = () => Math.max(0, totalPrice - discountAmount());

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!client)              { setError('Selecione o cliente'); return; }
    if (selectedSvcs.length === 0) { setError('Selecione ao menos um serviço'); return; }
    if (!prof || !date || !time)   { setError('Preencha profissional, data e horário'); return; }
    setLoading(true);
    try {
      // Create one appointment per service, each starting when the previous ends
      let currentTime = time;
      for (let i = 0; i < selectedSvcs.length; i++) {
        const svc = selectedSvcs[i];
        const body = {
          customerPhone:  client.phone,
          serviceId:      svc.id,
          professionalId: prof.id,
          appointmentDate: date,
          appointmentTime: currentTime + ':00',
          ...(i === 0 && promo ? { promotionId: promo.id, finalPrice: finalTotal() } : {}),
        };
        const res = await fetch('/api/appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify(body),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.message || (res.status === 409 ? 'Horário já ocupado' : 'Erro ao agendar'));

        // Advance time by this service's duration
        if (i < selectedSvcs.length - 1) {
          const [h, m] = currentTime.split(':').map(Number);
          const totalMins = h * 60 + m + parseDuration(svc.duration);
          currentTime = `${String(Math.floor(totalMins / 60)).padStart(2,'0')}:${String(totalMins % 60).padStart(2,'0')}`;
        }
      }
      setSuccess('Agendamento realizado com sucesso!');
      setTimeout(() => navigate(`/${tenantSlug}/servico-agendados`), 1500);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const Picker = ({ label, value, placeholder, onClick }) => (
    <button type="button" onClick={onClick}
      style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', padding:'0.6rem 0.75rem', display:'flex', alignItems:'center', justifyContent:'space-between', color: value ? 'var(--color)' : 'var(--color-muted)', fontSize:'0.875rem', textAlign:'left' }}>
      <span>{value || placeholder}</span>
      <FiChevronDown size={14} />
    </button>
  );

  return (
    <Layout title="Novo Agendamento">
      <div style={{ maxWidth: 560 }}>
        {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

        {pendingPromos.length > 0 && (
          <div style={{ background: 'rgba(22,163,74,0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
            <p style={{ color: '#4ade80', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>Promoções disponíveis para este cliente:</p>
            {pendingPromos.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}><FiTag size={12} style={{ marginRight: 4 }} />{p.name}</span>
                <button className="btn btn-success btn-xs" onClick={() => setPromo(p)}>Aplicar</button>
              </div>
            ))}
          </div>
        )}

        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Cliente */}
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <Picker value={client ? `${client.name} · ${fmtPhone(client.phone)}` : ''} placeholder="Selecionar cliente" onClick={() => setModal('client')} />
            </div>

            {/* Serviços */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Serviço{selectedSvcs.length > 1 ? 's' : ''} *</span>
                {selectedSvcs.length > 0 && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)', fontWeight: 400 }}>
                    {totalDuration} min · {fmtP(totalPrice)}
                  </span>
                )}
              </label>

              {selectedSvcs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  {selectedSvcs.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xs)', padding: '0.5rem 0.75rem' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{i > 0 && <span style={{ color: 'var(--color-muted)', marginRight: 6, fontSize: '0.75rem' }}>+</span>}{s.name}</span>
                        <span style={{ color: 'var(--color-muted)', fontSize: '0.78rem', marginLeft: 8 }}>{parseDuration(s.duration)} min · {fmtP(s.price)}</span>
                      </div>
                      <button type="button" onClick={() => removeService(s.id)} style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', padding: '0 4px' }}>
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button type="button" onClick={() => setModal('service')}
                style={{ width: '100%', background: 'var(--bg-input)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-xs)', padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.875rem', cursor: 'pointer' }}>
                <FiPlus size={14} /> {selectedSvcs.length === 0 ? 'Selecionar serviço' : '+ Adicionar serviço'}
              </button>
            </div>

            {/* Profissional */}
            <div className="form-group">
              <label className="form-label">Profissional *</label>
              <Picker value={prof?.name || ''} placeholder="Selecionar profissional" onClick={() => setModal('prof')} />
            </div>

            {/* Data */}
            <div className="form-group">
              <label className="form-label">Data *</label>
              <input className="form-input" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} />
            </div>

            {/* Horário */}
            <div className="form-group">
              <label className="form-label">Horário *{totalDuration > 0 && <span style={{ fontWeight: 400, color: 'var(--color-muted)', fontSize: '0.75rem', marginLeft: 6 }}>— bloqueando {totalDuration} min</span>}</label>
              {timesLoading ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Carregando horários...</p>
              ) : times.length > 0 ? (
                <>
                  <select
                    className="form-input"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    style={time ? { borderColor: 'var(--success)', outline: 'none', boxShadow: '0 0 0 2px rgba(34,197,94,0.2)' } : {}}
                  >
                    <option value="">— Selecione o horário —</option>
                    {times.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {time && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '0.3rem' }}>
                      ✓ Horário {time} selecionado
                    </p>
                  )}
                </>
              ) : prof && date ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Nenhum horário disponível para esta data</p>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Selecione profissional e data</p>
              )}
            </div>

            {/* Promoção */}
            <div className="form-group">
              <label className="form-label">Promoção (opcional)</label>
              <Picker value={promo?.name || promo?.nome || ''} placeholder="Selecionar promoção" onClick={() => setModal('promo')} />
              {promo && <button type="button" className="btn btn-ghost btn-xs" style={{ marginTop: '0.25rem' }} onClick={() => setPromo(null)}>Remover promoção</button>}
            </div>

            {/* Resumo */}
            {client && selectedSvcs.length > 0 && prof && date && time && (
              <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', padding: '1rem', marginTop: '0.25rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Resumo</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem' }}>
                  {selectedSvcs.map((s, i) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-muted)' }}>{i === 0 ? 'Serviço' : `+ ${s.name}`}</span>
                      <span>{i === 0 ? `${s.name} · ${fmtP(s.price)}` : fmtP(s.price)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-muted)' }}>Profissional</span><span>{prof.name}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-muted)' }}>Data/Hora</span><span>{date} às {time}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-muted)' }}>Duração total</span><span>{totalDuration} min</span></div>
                  {promo && discountAmount() > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--success)' }}>Desconto</span><span style={{ color: 'var(--success)' }}>-{fmtP(discountAmount())}</span></div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                    <span>Total</span><span>{fmtP(finalTotal())}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }}
                onClick={() => navigate(searchParams.get('date') ? `/${tenantSlug}/disponibilidade` : `/${tenantSlug}/servico-agendados`)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || !time || selectedSvcs.length === 0}>
                {loading ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {modal === 'client' && (
        <SearchModal title="Selecionar Cliente" items={clients} searchKey={['name','phone']}
          onSelect={c => { setClient(c); setModal(''); }} onClose={() => setModal('')}
          renderItem={c => <div><p style={{ fontWeight: 600 }}>{c.name}</p><p style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{fmtPhone(c.phone)}</p></div>}
        />
      )}
      {modal === 'service' && (
        <SearchModal title="Selecionar Serviço" items={services.filter(s => s.ativo !== false && !selectedSvcs.find(x => x.id === s.id))} searchKey="name"
          onSelect={addService} onClose={() => setModal('')}
          renderItem={s => <div><p style={{ fontWeight: 600 }}>{s.name}</p><p style={{ color: '#fbbf24', fontSize: '0.8rem' }}>{fmtP(s.price)} · {parseDuration(s.duration)} min</p></div>}
        />
      )}
      {modal === 'prof' && (
        <SearchModal title="Selecionar Profissional" items={profs} searchKey="name"
          onSelect={p => { setProf(p); setModal(''); }} onClose={() => setModal('')}
        />
      )}
      {modal === 'promo' && (
        <SearchModal title="Selecionar Promoção" items={promos} searchKey={['name','nome']}
          onSelect={p => { setPromo(p); setModal(''); }} onClose={() => setModal('')}
          renderItem={p => <div><p style={{ fontWeight: 600 }}>{p.name || p.nome}</p><p style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{p.preco}{p.tipoPreco?.includes('%') ? '%' : ' R$'} de desconto</p></div>}
        />
      )}
    </Layout>
  );
}
