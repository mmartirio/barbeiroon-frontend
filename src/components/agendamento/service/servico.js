import React, { useState, useEffect, lazy, Suspense } from 'react';
import './servico.css';
import { useApi } from '../../../hooks/useApi';

const Login = lazy(() => import('../../login/login'));
const PDFGenerator = lazy(() => import('../PDF/pdfGenerator'));

const Servico = () => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    async function fetchServices() {
      setLoading(true);
      try {
        const data = await get('/api/service');
        setServicesData(data);
      } catch (e) {
        setServicesData([]);
      }
      setLoading(false);
    }
    fetchServices();
  }, [get]);

  const toggleService = (service) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const total = selectedServices.reduce((acc, name) => {
    const { value = 0, duration = 0 } = servicesData.find(s => s.name === name) || {};
    return { value: acc.value + value, duration: acc.duration + duration };
  }, { value: 0, duration: 0 });

  const handlePdfGenerated = () => {
    setShowLogin(true);
  };

  if (showLogin) {
    return (
      <Suspense fallback={<div>Carregando Login...</div>}>
        <Login />
      </Suspense>
    );
  }

  return (
    <section className='container-serv'>
      <h2 className='title-serv'>Selecione o Serviço desejado</h2>
      {loading ? (
        <div>Carregando serviços...</div>
      ) : servicesData.length === 0 ? (
        <div>Nenhum serviço cadastrado.</div>
      ) : (
        servicesData.map(({ name, duration, value }) => (
          <div
            key={name}
            className={`serv ${selectedServices.includes(name) ? 'selected' : ''}`}
            onClick={() => toggleService(name)}
          >
            <h3>{name}</h3>
            <p>Duração: {duration} min</p>
            <p>Valor: R$ {value},00</p>
          </div>
        ))
      )}
      {selectedServices.length > 0 && (
        <section className='summary-serv'>
          <h3>Resumo dos Serviços Selecionados:</h3>
          <p>Serviço: {selectedServices.join(' + ')}</p>
          <p>Valor Total: R$ {total.value},00</p>
          <p>Duração Total: {total.duration} min</p>
          <Suspense fallback={<div>Carregando PDF...</div>}>
            <PDFGenerator
              servicesDescription={selectedServices.join(' + ')}
              totalValue={total.value}
              totalDuration={total.duration}
              onDownloadComplete={handlePdfGenerated}
            />
          </Suspense>
        </section>
      )}
    </section>
  );
}

export default Servico;
