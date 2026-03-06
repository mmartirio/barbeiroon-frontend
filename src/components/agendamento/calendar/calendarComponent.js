import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendarComponent.css';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import HoraSelector from '../Hour/horaSelector'; // Importe o HoraSelector
import { useNavigate } from 'react-router-dom';

const CalendarComponent = () => {
  const [date, setDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState(null);
  const navigate = useNavigate();

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setSelectedHour(null); // Reset selected hour when the date changes
  };

  const handleBook = () => {
    // Aqui você pode definir a lógica para o agendamento, e então redirecionar
    navigate('/profissional');
  };

  // Formata a data no formato pt-BR (dd/MM/yyyy)
  const formattedDate = date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '';

  return (
    <div className='container-cal'>
      <h2 className='title-cal'>Selecione uma data</h2>
      <Calendar
        onChange={handleDateChange}
        value={date}
      />
      {date && (
        <p>Data selecionada: {formattedDate}</p>
      )}
      {date && (
        <HoraSelector 
          selectedDate={date}
          onSelectHour={setSelectedHour}
          onBook={handleBook}
        />
      )}
    </div>
  );
};

export default CalendarComponent;
