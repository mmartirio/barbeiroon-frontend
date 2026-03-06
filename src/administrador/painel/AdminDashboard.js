import React, { useEffect, useState } from 'react';
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

function AdminDashboard() {
  const { t } = useTranslation();
  const { theme, backgroundImage, logo } = useTheme();
  const { logout, user } = useAuth();
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

  useEffect(() => {
    loadDashboardData();
  }, []);

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

  const loadDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalClients: data.totalClients || 0,
          totalAppointments: data.totalAppointments || 0,
          monthlyRevenue: data.monthlyRevenue || 0,
          servicesPerformed: data.servicesPerformed || 0,
          loading: false
        });

        setRecentAppointments(data.recentAppointments || []);
        setTopServices(data.topServices || []);
        setBirthdays(data.birthdays || []);
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
  };

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
              <CardTitle>{t('dashboard.topServices', 'Serviços Mais Vendidos')}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="services-list">
                {topServices.length > 0 ? (
                  topServices.map((service, index) => (
                    <div key={index} className="service-item">
                      <div className="service-icon">✂️</div>
                      <div className="service-rank">#{index + 1}</div>
                      <div className="service-details">
                        <h4 className="service-name">{service.name}</h4>
                        <div className="service-stats">
                          <span>{service.count} serviços</span>
                          <span className="service-revenue">{service.revenue}</span>
                        </div>
                      </div>
                      <div className="service-bar">
                        <div 
                          className="service-bar-fill" 
                          style={{ width: `${(service.count / 50) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
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
          <Card className="dashboard-card-enhanced">
            <CardHeader>
              <CardTitle>{t('dashboard.birthdaysMonth', 'Aniversariantes do Mês')}</CardTitle>
            </CardHeader>
            <CardBody>
              <div className="birthdays-list">
                {birthdays.length > 0 ? (
                  birthdays.map((birthday, index) => (
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
              </div>
            </CardBody>
          </Card>


        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
