import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import SearchModal from '../../components/SearchModal/SearchModal';
import { FiSearch, FiX, FiCheck } from 'react-icons/fi';
import s from './NovoAgendamento.module.css';

const tok = () => sessionStorage.getItem('token');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fmtPrice = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v||0));

function Picker({ label, optional, selected, displayValue, onOpen, onClear }) {
  return (
    <div className="form-field">
      <label className="form-label">{label}{optional && <span className={s.opt}> (opcional)</span>}</label>
      <button type="button" className={`${s.picker} ${selected ? s.pickerSel : ''}`} onClick={onOpen}>
        {selected
          ? <span className={s.pickerVal}><FiCheck size={14} /> {displayValue}
              <button type="button" className={s.pickerClear} onClick={e => { e.stopPropagation(); onClear(); }}><FiX size={12} /></button>
            </span>
          : <span className={s.pickerPh}><FiSearch size={14} /> Selecionar {label.toLowerCase()}</span>
        }
      </button>
    </div>
  );
}

export default function NovoAgendamento() {
  const [data, setData]   = useState({ clients: [], services: [], professionals: [], promotions: [] });
  const [times, setTimes] = useState([]);
  const [modal, setModal] = useState(null);

  const [client,  setClient]  = useState(null);
  const [service, setService] = useState(null);
  const [prof,    setProf]    = useState(null);
  const [promo,   setPromo]   = useState(null);
  const [date,    setDate]    = useState(today());
  const [time,    setTime]    = useState('');

  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,  setError]  = useState('');
  const [success,setSuccess]= useState('');

  useEffect(() => {
    const h = { Authorization: `Bearer ${tok()}` };
    Promise.all([
      fetch('/api/customer/customers?limit=500', { headers: h }).then(r => r.json()).catch(() => ({})),
      fetch('/api/service/services',             { headers: h }).then(r => r.json()).catch(() => ({})),
      fetch('/api/user/users?limit=200',         { headers: h }).then(r => r.json()).catch(() => ({})),
      fetch('/api/promotion/promotions',         { headers: h }).then(r => r.json()).catch(() => ({})),
    ]).then(([c, sv, u, pr]) => setData({
      clients:       c.customers  || c.data  || [],
      services:      sv.services  || sv.data || [],
      professionals: (u.users     || u.data  || []).filter(x => x.isBarber),
      promotions:    pr.promotions || pr.data || [],
    }));
  }, []);

  const loadTimes = useCallback(async () => {
    if (!service || !prof || !date) { setTimes([]); return; }
    setLoadingTimes(true); setTime('');
    try {
      const res = await fetch(`/api/appointment/available-times?date=${date}&professionalId=${prof.id}&serviceId=${service.id}`, { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      setTimes(d.times || d.availableTimes || []);
    } finally { setLoadingTimes(false); }
  }, [service, prof, date]);

  useEffect(() => { loadTimes(); }, [loadTimes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!client)  return setError('Selecione um cliente.');
    if (!service) return setError('Selecione um serviço.');
    if (!prof)    return setError('Selecione um profissional.');
    if (!date)    return setError('Selecione uma data.');
    if (!time)    return setError('Selecione um horário.');
    setSubmitting(true);
    try {
      const res = await fetch('/api/appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ customerId: client.id, serviceId: service.id, professionalId: prof.id, appointmentDate: date, appointmentTime: time, ...(promo ? { promotionId: promo.id } : {}) }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao criar agendamento');
      setSuccess('Agendamento criado com sucesso!');
      setClient(null); setService(null); setProf(null); setPromo(null); setTime(''); setDate(today());
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <Layout title="Novo Agendamento">
      <div className={s.wrap}>
        <form className={s.form} onSubmit={handleSubmit}>
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <Picker label="Cliente"     selected={client}  displayValue={client?.name}  onOpen={() => setModal('client')}       onClear={() => setClient(null)} />
          <Picker label="Serviço"     selected={service} displayValue={`${service?.name} — ${fmtPrice(service?.price)}`} onOpen={() => setModal('service')} onClear={() => { setService(null); setTime(''); setTimes([]); }} />
          <Picker label="Profissional" selected={prof}   displayValue={prof?.name}    onOpen={() => setModal('prof')}         onClear={() => { setProf(null); setTime(''); setTimes([]); }} />
          <Picker label="Promoção" optional selected={promo} displayValue={promo?.name}  onOpen={() => setModal('promo')}    onClear={() => setPromo(null)} />

          <div className="form-field">
            <label className="form-label">Data</label>
            <input className="form-input" type="date" value={date} min={today()} onChange={e => { setDate(e.target.value); setTime(''); }} />
          </div>

          <div className="form-field">
            <label className="form-label">Horário</label>
            {loadingTimes
              ? <p className={s.timesMsg}>Carregando horários...</p>
              : times.length > 0
                ? <div className={s.timesGrid}>
                    {times.map(t => (
                      <button key={t} type="button" className={`${s.timeBtn} ${time === t ? s.timeBtnSel : ''}`} onClick={() => setTime(t)}>{t}</button>
                    ))}
                  </div>
                : <p className={s.timesMsg}>{service && prof && date ? 'Nenhum horário disponível' : 'Selecione serviço, profissional e data'}</p>
            }
          </div>

          <button type="submit" className={`btn btn-primary ${s.submit}`} disabled={submitting}>
            {submitting ? 'Criando...' : 'Confirmar Agendamento'}
          </button>
        </form>
      </div>

      {modal === 'client'  && <SearchModal title="Selecionar Cliente" items={data.clients} onSelect={setClient} onClose={() => setModal(null)} renderItem={i => <><span className="modal-item-main">{i.name}</span><span className="modal-item-sub">{i.phone||i.email||''}</span></>} />}
      {modal === 'service' && <SearchModal title="Selecionar Serviço" items={data.services} onSelect={setService} onClose={() => setModal(null)} renderItem={i => <><span className="modal-item-main">{i.name}</span><span className="modal-item-sub">{fmtPrice(i.price)} · {i.durationMinutes||i.duration||''}min</span></>} />}
      {modal === 'prof'    && <SearchModal title="Selecionar Profissional" items={data.professionals} onSelect={setProf} onClose={() => setModal(null)} renderItem={i => <><span className="modal-item-main">{i.name}</span><span className="modal-item-sub">{i.email||''}</span></>} />}
      {modal === 'promo'   && <SearchModal title="Selecionar Promoção" items={data.promotions} onSelect={setPromo} onClose={() => setModal(null)} renderItem={i => <><span className="modal-item-main">{i.name}</span><span className="modal-item-sub">{i.description||''}</span></>} />}
    </Layout>
  );
}
