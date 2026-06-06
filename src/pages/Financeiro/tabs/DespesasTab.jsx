import React, { useState, useEffect, useCallback } from 'react';
import s from '../Financeiro.module.css';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Title, Tooltip, Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { FiPlus, FiTrash2, FiEdit2, FiDownload } from 'react-icons/fi';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const tok  = () => sessionStorage.getItem('token');
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
const fmtD = v => { if (!v) return '—'; const [y,m,d] = String(v).split('T')[0].split('-'); return `${d}/${m}/${y}`; };
const fmtDD = v => { if (!v) return '—'; const [y,m,d] = String(v).split('-'); return `${d}/${m}`; };

const CATEGORIAS = ['Aluguel','Produtos','Equipamentos','Marketing','Salários','Utilidades','Manutenção','Outros'];
const COLORS = ['#dc2626','#f59e0b','#7c3aed','#2563eb','#16a34a','#0891b2','#db2777','#65a30d'];
const EMPTY = { descricao:'', valor:'', categoria:'', data:'', observacao:'' };

const doughnutOpts = {
  responsive: true,
  plugins: {
    legend: { position:'right', labels: { color:'#9ca3af', font:{ size:10 }, boxWidth:12 } },
    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${fmtR(ctx.parsed)}` } },
  },
};

const barOpts = {
  responsive: true,
  plugins: { legend: { display:false }, tooltip: { callbacks: { label: ctx => fmtR(ctx.parsed.y) } } },
  scales: {
    x: { ticks: { color:'#6b7280', font:{ size:10 } }, grid: { color:'rgba(255,255,255,0.05)' } },
    y: { ticks: { color:'#6b7280', font:{ size:10 }, callback: v => fmtR(v) }, grid: { color:'rgba(255,255,255,0.05)' } },
  },
};

export default function DespesasTab({ periodo }) {
  const [data,      setData]      = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(false);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [catFilter, setCatFilter] = useState('');

  const buscar = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ periodo });
    if (catFilter) params.set('categoria', catFilter);
    fetch(`/api/financeiro/despesas?${params}`, { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json())
      .then(d => { setData(d.data || []); setTotal(d.total || 0); })
      .finally(() => setLoading(false));
  }, [periodo, catFilter]);

  useEffect(() => { buscar(); }, [buscar]);

  // Agrupamentos para gráficos
  const byCat = data.reduce((acc, d) => { const k = d.categoria || 'Outros'; acc[k] = (acc[k]||0) + Number(d.valor||0); return acc; }, {});
  const catEntries = Object.entries(byCat).sort((a,b) => b[1]-a[1]);

  const byDay = data.reduce((acc, d) => { acc[d.data] = (acc[d.data]||0) + Number(d.valor||0); return acc; }, {});
  const dayLabels = Object.keys(byDay).sort();

  const doughnutData = {
    labels: catEntries.map(([k]) => k),
    datasets: [{ data: catEntries.map(([,v]) => v), backgroundColor: COLORS, borderWidth: 0 }],
  };

  const barData = {
    labels: dayLabels.map(fmtDD),
    datasets: [{ label:'Despesa', data: dayLabels.map(d => byDay[d]), backgroundColor:'rgba(220,38,38,0.75)', borderRadius:4 }],
  };

  const openNew  = () => { setForm({ ...EMPTY, data: new Date().toISOString().slice(0,10) }); setEditId(null); setModal(true); };
  const openEdit = item => { setForm({ descricao:item.descricao, valor:item.valor, categoria:item.categoria||'', data:item.data, observacao:item.observacao||'' }); setEditId(item.id); setModal(true); };

  const salvar = async () => {
    if (!form.descricao || !form.valor || !form.data) return alert('Preencha descrição, valor e data.');
    setSaving(true);
    try {
      const res = await fetch(editId ? `/api/financeiro/despesas/${editId}` : '/api/financeiro/despesas', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${tok()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setModal(false); buscar();
    } catch { alert('Erro ao salvar despesa.'); }
    finally { setSaving(false); }
  };

  const excluir = async id => {
    if (!window.confirm('Excluir esta despesa?')) return;
    await fetch(`/api/financeiro/despesas/${id}`, { method:'DELETE', headers:{ Authorization:`Bearer ${tok()}` } });
    buscar();
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
        <div className={s.inputRow} style={{ margin:0 }}>
          <div className={s.inputGroup}>
            <label>Categoria</label>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="">Todas</option>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          <button className="btn btn-primary" onClick={openNew} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}><FiPlus size={14} /> Nova Despesa</button>
        </div>
      </div>

      {/* KPI */}
      <div className={s.kpiCard} style={{ display:'inline-flex', flexDirection:'column', gap:'0.15rem', minWidth:180 }}>
        <span className={s.kpiLabel}>Total de Despesas</span>
        <span className={s.kpiValue} style={{ color:'#dc2626' }}>{fmtR(total)}</span>
      </div>

      {/* Gráficos */}
      {data.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom:'0.75rem', fontSize:'0.875rem' }}>Despesa por Categoria</h4>
              <Doughnut data={doughnutData} options={doughnutOpts} />
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <h4 style={{ marginBottom:'0.75rem', fontSize:'0.875rem' }}>Despesa por Dia</h4>
              <Bar data={barData} options={barOpts} />
            </div>
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <p className={s.emptyState}>Carregando...</p>
      ) : data.length === 0 ? (
        <p className={s.emptyState}>Nenhuma despesa registrada no período.</p>
      ) : (
        <div className={s.tableWrap}>
          <table className="data-table">
            <thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Obs</th><th></th></tr></thead>
            <tbody>
              {data.map(item => (
                <tr key={item.id}>
                  <td style={{ fontSize:'0.85rem', whiteSpace:'nowrap' }}>{fmtD(item.data)}</td>
                  <td style={{ fontWeight:600 }}>{item.descricao}</td>
                  <td style={{ fontSize:'0.82rem', color:'var(--color-muted)' }}>{item.categoria||'—'}</td>
                  <td style={{ color:'#dc2626', fontWeight:700 }}>{fmtR(item.valor)}</td>
                  <td style={{ fontSize:'0.78rem', color:'var(--color-muted)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.observacao||'—'}</td>
                  <td style={{ whiteSpace:'nowrap' }}>
                    <button className="btn btn-ghost" onClick={() => openEdit(item)} style={{ padding:'0.2rem 0.4rem', marginRight:'0.25rem' }}><FiEdit2 size={13} /></button>
                    <button className="btn btn-ghost" onClick={() => excluir(item.id)} style={{ padding:'0.2rem 0.4rem', color:'#dc2626' }}><FiTrash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div className="card" style={{ width:'100%', maxWidth:440, padding:'1.5rem' }}>
            <h3 style={{ marginBottom:'1rem' }}>{editId ? 'Editar Despesa' : 'Nova Despesa'}</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              <div className={s.inputGroup}><label>Descrição *</label><input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao:e.target.value }))} placeholder="Ex: Compra de produtos" /></div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                <div className={s.inputGroup}><label>Valor (R$) *</label><input type="number" min="0" step="0.01" value={form.valor} onChange={e => setForm(f => ({ ...f, valor:e.target.value }))} placeholder="0,00" /></div>
                <div className={s.inputGroup}><label>Data *</label><input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data:e.target.value }))} /></div>
              </div>
              <div className={s.inputGroup}><label>Categoria</label><select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria:e.target.value }))}><option value="">Selecione</option>{CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              <div className={s.inputGroup}><label>Observação</label><input value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao:e.target.value }))} placeholder="Opcional" /></div>
            </div>
            <div style={{ display:'flex', gap:'0.5rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
