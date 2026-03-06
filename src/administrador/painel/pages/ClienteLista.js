import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import '../AdminDashboard.css';

export default function ClienteLista() {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function fetchClientes() {
      setLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch('/api/customer', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) throw new Error('Erro ao buscar clientes');
        const data = await response.json();
        // backend retorna { customers: [...] }
        setClientes(data.customers || data || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchClientes();
  }, []);

  const navigate = useNavigate();

  const handleEditar = (phone) => {
    navigate('/cliente-cadastro', { state: { phone } });
  };

  const handleExcluir = async (phone) => {
    if (!window.confirm('Confirma exclusão do cliente?')) return;
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/customer/${encodeURIComponent(phone)}`, { method: 'DELETE', headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) } });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || 'Erro ao remover cliente');
      }
      setClientes(prev => prev.filter(c => (c.phone || c.id) !== phone));
    } catch (err) {
      setError(err.message || 'Erro ao remover cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionar = () => navigate('/cliente-cadastro');

  const formatBirthday = (value) => {
    if (!value) return '-';
    const [year, month, day] = String(value).split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return String(value);
  };

  const term = busca.toLowerCase();
  const clientesFiltrados = clientes.filter(cliente => {
    const nome = (cliente.nome || cliente.name || '').toLowerCase();
    const telefone = String(cliente.phone || cliente.telefone || '').toLowerCase();
    const aniversario = (cliente.birthDate || cliente.aniversario || '').toLowerCase();

    return nome.includes(term) || telefone.includes(term) || aniversario.includes(term);
  });

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified portal-layout">
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Clientes</h2>
          </div>
          <div className="portal-card-body">
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                style={{ width: '60%', minWidth: 180, maxWidth: 500, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', transition: 'border 0.2s' }}
              />
              <button
                onClick={handleAdicionar}
                style={{ background: 'linear-gradient(90deg,#007aff,#00d4ff)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 5px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px #007aff22', transition: '0.2s', display: 'inline-flex', alignItems: 'center', height: 36, width: 'auto', minWidth: 'unset' }}
              >
                <span style={{ padding: '0 5px' }}>+ Novo cliente</span>
              </button>
            </div>
            {loading && <div style={{ textAlign: 'center', color: '#007aff', fontWeight: 600, fontSize: 20 }}>Carregando clientes...</div>}
            {error && <div style={{ color: '#e74c3c', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
            {!loading && !error && (
              <>
                {clientesFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', fontSize: 20, padding: 36, background: '#f7fafd', borderRadius: 14 }}>Nenhum cliente encontrado.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="client-list-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Telefone</th>
                          <th>Aniversário</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientesFiltrados.map((cliente, index) => (
                          <tr key={cliente.id || cliente.phone || cliente.telefone || `${cliente.name || cliente.nome || 'cliente'}-${index}`}>
                            <td>{cliente.nome || cliente.name || '-'}</td>
                            <td>{cliente.phone || cliente.telefone || '-'}</td>
                            <td>{formatBirthday(cliente.birthDate || cliente.aniversario)}</td>
                            <td>
                              <div className="client-list-actions">
                                <button
                                  className="client-action-btn edit"
                                  onClick={() => handleEditar(cliente.id)}
                                >
                                  Editar
                                </button>
                                <button
                                  className="client-action-btn delete"
                                  onClick={() => handleExcluir(cliente.id)}
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
