import React, { useState, useEffect } from 'react';
import Sidebar from './sidebar/Sidebar';
import '../painel/AdminDashboard.css';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiLock, FiSave } from 'react-icons/fi';
import './Perfil.css';

function Perfil() {
  const { t } = useTranslation();
  const { user } = useAuth();
  // ...existing code...

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Validações
      if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
        setMessage({ type: 'error', text: 'As senhas não coincidem' });
        setLoading(false);
        return;
      }

      const updateData = {
        name: formData.name,
        email: formData.email
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      // TODO: Substituir por chamada real à API
      const response = await fetch(`/api/user/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil' });
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
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
            <h2 className="portal-card-title">{t('profile.title', 'Meu Perfil')}</h2>
          </div>
          <div className="portal-card-body">
            <div className="perfil-content">
              <div className="perfil-card">
                <div className="perfil-avatar">
                  <div className="avatar-placeholder">
                    <FiUser size={48} />
                  </div>
                  <h2>{user?.name}</h2>
                  <p>{user?.email}</p>
                </div>
                <form onSubmit={handleSubmit} className="perfil-form">
                  {message.text && (
                    <div className={`message ${message.type}`}>{message.text}</div>
                  )}
                  <label htmlFor="name">{t('profile.name', 'Nome')}</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label htmlFor="email">{t('profile.email', 'Email')}</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label htmlFor="currentPassword">{t('profile.currentPassword', 'Senha Atual')}</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label htmlFor="newPassword">{t('profile.newPassword', 'Nova Senha')}</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label htmlFor="confirmPassword">{t('profile.confirmPassword', 'Confirmar Nova Senha')}</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button type="submit" className="btn-save" disabled={loading}>
                    <FiSave /> {loading ? t('common.saving', 'Salvando...') : t('profile.save', 'Salvar')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Perfil;
