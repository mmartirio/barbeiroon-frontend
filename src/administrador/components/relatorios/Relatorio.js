
import React, { useState, useEffect } from 'react';
import Sidebar from '../../painel/sidebar/Sidebar';
import '../../painel/AdminDashboard.css';
import Button from '../../../components/Button';
import FeedbackMessage from '../../../components/FeedbackMessage';
import { useTranslation } from 'react-i18next';

const Relatorio = () => {
  const { t } = useTranslation();
  const [tipoRelatorio, setTipoRelatorio] = useState('');
  const [usuario, setUsuario] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  // ...existing code...

  useEffect(() => {
    const fetchUsuarios = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const response = await fetch('/api/user/users');
        if (!response.ok) {
          throw new Error('Erro ao buscar usuários');
        }
        const data = await response.json();
        setUsuarios(data.users || []);
      } catch (error) {
        setErrorMsg('Erro ao carregar usuários.');
      } finally {
        setLoading(false);
      }
    };
    fetchUsuarios();
  }, [t]);

  const handleGerarRelatorio = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    // Aqui você pode chamar a API para gerar o relatório de acordo com os filtros
    setTimeout(() => {
      setSuccessMsg('Relatório gerado com sucesso!');
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified">
        <div style={{ maxWidth: 1100, margin: '0 auto', background: 'rgba(255,255,255,0.1)', borderRadius: 24, boxShadow: '0 8px 40px #007aff22', padding: 40, minHeight: 400, backdropFilter: 'blur(18px)', border: '1px solid rgba(224,231,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ marginBottom: 36, textAlign: 'center', width: '100%' }}>
            <h2 style={{ margin: 0, fontWeight: 800, fontSize: 32, color: '#fff', letterSpacing: -1, textAlign: 'center' }}>Gerar Relatório</h2>
          </div>
          <FeedbackMessage message={errorMsg} type="error" onClose={() => setErrorMsg('')} />
          <FeedbackMessage message={successMsg} type="success" onClose={() => setSuccessMsg('')} />
          <form onSubmit={handleGerarRelatorio} style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', maxWidth: 500, margin: '0 auto', width: '100%' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label htmlFor="tipoRelatorio" style={{ width: '100%', fontWeight: 600, color: '#222', textAlign: 'center', marginBottom: 4 }}>Tipo de Relatório:</label>
              <select
                id="tipoRelatorio"
                value={tipoRelatorio}
                onChange={e => setTipoRelatorio(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center', marginBottom: 12, color: '#111' }}
              >
                <option value="">Selecione...</option>
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="quinzenal">Quinzenal</option>
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
              </select>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <label htmlFor="usuario" style={{ width: '100%', fontWeight: 600, color: '#222', textAlign: 'center', marginBottom: 4 }}>Usuário:</label>
              <select
                id="usuario"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', textAlign: 'center', marginBottom: 12, color: '#111' }}
              >
                <option value="">Selecione um usuário...</option>
                {usuarios.map((user) => (
                  <option key={user.id} value={user.name || user.nome}>{user.name || user.nome}</option>
                ))}
              </select>
            </div>
            <Button type="submit" loading={loading} aria-busy={loading} className={loading ? 'loading' : ''} style={{ background: 'linear-gradient(90deg,#007aff,#00d4ff)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 2px 8px #007aff22', transition: '0.2s', display: 'inline-flex', alignItems: 'center', height: 36, width: 'auto', minWidth: 120, alignSelf: 'center', marginTop: 40 }}>
              Gerar Relatório
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Relatorio;
