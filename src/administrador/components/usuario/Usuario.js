import React, { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import Button from '../../../components/Button';
import { useTranslation } from 'react-i18next';
import Grupo from './Grupo';
import { PERMISSOES } from './Grupo';
import Sidebar from '../../painel/sidebar/Sidebar';
import '../../painel/AdminDashboard.css';
import style from './Usuario.css';

const UserManagement = () => {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState({ name: '', email: '', password: '', isAdmin: false, id: null, isBarber: false });
  const [editingIndex, setEditingIndex] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userIdToRemove, setUserIdToRemove] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [planLimit, setPlanLimit] = useState(null);
  const [userType, setUserType] = useState('admin');
  const [perms, setPerms] = useState({});
  const [groups, setGroups] = useState([
    { id: 1, name: 'Administrador', type: 'admin' },
    { id: 2, name: 'Padrão', type: 'padrao' }
  ]);
  const [selectedGroupId, setSelectedGroupId] = useState(2);
  const [showPassword, setShowPassword] = useState(false);
  
  // Refs
  const nameRef = useRef(null);
  const emailRef = useRef(null);

  // Permissões de cada grupo
  const groupPermissions = {
    admin: PERMISSOES.flatMap(cat => cat.permissoes.map(perm => perm.key)),
    padrao: [
      'canCreateCustomer', 'canEditCustomer', 'canDeleteCustomer',
      'canEditUser', 'canDeleteUser',
      'canCreateAppointment', 'canEditAppointment', 'canDeleteAppointment', 'canViewOwnAppointments',
      'canViewGeneralReport', 'canViewIndividualReport',
      'canViewDashboard', 'canViewTotalClients', 'canViewMonthlyRevenue', 
      'canViewServicesDone', 'canViewTopServices', 'canViewBirthdays'
    ]
  };

  // Atualiza permissões ao trocar grupo
  useEffect(() => {
    if (userType === 'admin') {
      const allPerms = {};
      PERMISSOES.forEach(cat => cat.permissoes.forEach(perm => { allPerms[perm.key] = true; }));
      setPerms(allPerms);
    } else {
      const groupPerms = {};
      PERMISSOES.forEach(cat => cat.permissoes.forEach(perm => {
        groupPerms[perm.key] = groupPermissions.padrao.includes(perm.key);
      }));
      setPerms(groupPerms);
    }
  }, [userType]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = location.state?.editId || params.get('editId');
    if (!editId) return;

    const loadUserForEdit = async () => {
      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');
        const headers = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

        const response = await fetch(`/api/user/${editId}`, { headers });
        if (response.ok) {
          const target = await response.json();
          editUser(target);
          return;
        }

        const listResponse = await fetch('/api/user/users', { headers });
        if (!listResponse.ok) {
          setErrorMsg('Não foi possível carregar os usuários para edição.');
          return;
        }
        const data = await listResponse.json();
        const list = data.users || data || [];
        setUsers(list);
        const target = list.find((u) => String(u.id) === String(editId));
        if (!target) {
          setErrorMsg('Usuário selecionado não encontrado.');
          return;
        }
        editUser(target);
      } catch (error) {
        setErrorMsg('Erro ao preparar edição do usuário.');
      }
    };

    loadUserForEdit();
  }, [location.state, location.search]);

  // ============ FUNÇÕES ============

  // Função para adicionar usuário
  const addUser = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setPlanLimit(null);
    
    // Validações
    if (!userData.name || !userData.email || !userData.password) {
      setErrorMsg(t('usuario.fillAllFields') || 'Por favor, preencha todos os campos obrigatórios.');
      if (nameRef.current) nameRef.current.focus();
      return;
    }

    // Verifica permissão do usuário logado
    const isAdmin = user && (user.role === 'admin' || user.permissions?.isAdmin);
    const canCreateUser = user && (isAdmin || user.permissions?.canCreateUser);
    if (!canCreateUser) {
      setErrorMsg('Você não tem permissão para cadastrar usuários.');
      return;
    }

    // Valida grupo selecionado
    if (!selectedGroupId || isNaN(Number(selectedGroupId))) {
      setErrorMsg('Selecione um grupo válido.');
      return;
    }

    setLoading(true);

    // Monta as permissões do grupo selecionado
    const selectedPerms = Object.keys(perms).filter((key) => perms[key]);
    const roleValue = userType === 'admin' ? 'admin' : 'user';
    
    const userToAdd = { 
      ...userData, 
      role: roleValue, 
      permissions: selectedPerms, 
      groupId: Number(selectedGroupId) 
    };

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userToAdd),
      });

      if (response.status === 409) {
        setErrorMsg('Este e-mail já está cadastrado. Use um e-mail diferente.');
        return;
      }

      if (response.status === 403) {
        const data = await response.json().catch(() => ({}));
        if (data.limitReached) {
          setPlanLimit(data);
        } else {
          setErrorMsg(data.message || 'Você não tem permissão para realizar esta ação.');
        }
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setErrorMsg(data.message || 'Não foi possível cadastrar o usuário. Tente novamente.');
        return;
      }

      const data = await response.json();
      setSuccessMsg(t('usuario.successAdd') || 'Usuário adicionado com sucesso!');
      setUsers((prevUsers) => [...prevUsers, data.user]);
      setUserData({ name: '', email: '', password: '', isAdmin: false, isBarber: false });
      
    } catch {
      setErrorMsg('Falha na conexão com o servidor. Verifique sua internet e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para registrar admin do tenant
  const registerAdminTenant = async (tenantName, tenantSlug, adminName, adminEmail, adminPassword) => {
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    
    try {
      const response = await fetch('/api/tenant/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantName, tenantSlug, adminName, adminEmail, adminPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setErrorMsg(data.message || 'Erro ao registrar admin: ' + (data.error || response.status));
        return;
      }
      
      sessionStorage.setItem('token', data.token);
      setSuccessMsg('Admin registrado com sucesso! Você já pode cadastrar outros usuários.');
      
    } catch (error) {
      setErrorMsg('Erro ao registrar admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Função para remover usuário
  const confirmRemoveUser = async () => {
    if (!userIdToRemove) return;
    
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const response = await fetch(`/api/user/${userIdToRemove}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setErrorMsg(t('usuario.errorRemove') + `: ${response.status} - ${errorText}`);
        return;
      }
      
      setSuccessMsg(t('usuario.successRemove') || 'Usuário removido com sucesso!');
      setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userIdToRemove));
      setIsModalOpen(false);
      setUserIdToRemove(null);
      
    } catch (error) {
      setErrorMsg(t('usuario.errorRemove') + `: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const cancelRemoveUser = () => {
    setIsModalOpen(false);
    setUserIdToRemove(null);
  };

  const handleRemoveUser = (userId) => {
    setUserIdToRemove(userId);
    setIsModalOpen(true);
  };

  const handlePermChange = (key) => {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const editUser = (user) => {
    setUserData({
      name: user.name,
      email: user.email,
      password: '',
      isAdmin: user.role === 'admin',
      id: user.id,
      isBarber: user.isBarber || false
    });
    setEditingIndex(users.indexOf(user));
    const nextGroupId = user.groupId || 2;
    setSelectedGroupId(nextGroupId);
    const groupMatch = groups.find((g) => String(g.id) === String(nextGroupId));
    setUserType(groupMatch ? groupMatch.type : (user.role === 'admin' ? 'admin' : 'padrao'));
    
    const userPerms = {};
    PERMISSOES.forEach((cat) => {
      cat.permissoes.forEach((perm) => {
        userPerms[perm.key] = user.permissions && user.permissions.includes(perm.key);
      });
    });
    setPerms(userPerms);
  };

  const saveEdit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!userData.id) {
      setErrorMsg('Usuário inválido para edição.');
      return;
    }

    if (!userData.name || !userData.email) {
      setErrorMsg('Preencha nome e e-mail.');
      return;
    }

    if (!selectedGroupId || isNaN(Number(selectedGroupId))) {
      setErrorMsg('Selecione um grupo válido.');
      return;
    }

    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`/api/user/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          groupId: Number(selectedGroupId),
          isBarber: !!userData.isBarber,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setErrorMsg(`${t('usuario.errorEdit') || 'Erro ao editar usuário'}: ${response.status} - ${errorText}`);
        return;
      }

      const updated = await response.json();

      if (userData.password) {
        const passResponse = await fetch(`/api/user/${userData.id}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ newPassword: userData.password }),
        });

        if (!passResponse.ok) {
          const errorText = await passResponse.text();
          setErrorMsg(`Erro ao alterar senha: ${passResponse.status} - ${errorText}`);
          return;
        }
      }

      setUsers((prevUsers) => prevUsers.map((u) => (u.id === userData.id ? { ...u, ...updated } : u)));
      setSuccessMsg(t('usuario.successEdit') || 'Usuário atualizado com sucesso!');
      setEditingIndex(null);
      setUserData({ name: '', email: '', password: '', isAdmin: false, isBarber: false, id: null });
      setSelectedGroupId(2);
      setUserType('admin');
      setPerms({});
    } catch (error) {
      setErrorMsg(`${t('usuario.errorEdit') || 'Erro ao editar usuário'}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ============ RENDER ============
  return (
    <>
      <ConfirmModal 
        isOpen={isModalOpen}
        onConfirm={confirmRemoveUser}
        onCancel={cancelRemoveUser}
      />
      
      <div className="admin-dashboard">
        <Sidebar />
        <main className="main-content-unified portal-layout">
          <div className="portal-card portal-card--narrow">
            <div className="portal-card-header">
              <h1 className="portal-card-title">
                {userData.id ? t('usuario.editTitle') || 'Editar Usuário' : t('usuario.title') || 'Cadastro de Usuários'}
              </h1>
            </div>
            <div className="portal-card-body">
              {planLimit && (
                <div role="alert" style={{
                  background: '#422006', border: '1px solid #92400e', borderRadius: 8,
                  padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 22, lineHeight: 1 }}>📋</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fbbf24', marginBottom: 4, fontSize: 14 }}>
                      Limite do plano atingido
                    </div>
                    <div style={{ color: '#fde68a', fontSize: 13, lineHeight: 1.5 }}>
                      {planLimit.message}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#f59e0b' }}>
                      Usuários ativos: <strong>{planLimit.current}</strong> / <strong>{planLimit.limit}</strong>
                    </div>
                  </div>
                </div>
              )}
              {errorMsg && <div className="alert-error" role="alert">{errorMsg}</div>}
              {successMsg && <div className="alert-success" role="status">{successMsg}</div>}

              <form 
                className="user-form" 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  userData.id ? saveEdit() : addUser(); 
                }} 
                autoComplete="on"
              >
            <div className="user-form-group">
              <label htmlFor='name'>{t('usuario.name') || 'Nome:'}</label>
              <input
                ref={nameRef}
                id='name'
                type="text"
                name="name"
                value={userData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="user-form-group">
              <label htmlFor='email'>{t('usuario.email') || 'Login (E-mail):'}</label>
              <input
                ref={emailRef}
                id="email"
                type="email"
                name="email"
                value={userData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="user-form-group">
              <label htmlFor='password'>{t('usuario.password') || 'Senha:'}</label>
              <div className="password-input-group">
                <input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={userData.password}
                  onChange={handleInputChange}
                  required={editingIndex === null}
                  className="user-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="show-password-btn"
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div className="user-form-group checkbox-row">
              <input
                type="checkbox"
                id="isBarber"
                name="isBarber"
                checked={userData.isBarber}
                onChange={handleInputChange}
              />
              <label htmlFor="isBarber">Barbeiro</label>
              <small className="user-form-hint">Usuarios nao marcados como barbeiro nao aparecem no agendamento do cliente.</small>
            </div>

            <div className="user-form-group">
              <label>Grupo do usuário:</label>
              <select
                value={selectedGroupId}
                onChange={e => {
                  const gid = e.target.value;
                  setSelectedGroupId(gid);
                  const g = groups.find(x => String(x.id) === String(gid));
                  if (g) setUserType(g.type);
                }}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="user-form-actions">
              <Button type="submit" loading={loading}>
                {userData.id ? t('usuario.save') || 'Salvar' : t('usuario.add') || 'Adicionar'}
              </Button>
            </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default UserManagement;