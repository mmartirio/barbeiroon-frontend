import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiChevronDown, FiDownload } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const tok = () => sessionStorage.getItem('token');
const fmtP  = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtDate = (v) => { if (!v) return '—'; const [y,m,d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };
const fmtTime = (v) => String(v || '').slice(0, 5) || '—';

const PERIODOS = [
  { label: 'Diário',     value: 'diario' },
  { label: 'Semanal',    value: 'semanal' },
  { label: 'Quinzenal',  value: 'quinzenal' },
  { label: 'Mensal',     value: 'mensal' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Semestral',  value: 'semestral' },
  { label: 'Anual',      value: 'anual' },
];

const STATUS_COLORS  = { agendado:'#2563eb', concluido:'#16a34a', cancelado:'#dc2626', pendente:'#f59e0b' };
const STATUS_LABELS  = { agendado:'Agendado', concluido:'Concluído', cancelado:'Cancelado', pendente:'Pendente' };

const groupBy = (arr, key) => arr.reduce((acc, item) => {
  const k = key(item) || 'Outros';
  acc[k] = acc[k] || { count: 0, valor: 0 };
  acc[k].count++;
  acc[k].valor += Number(item.valor) || 0;
  return acc;
}, {});

function Selector({ label, value, open, onToggle }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <button type="button" onClick={onToggle}
        style={{ width:'100%', background:'var(--bg-input)', border:`1px solid ${open ? 'var(--accent)' : 'var(--border)'}`, borderRadius:'var(--radius-xs)', padding:'0.6rem 0.75rem', display:'flex', alignItems:'center', justifyContent:'space-between', color:'var(--color)', fontSize:'0.875rem', textAlign:'left' }}>
        <span>{value}</span>
        <FiChevronDown size={14} />
      </button>
    </div>
  );
}

function OptionList({ items, selected, onSelect }) {
  return (
    <div style={{ marginTop:-8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', marginBottom:'0.75rem', maxHeight:200, overflowY:'auto' }}>
      {items.map(item => (
        <button key={String(item.id)} type="button" onClick={() => onSelect(String(item.id))}
          style={{ width:'100%', padding:'0.55rem 0.75rem', textAlign:'left', background: String(item.id) === String(selected) ? 'rgba(37,99,235,0.2)' : 'transparent', color: String(item.id) === String(selected) ? 'var(--accent)' : 'var(--color)', fontSize:'0.875rem', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', fontWeight: String(item.id) === String(selected) ? 700 : 400 }}>
          {item.name}
        </button>
      ))}
    </div>
  );
}

function BarChart({ data, color, max: maxOverride }) {
  const entries = Object.entries(data).sort((a,b) => b[1].count - a[1].count).slice(0, 8);
  if (!entries.length) return <p style={{ color:'var(--color-muted)', fontSize:'0.85rem' }}>Sem dados</p>;
  const max = maxOverride ?? Math.max(1, ...entries.map(([,v]) => v.count));
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
      {entries.map(([name, { count }]) => (
        <div key={name} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ width:110, fontSize:'0.78rem', color:'var(--color-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flexShrink:0 }}>{name}</span>
          <div style={{ flex:1, height:14, background:'var(--bg-input)', borderRadius:7, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.round(count/max*100)}%`, background:color, borderRadius:7, transition:'width 0.4s ease' }} />
          </div>
          <span style={{ width:32, fontSize:'0.78rem', fontWeight:700, color:'var(--color)', textAlign:'right' }}>{count}x</span>
        </div>
      ))}
    </div>
  );
}

export default function Relatorios() {
  const [periodo,     setPeriodo]     = useState('mensal');
  const [usuarioId,   setUsuarioId]   = useState('');
  const [clientePhone,setClientePhone]= useState('');
  const [servicoId,   setServicoId]   = useState('');
  const [showPer,     setShowPer]     = useState(false);
  const [showUsr,     setShowUsr]     = useState(false);
  const [showCli,     setShowCli]     = useState(false);
  const [showSrv,     setShowSrv]     = useState(false);

  const [usuarios,    setUsuarios]    = useState([]);
  const [clientes,    setClientes]    = useState([]);
  const [servicos,    setServicos]    = useState([]);
  const [dados,       setDados]       = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [loadingF,    setLoadingF]    = useState(true);
  const [pesquisado,  setPesquisado]  = useState(false);
  const [tenantInfo,  setTenantInfo]  = useState({});

  useEffect(() => {
    const load = async () => {
      setLoadingF(true);
      try {
        const [uRes, cRes, sRes, tRes] = await Promise.all([
          fetch('/api/user/users?limit=200',  { headers: { Authorization: `Bearer ${tok()}` } }),
          fetch('/api/customer?limit=500',    { headers: { Authorization: `Bearer ${tok()}` } }),
          fetch('/api/service?limit=200',     { headers: { Authorization: `Bearer ${tok()}` } }),
          fetch('/api/tenant/settings',       { headers: { Authorization: `Bearer ${tok()}` } }),
        ]);
        const [uD, cD, sD, tD] = await Promise.all([
          uRes.json().catch(()=>({})),
          cRes.json().catch(()=>({})),
          sRes.json().catch(()=>({})),
          tRes.json().catch(()=>({})),
        ]);
        setUsuarios(uD.users || []);
        setClientes(cD.customers || cD.data || []);
        setServicos(sD.services || sD.data || []);
        setTenantInfo(tD.tenant || tD.settings || tD || {});
      } finally { setLoadingF(false); }
    };
    load();
  }, []);

  const buscar = useCallback(async () => {
    setLoading(true); setPesquisado(true);
    setShowPer(false); setShowUsr(false); setShowCli(false); setShowSrv(false);
    try {
      const params = new URLSearchParams({ periodo });
      if (usuarioId)    params.append('usuarioId', usuarioId);
      if (clientePhone) params.append('clientePhone', clientePhone);
      if (servicoId)    params.append('servicoId', servicoId);
      const res = await fetch(`/api/report/appointments?${params}`, { headers: { Authorization: `Bearer ${tok()}` } });
      const d   = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro');
      setDados(Array.isArray(d.data) ? d.data : []);
      setSummary(d.summary || null);
    } catch { setDados([]); setSummary(null); }
    finally { setLoading(false); }
  }, [periodo, usuarioId, clientePhone, servicoId]);

  const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label || 'Selecione';
  const usuarioLabel = usuarioId ? (usuarios.find(u => String(u.id) === usuarioId)?.name || 'Profissional') : 'Todos os profissionais';
  const clienteLabel = clientePhone ? (clientes.find(c => c.phone === clientePhone)?.name || 'Cliente') : 'Todos os clientes';
  const servicoLabel = servicoId ? (servicos.find(s => String(s.id) === servicoId)?.name || 'Serviço') : 'Todos os serviços';

  const byStatus  = groupBy(dados, i => i.status);
  const byProf    = groupBy(dados, i => i.profissional?.nome);
  const byServico = groupBy(dados, i => i.servico?.nome);

  // Dados específicos do cliente selecionado
  const clienteNome    = clientePhone ? (clientes.find(c => c.phone === clientePhone)?.name || clientePhone) : null;
  const dadosCliente   = clientePhone ? [...dados].sort((a, b) => {
    const da = new Date(String(a.data).split('T')[0] + 'T' + (String(a.horario||'00:00').slice(0,5)));
    const db = new Date(String(b.data).split('T')[0] + 'T' + (String(b.horario||'00:00').slice(0,5)));
    return db - da;
  }) : [];
  const byServicoCliente = groupBy(dadosCliente, i => i.servico?.nome);

  const exportarPdf = useCallback(async () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();

    const nome    = tenantInfo.name        || tenantInfo.companyName || '';
    const fone    = tenantInfo.phone        || tenantInfo.ownerPhone  || '';
    const email   = tenantInfo.email        || '';
    const logoUrl = tenantInfo.logo         || '';
    const endereco = [
      tenantInfo.address,
      tenantInfo.neighborhood,
      tenantInfo.city && tenantInfo.state ? `${tenantInfo.city} - ${tenantInfo.state}` : (tenantInfo.city || tenantInfo.state),
    ].filter(Boolean).join(', ');

    let curY = 10;
    const LOGO_W = 28;
    const LOGO_H = 14;

    // Tenta carregar logo
    if (logoUrl) {
      try {
        const resp = await fetch(logoUrl);
        const blob = await resp.blob();
        const b64  = await new Promise((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result);
          reader.readAsDataURL(blob);
        });
        const ext = logoUrl.match(/\.(png|jpg|jpeg|gif|webp)/i)?.[1]?.toUpperCase() || 'PNG';
        doc.addImage(b64, ext === 'JPG' ? 'JPEG' : ext, 14, curY, LOGO_W, LOGO_H);
      } catch { /* logo indisponível */ }
    }

    // Nome da barbearia
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(nome || 'Barbearia', logoUrl ? 14 + LOGO_W + 4 : pageW / 2, curY + 6, { align: logoUrl ? 'left' : 'center' });

    // Contato / endereço
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const infoLines = [fone, email, endereco].filter(Boolean);
    infoLines.forEach((line, idx) => {
      doc.text(line, logoUrl ? 14 + LOGO_W + 4 : pageW / 2, curY + 11 + idx * 4, { align: logoUrl ? 'left' : 'center' });
    });
    doc.setTextColor(0);

    curY = Math.max(curY + LOGO_H, curY + 10 + infoLines.length * 4) + 3;

    // Linha separadora
    doc.setDrawColor(200);
    doc.line(14, curY, pageW - 14, curY);
    curY += 5;

    // Título do relatório
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Agendamentos', pageW / 2, curY, { align: 'center' });
    curY += 5;

    // Filtros e data
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const filtroTexto = [
      `Período: ${periodoLabel}`,
      usuarioId    ? `Profissional: ${usuarioLabel}` : null,
      clientePhone ? `Cliente: ${clienteLabel}`      : null,
      servicoId    ? `Serviço: ${servicoLabel}`      : null,
    ].filter(Boolean).join('   |   ');
    doc.text(filtroTexto, pageW / 2, curY, { align: 'center' });
    curY += 4;
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW / 2, curY, { align: 'center' });
    doc.setTextColor(0);
    curY += 7;

    // Resumo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${summary?.total ?? dados.length}`, 14, curY);
    doc.text(`Faturamento: ${fmtP(summary?.valorTotal ?? 0)}`, 80, curY);
    doc.text(`Ticket Médio: ${fmtP(summary?.valorMedio ?? 0)}`, 180, curY);
    curY += 6;

    // Tabela
    autoTable(doc, {
      startY: curY,
      head: [['Data', 'Hora', 'Cliente', 'Profissional', 'Serviço', 'Valor', 'Status']],
      body: dados.map(item => [
        fmtDate(item.data),
        fmtTime(item.horario),
        item.cliente?.nome      || '—',
        item.profissional?.nome || '—',
        item.servico?.nome      || '—',
        fmtP(item.valor),
        STATUS_LABELS[item.status] || item.status || '—',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 16 },
        5: { cellWidth: 28, halign: 'right' },
        6: { cellWidth: 24 },
      },
    });

    const filename = `relatorio-${periodo}-${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
  }, [dados, summary, periodo, periodoLabel, usuarioId, usuarioLabel, clientePhone, clienteLabel, servicoId, servicoLabel, tenantInfo]);

  return (
    <Layout title="Relatórios">
      {/* Filters */}
      <div className="card" style={{ marginBottom: '1.25rem' }}>
        <div className="card-body">
          <h3 style={{ marginBottom: '1rem' }}>Filtros</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div>
              <Selector label="Período" value={periodoLabel} open={showPer} onToggle={() => setShowPer(p=>!p)} />
              {showPer && <OptionList items={PERIODOS.map(p=>({id:p.value,name:p.label}))} selected={periodo} onSelect={v=>{setPeriodo(v);setShowPer(false);}} />}
            </div>
            <div>
              <Selector label="Profissional" value={usuarioLabel} open={showUsr} onToggle={() => setShowUsr(p=>!p)} />
              {showUsr && <OptionList items={[{id:'',name:'Todos os profissionais'},...usuarios]} selected={usuarioId} onSelect={v=>{setUsuarioId(v);setShowUsr(false);}} />}
            </div>
            <div>
              <Selector label="Cliente" value={clienteLabel} open={showCli} onToggle={() => setShowCli(p=>!p)} />
              {showCli && <OptionList items={[{id:'',name:'Todos os clientes'},...clientes.map(c=>({id:c.phone,name:c.name}))]} selected={clientePhone} onSelect={v=>{setClientePhone(v);setShowCli(false);}} />}
            </div>
            <div>
              <Selector label="Serviço" value={servicoLabel} open={showSrv} onToggle={() => setShowSrv(p=>!p)} />
              {showSrv && <OptionList items={[{id:'',name:'Todos os serviços'},...servicos]} selected={servicoId} onSelect={v=>{setServicoId(v);setShowSrv(false);}} />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={buscar} disabled={loading || loadingF}>
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            {pesquisado && dados.length > 0 && (
              <button className="btn btn-ghost" onClick={exportarPdf} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FiDownload size={14} /> Exportar PDF
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      {pesquisado && !loading && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="card" style={{ background: 'rgba(37,99,235,0.12)', borderColor: 'var(--accent)' }}>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Total</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800 }}>{summary?.total ?? dados.length}</p>
              </div>
            </div>
            <div className="card" style={{ background: 'rgba(22,163,74,0.12)', borderColor: 'var(--success)' }}>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Faturamento</p>
                <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>{fmtP(summary?.valorTotal ?? 0)}</p>
              </div>
            </div>
            <div className="card" style={{ background: 'rgba(245,158,11,0.12)', borderColor: 'var(--warning)' }}>
              <div className="card-body" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Ticket Médio</p>
                <p style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--warning)' }}>{fmtP(summary?.valorMedio ?? 0)}</p>
              </div>
            </div>
          </div>

          {dados.length > 0 && (
            <>
              {/* Status chips */}
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <div className="card-body">
                  <h4 style={{ marginBottom: '0.75rem' }}>Por Status</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.entries(byStatus).map(([k, { count }]) => (
                      <div key={k} style={{ display:'flex', alignItems:'center', gap:'0.4rem', border:`1px solid ${STATUS_COLORS[k]||'#8b8b93'}`, borderRadius:999, padding:'0.3rem 0.75rem', background:`${STATUS_COLORS[k]||'#8b8b93'}22` }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLORS[k]||'#8b8b93' }} />
                        <span style={{ fontSize:'0.8rem', fontWeight:600, color:STATUS_COLORS[k]||'#8b8b93' }}>{STATUS_LABELS[k]||k}: <strong>{count}</strong></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="card">
                  <div className="card-body">
                    <h4 style={{ marginBottom: '0.75rem' }}>Atendimentos por Profissional</h4>
                    <BarChart data={byProf} color="var(--accent)" />
                  </div>
                </div>
                <div className="card">
                  <div className="card-body">
                    <h4 style={{ marginBottom: '0.75rem' }}>Atendimentos por Serviço</h4>
                    <BarChart data={byServico} color="#7c3aed" />
                  </div>
                </div>
              </div>

              {/* Client history section — shown only when a specific client is selected */}
              {clientePhone && dadosCliente.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--accent)' }}>
                    Histórico de {clienteNome}
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    {/* Last services table */}
                    <div className="card">
                      <div className="card-body">
                        <h4 style={{ marginBottom: '0.75rem' }}>Últimos Serviços</h4>
                        <div className="table-wrap" style={{ maxHeight: 280, overflowY: 'auto' }}>
                          <table className="data-table">
                            <thead>
                              <tr><th>Data</th><th>Serviço</th><th>Profissional</th><th>Valor</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                              {dadosCliente.slice(0, 15).map((item, i) => {
                                const sc = STATUS_COLORS[item.status] || '#8b8b93';
                                return (
                                  <tr key={item.id ?? i}>
                                    <td style={{ fontSize:'0.82rem', whiteSpace:'nowrap' }}>{fmtDate(item.data)}</td>
                                    <td style={{ fontWeight:600, fontSize:'0.85rem' }}>{item.servico?.nome || '—'}</td>
                                    <td style={{ fontSize:'0.82rem', color:'var(--color-muted)' }}>{item.profissional?.nome || '—'}</td>
                                    <td style={{ color:'var(--success)', fontWeight:700, fontSize:'0.82rem' }}>{fmtP(item.valor)}</td>
                                    <td>
                                      <span style={{ background:`${sc}22`, color:sc, border:`1px solid ${sc}`, borderRadius:999, padding:'0.1rem 0.45rem', fontSize:'0.68rem', fontWeight:800, textTransform:'uppercase', whiteSpace:'nowrap' }}>
                                        {STATUS_LABELS[item.status]||item.status||'—'}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Service frequency chart */}
                    <div className="card">
                      <div className="card-body">
                        <h4 style={{ marginBottom: '0.75rem' }}>Serviços Mais Solicitados</h4>
                        <BarChart data={byServicoCliente} color="#7c3aed" />
                        <p style={{ marginTop:'0.75rem', fontSize:'0.72rem', color:'var(--color-muted)' }}>
                          Total de visitas: <strong style={{ color:'var(--color)' }}>{dadosCliente.filter(d => d.status === 'concluido').length}</strong> concluídas
                          {dadosCliente.length > dadosCliente.filter(d => d.status === 'concluido').length && (
                            <span> · {dadosCliente.length - dadosCliente.filter(d => d.status === 'concluido').length} outros</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Table */}
              <div className="table-wrap" style={{ marginBottom: '1.25rem' }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Data</th><th>Hora</th><th>Cliente</th><th>Profissional</th><th>Serviço</th><th>Valor</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {dados.map((item, i) => {
                      const sc = STATUS_COLORS[item.status] || '#8b8b93';
                      return (
                        <tr key={item.id ?? i}>
                          <td style={{ fontSize:'0.85rem' }}>{fmtDate(item.data)}</td>
                          <td style={{ fontSize:'0.85rem' }}>{fmtTime(item.horario)}</td>
                          <td style={{ fontWeight:600 }}>{item.cliente?.nome || '—'}</td>
                          <td>{item.profissional?.nome || '—'}</td>
                          <td style={{ fontSize:'0.85rem' }}>{item.servico?.nome || '—'}</td>
                          <td style={{ color:'var(--success)', fontWeight:700 }}>{fmtP(item.valor)}</td>
                          <td><span style={{ background:`${sc}22`, color:sc, border:`1px solid ${sc}`, borderRadius:999, padding:'0.15rem 0.5rem', fontSize:'0.7rem', fontWeight:800, textTransform:'uppercase' }}>{STATUS_LABELS[item.status]||item.status||'—'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {dados.length === 0 && (
            <div className="empty-state">
              <p>Nenhum agendamento encontrado para os filtros selecionados.</p>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Tente alterar o período ou remover filtros.</p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
