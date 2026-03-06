import React, { useState, useEffect } from 'react';
import './horaSelector.css';
import { useApi } from '../../../hooks/useApi';

const HoraSelector = ({ selectedDate, onSelectHour, onBook }) => {
  const [horarios, setHorarios] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [loading, setLoading] = useState(false);
  const { get } = useApi();

  useEffect(() => {
    async function fetchHorarios() {
      if (!selectedDate) return setHorarios([]);
      setLoading(true);
      try {
        // Exemplo de endpoint: /api/appointment/available?date=YYYY-MM-DD
        const dateStr = selectedDate.toISOString().split('T')[0];
        const data = await get(`/api/appointment/available?date=${dateStr}`);
        setHorarios(data);
      } catch (e) {
        setHorarios([]);
      }
      setLoading(false);
    }
    fetchHorarios();
  }, [selectedDate, get]);

  const handleHourClick = (hour) => {
    setSelectedHour(hour);
    onSelectHour?.(hour);
  };

  return (
    <div className='hora-selector'>
      {selectedDate ? (
        <div>
          <h3>Horários Disponíveis para {selectedDate.toLocaleDateString('pt-BR')}:</h3>
          {loading ? (
            <div>Carregando horários...</div>
          ) : horarios.length === 0 ? (
            <div>Nenhum horário disponível.</div>
          ) : (
            <ul>
              {horarios.map((hora, index) => (
                <li
                  key={index}
                  onClick={() => handleHourClick(hora)}
                  style={{ backgroundColor: hora === selectedHour ? '#3e4095' : 'transparent' }}
                >
                  {hora}
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={onBook}
            disabled={!selectedHour}
            className='btn-book'
          >
            Confirmar horário
          </button>
        </div>
      ) : (
        <p>Selecione uma data para ver os horários disponíveis.</p>
      )}
    </div>
  );
};

export default HoraSelector;
