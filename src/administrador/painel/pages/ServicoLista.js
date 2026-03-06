import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import '../AdminDashboard.css';
import './ServicoLista.css';


export default function ServicoLista() {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    fetchServicos();
    // eslint-disable-next-line
  }, []);

  async function fetchServicos() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch('/api/service', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erro ao buscar serviços');
      const data = await response.json();
      setServicos(data.services || data || []);
    } catch (err) {
      setError('Erro ao carregar serviços.');
    } finally {
      setLoading(false);
    }
  }

  const handleEditar = (id) => {
    navigate(`/servico-editar/${id}`);
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/service/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Erro ao excluir serviço');
      setServicos((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('Erro ao excluir serviço.');
    } finally {
      setDeletingId(null);
    }
  };

  const servicosFiltrados = servicos.filter((servico) => {
    const nome = (servico.name || servico.tipoServico || '').toLowerCase();
    const tipo = (servico.tipoServico || '').toLowerCase();
    const termo = busca.toLowerCase();
    return nome.includes(termo) || tipo.includes(termo);
  });

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified portal-layout">
        <div className="servico-lista-container portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Lista de Serviços</h2>
          </div>
          <div className="portal-card-body">
            <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
              <input
                type="text"
                placeholder="Buscar por nome ou tipo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ width: '60%', minWidth: 180, maxWidth: 500, padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', transition: 'border 0.2s' }}
              />
              <button
                onClick={() => navigate('/servicos')}
                style={{ background: 'linear-gradient(90deg,#007aff,#00d4ff)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 5px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px #007aff22', transition: '0.2s', display: 'inline-flex', alignItems: 'center', height: 36, width: 'auto', minWidth: 'unset' }}
              >
                <span style={{ padding: '0 5px' }}>+ Novo serviço</span>
              </button>
            </div>
            {loading && <div style={{ textAlign: 'center', color: '#007aff', fontWeight: 600, fontSize: 20 }}>Carregando serviços...</div>}
            {error && <div style={{ color: '#e74c3c', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
            {!loading && !error && servicosFiltrados.length === 0 && (
              <div style={{ textAlign: 'center', color: '#888', fontSize: 20, padding: 36, background: '#f7fafd', borderRadius: 14 }}>Nenhum serviço encontrado.</div>
            )}
            {!loading && !error && servicosFiltrados.length > 0 && (
              <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table className="client-list-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Duração</th>
                      <th>Ativo</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicosFiltrados.map((s) => (
                      <tr key={s.id}>
                        <td>{s.name || s.tipoServico || '-'}</td>
                        <td>{s.tipoServico || '-'}</td>
                        <td style={{ color: '#007aff', fontWeight: 600 }}>R$ {s.valor?.toFixed ? s.valor.toFixed(2) : s.valor}</td>
                        <td>{(s.duration || s.duracao) ? `${s.duration || s.duracao} min` : '-'}</td>
                        <td style={{ color: s.ativo ? '#27ae60' : '#e74c3c', fontWeight: 600 }}>{s.ativo ? 'Sim' : 'Não'}</td>
                        <td>
                          <div className="client-list-actions">
                            <button
                              className="client-action-btn edit"
                              onClick={() => handleEditar(s.id)}
                            >
                              Editar
                            </button>
                            <button
                              className="client-action-btn delete"
                              onClick={() => handleExcluir(s.id)}
                              disabled={deletingId === s.id}
                              style={deletingId === s.id ? { opacity: 0.5, cursor: 'wait' } : {}}
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
          </div>
        </div>
      </main>
    </div>
  );
}
