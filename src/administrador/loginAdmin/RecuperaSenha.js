import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Importa useNavigate

import './RecuperaSenha.css'; // Importa os estilos

import FeedbackMessage from '../../components/FeedbackMessage';
import { useTranslation } from 'react-i18next';

const RecuperarSenha = () => {

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Inicializa o hook useNavigate
  const { t } = useTranslation();

  const handleBack = () => {
    navigate(-1); // Volta para a página anterior
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(''); // Limpa a mensagem anterior

    try {
      const response = await fetch('https://seu-backend.com/api/recuperar-senha', { // Substitua pela sua URL de API
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }), // Envia o e-mail no corpo da requisição
      });

      if (response.ok) {
        setMessage(t('recover.success', { email }) || `Instruções de recuperação de senha enviadas para ${email}`);
      } else {
        const data = await response.json();
        setMessage(data.message || t('recover.errorSend') || 'Ocorreu um erro ao enviar as instruções.');
      }
    } catch (error) {
      setMessage(t('recover.networkError') || 'Erro de rede. Tente novamente mais tarde.');
      setTimeout(() => {
        setMessage('');
      }, 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recuperar-senha-container">
      <button onClick={handleBack} className="back-button">{t('recover.back') || 'Voltar'}</button>
      <h1>{t('recover.title') || 'Recuperar Senha'}</h1>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="email">{t('recover.label') || 'Digite seu e-mail cadastrado'}</label>
        <input 
          type="email" 
          id="email" 
          placeholder={t('recover.placeholder') || 'E-mail'} 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <button type="submit" disabled={loading}>
          {loading ? t('recover.sending') || 'Enviando...' : t('recover.send') || 'Enviar Instruções'}
        </button>
        <FeedbackMessage
          message={message}
          type={message && message.toLowerCase().includes('erro') ? 'error' : 'success'}
          onClose={() => setMessage('')}
        />
      </form>
    </div>
  );
};

export default RecuperarSenha;
