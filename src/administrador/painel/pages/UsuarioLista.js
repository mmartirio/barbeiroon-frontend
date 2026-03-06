import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/Sidebar';
import '../AdminDashboard.css';

export default function UsuarioLista() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    async function fetchUsuarios() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch('/api/user/users', { headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) } });
        if (!response.ok) throw new Error('Não foi possível carregar os usuários');
        const data = await response.json();
        setUsuarios(data.users || data || []);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
    fetchUsuarios();
  }, []);

  const navigate = useNavigate();

  const handleEditar = (id) => {
    navigate(`/usuario?editId=${id}`, { state: { editId: id } });
  };

  const handleExcluir = async (id) => {
    if (!window.confirm('Confirma exclusão do usuário?')) return;
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const response = await fetch(`/api/user/${id}`, { method: 'DELETE', headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) } });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || 'Erro ao remover usuário');
      }
      setUsuarios((prev) => prev.filter(u => u.id !== id));
    } catch (err) {
      setError(err.message || 'Erro ao remover usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleAdicionar = () => navigate('/usuario');

  const usuariosFiltrados = usuarios.filter(usuario =>
    (usuario.nome || usuario.name || '').toLowerCase().includes(busca.toLowerCase()) ||
    (usuario.email || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified portal-layout">
        <div className="portal-card">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Usuários</h2>
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
                <span style={{ padding: '0 5px' }}>+ Novo usuário</span>
              </button>
            </div>
            {loading && <div style={{ textAlign: 'center', color: '#007aff', fontWeight: 600, fontSize: 20 }}>Carregando usuários...</div>}
            {error && <div style={{ color: '#e74c3c', textAlign: 'center', fontWeight: 600 }}>{error}</div>}
            {!loading && !error && (
              <>
                {usuariosFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#888', fontSize: 20, padding: 36, background: '#f7fafd', borderRadius: 14 }}>Nenhum usuário encontrado.</div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="client-list-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Email</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuariosFiltrados.map(usuario => (
                          <tr key={usuario.id}>
                            <td>{usuario.nome || usuario.name || '-'}</td>
                            <td>{usuario.email || '-'}</td>
                            <td>
                              <div className="client-list-actions">
                                <button
                                  className="client-action-btn edit"
                                  onClick={() => handleEditar(usuario.id)}
                                >
                                  Editar
                                </button>
                                <button
                                  className="client-action-btn delete"
                                  onClick={() => handleExcluir(usuario.id)}
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
