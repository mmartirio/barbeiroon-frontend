import React, { useState } from 'react';
import Sidebar from '../../painel/sidebar/Sidebar';
import '../../painel/AdminDashboard.css';
import Button from '../../../components/Button';

const CRITERIOS = [
  { label: 'Aniversariantes do mês', value: 'aniversariantes' },
  { label: 'Após X compras', value: 'x_compras' },
  { label: 'Na compra do serviço X', value: 'servico_x' },
  { label: 'Efetiva no prazo estimado', value: 'prazo_estimado' },
  { label: 'Número específico de clientes', value: 'num_clientes' },
];

const TIPOS = [
  { label: 'Desconto na compra', value: 'desconto_compra' },
  { label: 'Desconto na próxima compra', value: 'desconto_proxima' },
];

const TIPOS_PRECO = [
  { label: 'Fixo (R$)', value: 'fixo' },
  { label: 'Percentual (%)', value: 'percentual' },
];

export default function Promocoes() {
  // ...existing code...
  const [form, setForm] = useState({
    nome: '',
    preco: '',
    tipoPreco: 'fixo',
    tipo: 'desconto_compra',
    validadeInicio: '',
    validadeFim: '',
    criterios: [],
    xCompras: '',
    servicoX: '',
    numClientes: '',
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm(prev => ({
        ...prev,
        criterios: checked
          ? [...prev.criterios, value]
          : prev.criterios.filter(c => c !== value),
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    // Simulação de envio
    setTimeout(() => {
      setSuccessMsg('Promoção criada com sucesso!');
      setLoading(false);
      setForm({
        nome: '', preco: '', tipoPreco: 'fixo', tipo: 'desconto_compra', validadeInicio: '', validadeFim: '', criterios: [], xCompras: '', servicoX: '', numClientes: ''
      });
    }, 1200);
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified portal-layout">
        <div className="portal-card portal-card--narrow">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Nova Promoção</h2>
          </div>
          <div className="portal-card-body">
            {errorMsg && <div className="alert-error" role="alert" style={{ textAlign: 'center', width: '100%' }}>{errorMsg}</div>}
            {successMsg && <div className="alert-success" role="status" style={{ textAlign: 'center', width: '100%' }}>{successMsg}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', maxWidth: 500, margin: '0 auto', width: '100%' }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <label htmlFor="nome" style={{ width: '100%', fontWeight: 600, color: '#e5e7eb', textAlign: 'center', marginBottom: 4 }}>Nome da Promoção:</label>
                <input id="nome" name="nome" type="text" value={form.nome} onChange={handleChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center', marginBottom: 12 }} />
              </div>
              <div style={{ width: '100%', display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label htmlFor="preco" style={{ width: '100%', fontWeight: 600, color: '#e5e7eb', textAlign: 'center', marginBottom: 4 }}>Preço:</label>
                  <input id="preco" name="preco" type="number" min="0" value={form.preco} onChange={handleChange} required style={{ width: 'calc(50% - 4px)', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center', marginBottom: 12 }} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label htmlFor="tipoPreco" style={{ width: '100%', fontWeight: 600, color: '#e5e7eb', textAlign: 'center', marginBottom: 4 }}>Tipo de Preço:</label>
                  <select id="tipoPreco" name="tipoPreco" value={form.tipoPreco} onChange={handleChange} style={{ width: 'calc(50% - 4px)', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center', marginBottom: 12, color: '#111' }}>
                    {TIPOS_PRECO.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ width: '100%', display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label htmlFor="tipo" style={{ width: '100%', fontWeight: 600, color: '#e5e7eb', textAlign: 'center', marginBottom: 4 }}>Tipo:</label>
                  <select id="tipo" name="tipo" value={form.tipo} onChange={handleChange} style={{ width: '90%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center', marginBottom: 12, color: '#111' }}>
                    {TIPOS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <label style={{ width: '100%', fontWeight: 600, color: '#e5e7eb', textAlign: 'center', marginBottom: 4 }}>Validade da Promoção:</label>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <input id="validadeInicio" name="validadeInicio" type="date" value={form.validadeInicio} onChange={handleChange} required style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center', marginBottom: 12 }} placeholder="Início" />
                    <input id="validadeFim" name="validadeFim" type="date" value={form.validadeFim} onChange={handleChange} required style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center', marginBottom: 12 }} placeholder="Fim" />
                  </div>
                </div>
              </div>
              <div style={{ width: '100%', marginTop: 12 }}>
                <label style={{ width: '100%', fontWeight: 600, color: '#e5e7eb', textAlign: 'center', marginBottom: 10, display: 'block' }}>Critérios:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 12, marginBottom: 12, justifyItems: 'start', justifyContent: 'center' }}>
                  {CRITERIOS.map(opt => (
                    <label key={opt.value} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 3, fontWeight: 500, color: '#e5e7eb', textAlign: 'left', lineHeight: 1.3, padding: '2px 0', whiteSpace: 'nowrap' }}>
                      <input type="checkbox" name="criterios" value={opt.value} checked={form.criterios.includes(opt.value)} onChange={handleChange} style={{ margin: 0, width: 20, height: 20 }} />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {/* Campos extras condicionais */}
                {form.criterios.includes('x_compras') && (
                  <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
                    <label style={{ color: '#e5e7eb', minWidth: 170 }}>Quantidade de compras:</label>
                    <input type="number" name="xCompras" min="1" value={form.xCompras} onChange={handleChange} style={{ width: 90 }} />
                  </div>
                )}
                {form.criterios.includes('servico_x') && (
                  <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
                    <label style={{ color: '#e5e7eb', minWidth: 170 }}>Nome do serviço:</label>
                    <input type="text" name="servicoX" value={form.servicoX} onChange={handleChange} style={{ width: 200 }} />
                  </div>
                )}
                {form.criterios.includes('num_clientes') && (
                  <div style={{ margin: '8px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%' }}>
                    <label style={{ color: '#e5e7eb', minWidth: 170 }}>Número de clientes:</label>
                    <input type="number" name="numClientes" min="1" value={form.numClientes} onChange={handleChange} style={{ width: 90 }} />
                  </div>
                )}
              </div>
              <Button type="submit" loading={loading} aria-busy={loading} className={loading ? 'loading' : ''} style={{ background: 'linear-gradient(90deg,#007aff,#00d4ff)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px #007aff22', transition: '0.2s', display: 'inline-flex', alignItems: 'center', height: 36, width: 'auto', minWidth: 120, alignSelf: 'center', marginTop: 40 }}>
                Criar Promoção
              </Button>
          </form>
        </div>
      </div>
      </main>
    </div>
  );
}
