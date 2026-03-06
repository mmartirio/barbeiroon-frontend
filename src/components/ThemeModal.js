
import React, { useState, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { FiSun, FiMoon, FiImage, FiTrash2 } from 'react-icons/fi';
import './ThemeModal.css';

export default function ThemeModal({ isOpen, onClose }) {
  const { theme, changeTheme, backgroundImage, changeBackground } = useTheme();
  const { t } = useTranslation();
  const [bgOpacity, setBgOpacity] = useState(0.5);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef();

  if (!isOpen) return null;

  // Permitir alterar plano de fundo apenas no tema escuro
  return (
    <div className="theme-modal-overlay" onClick={onClose}>
      <div className="theme-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="theme-modal-title">
        <button className="theme-modal-close" onClick={onClose} aria-label={t('theme.close') || 'Fechar'}>×</button>
        <h2 id="theme-modal-title" className="theme-modal-header">{t('theme.title') || 'Personalização de Tema'}</h2>
        <p className="theme-modal-desc">{t('theme.desc') || 'Escolha o tema e personalize o plano de fundo do sistema.'}</p>
        <div className="theme-options" aria-label="Opções de tema">
          <button 
            className={`theme-btn${theme.name === 'light' ? ' active' : ''}`}
            onClick={() => changeTheme('light')}
            aria-label={t('theme.lightAria') || 'Tema claro'}
            tabIndex={0}
          >
            <FiSun /> {t('theme.light') || 'Claro'}
          </button>
          <button 
            className={`theme-btn${theme.name === 'dark' ? ' active' : ''}`}
            onClick={() => changeTheme('dark')}
            aria-label={t('theme.darkAria') || 'Tema escuro'}
            tabIndex={0}
          >
            <FiMoon /> {t('theme.dark') || 'Escuro'}
          </button>
        </div>
        <div className="theme-bg-section">
          <div className="theme-bg-instructions">
            <span role="img" aria-label="info">ℹ️</span> {t('theme.bgInfo') || 'A personalização de plano de fundo está disponível apenas no tema escuro.'}
          </div>
          {theme.name === 'dark' ? (
            <>
              <input 
                type="file" 
                accept="image/*" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={e => {
                  const file = e.target.files[0];
                  setUploadError('');
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setUploadError('Imagem muito grande (máx. 5MB)');
                      return;
                    }
                    setUploading(true);
                    const reader = new FileReader();
                    reader.onload = ev => {
                      changeBackground(ev.target.result);
                      setUploading(false);
                    };
                    reader.onerror = () => {
                      setUploadError('Erro ao carregar imagem');
                      setUploading(false);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <button className="theme-btn" onClick={() => fileInputRef.current?.click()} aria-label={t('theme.selectBgAria') || 'Selecionar plano de fundo'} tabIndex={0}>
                <FiImage /> {t('theme.bgButton') || 'Plano de Fundo'}
              </button>
              {uploading && <div className="theme-upload-feedback">Carregando imagem...</div>}
              {uploadError && <div className="theme-upload-error">{uploadError}</div>}
              {backgroundImage && (
                <>
                  <div className="theme-bg-preview">
                    <img src={backgroundImage} alt={t('theme.bgPreviewAlt') || 'Preview do plano de fundo'} style={{maxWidth: '100%', maxHeight: 180, borderRadius: 10, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)', border: '1px solid #eee', background: '#fafafa'}} />
                    <div className="theme-bg-preview-label">{t('theme.preview') || 'Pré-visualização'}</div>
                  </div>
                  <div className="opacity-control">
                    <label htmlFor="bg-opacity-slider">{t('theme.opacity') || 'Opacidade:'}</label>
                    <input 
                      id="bg-opacity-slider"
                      type="range" 
                      min="0.1" 
                      max="1" 
                      step="0.05" 
                      value={bgOpacity}
                      onChange={e => setBgOpacity(Number(e.target.value))} 
                    />
                    <span className="opacity-value">{Math.round(bgOpacity*100)}%</span>
                  </div>
                  <button className="theme-btn danger" onClick={() => changeBackground('')} aria-label={t('theme.removeBgAria') || 'Remover plano de fundo'} tabIndex={0}><FiTrash2 /> {t('theme.removeBg') || 'Remover Fundo'}</button>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
