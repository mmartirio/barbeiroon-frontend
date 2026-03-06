// Dados de exemplo para o gráfico de barra
export const barChartData = {
  labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
  datasets: [
    {
      label: 'Faturamento',
      data: [12000, 15000, 11000, 18000, 17000, 21000],
      backgroundColor: 'rgba(0, 122, 255, 0.7)',
      borderRadius: 8,
    },
  ],
};

export const barChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          return 'R$ ' + value;
        }
      }
    }
  }
};
