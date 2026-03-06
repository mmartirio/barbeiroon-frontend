import React from 'react';
import Sidebar from '../sidebar/Sidebar';
import '../AdminDashboard.css';

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified">
        <div style={{ maxWidth: 700, margin: '0 auto', background: 'rgba(255,255,255,0.1)', borderRadius: 24, boxShadow: '0 8px 40px #007aff22', padding: 40, minHeight: 400, backdropFilter: 'blur(18px)', border: '1px solid rgba(224,231,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 32, color: '#fff', letterSpacing: -1, textAlign: 'center', marginBottom: 24 }}>Cadastrar Usuário</h2>
          <p style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>Formulário para cadastrar um novo usuário.</p>
        </div>
      </main>
    </div>
  );
}
