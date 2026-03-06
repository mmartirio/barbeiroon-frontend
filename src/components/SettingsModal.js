import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import './SettingsModal.css';

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'en-US', label: 'English (US)' },
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export default function SettingsModal({ isOpen, onClose }) {
  const { theme, changeTheme, backgroundImage, changeBackground } = useTheme();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [bgInput, setBgInput] = useState('');
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('language') || i18n.language);
  const [selectedTheme, setSelectedTheme] = useState(theme.name);
  const fileInputRef = useRef();
  const [saving, setSaving] = useState(false);
  const [tempBackground, setTempBackground] = useState(''); // Para preview temporário

  // Inicializa apenas com URLs do servidor
  useEffect(() => {
    if (backgroundImage && !backgroundImage.startsWith('data:')) {
      setBgInput(backgroundImage);
    }
  }, [backgroundImage]);

  useEffect(() => {
    if (isOpen && selectedLang && i18n.language !== selectedLang) {
      i18n.changeLanguage(selectedLang);
    }
  }, [isOpen, selectedLang, i18n]);

  const getFileExtension = (mimeType) => {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp'
    };
    return extensions[mimeType] || 'png';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione um arquivo de imagem válido.');
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        alert('A imagem deve ter no máximo 20MB.');
        return;
      }

      // Compactação dinâmica para atingir até 2MB
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new window.Image();
        img.onload = () => {
          const maxW = 1920;
          const maxH = 1080;
          let { width, height } = img;
          if (width > maxW || height > maxH) {
            const scale = Math.min(maxW / width, maxH / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Função recursiva para tentar várias qualidades
          const tryCompress = (quality) => {
            canvas.toBlob((blob) => {
              if (!blob) {
                alert('Erro ao compactar imagem.');
                return;
              }
              if (blob.size <= 2 * 1024 * 1024 || quality <= 0.3) {
                // Sucesso: <= 2MB ou qualidade mínima atingida
                const previewUrl = URL.createObjectURL(blob);
                setTempBackground(previewUrl);
              } else {
                // Reduz qualidade e tenta novamente
                tryCompress(quality - 0.1);
              }
            }, 'image/jpeg', quality);
          };
          tryCompress(0.7);
        };
        img.onerror = () => {
          alert('Erro ao processar imagem.');
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  // Salva imagem no banco e obtém URL do servidor
  async function handleSaveBackground() {
    if (!user?.tenantId) {
      alert('Usuário não identificado. Faça login novamente.');
      return;
    }

    if (!tempBackground) {
      alert('Selecione uma imagem primeiro.');
      return;
    }

    setSaving(true);
    try {
      // Só faz upload se for blob: ou data:
      if (tempBackground.startsWith('blob:') || tempBackground.startsWith('data:')) {
        // Converte Data URL/Blob para Blob e envia para o servidor
        const response = await fetch(tempBackground);
        const blob = await response.blob();
        const formData = new FormData();
        const fileName = `img-${Date.now()}.${getFileExtension(blob.type)}`;
        formData.append('background', blob, fileName);
        const res = await fetch(`/api/tenant/${user.tenantId}/background`, {
          method: 'POST',
          body: formData
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Erro ${res.status} ao salvar imagem`);
        }
        const data = await res.json();
        const serverUrl = data.backgroundImage || data.url;
        if (!serverUrl) {
          throw new Error('Servidor não retornou URL da imagem');
        }
        // Atualiza o contexto com a URL do servidor
        changeBackground(serverUrl);
        setBgInput(serverUrl);
        setTempBackground('');
        alert('Imagem salva com sucesso no banco de dados!');
      } else if (tempBackground.startsWith('/uploads/')) {
        // Se já é uma URL válida do backend, apenas atualiza o contexto
        const saveRes = await fetch(`/api/tenant/${user.tenantId}/images`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ backgroundImage: tempBackground })
        });
        if (!saveRes.ok) {
          throw new Error('Erro ao salvar URL no banco de dados');
        }
        changeBackground(tempBackground);
        setBgInput(tempBackground);
        setTempBackground('');
        alert('Imagem salva com sucesso no banco de dados!');
      } else {
        throw new Error('URL de imagem inválida para salvar.');
      }
    } catch (error) {
      console.error('Erro ao salvar background:', error);
      alert(`Erro ao salvar imagem: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  // Remove o background do banco
  const handleRemoveBackground = async () => {
    if (!user?.tenantId) {
      setBgInput('');
      changeBackground('');
      return;
    }

    try {
      const res = await fetch(`/api/tenant/${user.tenantId}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backgroundImage: '' })
      });

      if (res.ok) {
        setBgInput('');
        changeBackground('');
        setTempBackground('');
        alert('Background removido com sucesso!');
      } else {
        throw new Error('Erro ao remover imagem do servidor');
      }
    } catch (error) {
      console.error('Erro ao remover background:', error);
      alert('Erro ao remover imagem. Tente novamente.');
    }
  };

  // Para preview, usa a imagem temporária ou a do servidor
  const getPreviewImage = () => {
    return tempBackground || bgInput;
  };

  const isValidImageForPreview = (imageUrl) => {
    if (!imageUrl) return false;
    // Se for número (ID), monta a URL da API
    if (typeof imageUrl === 'number' || (/^[0-9]+$/.test(imageUrl) && !String(imageUrl).startsWith('data:'))) {
      imageUrl = `/api/images/image/${imageUrl}`;
    }
    if (typeof imageUrl !== 'string') imageUrl = String(imageUrl);
    return imageUrl.startsWith('data:') || imageUrl.startsWith('/api/images/image/') || /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(imageUrl);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className={`settings-modal ${theme.name}`} onClick={e => e.stopPropagation()}>
        <button className="settings-modal-close" onClick={onClose}>×</button>
        <h3>Configurações</h3>
        
        <div className="settings-content">
          {/* Seção de Idioma */}
          <div className="settings-section">
            <div className="section-header">
              <div className="section-icon">🌐</div>
              <div>
                <h4 className="section-title">Idioma</h4>
                <p className="section-description">Escolha o idioma da interface</p>
              </div>
            </div>
            
            <div className="setting-group">
              <div className="setting-item">
                <label className="setting-label">Idioma preferido</label>
                <select
                  className="setting-control"
                  value={selectedLang}
                  onChange={e => {
                    setSelectedLang(e.target.value);
                    i18n.changeLanguage(e.target.value);
                    localStorage.setItem('language', e.target.value);
                  }}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seção de Tema */}
          <div className="settings-section">
            <div className="section-header">
              <div className="section-icon">🎨</div>
              <div>
                <h4 className="section-title">Aparência</h4>
                <p className="section-description">Personalize a aparência do sistema</p>
              </div>
            </div>
            
            <div className="setting-group">
              <div className="setting-item">
                <label className="setting-label">Tema da interface</label>
                <select
                  className="setting-control"
                  value={selectedTheme}
                  onChange={e => {
                    setSelectedTheme(e.target.value);
                    changeTheme(e.target.value);
                  }}
                >
                  <option value="light">Claro</option>
                  <option value="dark">Escuro</option>
                </select>
              </div>
            </div>
          </div>

          {/* Seção de Plano de Fundo */}
          <div className="settings-section">
            <div className="section-header">
              <div className="section-icon">🖼️</div>
              <div>
                <h4 className="section-title">Plano de Fundo</h4>
                <p className="section-description">Personalize o plano de fundo do sistema</p>
              </div>
            </div>
            
            <div className="setting-group">
              <div className="setting-item">
                <label className="setting-label">Imagem de fundo</label>
                <p className="setting-hint">Suporte para JPG, PNG, GIF, WebP, BMP (máx. 20MB)</p>
                
                {/* Preview da imagem */}
                {isValidImageForPreview(getPreviewImage()) && (
                  <div className="bg-preview">
                    <img
                      src={getPreviewImage()}
                      alt="Preview do plano de fundo"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const previewLabel = e.target.nextElementSibling;
                        if (previewLabel) {
                          previewLabel.textContent = 'Erro ao carregar imagem';
                        }
                      }}
                    />
                    <div className="preview-label">
                      {tempBackground ? 'Pré-visualização (não salvo)' : 'Imagem salva no servidor'}
                    </div>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
                
                <button
                  className="file-upload-btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Carregar imagem do dispositivo
                </button>

                <div className="bg-actions">
                  <button
                    className="action-btn primary"
                    type="button"
                    onClick={handleSaveBackground}
                    disabled={saving || !tempBackground}
                  >
                    {saving ? '⏳ Salvando no banco...' : '💾 Salvar no Banco de Dados'}
                  </button>
                  
                  <button
                    className="action-btn danger"
                    type="button"
                    onClick={handleRemoveBackground}
                    disabled={!bgInput}
                  >
                    🗑️ Remover do Banco
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}