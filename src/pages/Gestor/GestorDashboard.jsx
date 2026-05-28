import { RiDashboardLine } from 'react-icons/ri';

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <RiDashboardLine size={20} color="var(--accent)" />
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Dashboard</h1>
      </div>
      <div className="card">
        <div className="card-body" style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          Em desenvolvimento.
        </div>
      </div>
    </div>
  );
}
