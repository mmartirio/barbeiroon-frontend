import React, { useState, useEffect, useCallback } from 'react';
import { FiChevronDown, FiDownload, FiFileText } from 'react-icons/fi';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import s from '../Financeiro.module.css';

const tok = () => sessionStorage.getItem('token');
const fmtP   = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtDate = v => { if (!v) return '—'; const [y,m,d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };
const fmtTime = v => String(v || '').slice(0, 5) || '—';

const PERIODOS = [
  { label: 'Diário',     value: 'diario' },
  { label: 'Semanal',    value: 'semanal' },
  { label: 'Quinzenal',  value: 'quinzenal' },
  { label: 'Mensal',     value: 'mensal' },
  { label: 'Trimestral', value: 'trimestral' },
  { label: 'Semestral',  value: 'semestral' },
  { label: 'Anual',      value: 'anual' },
];

const STATUS_COLORS = { agendado:'#2563eb', concluido:'#16a34a', cancelado:'#dc2626', pendente:'#f59e0b' };
const STATUS_LABELS = { agendado:'Agendado', concluido:'Concluído', cancelado:'Cancelado', pendente:'Pendente' };

function Selector({ label, value, open, onToggle }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <button type="button" onClick={onToggle}
        style={{ width:'100%', background:'var(--bg-input)', border:`1px solid ${open?'var(--accent)':'var(--border)'}`, borderRadius:'var(--radius-xs)', padding:'0.6rem 0.75rem', display:'flex', alignItems:'center', justifyContent:'space-between', color:'var(--color)', fontSize:'0.875rem', textAlign:'left' }}>
        <span>{value}</span><FiChevronDown size={14} />
      </button>
    </div>
  );
}

function OptionList({ items, selected, onSelect }) {
  return (
    <div style={{ marginTop:-8, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', marginBottom:'0.75rem', maxHeight:200, overflowY:'auto' }}>
      {items.map(item => (
        <button key={String(item.id)} type="button" onClick={() => onSelect(String(item.id))}
          style={{ width:'100%', padding:'0.55rem 0.75rem', textAlign:'left', background: String(item.id)===String(selected)?'rgba(37,99,235,0.2)':'transparent', color: String(item.id)===String(selected)?'var(--accent)':'var(--color)', fontSize:'0.875rem', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', fontWeight: String(item.id)===String(selected)?700:400 }}>
          {item.name}
        </button>
      ))}
    </div>
  );
}

export default function RelatoriosTab() {
  const [periodo,      setPeriodo]      = useState('mensal');
  const [usuarioId,    setUsuarioId]    = useState('');
  const [clientePhone, setClientePhone] = useState('');
  const [servicoId,    setServicoId]    = useState('');
  const [showPer,      setShowPer]      = useState(false);
  const [showUsr,      setShowUsr]      = useState(false);
  const [showCli,      setShowCli]      = useState(false);
  const [showSrv,      setShowSrv]      = useState(false);

  const [usuarios,   setUsuarios]   = useState([]);
  const [clientes,   setClientes]   = useState([]);
  const [servicos,   setServicos]   = useState([]);
  const [dados,      setDados]      = useState([]);
  const [resumo,     setResumo]     = useState(null);
  const [summary,    setSummary]    = useState(null);
  const [despesas,   setDespesas]   = useState([]);
  const [comissoes,  setComissoes]  = useState([]);
  const [ranking,    setRanking]    = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [loadingF,   setLoadingF]   = useState(true);
  const [pesquisado, setPesquisado] = useState(false);
  const [tenantInfo, setTenantInfo] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoadingF(true);
      try {
        const [uRes, cRes, sRes, tRes] = await Promise.all([
          fetch('/api/user/users?limit=200', { headers: { Authorization: `Bearer ${tok()}` } }),
          fetch('/api/customer?limit=500',   { headers: { Authorization: `Bearer ${tok()}` } }),
          fetch('/api/service?limit=200',    { headers: { Authorization: `Bearer ${tok()}` } }),
          fetch('/api/tenant/settings',      { headers: { Authorization: `Bearer ${tok()}` } }),
        ]);
        const [uD, cD, sD, tD] = await Promise.all([uRes.json().catch(()=>({})), cRes.json().catch(()=>({})), sRes.json().catch(()=>({})), tRes.json().catch(()=>({}))]);
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

      const [agRes, resRes, despRes, comRes, rankRes] = await Promise.all([
        fetch(`/api/report/appointments?${params}`,        { headers: { Authorization: `Bearer ${tok()}` } }),
        fetch(`/api/financeiro/resumo?periodo=${periodo}`, { headers: { Authorization: `Bearer ${tok()}` } }),
        fetch(`/api/financeiro/despesas?periodo=${periodo}`,{ headers: { Authorization: `Bearer ${tok()}` } }),
        fetch(`/api/financeiro/comissao?periodo=${periodo}`,{ headers: { Authorization: `Bearer ${tok()}` } }),
        fetch(`/api/financeiro/ranking?periodo=${periodo}`, { headers: { Authorization: `Bearer ${tok()}` } }),
      ]);

      const [agD, resD, despD, comD, rankD] = await Promise.all([
        agRes.json().catch(()=>({})),
        resRes.json().catch(()=>({})),
        despRes.json().catch(()=>({})),
        comRes.json().catch(()=>({})),
        rankRes.json().catch(()=>({})),
      ]);

      setDados(Array.isArray(agD.data) ? agD.data : []);
      setSummary(agD.summary || null);
      setResumo(resD || null);
      setDespesas(despD.data || []);
      setComissoes(comD.data || []);
      setRanking(rankD.data || []);
    } catch { setDados([]); setSummary(null); }
    finally { setLoading(false); }
  }, [periodo, usuarioId, clientePhone, servicoId]);

  const periodoLabel = PERIODOS.find(p => p.value === periodo)?.label || 'Selecione';
  const usuarioLabel = usuarioId ? (usuarios.find(u => String(u.id)===usuarioId)?.name || 'Profissional') : 'Todos';
  const clienteLabel = clientePhone ? (clientes.find(c => c.phone===clientePhone)?.name || 'Cliente') : 'Todos';
  const servicoLabel = servicoId ? (servicos.find(sv => String(sv.id)===servicoId)?.name || 'Serviço') : 'Todos';

  // ── EXPORTAR PDF ──────────────────────────────────────────────────────────────
  const exportarPdf = useCallback(async () => {
    const doc    = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW  = doc.internal.pageSize.getWidth();
    const nome   = tenantInfo.name || tenantInfo.companyName || '';
    const logoUrl = tenantInfo.logo || '';
    const LOGO_W = 28, LOGO_H = 14;
    let curY = 10;

    if (logoUrl) {
      try {
        const resp = await fetch(logoUrl);
        const blob = await resp.blob();
        const b64  = await new Promise(res => { const r = new FileReader(); r.onloadend = () => res(r.result); r.readAsDataURL(blob); });
        const ext  = logoUrl.match(/\.(png|jpg|jpeg|gif|webp)/i)?.[1]?.toUpperCase() || 'PNG';
        doc.addImage(b64, ext === 'JPG' ? 'JPEG' : ext, 14, curY, LOGO_W, LOGO_H);
      } catch {}
    }

    doc.setFontSize(15); doc.setFont('helvetica', 'bold');
    doc.text(nome || 'Barbearia', logoUrl ? 14 + LOGO_W + 4 : pageW / 2, curY + 6, { align: logoUrl ? 'left' : 'center' });
    const fone  = tenantInfo.phone || '';
    const email = tenantInfo.email || '';
    const end   = [tenantInfo.address, tenantInfo.city].filter(Boolean).join(', ');
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
    [fone, email, end].filter(Boolean).forEach((line, i) => {
      doc.text(line, logoUrl ? 14 + LOGO_W + 4 : pageW / 2, curY + 11 + i * 4, { align: logoUrl ? 'left' : 'center' });
    });
    doc.setTextColor(0);
    curY = Math.max(curY + LOGO_H, curY + 14) + 4;
    doc.setDrawColor(200); doc.line(14, curY, pageW - 14, curY); curY += 6;

    // Cabeçalho relatório
    doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text('Relatório Financeiro Completo', pageW / 2, curY, { align: 'center' }); curY += 5;
    doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(100);
    doc.text(`Período: ${periodoLabel}   |   Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageW / 2, curY, { align: 'center' });
    doc.setTextColor(0); curY += 8;

    // 1. Resumo financeiro
    if (resumo) {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('1. Resumo Financeiro', 14, curY); curY += 4;
      autoTable(doc, {
        startY: curY,
        head: [['Indicador', 'Valor']],
        body: [
          ['Faturamento Bruto',  fmtP(resumo.faturamentoBruto)],
          ['Total Despesas',     fmtP(resumo.totalDespesas)],
          ['Lucro Líquido',      fmtP(resumo.lucroLiquido)],
          ['Ticket Médio',       fmtP(resumo.ticketMedio)],
          ['Taxa de Conversão',  `${resumo.taxaConversao}%`],
          ['Receita Potencial',  fmtP(resumo.receitaPotencial)],
          ['Total Agendamentos', String(resumo.qtdTotal || 0)],
          ['Concluídos',         String(resumo.qtdConcluidos || 0)],
          ['Agendados',          String(resumo.qtdAgendados  || 0)],
          ['Cancelados',         String(resumo.qtdCancelados || 0)],
          ['Pendentes',          String(resumo.qtdPendentes  || 0)],
          ['Clientes Únicos',    String(resumo.qtdClientes   || 0)],
        ],
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
        columnStyles: { 1: { halign: 'right' } },
        tableWidth: 100,
      });
      curY = doc.lastAutoTable.finalY + 8;
    }

    // 2. Agendamentos
    if (dados.length > 0) {
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('2. Agendamentos', 14, curY); curY += 4;
      autoTable(doc, {
        startY: curY,
        head: [['Data', 'Hora', 'Cliente', 'Profissional', 'Serviço', 'Valor', 'Status']],
        body: dados.map(item => [fmtDate(item.data), fmtTime(item.horario), item.cliente?.nome||'—', item.profissional?.nome||'—', item.servico?.nome||'—', fmtP(item.valor), STATUS_LABELS[item.status]||item.status||'—']),
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235] },
        alternateRowStyles: { fillColor: [245, 247, 250] },
      });
      curY = doc.lastAutoTable.finalY + 8;
    }

    // 3. Despesas
    if (despesas.length > 0) {
      if (curY > 170) { doc.addPage(); curY = 14; }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('3. Despesas', 14, curY); curY += 4;
      autoTable(doc, {
        startY: curY,
        head: [['Data', 'Descrição', 'Categoria', 'Valor']],
        body: despesas.map(d => [fmtDate(d.data), d.descricao, d.categoria||'—', fmtP(d.valor)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [220, 38, 38] },
      });
      curY = doc.lastAutoTable.finalY + 8;
    }

    // 4. Comissões
    if (comissoes.length > 0) {
      if (curY > 170) { doc.addPage(); curY = 14; }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('4. Comissões', 14, curY); curY += 4;
      autoTable(doc, {
        startY: curY,
        head: [['Profissional', 'Atendimentos', 'Faturamento', 'Comissão %', 'Comissão R$']],
        body: comissoes.map(b => [b.nome, String(b.qtdAtendimentos), fmtP(b.faturamento), `${b.percentual}%`, fmtP(b.comissao)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [124, 58, 237] },
      });
      curY = doc.lastAutoTable.finalY + 8;
    }

    // 5. Ranking
    if (ranking.length > 0) {
      if (curY > 170) { doc.addPage(); curY = 14; }
      doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.text('5. Ranking de Barbeiros', 14, curY); curY += 4;
      autoTable(doc, {
        startY: curY,
        head: [['#', 'Profissional', 'Atendimentos', 'Ticket Médio', 'Faturamento']],
        body: ranking.map((b, i) => [i+1, b.nome, String(b.atendimentos), fmtP(b.ticketMedio), fmtP(b.faturamento)]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [37, 99, 235] },
      });
    }

    doc.save(`relatorio-financeiro-${periodo}-${new Date().toISOString().slice(0,10)}.pdf`);
  }, [dados, resumo, despesas, comissoes, ranking, periodo, periodoLabel, tenantInfo]);

  // ── EXPORTAR EXCEL ────────────────────────────────────────────────────────────
  const exportarExcel = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Resumo
    if (resumo) {
      const rows = [
        { Indicador: 'Faturamento Bruto',  Valor: resumo.faturamentoBruto },
        { Indicador: 'Total Despesas',     Valor: resumo.totalDespesas },
        { Indicador: 'Lucro Líquido',      Valor: resumo.lucroLiquido },
        { Indicador: 'Ticket Médio',       Valor: resumo.ticketMedio },
        { Indicador: 'Taxa de Conversão',  Valor: `${resumo.taxaConversao}%` },
        { Indicador: 'Total Agendamentos', Valor: resumo.qtdTotal },
        { Indicador: 'Concluídos',         Valor: resumo.qtdConcluidos },
        { Indicador: 'Agendados',          Valor: resumo.qtdAgendados },
        { Indicador: 'Cancelados',         Valor: resumo.qtdCancelados },
        { Indicador: 'Pendentes',          Valor: resumo.qtdPendentes },
        { Indicador: 'Clientes Únicos',    Valor: resumo.qtdClientes },
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Resumo');
    }

    // Agendamentos
    if (dados.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dados.map(item => ({
        Data: fmtDate(item.data), Hora: fmtTime(item.horario),
        Cliente: item.cliente?.nome||'', Profissional: item.profissional?.nome||'',
        Serviço: item.servico?.nome||'', Valor: Number(item.valor||0),
        Status: STATUS_LABELS[item.status]||item.status||'',
      }))), 'Agendamentos');
    }

    // Despesas
    if (despesas.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(despesas.map(d => ({
        Data: fmtDate(d.data), Descrição: d.descricao, Categoria: d.categoria||'', Valor: Number(d.valor||0), Observação: d.observacao||'',
      }))), 'Despesas');
    }

    // Comissões
    if (comissoes.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(comissoes.map(b => ({
        Profissional: b.nome, Atendimentos: b.qtdAtendimentos, Faturamento: b.faturamento, 'Comissão %': b.percentual, 'Comissão R$': b.comissao,
      }))), 'Comissões');
    }

    // Ranking
    if (ranking.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ranking.map((b, i) => ({
        '#': i+1, Profissional: b.nome, Atendimentos: b.atendimentos, 'Ticket Médio': b.ticketMedio, Faturamento: b.faturamento,
      }))), 'Ranking');
    }

    XLSX.writeFile(wb, `relatorio-financeiro-${periodo}-${new Date().toISOString().slice(0,10)}.xlsx`);
  }, [dados, resumo, despesas, comissoes, ranking, periodo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Filtros */}
      <div className="card">
        <div className="card-body">
          <h3 style={{ marginBottom: '1rem' }}>Filtros</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
            <div>
              <Selector label="Período" value={periodoLabel} open={showPer} onToggle={() => setShowPer(p=>!p)} />
              {showPer && <OptionList items={PERIODOS.map(p=>({id:p.value,name:p.label}))} selected={periodo} onSelect={v=>{setPeriodo(v);setShowPer(false);}} />}
            </div>
            <div>
              <Selector label="Profissional" value={usuarioLabel} open={showUsr} onToggle={() => setShowUsr(p=>!p)} />
              {showUsr && <OptionList items={[{id:'',name:'Todos'},...usuarios]} selected={usuarioId} onSelect={v=>{setUsuarioId(v);setShowUsr(false);}} />}
            </div>
            <div>
              <Selector label="Cliente" value={clienteLabel} open={showCli} onToggle={() => setShowCli(p=>!p)} />
              {showCli && <OptionList items={[{id:'',name:'Todos'},...clientes.map(c=>({id:c.phone,name:c.name}))]} selected={clientePhone} onSelect={v=>{setClientePhone(v);setShowCli(false);}} />}
            </div>
            <div>
              <Selector label="Serviço" value={servicoLabel} open={showSrv} onToggle={() => setShowSrv(p=>!p)} />
              {showSrv && <OptionList items={[{id:'',name:'Todos'},...servicos]} selected={servicoId} onSelect={v=>{setServicoId(v);setShowSrv(false);}} />}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={buscar} disabled={loading || loadingF}>
              {loading ? 'Buscando...' : 'Gerar Relatório'}
            </button>
            {pesquisado && !loading && (
              <>
                <button className="btn btn-ghost" onClick={exportarPdf} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <FiDownload size={14} /> Exportar PDF
                </button>
                <button className="btn btn-ghost" onClick={exportarExcel} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                  <FiFileText size={14} /> Exportar Excel
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {pesquisado && !loading && resumo && (
        <>
          {/* KPIs resumo */}
          <div className={s.kpiGrid}>
            {[
              { label:'Faturamento Bruto',  value:fmtP(resumo.faturamentoBruto), color:'var(--success)' },
              { label:'Total Despesas',     value:fmtP(resumo.totalDespesas),    color:'#dc2626' },
              { label:'Lucro Líquido',      value:fmtP(resumo.lucroLiquido),     color:resumo.lucroLiquido>=0?'var(--success)':'#dc2626' },
              { label:'Ticket Médio',       value:fmtP(resumo.ticketMedio),      color:'#f59e0b' },
              { label:'Taxa de Conversão',  value:`${resumo.taxaConversao}%`,    color:resumo.taxaConversao>=70?'var(--success)':'#f59e0b' },
              { label:'Total Agendamentos', value:String(resumo.qtdTotal||0),    color:'var(--color)' },
              { label:'Concluídos',         value:String(resumo.qtdConcluidos||0), color:'var(--success)' },
              { label:'Cancelados',         value:String(resumo.qtdCancelados||0), color:'#dc2626' },
            ].map(k => (
              <div key={k.label} className={s.kpiCard}>
                <span className={s.kpiLabel}>{k.label}</span>
                <span className={s.kpiValue} style={{ color:k.color, fontSize:'1.1rem' }}>{k.value}</span>
              </div>
            ))}
          </div>

          {/* Tabela agendamentos */}
          {dados.length > 0 && (
            <div>
              <h4 style={{ marginBottom:'0.75rem', fontSize:'0.9rem' }}>Agendamentos ({dados.length})</h4>
              <div className={s.tableWrap}>
                <table className="data-table">
                  <thead>
                    <tr><th>Data</th><th>Hora</th><th>Cliente</th><th>Profissional</th><th>Serviço</th><th>Valor</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {dados.map((item, i) => {
                      const sc = STATUS_COLORS[item.status] || '#8b8b93';
                      return (
                        <tr key={item.id ?? i}>
                          <td data-label="Data" style={{ fontSize:'0.85rem' }}>{fmtDate(item.data)}</td>
                          <td data-label="Hora" style={{ fontSize:'0.85rem' }}>{fmtTime(item.horario)}</td>
                          <td data-label="Cliente" style={{ fontWeight:600 }}>{item.cliente?.nome||'—'}</td>
                          <td data-label="Profissional">{item.profissional?.nome||'—'}</td>
                          <td data-label="Serviço" style={{ fontSize:'0.85rem' }}>{item.servico?.nome||'—'}</td>
                          <td data-label="Valor" style={{ color:'var(--success)', fontWeight:700 }}>{fmtP(item.valor)}</td>
                          <td data-label="Status"><span style={{ background:`${sc}22`, color:sc, border:`1px solid ${sc}`, borderRadius:999, padding:'0.15rem 0.5rem', fontSize:'0.7rem', fontWeight:800, textTransform:'uppercase' }}>{STATUS_LABELS[item.status]||item.status||'—'}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {dados.length === 0 && (
            <div className="empty-state">
              <p>Nenhum agendamento encontrado para os filtros selecionados.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
