import { useState, useEffect, useCallback } from 'react';
import { FiRefreshCw, FiMessageSquare, FiX, FiSend, FiDownload } from 'react-icons/fi';

const SUPPORT_WA = import.meta.env.VITE_SUPPORT_WA || '5579991071656';

const STATUS_LABEL = {
  open:      'Aberto',
  attending: 'Em atendimento',
  paused:    'Pausado',
  resolved:  'Resolvido',
  canceled:  'Cancelado',
};
const STATUS_CLASS = {
  open:      'badge-amber',
  attending: 'badge-blue',
  paused:    'badge-gray',
  resolved:  'badge-green',
  canceled:  'badge-red',
};
const CATEGORY_LABEL = {
  login:         'Login / Acesso',
  whatsapp:      'WhatsApp',
  agendamento:   'Agendamentos',
  clientes:      'Clientes / Usuários',
  configuracoes: 'Configurações',
  pagamento:     'Pagamento / Cobrança',
  other:         'Outro',
};

const gTok = () => sessionStorage.getItem('gestor_token');

const fmtDate = (v) => {
  if (!v) return '—';
  return new Date(v).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
};

export default function GestorSupport() {
  const [tickets,  setTickets]  = useState([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply,       setReply]       = useState('');
  const [sending,     setSending]     = useState(false);
  const [resolveText, setResolveText] = useState('');
  const [showResolve, setShowResolve] = useState(false);
  const [reports,  setReports]  = useState(null);
  const [view,     setView]     = useState('list'); // list | detail | reports

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter ? `?status=${filter}` : '';
      const r  = await fetch(`/api/gestor/support/tickets${qs}`, { headers: { Authorization: `Bearer ${gTok()}` } });
      const d  = await r.json();
      setTickets(d.tickets || []);
      setTotal(d.total || 0);
    } finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const openTicket = async (t) => {
    setSelected(t);
    setView('detail');
    const r = await fetch(`/api/gestor/support/tickets/${t.id}`, { headers: { Authorization: `Bearer ${gTok()}` } });
    const d = await r.json();
    setMessages(d.messages || []);
    setSelected(d.ticket || t);
  };

  const updateStatus = async (id, status) => {
    await fetch(`/api/gestor/support/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${gTok()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setSelected(prev => ({ ...prev, status }));
    load();
  };

  const resolveTicket = async () => {
    if (!resolveText.trim() || !selected) return;
    setSending(true);
    try {
      // Envia o texto de resolução como mensagem
      await fetch(`/api/gestor/support/tickets/${selected.id}/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${gTok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `✅ Resolução: ${resolveText.trim()}` }),
      });
      // Muda status para resolvido
      await fetch(`/api/gestor/support/tickets/${selected.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${gTok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'resolved' }),
      });
      // Recarrega conversa
      const r = await fetch(`/api/gestor/support/tickets/${selected.id}`, { headers: { Authorization: `Bearer ${gTok()}` } });
      const d = await r.json();
      setMessages(d.messages || []);
      setSelected(d.ticket || selected);
      setResolveText('');
      setShowResolve(false);
      load();
    } finally { setSending(false); }
  };

  const sendReply = async () => {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const r = await fetch(`/api/gestor/support/tickets/${selected.id}/reply`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${gTok()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: reply }),
      });
      const d = await r.json();
      setMessages(prev => [...prev, d.message]);
      setReply('');
      setSelected(prev => ({ ...prev, status: prev.status === 'open' ? 'attending' : prev.status }));
    } finally { setSending(false); }
  };

  const loadReports = async () => {
    const r = await fetch('/api/gestor/support/reports', { headers: { Authorization: `Bearer ${gTok()}` } });
    const d = await r.json();
    setReports(d);
    setView('reports');
  };

  const exportCsv = () => {
    const rows = [['ID','Tenant','Categoria','Status','Criado em','Encerrado em']];
    tickets.forEach(t => rows.push([
      t.id, t.tenantId, CATEGORY_LABEL[t.category] || t.category,
      STATUS_LABEL[t.status], fmtDate(t.created_at), fmtDate(t.closed_at),
    ]));
    const csv = rows.map(r => r.join(';')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `chamados_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  /* ── LIST ── */
  if (view === 'list') return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, flex: 1 }}>Mesa de Chamados</h2>
        <button className="btn btn-ghost btn-sm" onClick={loadReports}><FiMessageSquare size={13} /> Relatórios</button>
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}><FiDownload size={13} /> Exportar CSV</button>
        <button className="btn btn-ghost btn-sm" onClick={load}><FiRefreshCw size={13} /> Atualizar</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {[['', 'Todos'], ['open','Abertos'], ['attending','Em atendimento'], ['paused','Pausados'], ['resolved','Resolvidos'], ['canceled','Cancelados']].map(([val, lbl]) => (
          <button key={val} className={`btn btn-sm ${filter === val ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setFilter(val)}>
            {lbl}
          </button>
        ))}
      </div>

      <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', margin: 0 }}>{total} chamado(s)</p>

      {loading && <div className="empty-state"><p>Carregando...</p></div>}
      {!loading && tickets.length === 0 && <div className="empty-state"><p>Nenhum chamado encontrado.</p></div>}

      {!loading && tickets.length > 0 && (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>#</th><th>Tenant</th><th>Categoria</th><th>Status</th><th>Criado em</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>#{t.id}</td>
                  <td style={{ fontSize: '0.85rem' }}>{t.tenantId}</td>
                  <td style={{ fontSize: '0.85rem' }}>{CATEGORY_LABEL[t.category] || t.category}</td>
                  <td><span className={`badge ${STATUS_CLASS[t.status] || 'badge-gray'}`}>{STATUS_LABEL[t.status] || t.status}</span></td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>{fmtDate(t.created_at)}</td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => openTicket(t)}>Ver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* ── DETAIL ── */
  if (view === 'detail' && selected) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 680 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => { setView('list'); load(); }}>← Voltar</button>
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Chamado #{selected.id}</h2>
        <span className={`badge ${STATUS_CLASS[selected.status] || 'badge-gray'}`}>{STATUS_LABEL[selected.status]}</span>
      </div>

      {/* Info */}
      <div className="card">
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
          <div><span style={{ color: 'var(--color-muted)' }}>Categoria:</span> {CATEGORY_LABEL[selected.category] || selected.category}</div>
          <div><span style={{ color: 'var(--color-muted)' }}>Tenant ID:</span> {selected.tenantId}</div>
          <div><span style={{ color: 'var(--color-muted)' }}>Usuário:</span> {selected.userName || '—'}</div>
          <div><span style={{ color: 'var(--color-muted)' }}>E-mail:</span> {selected.userEmail || '—'}</div>
          <div><span style={{ color: 'var(--color-muted)' }}>Criado em:</span> {fmtDate(selected.created_at)}</div>
          {selected.closed_at && <div><span style={{ color: 'var(--color-muted)' }}>Encerrado em:</span> {fmtDate(selected.closed_at)}</div>}
        </div>
      </div>

      {/* Status actions */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {selected.status !== 'attending' && <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(selected.id, 'attending')}>Em atendimento</button>}
        {selected.status !== 'paused'    && <button className="btn btn-ghost btn-sm" onClick={() => updateStatus(selected.id, 'paused')}>Pausar</button>}
        {!['resolved','canceled'].includes(selected.status) && (
          <button className="btn btn-success btn-sm" onClick={() => { setShowResolve(v => !v); setResolveText(''); }}>
            {showResolve ? '↩ Cancelar resolução' : '✅ Resolver'}
          </button>
        )}
        {selected.status !== 'canceled' && !['resolved'].includes(selected.status) && (
          <button className="btn btn-danger btn-sm" onClick={() => updateStatus(selected.id, 'canceled')}>Cancelar</button>
        )}
        {selected.userEmail && (
          <a href={`https://wa.me/${SUPPORT_WA}?text=${encodeURIComponent(`Chamado #${selected.id} — ${selected.userEmail}`)}`}
            target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
            📱 WhatsApp
          </a>
        )}
      </div>

      {/* Formulário de resolução */}
      {showResolve && (
        <div className="card" style={{ border: '1px solid var(--success)', borderRadius: 'var(--radius-sm)' }}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label className="form-label" style={{ color: '#4ade80' }}>✅ Texto de resolução</label>
            <textarea className="form-input" rows={3} placeholder="Descreva como o problema foi resolvido..."
              value={resolveText} onChange={e => setResolveText(e.target.value)}
              style={{ resize: 'vertical', fontSize: '0.875rem' }} autoFocus />
            <button className="btn btn-success" onClick={resolveTicket} disabled={sending || !resolveText.trim()}>
              {sending ? 'Salvando...' : 'Confirmar resolução'}
            </button>
          </div>
        </div>
      )}

      {/* Conversation */}
      <div className="card" style={{ maxHeight: 320, overflowY: 'auto', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {messages.length === 0 && <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Sem mensagens.</p>}
        {messages.map(m => (
          <div key={m.id} style={{
            alignSelf: m.sender === 'gestor' ? 'flex-end' : 'flex-start',
            background: m.sender === 'gestor' ? 'var(--accent)' : m.sender === 'bot' ? 'var(--bg-input)' : 'var(--bg)',
            color: m.sender === 'gestor' ? '#000' : 'var(--color)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '0.5rem 0.75rem',
            maxWidth: '80%',
            fontSize: '0.82rem',
            lineHeight: 1.45,
            whiteSpace: 'pre-wrap',
          }}>
            <span style={{ fontSize: '0.7rem', color: m.sender === 'gestor' ? '#000a' : 'var(--color-muted)', display: 'block', marginBottom: 2 }}>
              {m.sender === 'gestor' ? '🎧 Gestor' : m.sender === 'bot' ? '🤖 Bot' : '👤 Cliente'} · {fmtDate(m.created_at)}
            </span>
            {m.content}
          </div>
        ))}
      </div>

      {/* Reply */}
      {!['resolved','canceled'].includes(selected.status) && (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <textarea className="form-input" rows={2} placeholder="Responder ao cliente..." value={reply}
            onChange={e => setReply(e.target.value)} style={{ flex: 1, resize: 'none', fontSize: '0.85rem' }} />
          <button className="btn btn-primary" onClick={sendReply} disabled={sending || !reply.trim()}>
            {sending ? '...' : <FiSend size={14} />}
          </button>
        </div>
      )}
    </div>
  );

  /* ── REPORTS ── */
  if (view === 'reports' && reports) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => setView('list')}>← Voltar</button>
        <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Relatório de Chamados (últimos 30 dias)</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '0.75rem' }}>
        {Object.entries(reports.summary).map(([st, n]) => (
          <div key={st} className="card">
            <div className="card-body" style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{n}</p>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.78rem', margin: 0 }}>{STATUS_LABEL[st]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Por categoria</h3></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {Object.entries(reports.byCategory).sort((a,b) => b[1]-a[1]).map(([cat, n]) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>{CATEGORY_LABEL[cat] || cat}</span>
              <strong>{n}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return null;
}
