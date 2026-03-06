import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const BarChartCard = ({ title = 'Gráfico de Barra', data, options, loading }) => {
  const hasData = data && data.datasets && data.datasets[0] && data.datasets[0].data && data.datasets[0].data.length > 0 && data.datasets[0].data.some(v => v > 0);

  return (
    <Card className="dashboard-card-enhanced">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {loading ? (
            <span style={{ color: '#888', fontSize: '1rem', textAlign: 'center' }}>Carregando...</span>
          ) : hasData ? (
            <Bar data={data} options={options} />
          ) : (
            <span style={{ color: '#888', fontSize: '1rem', textAlign: 'center' }}>Ainda não existe dados</span>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

export default BarChartCard;
