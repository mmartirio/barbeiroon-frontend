import React from 'react';
import Sidebar from '../../painel/sidebar/Sidebar';
import BarberAppointmentsPanel from './BarberAppointmentsPanel';
import AdminAppointmentsPanel from './AdminAppointmentsPanel';
import { useAuth } from '../../../hooks/useAuth';
import '../../painel/AdminDashboard.css';
import './Services.css';

const Agendados = () => {
  const { user } = useAuth();
  const canViewAll = !!user?.permissions?.canViewAppointments;

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified portal-layout">
        <div className="portal-card portal-card--narrow">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Agendados</h2>
          </div>
          <div className="portal-card-body">
            {canViewAll ? <AdminAppointmentsPanel /> : <BarberAppointmentsPanel />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Agendados;
