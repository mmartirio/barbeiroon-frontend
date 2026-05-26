import React, { useState, useEffect, lazy, Suspense } from 'react';
import './servico.css';
import { useApi } from '../../../hooks/useApi';
import { FiScissors, FiClock, FiDollarSign } from 'react-icons/fi';

const Login = lazy(() => import('../../login/login'));
const PDFGenerator = lazy(() => import('../PDF/pdfGenerator'));

const formatDurationLabel = (duration) => {
  const raw = String(duration ?? '').trim();
  if (!raw) return '-';

  if (/^\d+$/.test(raw)) {
    return `${raw} min`;
  }

  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) return raw;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const totalMinutes = (hours * 60) + minutes;
  return `${totalMinutes} min`;
};


const Servico = () => {
  const [selectedServices, setSelectedServices] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  // Busca voucher de aniversariante ao montar o componente
  useEffect(() => {
    async function checkBirthdayVoucher() {
      try {
        // Ajuste o endpoint conforme sua API
        const voucher = await get('/api/voucher/birthday');
        if (voucher && voucher.valid) {
          window.alert(`Parabéns! Você ganhou um voucher de aniversário: ${voucher.code}\n${voucher.description || ''}`);
        }
      } catch (e) {
        // Silencia erro, pois não é obrigatório
      }
    }
    checkBirthdayVoucher();
  }, [get]);

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
    const svc = servicesData.find(s => s.name === name) || {};
    const price = parseFloat(svc.price ?? svc.value ?? 0) || 0;
    const rawDur = svc.duration ?? svc.duracao ?? 0;
    const durStr = String(rawDur);
    const parts = durStr.split(':');
    const duration = parts.length >= 2
      ? parseInt(parts[0]) * 60 + parseInt(parts[1])
      : parseInt(durStr) || 0;
    return { value: acc.value + price, duration: acc.duration + duration };
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
            <h3 className='serv-title'>
              <FiScissors />
              <span>{name}</span>
            </h3>
            <p className='serv-meta'>
              <FiClock />
              <span>Duração: {formatDurationLabel(duration)}</span>
            </p>
            <p className='serv-meta'>
              <FiDollarSign />
              <span>Valor: R$ {value},00</span>
            </p>
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
