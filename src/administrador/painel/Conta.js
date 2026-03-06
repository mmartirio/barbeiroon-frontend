import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './sidebar/Sidebar';
import './AdminDashboard.css';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { FiBriefcase, FiSave, FiTrash2, FiUpload, FiImage, FiPhone, FiMapPin, FiGlobe } from 'react-icons/fi';
import './Conta.css';

function Conta() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { logo, changeLogo } = useTheme();
  // ...existing code...
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    phone: '',
    address: '',
    website: ''
  });

  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadCompanyData();
    if (logo) {
      setLogoPreview(logo);
    }
  }, [logo]);

  const loadCompanyData = async () => {
    try {
      const response = await fetch('/api/tenant/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          companyName: data.name || '',
          cnpj: data.cnpj || '',
          phone: data.phone || '',
          address: data.address || '',
          website: data.website || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB' });
        return;
      }

      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'O arquivo deve ser uma imagem' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setMessage({ type: '', text: '' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updateData = {
        ...formData
      };

      // Se houver uma nova logo, incluir no update
      if (logoPreview && logoPreview !== logo) {
        updateData.logo = logoPreview;
      }

      const response = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        // Atualizar logo no contexto global
        if (logoPreview && logoPreview !== logo) {
          changeLogo(logoPreview);
        }
        
        setMessage({ type: 'success', text: 'Dados da empresa atualizados com sucesso!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Erro ao atualizar dados' });
      }
    } catch (error) {
      console.error('Erro ao atualizar dados da empresa:', error);
      setMessage({ type: 'error', text: 'Erro ao atualizar dados da empresa' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // TODO: Substituir por chamada real à API
      const response = await fetch(`/api/tenant/${user?.tenantId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Conta excluída com sucesso');
        localStorage.clear();
        navigate('/admin');
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Erro ao excluir conta' });
      }
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      setMessage({ type: 'error', text: 'Erro ao excluir conta' });
    } finally {
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified portal-layout">
        <div className="portal-card portal-card--narrow">
          <div className="portal-card-header">
            <h2 className="portal-card-title">{t('account.title', 'Conta da Empresa')}</h2>
          </div>
          <div className="portal-card-body">
            <form onSubmit={handleSubmit} autoComplete="on" aria-label={t('account.formLabel') || 'Formulário de conta da empresa'} style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', maxWidth: 500, margin: '0 auto', width: '100%' }}>
            {message.text && (
              <div className={`message ${message.type}`} style={{ textAlign: 'center', width: '100%' }}>
                {message.text}
              </div>
            )}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <label style={{ width: '100%', fontWeight: 600, color: '#fff', marginBottom: 4, display: 'block', textAlign: 'center' }}>
                {t('account.companyLogo', 'Logo da Empresa')}
              </label>
              <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px auto', background: '#fff', boxShadow: '0 2px 12px #007aff11', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#bbb' }}>
                    <FiImage size={48} />
                    <p>{t('account.noLogo', 'Nenhuma logo')}</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" style={{ display: 'none' }} />
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current.click()} style={{ height: 32, fontSize: 13, padding: '0 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FiUpload size={15} />
                  {t('account.uploadLogo', 'Enviar Logo')}
                </button>
                {logoPreview && (
                  <button type="button" className="btn btn-danger" title="Remover logo" onClick={() => { setLogoPreview(null); if (typeof changeLogo === 'function') changeLogo(''); }} style={{ height: 32, fontSize: 13, padding: '0 10px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FiTrash2 size={15} />
                  </button>
                )}
              </div>
              <p style={{ color: '#888', fontSize: 13, margin: 0 }}>{t('account.logoHint', 'Recomendado: PNG ou JPG, máximo 5MB. A logo será exibida em todo o sistema.')}</p>
            </div>
            <label htmlFor="companyName" style={{ width: '100%', fontWeight: 600, color: '#fff', marginBottom: 4, display: 'block', textAlign: 'center' }}>{t('account.companyName', 'Nome da Empresa')}</label>
            <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleChange} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', marginBottom: 12 }} />
            <label htmlFor="cnpj" style={{ width: '100%', fontWeight: 600, color: '#fff', marginBottom: 4, display: 'block', textAlign: 'center' }}>{t('account.cnpj', 'CNPJ')}</label>
            <input type="text" id="cnpj" name="cnpj" value={formData.cnpj} onChange={handleChange} placeholder="00.000.000/0000-00" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', marginBottom: 12 }} />
            <label htmlFor="phone" style={{ width: '100%', fontWeight: 600, color: '#fff', marginBottom: 4, display: 'block', textAlign: 'center' }}>{t('account.phone', 'Telefone')}</label>
            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="(00) 00000-0000" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', marginBottom: 12 }} />
            <label htmlFor="address" style={{ width: '100%', fontWeight: 600, color: '#fff', marginBottom: 4, display: 'block', textAlign: 'center' }}>{t('account.address', 'Endereço')}</label>
            <input type="text" id="address" name="address" value={formData.address} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', marginBottom: 12 }} />
            <label htmlFor="website" style={{ width: '100%', fontWeight: 600, color: '#fff', marginBottom: 4, display: 'block', textAlign: 'center' }}>{t('account.website', 'Website')}</label>
            <input type="url" id="website" name="website" value={formData.website} onChange={handleChange} placeholder="https://" style={{ width: '100%', minWidth: 0, maxWidth: '100%', padding: '10px 14px', borderRadius: 8, border: '1.5px solid #c7d0e1', fontSize: 16, background: '#f7fafd', boxShadow: '0 1px 6px #007aff11', outline: 'none', marginBottom: 12 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', paddingTop: 12 }}>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: 0, height: 34, fontWeight: 700, fontSize: 14, background: 'linear-gradient(90deg,#007aff,#0051d5)', color: '#fff', border: 'none', boxShadow: '0 2px 8px #007aff33', padding: '0 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiSave size={16} />
                {loading ? t('common.saving', 'Salvando...') : t('common.save', 'Salvar Alterações')}
              </button>
            </div>
            </form>
            <div className="danger-zone" style={{ marginTop: 24, width: '100%', padding: '12px 18px', borderRadius: 8, background: 'rgba(239,68,68,0.07)', border: '1.5px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
              <h3 style={{ color: '#e74c3c', fontWeight: 700, fontSize: 16, margin: 0 }}>{t('account.dangerZone', 'Excluir Conta')}</h3>
              <p style={{ color: '#e74c3c', fontSize: 13, margin: 0, marginBottom: 8 }}>{t('account.deleteWarning', 'Ao excluir sua conta, todos os dados serão permanentemente removidos.')}</p>
              <button type="button" className="btn btn-danger" onClick={() => setShowDeleteModal(true)} style={{ minWidth: 0, height: 32, fontWeight: 700, fontSize: 13, padding: '0 10px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiTrash2 size={14} style={{ marginRight: 2 }} />
                {t('account.deleteAccount', 'Excluir Conta')}
              </button>
            </div>
          </div>
        </div>
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{t('account.confirmDelete', 'Confirmar Exclusão')}</h2>
              <p>{t('account.confirmDeleteMessage', 'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')}</p>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button className="btn btn-danger" onClick={handleDeleteAccount}>
                  {t('common.confirm', 'Confirmar')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Conta;
