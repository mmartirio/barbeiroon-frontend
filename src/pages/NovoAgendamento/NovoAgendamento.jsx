import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import SearchModal from '../../components/SearchModal/SearchModal';
import { FiChevronDown, FiTag } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');
const fmtPhone = (p) => { if (!p) return ''; const c=p.replace(/\D/g,''); if(c.length<=2)return c; if(c.length<=7)return `(${c.slice(0,2)}) ${c.slice(2)}`; return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`; };
const fmtP = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const today = () => new Date().toISOString().split('T')[0];

export default function NovoAgendamento() {
  const navigate = useNavigate();

  const [clients,  setClients]  = useState([]);
  const [services, setServices] = useState([]);
  const [profs,    setProfs]    = useState([]);
  const [promos,   setPromos]   = useState([]);
  const [times,    setTimes]    = useState([]);

  const [client,   setClient]   = useState(null);
  const [service,  setService]  = useState(null);
  const [prof,     setProf]     = useState(null);
  const [date,     setDate]     = useState(today());
  const [time,     setTime]     = useState('');
  const [promo,    setPromo]    = useState(null);
  const [pendingPromos, setPendingPromos] = useState([]);

  const [modal,    setModal]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [timesLoading, setTimesLoading] = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

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
      const res = await fetch(`/api/agenda?professionalId=${prof.id}&date=${date}`, { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setTimes(d.availableTimes || d.times || []);
    } catch { setTimes([]); }
    finally { setTimesLoading(false); }
  }, [prof, date]);

  useEffect(() => { loadTimes(); }, [loadTimes]);

  useEffect(() => {
    if (!client) return;
    fetch(`/api/appointment/pending-promotions?customerPhone=${encodeURIComponent(client.phone||'')}`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r=>r.json()).catch(()=>({}))
      .then(d => setPendingPromos(d.pendingPromotions || []));
  }, [client]);

  const finalPrice = () => {
    if (!service) return null;
    const base = Number(service.price || 0);
    if (!promo) return base;
    if (promo.tipoPreco === 'Percentual (%)') return base * (1 - Number(promo.preco||0)/100);
    if (promo.tipoPreco === 'Fixo (R$)')      return Math.max(0, base - Number(promo.preco||0));
    return base;
  };

  const discount = () => {
    if (!service || !promo) return 0;
    const base = Number(service.price || 0);
    const fp   = finalPrice();
    return base - fp;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!client || !service || !prof || !date || !time) { setError('Preencha todos os campos obrigatórios'); return; }
    setLoading(true);
    try {
      const body = {
        customerPhone: client.phone,
        serviceId:     service.id,
        professionalId: prof.id,
        appointmentDate: date,
        appointmentTime: time + ':00',
        ...(promo ? { promotionId: promo.id, finalPrice: finalPrice() } : {}),
      };
      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(body),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || res.status === 409 ? 'Horário já ocupado' : 'Erro ao agendar');
      setSuccess('Agendamento realizado com sucesso!');
      setTimeout(() => navigate('/servico-agendados'), 1500);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fp = finalPrice();

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

        {/* Pending promos banner */}
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
            <div className="form-group">
              <label className="form-label">Cliente *</label>
              <Picker value={client ? `${client.name} · ${fmtPhone(client.phone)}` : ''} placeholder="Selecionar cliente" onClick={() => setModal('client')} />
            </div>
            <div className="form-group">
              <label className="form-label">Serviço *</label>
              <Picker value={service ? `${service.name} · ${fmtP(service.price)}` : ''} placeholder="Selecionar serviço" onClick={() => setModal('service')} />
            </div>
            <div className="form-group">
              <label className="form-label">Profissional *</label>
              <Picker value={prof?.name || ''} placeholder="Selecionar profissional" onClick={() => setModal('prof')} />
            </div>
            <div className="form-group">
              <label className="form-label">Data *</label>
              <input className="form-input" type="date" min={today()} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Horário *</label>
              {timesLoading ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Carregando horários...</p>
              ) : times.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {times.map(t => (
                    <button key={t} type="button"
                      className={`btn btn-sm ${time === t ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setTime(t)}
                    >{t}</button>
                  ))}
                </div>
              ) : prof && date ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Nenhum horário disponível para esta data</p>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Selecione profissional e data</p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Promoção (opcional)</label>
              <Picker value={promo?.name || promo?.nome || ''} placeholder="Selecionar promoção" onClick={() => setModal('promo')} />
              {promo && <button type="button" className="btn btn-ghost btn-xs" style={{ marginTop: '0.25rem' }} onClick={() => setPromo(null)}>Remover promoção</button>}
            </div>

            {/* Summary */}
            {client && service && prof && date && time && (
              <div style={{ background: 'var(--bg-input)', borderRadius: 'var(--radius-xs)', padding: '1rem', marginTop: '0.25rem' }}>
                <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Resumo</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-muted)' }}>Serviço</span><span>{service.name}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-muted)' }}>Profissional</span><span>{prof.name}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-muted)' }}>Data/Hora</span><span>{date} às {time}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--color-muted)' }}>Valor</span><span>{fmtP(service.price)}</span></div>
                  {promo && discount() > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--success)' }}>Desconto</span><span style={{ color: 'var(--success)' }}>-{fmtP(discount())}</span></div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid var(--border)', paddingTop: '0.3rem', marginTop: '0.2rem' }}>
                    <span>Total</span><span>{fmtP(fp ?? service.price)}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/servico-agendados')}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading || !time}>{loading ? 'Agendando...' : 'Confirmar Agendamento'}</button>
            </div>
          </div>
        </form>
      </div>

      {modal === 'client' && (
        <SearchModal title="Selecionar Cliente" items={clients} searchKey={['name','phone']}
          onSelect={setClient} onClose={() => setModal('')}
          renderItem={c => <div><p style={{ fontWeight: 600 }}>{c.name}</p><p style={{ color: 'var(--color-muted)', fontSize: '0.8rem' }}>{fmtPhone(c.phone)}</p></div>}
        />
      )}
      {modal === 'service' && (
        <SearchModal title="Selecionar Serviço" items={services.filter(s => s.ativo !== false)} searchKey="name"
          onSelect={setService} onClose={() => setModal('')}
          renderItem={s => <div><p style={{ fontWeight: 600 }}>{s.name}</p><p style={{ color: '#fbbf24', fontSize: '0.8rem' }}>{fmtP(s.price)}</p></div>}
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
