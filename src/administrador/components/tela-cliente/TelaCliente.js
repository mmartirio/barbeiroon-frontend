import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { FiUpload, FiImage, FiEye, FiCopy, FiCheck, FiShare2 } from 'react-icons/fi';
import FeedbackMessage from '../../../components/FeedbackMessage';
import './TelaClienteServices.css';
import Sidebar from '../../painel/sidebar/Sidebar';

/**
 * Componente para personalização da tela do cliente
 * Permite configurar logo, background e compartilhar link público
 */
const TelaCliente = () => {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [copied, setCopied] = useState(false);
    
    const [tenantData, setTenantData] = useState({
        name: '',
        slug: '',
        logo: '',
        backgroundImage: ''
    });

    const [logoFile, setLogoFile] = useState(null);
    const [backgroundFile, setBackgroundFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState('');
    const [backgroundPreview, setBackgroundPreview] = useState('');

    const frontendBaseUrl = 'http://localhost:3002';

    const getTenantSlug = () => {
        const slug = tenantData.slug?.trim();
        if (slug) return slug;

        const name = tenantData.name?.trim();
        if (!name) return '';

        return name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    };

    useEffect(() => {
        loadTenantData();
    }, []);

    const loadTenantData = async () => {
        setLoading(true);
        try {
            const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token');
            if (!authToken) {
                showMessage('😞 Não foi possível carregar os dados da barbearia. Faça login novamente', 'error');
                return;
            }
            const response = await fetch('/api/tenant/settings', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (!response.ok) throw new Error('Erro ao carregar dados');

            const data = await response.json();
            setTenantData(data);
            
            if (data.logo) {
                setLogoPreview(data.logo);
            }
            if (data.backgroundImage) {
                setBackgroundPreview(data.backgroundImage);
            }
        } catch (error) {
            showMessage('😞 Não foi possível carregar os dados da barbearia. Tente atualizar a página', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB
                showMessage('📊 A logo precisa ter no máximo 2MB. Por favor, reduza o tamanho da imagem', 'error');
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleBackgroundChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                showMessage('📊 O plano de fundo precisa ter no máximo 5MB. Por favor, reduza o tamanho da imagem', 'error');
                return;
            }
            setBackgroundFile(file);
            setBackgroundPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const authToken = token || sessionStorage.getItem('token') || localStorage.getItem('token');
            if (!authToken) {
                showMessage('😞 Não foi possível salvar. Faça login novamente', 'error');
                return;
            }
            const formData = new FormData();

            if (logoFile) {
                formData.append('logo', logoFile);
            }
            if (backgroundFile) {
                formData.append('background', backgroundFile);
            }

            const response = await fetch('/api/tenant/upload-assets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Erro ao salvar');

            const data = await response.json();
            setTenantData(prev => ({
                ...prev,
                logo: data.logo || prev.logo,
                backgroundImage: data.backgroundImage || prev.backgroundImage
            }));

            showMessage('Personalização salva com sucesso!', 'success');
            setLogoFile(null);
            setBackgroundFile(null);
        } catch (error) {
            showMessage('😞 Não foi possível salvar a personalização. Verifique sua conexão e tente novamente', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCopyLink = () => {
        const link = `${frontendBaseUrl}/agendar/${getTenantSlug()}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        showMessage('✅ Link copiado com sucesso! Agora é só compartilhar com seus clientes', 'success');
        setTimeout(() => setCopied(false), 3000);
    };

    const handleShareWhatsApp = () => {
        const link = `${frontendBaseUrl}/agendar/${getTenantSlug()}`;
        const message = `Agende seu horário na ${tenantData.name}! Acesse: ${link}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    const handlePreview = () => {
        const link = `${frontendBaseUrl}/agendar/${getTenantSlug()}`;
        window.open(link, '_blank');
    };

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => setMessage(''), 5000);
    };

    const tenantSlug = getTenantSlug();
    const clientLink = `${frontendBaseUrl}/agendar/${tenantSlug}`;
    const canShareLink = Boolean(tenantSlug);

    if (loading) {
        return (
            <div className="admin-dashboard">
                <Sidebar />
                <main className="main-content-unified">
                    <div className="loading">Carregando...</div>
                </main>
            </div>
        );
    }

    return (
        <div className="admin-dashboard">
            <Sidebar />
            <main className="main-content-unified">
                <div className="tela-cliente-container">
                    <div className="tela-cliente-header">
                        <h1>Personalizar Tela do Cliente</h1>
                        <p>Configure a aparência da página de agendamento dos seus clientes</p>
                    </div>
                    <FeedbackMessage 
                        message={message} 
                        type={messageType} 
                        onClose={() => setMessage('')} 
                    />
                    <div className="tela-cliente-content">
                        {/* Seção de Logomarca */}
                        <div className="config-section">
                            <div className="section-header">
                                <FiImage size={24} />
                                <h2>Logomarca</h2>
                            </div>
                            <p className="section-description">
                                A logo será exibida acima do formulário de agendamento
                            </p>
                            <div className="upload-area">
                                {logoPreview ? (
                                    <div className="preview-container">
                                        <img src={logoPreview} alt="Logo preview" className="logo-preview" />
                                        <button 
                                            className="btn-change"
                                            onClick={() => document.getElementById('logo-input').click()}
                                        >
                                            <FiUpload /> Alterar Logo
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        className="upload-placeholder"
                                        onClick={() => document.getElementById('logo-input').click()}
                                    >
                                        <FiUpload size={48} />
                                        <p>Clique para fazer upload da logo</p>
                                        <span>PNG, JPG ou SVG (máx. 2MB)</span>
                                    </div>
                                )}
                                <input
                                    id="logo-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                        {/* Seção de Plano de Fundo */}
                        <div className="config-section">
                            <div className="section-header">
                                <FiImage size={24} />
                                <h2>Plano de Fundo</h2>
                            </div>
                            <p className="section-description">
                                Imagem de fundo da página de agendamento
                            </p>
                            <div className="upload-area">
                                {backgroundPreview ? (
                                    <div className="preview-container">
                                        <img 
                                            src={backgroundPreview} 
                                            alt="Background preview" 
                                            className="background-preview" 
                                        />
                                        <button 
                                            className="btn-change"
                                            onClick={() => document.getElementById('background-input').click()}
                                        >
                                            <FiUpload /> Alterar Plano de Fundo
                                        </button>
                                    </div>
                                ) : (
                                    <div 
                                        className="upload-placeholder"
                                        onClick={() => document.getElementById('background-input').click()}
                                    >
                                        <FiUpload size={48} />
                                        <p>Clique para fazer upload do plano de fundo</p>
                                        <span>PNG, JPG (máx. 5MB)</span>
                                    </div>
                                )}
                                <input
                                    id="background-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBackgroundChange}
                                    style={{ display: 'none' }}
                                />
                            </div>
                        </div>
                        {/* Seção de Link de Compartilhamento */}
                        <div className="config-section">
                            <div className="section-header">
                                <FiShare2 size={24} />
                                <h2>Link de Agendamento</h2>
                            </div>
                            <p className="section-description">
                                Compartilhe este link com seus clientes para que eles possam agendar serviços
                            </p>
                            <div className="link-share-container">
                                <div className="link-display">
                                    <input 
                                        type="text" 
                                        value={clientLink} 
                                        readOnly 
                                        className="link-input"
                                    />
                                    <button 
                                        className="btn-copy"
                                        onClick={handleCopyLink}
                                        title="Compartilhar link"
                                        disabled={!canShareLink}
                                    >
                                        {copied ? <FiCheck /> : <FiCopy />} Compartilhar link
                                    </button>
                                </div>
                                {!canShareLink && (
                                    <p className="link-warning">
                                        Defina o nome da barbearia para gerar o link de agendamento.
                                    </p>
                                )}
                                <div className="share-buttons">
                                    {/* Botão Visualizar removido conforme solicitado */}
                                    <button 
                                        className="btn-whatsapp"
                                        onClick={handleShareWhatsApp}
                                        disabled={!canShareLink}
                                    >
                                        <FiShare2 /> Compartilhar no WhatsApp
                                    </button>
                                </div>
                            </div>
                        </div>
                        {/* Botões de Ação */}
                        <div className="action-buttons">
                            <button 
                                className="btn-save"
                                onClick={handleSave}
                                disabled={saving || (!logoFile && !backgroundFile)}
                            >
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TelaCliente;
