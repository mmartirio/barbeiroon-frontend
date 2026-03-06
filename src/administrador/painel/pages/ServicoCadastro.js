import Services from '../../components/servicos/Services';
import React from 'react';
function ServicoCadastro() {
  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified">
        <div style={{ maxWidth: 1100, margin: '0 auto', background: 'rgba(255,255,255,0.1)', borderRadius: 24, boxShadow: '0 8px 40px #007aff22', padding: 40, minHeight: 520, backdropFilter: 'blur(18px)', border: '1px solid rgba(224,231,255,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Services />
        </div>
      </main>
    </div>
  );
}

export default ServicoCadastro;
