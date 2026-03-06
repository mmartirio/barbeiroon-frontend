import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import './Profissionais.css';

const Profissionais = () => {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialties: '',
    status: 'active'
  });

  useEffect(() => {
    loadProfessionals();
  }, []);

  const loadProfessionals = async () => {
    try {
      // Simulando dados - substitua com chamada real à API
      setTimeout(() => {
        setProfessionals([
          { id: 1, name: 'João Barbeiro', email: 'joao@example.com', phone: '(11) 98765-4321', specialties: 'Corte, Barba', status: 'active', appointmentsToday: 8 },
          { id: 2, name: 'Pedro Silva', email: 'pedro@example.com', phone: '(11) 98765-4322', specialties: 'Corte, Coloração', status: 'active', appointmentsToday: 5 },
          { id: 3, name: 'Carlos Lima', email: 'carlos@example.com', phone: '(11) 98765-4323', specialties: 'Barba, Penteados', status: 'inactive', appointmentsToday: 0 },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProfessional) {
        // Atualizar profissional
        console.log('Atualizar:', formData);
      } else {
        // Criar novo profissional
        console.log('Criar:', formData);
      }
      setShowModal(false);
      resetForm();
      loadProfessionals();
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
    }
  };

  const handleEdit = (professional) => {
    setEditingProfessional(professional);
    setFormData({
      name: professional.name,
      email: professional.email,
      phone: professional.phone,
      specialties: professional.specialties,
      status: professional.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este profissional?')) {
      try {
        // Chamar API de exclusão
        console.log('Excluir:', id);
        loadProfessionals();
      } catch (error) {
        console.error('Erro ao excluir profissional:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialties: '',
      status: 'active'
    });
    setEditingProfessional(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="profissionais-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profissionais</h1>
          <p className="page-subtitle">Gerencie sua equipe de profissionais</p>
        </div>
        <button 
          className="btn btn--primary"
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
        >
          ➕ Novo Profissional
        </button>
      </div>

      {/* Stats */}
      <div className="professionals-stats">
        <Card variant="default" padding="md">
          <div className="stat-item">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <p className="stat-label">Total de Profissionais</p>
              <p className="stat-value">{professionals.length}</p>
            </div>
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="stat-item">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <p className="stat-label">Ativos</p>
              <p className="stat-value">
                {professionals.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card variant="default" padding="md">
          <div className="stat-item">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <p className="stat-label">Agendamentos Hoje</p>
              <p className="stat-value">
                {professionals.reduce((sum, p) => sum + p.appointmentsToday, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Profissionais</CardTitle>
        </CardHeader>
        <CardBody padding="none">
          {loading ? (
            <div className="loading-state">Carregando...</div>
          ) : professionals.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum profissional cadastrado ainda.</p>
              <button className="btn btn--primary" onClick={() => setShowModal(true)}>
                Cadastrar Primeiro Profissional
              </button>
            </div>
          ) : (
            <Table hover>
              <TableHead>
                <TableRow>
                  <TableHeader>Nome</TableHeader>
                  <TableHeader>Contato</TableHeader>
                  <TableHeader>Especialidades</TableHeader>
                  <TableHeader>Agendamentos Hoje</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Ações</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {professionals.map(professional => (
                  <TableRow key={professional.id}>
                    <TableCell>
                      <div className="professional-name">
                        <div className="professional-avatar">
                          {professional.name.charAt(0)}
                        </div>
                        <strong>{professional.name}</strong>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="professional-contact">
                        <div>{professional.email}</div>
                        <div className="text-muted">{professional.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{professional.specialties}</TableCell>
                    <TableCell>
                      <Badge variant="info">{professional.appointmentsToday}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={professional.status === 'active' ? 'success' : 'default'}>
                        {professional.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="table-actions">
                        <button 
                          className="btn-icon"
                          onClick={() => handleEdit(professional)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-icon btn-icon--danger"
                          onClick={() => handleDelete(professional.id)}
                          title="Excluir"
                        >
                          🗑️
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
              </h2>
              <button 
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Nome Completo *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Digite o nome completo"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">E-mail *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Telefone *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="form-group">
                <label htmlFor="specialties">Especialidades *</label>
                <input
                  type="text"
                  id="specialties"
                  name="specialties"
                  value={formData.specialties}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Ex: Corte, Barba, Coloração"
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn--outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn--primary">
                  {editingProfessional ? 'Atualizar' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profissionais;
