
import React, { useState, useRef } from 'react';
import Sidebar from '../sidebar/Sidebar';
import '../AdminDashboard.css';
import Button from '../../../components/Button';
import { useAuth } from '../../../hooks/useAuth';

export default function ClienteCadastro() {
  const { token } = useAuth();
  const [form, setForm] = useState({ nome: '', telefone: '', aniversario: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const nomeRef = useRef(null);
  const telefoneRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!form.nome || !form.telefone) {
      setErrorMsg('Por favor, preencha nome e telefone.');
      if (!form.nome && nomeRef.current) nomeRef.current.focus();
      else if (!form.telefone && telefoneRef.current) telefoneRef.current.focus();
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.nome,
          phone: form.telefone.replace(/\D/g, ''),
          birthDate: form.aniversario || undefined,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 400 && errorData.customer) {
          setErrorMsg('Este número de telefone já está cadastrado no sistema. Verifique se o cliente já existe na lista.');
        } else {
          setErrorMsg(errorData.message || 'Erro ao cadastrar cliente. Tente novamente.');
        }
        setLoading(false);
        return;
      }
      setSuccessMsg('Cliente cadastrado com sucesso!');
      setForm({ nome: '', telefone: '', aniversario: '' });
    } catch (error) {
      setErrorMsg('Erro ao cadastrar cliente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified portal-layout">
        <div className="portal-card portal-card--narrow">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Cadastro de Cliente</h2>
          </div>
          <div className="portal-card-body">
            {errorMsg && <div className="alert-error" role="alert" style={{ textAlign: 'center', width: '100%' }}>{errorMsg}</div>}
            {successMsg && <div className="alert-success" role="status" style={{ textAlign: 'center', width: '100%' }}>{successMsg}</div>}
            <form onSubmit={handleSubmit} autoComplete="on" aria-label="Formulário de cadastro de cliente" style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', maxWidth: 500, margin: '0 auto', width: '100%' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label htmlFor='nome' style={{ width: '100%', fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>
                Nome:
              </label>
              <input
                ref={nomeRef}
                id='nome'
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
                aria-required="true"
                aria-label="Nome"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center' }}
              />
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label htmlFor='telefone' style={{ width: '100%', fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>
                Telefone:
              </label>
              <input
                ref={telefoneRef}
                id='telefone'
                type="tel"
                name="telefone"
                value={form.telefone}
                onChange={handleChange}
                required
                aria-required="true"
                aria-label="Telefone"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center' }}
              />
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label htmlFor='aniversario' style={{ width: '100%', fontWeight: 600, textAlign: 'center', marginBottom: 4 }}>
                Aniversário (opcional):
              </label>
              <input
                id='aniversario'
                type="date"
                name="aniversario"
                value={form.aniversario}
                onChange={handleChange}
                aria-label="Aniversário"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center' }}
              />
            </div>
            <Button type="submit" loading={loading} aria-busy={loading} className={loading ? 'loading' : ''} style={{ background: 'linear-gradient(90deg,#007aff,#00d4ff)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px #007aff22', transition: '0.2s', display: 'inline-flex', alignItems: 'center', height: 36, width: 'auto', minWidth: 120, alignSelf: 'center' }}>
              Cadastrar Cliente
            </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
