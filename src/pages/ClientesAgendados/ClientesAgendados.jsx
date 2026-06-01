import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import SearchModal from '../../components/SearchModal/SearchModal';
import { useAuth } from '../../context/AuthContext';
import { FiRefreshCw, FiSearch, FiX, FiEdit2, FiPlus } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const fmtPhone = (p) => {
  if (!p) return '';
  const c = p.replace(/\D/g,'');
  if (c.length <= 2) return c;
  if (c.length <= 7) return `(${c.slice(0,2)}) ${c.slice(2)}`;
  return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`;
};

const fmtDate = (v) => {
  if (!v) return '—';
  try { const d = new Date(v + (v.includes('T') ? '' : 'T12:00:00')); return d.toLocaleDateString('pt-BR'); } catch { return v; }
};

const fmtP = (v) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v||0));
const today = () => new Date().toISOString().split('T')[0];

const parseDuration = (v) => {
  if (!v) return 30;
  if (typeof v === 'number') return v;
  const parts = String(v).split(':');
  if (parts.length >= 2) return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  return parseInt(v) || 30;
};

const normalize = (a) => ({
  ...a,
  status: (a.status || '').toLowerCase().replace('concluido','completed').replace('cancelado','canceled').replace('agendado','scheduled').replace('pendente','pending'),
  customerName:   a.customerName   || a.customer?.name  || '—',
  customerPhone:  a.customerPhone  || a.customer?.phone || '',
  serviceName:    a.serviceName    || a.service?.name   || '—',
  serviceId:      a.serviceId      || a.service?.id     || null,
  professionalName: a.professionalName || a.professional?.name || '—',
  professionalId:   a.professionalId   || a.professional?.id   || null,
  appointmentDate: a.appointmentDate || a.date || '',
  appointmentTime: a.appointmentTime || a.time || '',
});

const FILTERS = [
  { key: 'scheduled', label: 'Agendados',  badgeClass: 'badge-blue'  },
  { key: 'completed', label: 'Concluídos', badgeClass: 'badge-green' },
  { key: 'canceled',  label: 'Cancelados', badgeClass: 'badge-red'   },
];

const STATUS_BADGE = { scheduled: 'badge-blue', completed: 'badge-green', canceled: 'badge-red', pending: 'badge-amber' };
const STATUS_LABEL = { scheduled: 'Agendado', completed: 'Concluído', canceled: 'Cancelado', pending: 'Pendente' };

export default function ClientesAgendados() {
  const { user } = useAuth();
  const tenantId = user?.tenantId || '';

  const [all,      setAll]      = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('scheduled');
  const [search,   setSearch]   = useState('');
  const [acting,   setActing]   = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [reason,   setReason]   = useState('');

  // Edit modal state
  const [editTarget,    setEditTarget]    = useState(null);  // appointment being edited
  const [allServices,   setAllServices]   = useState([]);
  const [allProfs,      setAllProfs]      = useState([]);
  const [editService,   setEditService]   = useState(null);
  const [editExtraSvcs, setEditExtraSvcs] = useState([]);
  const [editProf,      setEditProf]      = useState(null);
  const [editDate,      setEditDate]      = useState('');
  const [editTime,      setEditTime]      = useState('');
  const [editTimes,     setEditTimes]     = useState([]);
  const [editTimesLoading, setEditTimesLoading] = useState(false);
  const [editSaving,    setEditSaving]    = useState(false);
  const [editError,     setEditError]     = useState('');
  const [innerModal,    setInnerModal]    = useState('');  // 'service' | 'prof'

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointment/own?includeAll=true&includeTenant=true', { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      const raw = d.appointments || d.data || [];
      setAll(raw.map(normalize).sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load services + profs once (for edit modal)
  useEffect(() => {
    Promise.all([
      fetch('/api/service?limit=200',  { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.json()).catch(()=>({})),
      fetch('/api/user/barbers',        { headers: { Authorization: `Bearer ${tok()}` } }).then(r=>r.json()).catch(()=>({})),
    ]).then(([s, p]) => {
      setAllServices(s.services || s.data || []);
      setAllProfs(p.users || p.barbers || p.data || []);
    });
  }, []);

  // Load available times for edit modal when prof/date/service changes
  const loadEditTimes = useCallback(async (profId, date, svcId, extraSvcs) => {
    if (!profId || !date || !tenantId) return;
    setEditTimesLoading(true);
    setEditTime('');
    try {
      const totalDur = (svcId ? parseDuration(allServices.find(s => s.id === svcId || String(s.id) === String(svcId))?.duration) : 30)
        + extraSvcs.reduce((acc, s) => acc + parseDuration(s.duration), 0);
      const params = new URLSearchParams({ professionalId: profId, date, tenantId });
      if (totalDur > 30) params.set('duration', String(totalDur));
      else if (svcId)   params.set('serviceId', String(svcId));
      const r = await fetch(`/api/public/appointment/available-times?${params}`);
      const d = await r.json().catch(() => ({}));
      setEditTimes(d.availableTimes || []);
    } catch { setEditTimes([]); }
    finally { setEditTimesLoading(false); }
  }, [tenantId, allServices]);

  useEffect(() => {
    if (editTarget) {
      loadEditTimes(editProf?.id, editDate, editService?.id, editExtraSvcs);
    }
  }, [editProf, editDate, editService, editExtraSvcs, editTarget, loadEditTimes]);

  const openEdit = (a) => {
    const primSvc = allServices.find(s => String(s.id) === String(a.serviceId)) || { id: a.serviceId, name: a.serviceName, duration: 30 };
    const prof    = allProfs.find(p => String(p.id) === String(a.professionalId)) || { id: a.professionalId, name: a.professionalName };
    setEditTarget(a);
    setEditService(primSvc);
    setEditExtraSvcs([]);
    setEditProf(prof);
    setEditDate(String(a.appointmentDate).split('T')[0]);
    setEditTime(String(a.appointmentTime || '').slice(0, 5));
    setEditError('');
    setInnerModal('');
  };

  const closeEdit = () => {
    setEditTarget(null);
    setEditTimes([]);
    setEditExtraSvcs([]);
    setInnerModal('');
  };

  const addExtraSvc = (svc) => {
    if (!editExtraSvcs.find(s => s.id === svc.id) && svc.id !== editService?.id) {
      setEditExtraSvcs(prev => [...prev, svc]);
    }
    setInnerModal('');
    setEditTime('');
  };

  const removeExtraSvc = (id) => { setEditExtraSvcs(prev => prev.filter(s => s.id !== id)); setEditTime(''); };

  const saveEdit = async () => {
    if (!editService || !editProf || !editDate || !editTime) { setEditError('Preencha serviço, profissional, data e horário.'); return; }
    setEditSaving(true); setEditError('');
    try {
      // 1. Update primary appointment
      const res = await fetch(`/api/appointment/${editTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({
          serviceId:       editService.id,
          professionalId:  editProf.id,
          appointmentDate: editDate,
          appointmentTime: editTime + ':00',
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao editar agendamento');

      // 2. Create additional appointments at sequential times
      let curTime = editTime;
      for (const svc of editExtraSvcs) {
        const [h, m] = curTime.split(':').map(Number);
        const prevDur = parseDuration(editService.duration);
        const nextMins = h * 60 + m + prevDur;
        curTime = `${String(Math.floor(nextMins / 60)).padStart(2,'0')}:${String(nextMins % 60).padStart(2,'0')}`;

        await fetch('/api/appointment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify({
            customerPhone:   editTarget.customerPhone,
            serviceId:       svc.id,
            professionalId:  editProf.id,
            appointmentDate: editDate,
            appointmentTime: curTime + ':00',
          }),
        });
      }

      closeEdit();
      await load();
    } catch (err) { setEditError(err.message); }
    finally { setEditSaving(false); }
  };

  const filtered = all.filter(a => {
    if (a.status !== filter && !(filter === 'scheduled' && a.status === 'pending')) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.customerName.toLowerCase().includes(q)
      || a.customerPhone.includes(q)
      || a.serviceName.toLowerCase().includes(q)
      || a.professionalName.toLowerCase().includes(q);
  });

  const conclude = async (a) => {
    setActing(a.id);
    try {
      await fetch(`/api/appointment/own/${a.id}/close`, { method: 'POST', headers: { Authorization: `Bearer ${tok()}` } });
      setAll(prev => prev.map(x => x.id === a.id ? { ...x, status: 'completed' } : x));
    } finally { setActing(null); }
  };

  const openCancel = (a) => { setCancelModal(a); setReason(''); };
  const confirmCancel = async () => {
    setActing(cancelModal.id);
    try {
      await fetch(`/api/appointment/own/${cancelModal.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ reason }),
      });
      setAll(prev => prev.map(x => x.id === cancelModal.id ? { ...x, status: 'canceled' } : x));
      setCancelModal(null);
    } finally { setActing(null); }
  };

  // Total duration in edit modal
  const editTotalDur = (editService ? parseDuration(editService.duration) : 0)
    + editExtraSvcs.reduce((acc, s) => acc + parseDuration(s.duration), 0);
  const editTotalPrice = (editService ? Number(editService.price || 0) : 0)
    + editExtraSvcs.reduce((acc, s) => acc + Number(s.price || 0), 0);

  return (
    <Layout title="Clientes Agendados">
      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(f => (
          <button key={f.key} className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <div className="search-wrap" style={{ flex: 1, minWidth: 200 }}>
          <FiSearch size={14} />
          <input className="search-input" placeholder="Buscar cliente, serviço, profissional..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={load} title="Atualizar"><FiRefreshCw size={14} /></button>
      </div>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && filtered.length === 0 && <div className="empty-state"><p>Nenhum agendamento encontrado</p></div>}

      {!loading && filtered.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>Cliente</th><th>Telefone</th><th>Serviço</th><th>Profissional</th><th>Data</th><th>Hora</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600 }}>{a.customerName}</td>
                  <td style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{fmtPhone(a.customerPhone)}</td>
                  <td>{a.serviceName}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{a.professionalName}</td>
                  <td style={{ fontSize: '0.85rem' }}>{fmtDate(a.appointmentDate)}</td>
                  <td style={{ fontSize: '0.85rem' }}>{a.appointmentTime?.slice(0,5) || '—'}</td>
                  <td><span className={`badge ${STATUS_BADGE[a.status] || 'badge-gray'}`}>{STATUS_LABEL[a.status] || a.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {(a.status === 'scheduled' || a.status === 'pending') && (
                        <>
                          <button className="btn btn-ghost btn-sm btn-icon" title="Editar" onClick={() => openEdit(a)} disabled={acting === a.id}>
                            <FiEdit2 size={13} />
                          </button>
                          <button className="btn btn-success btn-sm" onClick={() => conclude(a)} disabled={acting === a.id}>Concluir</button>
                          <button className="btn btn-danger btn-sm"  onClick={() => openCancel(a)} disabled={acting === a.id}>Cancelar</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cancel modal */}
      {cancelModal && (
        <div className="modal-overlay" onClick={() => setCancelModal(null)}>
          <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Cancelar agendamento</h3><button className="modal-close" onClick={() => setCancelModal(null)}><FiX size={18} /></button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Cancelar agendamento de <strong style={{ color: 'var(--color)' }}>{cancelModal.customerName}</strong>?</p>
              <div className="form-group">
                <label className="form-label">Motivo do cancelamento</label>
                <textarea className="form-input" rows={3} placeholder="Ex: Profissional indisponível..." value={reason} onChange={e => setReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setCancelModal(null)}>Desistir</button>
                <button className="btn btn-danger" style={{ flex: 1 }} onClick={confirmCancel} disabled={acting === cancelModal?.id}>Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && !innerModal && (
        <div className="modal-overlay" onClick={closeEdit}>
          <div className="modal-box" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Agendamento</h3>
              <button className="modal-close" onClick={closeEdit}><FiX size={18} /></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {editError && <div className="alert alert-error">{editError}</div>}

              <p style={{ fontSize: '0.82rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
                Cliente: <strong style={{ color: 'var(--color)' }}>{editTarget.customerName}</strong>
              </p>

              {/* Serviços */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display:'flex', justifyContent:'space-between' }}>
                  <span>Serviços</span>
                  {editTotalDur > 0 && <span style={{ fontWeight:400, color:'var(--color-muted)', fontSize:'0.72rem' }}>{editTotalDur} min · {fmtP(editTotalPrice)}</span>}
                </label>

                {/* Primary service */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', padding:'0.5rem 0.75rem', marginBottom:'0.4rem' }}>
                  <div>
                    <span style={{ fontWeight:600, fontSize:'0.875rem' }}>{editService?.name || '—'}</span>
                    {editService && <span style={{ color:'var(--color-muted)', fontSize:'0.78rem', marginLeft:8 }}>{parseDuration(editService.duration)} min · {fmtP(editService.price)}</span>}
                  </div>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => setInnerModal('service')}>Alterar</button>
                </div>

                {/* Extra services */}
                {editExtraSvcs.map(s => (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', padding:'0.5rem 0.75rem', marginBottom:'0.4rem' }}>
                    <div>
                      <span style={{ color:'var(--color-muted)', marginRight:6, fontSize:'0.75rem' }}>+</span>
                      <span style={{ fontWeight:600, fontSize:'0.875rem' }}>{s.name}</span>
                      <span style={{ color:'var(--color-muted)', fontSize:'0.78rem', marginLeft:8 }}>{parseDuration(s.duration)} min · {fmtP(s.price)}</span>
                    </div>
                    <button type="button" onClick={() => removeExtraSvc(s.id)} style={{ background:'none', border:'none', color:'var(--color-muted)', cursor:'pointer', padding:'0 4px' }}><FiX size={13}/></button>
                  </div>
                ))}

                <button type="button" onClick={() => setInnerModal('extra')}
                  style={{ width:'100%', background:'var(--bg-input)', border:'1px dashed var(--border)', borderRadius:'var(--radius-xs)', padding:'0.45rem 0.75rem', display:'flex', alignItems:'center', gap:'0.4rem', color:'var(--accent)', fontSize:'0.82rem', cursor:'pointer' }}>
                  <FiPlus size={13}/> Adicionar serviço
                </button>
              </div>

              {/* Profissional */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Profissional</label>
                <button type="button" onClick={() => setInnerModal('prof')}
                  style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', padding:'0.6rem 0.75rem', display:'flex', justifyContent:'space-between', alignItems:'center', color: editProf ? 'var(--color)' : 'var(--color-muted)', fontSize:'0.875rem', textAlign:'left' }}>
                  <span>{editProf?.name || 'Selecionar profissional'}</span>
                  <span style={{ fontSize:'0.72rem', color:'var(--color-muted)' }}>Alterar</span>
                </button>
              </div>

              {/* Data */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Data</label>
                <input className="form-input" type="date" min={today()} value={editDate} onChange={e => { setEditDate(e.target.value); setEditTime(''); }} />
              </div>

              {/* Horários */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Horário
                  {editTotalDur > 0 && <span style={{ fontWeight:400, color:'var(--color-muted)', fontSize:'0.72rem', marginLeft:6 }}>— bloqueando {editTotalDur} min</span>}
                </label>
                {editTimesLoading ? (
                  <p style={{ fontSize:'0.82rem', color:'var(--color-muted)' }}>Carregando horários...</p>
                ) : editTimes.length > 0 ? (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem' }}>
                    {editTimes.map(t => (
                      <button key={t} type="button"
                        className={`btn btn-sm ${editTime === t ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setEditTime(t)}>{t}</button>
                    ))}
                  </div>
                ) : editProf && editDate ? (
                  <p style={{ fontSize:'0.82rem', color:'var(--color-muted)' }}>Nenhum horário disponível</p>
                ) : (
                  <p style={{ fontSize:'0.82rem', color:'var(--color-muted)' }}>Selecione profissional e data</p>
                )}
              </div>

              <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.25rem' }}>
                <button className="btn btn-ghost" style={{ flex:1 }} onClick={closeEdit}>Cancelar</button>
                <button className="btn btn-primary" style={{ flex:1 }} onClick={saveEdit} disabled={editSaving || !editTime}>
                  {editSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inner search modals */}
      {innerModal === 'service' && (
        <SearchModal title="Alterar Serviço" items={allServices.filter(s => s.ativo !== false)} searchKey="name"
          onSelect={s => { setEditService(s); setEditTime(''); setInnerModal(''); }} onClose={() => setInnerModal('')}
          renderItem={s => <div><p style={{ fontWeight:600 }}>{s.name}</p><p style={{ color:'#fbbf24', fontSize:'0.8rem' }}>{fmtP(s.price)} · {parseDuration(s.duration)} min</p></div>}
        />
      )}
      {innerModal === 'extra' && (
        <SearchModal title="Adicionar Serviço" items={allServices.filter(s => s.ativo !== false && s.id !== editService?.id && !editExtraSvcs.find(x => x.id === s.id))} searchKey="name"
          onSelect={addExtraSvc} onClose={() => setInnerModal('')}
          renderItem={s => <div><p style={{ fontWeight:600 }}>{s.name}</p><p style={{ color:'#fbbf24', fontSize:'0.8rem' }}>{fmtP(s.price)} · {parseDuration(s.duration)} min</p></div>}
        />
      )}
      {innerModal === 'prof' && (
        <SearchModal title="Alterar Profissional" items={allProfs} searchKey="name"
          onSelect={p => { setEditProf(p); setEditTime(''); setInnerModal(''); }} onClose={() => setInnerModal('')}
        />
      )}
    </Layout>
  );
}
