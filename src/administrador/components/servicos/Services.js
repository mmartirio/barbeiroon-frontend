
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Sidebar from '../../painel/sidebar/Sidebar';
import '../../painel/AdminDashboard.css';
import './Services.css';

const Servico = () => {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [duracao, setDuracao] = useState('');
  const [ativo, setAtivo] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const adicionarServico = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    if (!titulo || !tipo || !valor || !duracao) {
      setErrorMsg(t('services.errorRequired') || 'Preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }
    try {
      // Monta o payload conforme esperado pelo backend
      const payload = {
        name: titulo,
        price: Number(valor),
        description: descricao,
        duration: duracao
      };
      const token = sessionStorage.getItem('token');
      const url = editingId ? `/api/service/${editingId}` : '/api/service';
      const method = editingId ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erro ao cadastrar serviço');
      }
      const data = await response.json().catch(() => null);
      setSuccessMsg(editingId ? (t('services.successEdit') || 'Serviço atualizado com sucesso!') : (t('services.successAdd') || 'Serviço adicionado com sucesso!'));
      setTitulo('');
      setTipo('');
      setDescricao('');
      setValor('');
      setDuracao('');
      setAtivo(false);
      setEditingId(null);
      setEditingId(null);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao cadastrar serviço');
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
            <h2 className="portal-card-title">{t('services.addTitle') || 'Cadastro de Serviços'}</h2>
          </div>
          <div className="portal-card-body">
            {errorMsg && <div className="alert-error" role="alert">{errorMsg}</div>}
            {successMsg && <div className="alert-success" role="status">{successMsg}</div>}
            <form className="servico-form" onSubmit={(e) => { e.preventDefault(); adicionarServico(); }} autoComplete="on" aria-label={t('services.formLabel') || 'Formulário de cadastro de serviço'}>
            <div className="div-container">
              <div className="form-container">
                <label htmlFor='titulo'>{t('services.title') || 'Título:'}</label>
                <input
                  id='titulo'
                  type="text"
                  name="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                  aria-required="true"
                  aria-label={t('services.title') || 'Título'}
                />
                <label htmlFor='tipo'>{t('services.type') || 'Tipo:'}</label>
                <input
                  id='tipo'
                  type="text"
                  name="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  required
                  aria-required="true"
                  aria-label={t('services.type') || 'Tipo'}
                />
                <label htmlFor='valor'>{t('services.value') || 'Valor:'}</label>
                <input
                  id='valor'
                  type="number"
                  name="valor"
                  value={valor}
                  onChange={(e) => setValor(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                  aria-required="true"
                  aria-label={t('services.value') || 'Valor'}
                />
              </div>
              <div className="text-container">
                <label htmlFor='descricao'>{t('services.description') || 'Descrição:'}</label>
                <textarea
                  id='descricao'
                  name="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  aria-label={t('services.description') || 'Descrição'}
                />
                <label htmlFor='duracao'>{t('services.duration') || 'Duração (minutos):'}</label>
                <input
                  id='duracao'
                  type="text"
                  name="duracao"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                  required
                  aria-required="true"
                  aria-label={t('services.duration') || 'Duração'}
                />
                <div className="ativo-container">
                  <label htmlFor='ativo'>{t('services.active') || 'Ativo'}</label>
                  <input
                    id='ativo'
                    type="checkbox"
                    checked={ativo}
                    onChange={(e) => setAtivo(e.target.checked)}
                  />
                </div>
              </div>
            </div>
            <button className="btn-adiciona" type="submit" disabled={loading} aria-busy={loading}>
              {loading ? (t('services.loading') || 'Salvando...') : (t('services.addButton') || 'Adicionar')}
            </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Servico;
