import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { useTranslation } from 'react-i18next';
import SettingsModal from '../../components/SettingsModal';
import Sidebar from './sidebar/Sidebar';
import BarChartCard from '../../components/ui/BarChartCard';

// Ícones
import {
  FiPlus,
  FiBarChart2
} from 'react-icons/fi';
import LogoHeader from '../../components/Layout/LogoHeader';

function AdminDashboard() {
  const { t } = useTranslation();
  const { theme, backgroundImage, logo } = useTheme();
  const { logout, user, token, authReady } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalClients: 0,
    totalAppointments: 0,
    monthlyRevenue: 0,
    servicesPerformed: 0,
    loading: true
  });

  const [recentAppointments, setRecentAppointments] = useState([]);
  const [topServices, setTopServices] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showBirthdaysModal, setShowBirthdaysModal] = useState(false);
  const [barChartData, setBarChartData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [barChartLoading, setBarChartLoading] = useState(true);

  useEffect(() => {
    if (backgroundImage) {
      document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${backgroundImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = theme.background;
    }
  }, [backgroundImage, theme]);

  const loadDashboardData = useCallback(async (authToken) => {
    try {
      const resolvedToken = authToken || sessionStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          ...(resolvedToken ? { 'Authorization': `Bearer ${resolvedToken}` } : {})
        }
      });

      if (response.ok) {
        const data = await response.json();
        const totalClients = Number(data.totalClients ?? data.customers ?? 0) || 0;
        const totalAppointments = Number(data.totalAppointments ?? data.appointments ?? data.servicesPerformed ?? 0) || 0;
        const servicesPerformed = Number(data.servicesPerformed ?? data.appointments ?? 0) || 0;
        const monthlyRevenue = Number(data.monthlyRevenue ?? 0) || 0;

        setStats({
          totalClients,
          totalAppointments,
          monthlyRevenue,
          servicesPerformed,
          loading: false
        });

        setRecentAppointments(Array.isArray(data.recentAppointments) ? data.recentAppointments : []);
        setTopServices(Array.isArray(data.topServices) ? data.topServices : []);
        setBirthdays(Array.isArray(data.birthdays) ? data.birthdays : []);
      } else {
        // Fallback com dados de exemplo se a API não estiver pronta
        setStats({
          totalClients: 0,
          totalAppointments: 0,
          monthlyRevenue: 0,
          servicesPerformed: 0,
          loading: false
        });
        setRecentAppointments([]);
        setTopServices([]);
        setBirthdays([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      // Fallback em caso de erro
      setStats({
        totalClients: 0,
        totalAppointments: 0,
        monthlyRevenue: 0,
        servicesPerformed: 0,
        loading: false
      });
      setRecentAppointments([]);
      setTopServices([]);
      setBirthdays([]);
    }
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const authToken = sessionStorage.getItem('token') || token;
    if (!authToken) return;

    loadDashboardData(authToken);

    const intervalId = setInterval(() => {
      loadDashboardData(authToken);
    }, 15000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        loadDashboardData(authToken);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [authReady, token, loadDashboardData]);

  useEffect(() => {
    async function fetchBarChart() {
      setBarChartLoading(true);
      try {
        const res = await fetch('/api/service/monthly-revenue', {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        if (res.ok) {
          const { months } = await res.json();
          setBarChartData({
            labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
            datasets: [{
              label: 'Faturamento',
              data: months,
              backgroundColor: 'rgba(0, 122, 255, 0.7)',
              borderRadius: 8,
            }]
          });
        } else {
          setBarChartData({ labels: [], datasets: [{ data: [] }] });
        }
      } catch {
        setBarChartData({ labels: [], datasets: [{ data: [] }] });
      }
      setBarChartLoading(false);
    }
    fetchBarChart();
  }, []);

  const getStatusBadge = (status) => {
    const variants = {
      confirmed: { variant: 'success', text: 'Confirmado' },
      pending: { variant: 'warning', text: 'Pendente' },
      cancelled: { variant: 'error', text: 'Cancelado' },
      completed: { variant: 'primary', text: 'Concluído' }
    };

    const { variant, text } = variants[status] || variants.pending;
    return <Badge variant={variant} size="sm">{text}</Badge>;
  };

  const topService = topServices.length > 0 ? topServices[0] : null;

  return (
    <div className={`admin-dashboard ${theme.name}`}>
      {/* Sidebar */}
      <Sidebar />
      
      {/* Conteúdo principal */}
      <main className="main-content-unified">
        {showSettings && <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />}
        
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">{t('dashboard.title', 'Dashboard')}</h1>
            <p className="dashboard-subtitle">
              {t('dashboard.welcomeBack', 'Bem-vindo de volta! Aqui está o resumo de hoje.')}
            </p>
          </div>
          <div className="dashboard-actions">
            <LogoHeader />
            <button className="btn btn--primary" onClick={() => navigate('/agenda')}>
              <FiPlus /> {t('dashboard.newAppointment', 'Novo Agendamento')}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <StatCard
            title={t('dashboard.totalClients', 'Total de Clientes')}
            value={stats.totalClients}
            icon="👥"
            trend="up"
            trendValue="+12% este mês"
            loading={stats.loading}
          />
          <StatCard
            title={t('dashboard.appointmentsToday', 'Agendamentos Hoje')}
            value={stats.totalAppointments}
            icon="📅"
            trend="up"
            trendValue="+8% vs ontem"
            loading={stats.loading}
          />
          <StatCard
            title={t('dashboard.monthlyRevenue', 'Faturamento Mensal')}
            value={`R$ ${stats.monthlyRevenue.toFixed(2)}`}
            icon="💰"
            trend="up"
            trendValue="+23% vs mês anterior"
            loading={stats.loading}
          />
          <StatCard
            title={t('dashboard.servicesPerformed', 'Serviços Realizados')}
            value={stats.servicesPerformed}
            icon="✂️"
            trend="down"
            trendValue="-3% esta semana"
            loading={stats.loading}
          />
        </div>

        <div className="dashboard-grid">
          {/* Recent Appointments */}
          <Card className="dashboard-card-enhanced">
            <CardHeader>
              <CardTitle>{t('dashboard.upcomingAppointments', 'Próximos Agendamentos')}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="appointments-list">
                {recentAppointments.length > 0 ? (
                  recentAppointments.map(appointment => (
                    <div key={appointment.id} className="appointment-item">
                      <div className="appointment-icon">📅</div>
                      <div className="appointment-info">
                        <h4 className="appointment-client">{appointment.client}</h4>
                        <p className="appointment-service">{appointment.service}</p>
                      </div>
                      <div className="appointment-meta">
                        <span className="appointment-time">🕐 {appointment.time}</span>
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">📅</span>
                    <p className="empty-text">Nenhum agendamento próximo</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Top Services */}
          <Card className="dashboard-card-enhanced">
            <CardHeader>
              <CardTitle>{t('dashboard.topService', 'Serviço mais vendido')}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="services-list">
                {topService ? (
                  <div className="service-item">
                    <div className="service-icon">✂️</div>
                    <div className="service-details">
                      <h4 className="service-name">{topService.name}</h4>
                      <div className="service-stats">
                        <span>{topService.count} solicitações</span>
                        <span className="service-revenue">{topService.revenue}</span>
                      </div>
                    </div>
                    <div className="service-bar">
                      <div 
                        className="service-bar-fill" 
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">✂️</span>
                    <p className="empty-text">Nenhum serviço mais vendido</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Birthdays of the Month */}
          <div
            className="birthday-card-clickable"
            role="button"
            tabIndex={0}
            onClick={() => setShowBirthdaysModal(true)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setShowBirthdaysModal(true);
              }
            }}
            aria-label="Abrir lista de aniversariantes do mês"
          >
            <Card className="dashboard-card-enhanced">
              <CardHeader>
                <CardTitle>{t('dashboard.birthdaysMonth', 'Aniversariantes do Mês')}</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="birthdays-list">
                  {birthdays.length > 0 ? (
                    birthdays.slice(0, 3).map((birthday, index) => (
                      <div key={index} className="birthday-item">
                        <div className="birthday-icon">🎂</div>
                        <div className="birthday-info">
                          <h4 className="birthday-name">{birthday.name}</h4>
                          <p className="birthday-date">{birthday.date}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <span className="empty-icon">🎉</span>
                      <p className="empty-text">Nenhum aniversariante este mês</p>
                    </div>
                  )}
                  {birthdays.length > 0 && (
                    <p className="birthday-open-hint">Clique para ver todos</p>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>


        </div>

        {showBirthdaysModal && (
          <div className="birthday-modal-overlay" onClick={() => setShowBirthdaysModal(false)}>
            <div className="birthday-modal" onClick={(event) => event.stopPropagation()}>
              <div className="birthday-modal-header">
                <h3>{t('dashboard.birthdaysMonth', 'Aniversariantes do Mês')}</h3>
                <button
                  type="button"
                  className="birthday-modal-close"
                  onClick={() => setShowBirthdaysModal(false)}
                  aria-label="Fechar modal de aniversariantes"
                >
                  ×
                </button>
              </div>
              <div className="birthday-modal-body">
                {birthdays.length > 0 ? (
                  birthdays.map((birthday, index) => (
                    <div key={`${birthday.name}-${index}`} className="birthday-item birthday-item-modal">
                      <div className="birthday-icon">🎂</div>
                      <div className="birthday-info">
                        <h4 className="birthday-name">{birthday.name}</h4>
                        <p className="birthday-date">{birthday.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <span className="empty-icon">🎉</span>
                    <p className="empty-text">Nenhum aniversariante este mês</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
