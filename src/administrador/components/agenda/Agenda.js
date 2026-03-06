import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; // Supondo que a lib já esteja instalada
import 'react-calendar/dist/Calendar.css';
import './Agenda.css';
import './Calendar.css';
import { getFeriadosNacionais } from '../../../utils/feriados'; // Função utilitária para feriados nacionais

// Mapeamento dos feriados nacionais para exibir o nome no tooltip
const nomesFeriados = {
  '01-01': 'Confraternização Universal',
  '04-21': 'Tiradentes',
  '05-01': 'Dia do Trabalho',
  '09-07': 'Independência do Brasil',
  '10-12': 'N. Sra. Aparecida',
  '11-02': 'Finados',
  '11-15': 'Proclamação da República',
  '12-25': 'Natal',
};

function nomeFeriado(dateStr) {
  // dateStr no formato yyyy-mm-dd
  const [ano, mes, dia] = dateStr.split('-');
  const chave = mes + '-' + dia;
  if (nomesFeriados[chave]) return nomesFeriados[chave];
  // Feriados móveis
  const data = new Date(dateStr);
  if (!isNaN(data)) {
    const pascoa = getFeriadosNacionais(data.getFullYear())[6];
    const corpus = getFeriadosNacionais(data.getFullYear())[9];
    const sexta = getFeriadosNacionais(data.getFullYear())[7];
    const carnaval = getFeriadosNacionais(data.getFullYear())[8];
    if (dateStr === pascoa) return 'Páscoa';
    if (dateStr === corpus) return 'Corpus Christi';
    if (dateStr === sexta) return 'Sexta-feira Santa';
    if (dateStr === carnaval) return 'Carnaval';
  }
  return 'Feriado Nacional';
}
import Sidebar from '../../painel/sidebar/Sidebar';

const diasSemana = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

const Agenda = () => {
  const [diasSelecionados, setDiasSelecionados] = useState([]);
  const [todosDiasAno, setTodosDiasAno] = useState(false);
  // Estado para guardar os dias marcados pelo padrão
  const [diasPadrao, setDiasPadrao] = useState([]);
  const [diasCalendario, setDiasCalendario] = useState([]);
  const [inicioExpediente, setInicioExpediente] = useState('08:00');
  const [fimExpediente, setFimExpediente] = useState('18:00');
  const [inicioAlmoco, setInicioAlmoco] = useState('12:00');
  const [fimAlmoco, setFimAlmoco] = useState('13:00');
  const [indisponibilidade, setIndisponibilidade] = useState([]); // [{dia, inicio, fim, motivo}]
  const [novaIndisponibilidade, setNovaIndisponibilidade] = useState({ dia: '', inicio: '', fim: '', motivo: '' });
  const [encerramentoAntecipado, setEncerramentoAntecipado] = useState({ dia: '', hora: '', motivo: '' });
  const [feriados, setFeriados] = useState([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [users, setUsers] = useState([]);
  const [applyToAll, setApplyToAll] = useState(true);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  // Estado para controlar o mês inicial do calendário (Brasil)
  const [mesAtual, setMesAtual] = useState(() => {
    // Garante o fuso horário de Brasília
    const agora = new Date();
    const offset = -3 * 60; // Brasília UTC-3
    const local = new Date(agora.getTime() + (agora.getTimezoneOffset() + offset) * 60000);
    return local;
  });

  useEffect(() => {
    setFeriados(getFeriadosNacionais(new Date().getFullYear()));
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/user/users?limit=200', {
          headers: { 'Authorization': `Bearer ${sessionStorage.getItem('token')}` }
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) return;
        const list = (data.users || []).filter((user) => user.isBarber);
        setUsers(list);
      } catch (e) {
        console.error('Erro ao carregar usuários:', e);
      }
    };

    loadUsers();
  }, []);

  // Seleção de dias da semana
  const handleDiaSemana = (value) => {
    setDiasSelecionados((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    );
  };

  // Seleção manual de dias no calendário
  const handleCalendario = (date) => {
    const str = date.toISOString().split('T')[0];
    setDiasCalendario((prev) =>
      prev.includes(str) ? prev.filter((d) => d !== str) : [...prev, str]
    );
  };

  // Seleção automática de todos os dias do ano baseados nos dias da semana
  useEffect(() => {
    if (todosDiasAno && diasSelecionados.length > 0) {
      const ano = new Date().getFullYear();
      let dias = [];
      for (let m = 0; m < 12; m++) {
        const diasNoMes = new Date(ano, m + 1, 0).getDate();
        for (let d = 1; d <= diasNoMes; d++) {
          const data = new Date(ano, m, d);
          if (diasSelecionados.includes(data.getDay())) {
            const str = data.toISOString().split('T')[0];
            if (!feriados.includes(str)) dias.push(str);
          }
        }
      }
      setDiasCalendario(dias);
      setDiasPadrao(dias); // Salva os dias marcados pelo padrão
    }
  }, [todosDiasAno, diasSelecionados, feriados]);

  // Adicionar indisponibilidade
  const addIndisponibilidade = () => {
    const { dia, inicio, fim, motivo } = novaIndisponibilidade;
    if (!dia || !inicio || !fim || !motivo) return setErro('Preencha todos os campos de indisponibilidade.');
    setIndisponibilidade((prev) => [...prev, { dia, inicio, fim, motivo }]);
    setNovaIndisponibilidade({ dia: '', inicio: '', fim: '', motivo: '' });
    setErro('');
    // Salva a indisponibilidade no backend
    fetch('/api/agenda/indisponibilidade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({ dia, inicio, fim, motivo }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao salvar indisponibilidade');
        setSucesso('Indisponibilidade salva com sucesso!');
      })
      .catch(e => setErro(e.message));
  };

  // Definir encerramento antecipado
  const definirEncerramentoAntecipado = (e) => {
    e.preventDefault();
    const { dia, hora, motivo } = encerramentoAntecipado;
    if (!dia || !hora || !motivo) return setErro('Preencha todos os campos de encerramento antecipado.');
    setErro('');
    // Salva o encerramento antecipado no backend
    fetch('/api/agenda/encerramento-antecipado', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('token')}`
      },
      body: JSON.stringify({ dia, hora, motivo }),
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao salvar encerramento antecipado');
        setSucesso('Encerramento antecipado definido!');
      })
      .catch(e => setErro(e.message));
  };

  // Salvar expediente
  const salvarExpediente = async () => {
    setErro('');
    setSucesso('');
    if (diasCalendario.length === 0) return setErro('Selecione ao menos um dia de expediente.');
    // Monta o payload apenas com os dados de expediente
    const payload = {
      diasCalendario,
      diasSelecionados,
      inicioExpediente,
      fimExpediente,
      inicioAlmoco,
      fimAlmoco,
      applyToAll,
      professionalId: applyToAll ? null : selectedProfessionalId
    };
    if (!applyToAll && !selectedProfessionalId) {
      return setErro('Selecione um barbeiro para aplicar o expediente.');
    }
    try {
      // Exemplo de chamada ao backend
      const res = await fetch('/api/agenda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao salvar expediente');
      const msg = applyToAll ? 'Expediente salvo para todos os barbeiros!' : 'Expediente salvo com sucesso!';
      setSucesso(msg);
    } catch (e) {
      setErro(e.message);
    }
  };

  // Handler para o checkbox de horário padrão
  const handleHorarioPadrao = () => {
    if (todosDiasAno) {
      // Ao desmarcar, remove todos os dias marcados pelo padrão
      setDiasCalendario((prev) => prev.filter((d) => !diasPadrao.includes(d)));
    }
    setTodosDiasAno((v) => !v);
  };

  return (
    <div className="admin-dashboard">
      <Sidebar />
      <main className="main-content-unified portal-layout">
        <div className="portal-card portal-card--narrow">
          <div className="portal-card-header">
            <h2 className="portal-card-title">Configuração de Expediente</h2>
          </div>
          <div className="portal-card-body">
            <div className="agenda-config">
      <div style={{ marginBottom: 20 }}>
        <label>Aplicar expediente:</label>
        <div className="dias-checkbox-group" style={{ marginTop: 8 }}>
          <label>
            <input
              type="radio"
              checked={applyToAll}
              onChange={() => setApplyToAll(true)}
            />
            Todos os barbeiros
          </label>
          <label>
            <input
              type="radio"
              checked={!applyToAll}
              onChange={() => setApplyToAll(false)}
            />
            Barbeiro especifico
          </label>
        </div>
        {!applyToAll && (
          <div style={{ marginTop: 10 }}>
            <select
              value={selectedProfessionalId}
              onChange={(e) => setSelectedProfessionalId(e.target.value)}
            >
              <option value="">Selecione um barbeiro</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div>
        <label>Dias da semana com expediente:</label>
        <div className="dias-checkbox-group">
          {diasSemana.map((d) => (
            <label key={d.value}>
              <input
                type="checkbox"
                checked={diasSelecionados.includes(d.value)}
                onChange={() => handleDiaSemana(d.value)}
              />
              {d.label}
            </label>
          ))}
        </div>
      </div>
      <div className="dias-checkbox-group" style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600 }}>
          <input
            type="checkbox"
            checked={todosDiasAno}
            onChange={handleHorarioPadrao}
          />
          Agendamento padrão
        </label>
      </div>
      <div>
        <label>Seleção manual de dias no calendário:</label>
        <Calendar
          locale="pt-BR"
          value={mesAtual}
          onActiveStartDateChange={({ activeStartDate }) => setMesAtual(activeStartDate)}
          onClickDay={handleCalendario}
          tileDisabled={({ date, view }) => {
            const today = new Date();
            today.setHours(0,0,0,0);
            if (view === 'month') {
              return date < today;
            }
            if (view === 'decade') {
              // Não desabilita o ano atual
              const currentYear = today.getFullYear();
              return date.getFullYear() < currentYear;
            }
            return false;
          }}
          tileClassName={({ date }) => {
            const today = new Date();
            today.setHours(0,0,0,0);
            const dateStr = date.toISOString().split('T')[0];
            if (date < today) return 'past-day';
            if (feriados.includes(dateStr)) return 'feriado-day';
            if (diasCalendario.includes(dateStr)) return 'selected-day';
            return '';
          }}
          tileContent={({ date }) => {
            const dateStr = date.toISOString().split('T')[0];
            if (feriados.includes(dateStr)) {
              return (
                <span className="feriado-tooltip-wrapper">
                  <span className="feriado-tooltip-text">{nomeFeriado(dateStr)}</span>
                </span>
              );
            }
            return null;
          }}
          formatShortWeekday={(locale, date) => {
            const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            return dias[date.getDay()];
          }}
        />
      </div>
          <h3 className="hora-expediente">Horário de expediente</h3>
          <div className="expediente-horarios">
            <div>
              <label className="agenda-label-menor">Início do expediente:</label>
              <input type="time" value={inicioExpediente} onChange={e => setInicioExpediente(e.target.value)} />
              <label className="agenda-label-menor">Fim do expediente:</label>
              <input type="time" value={fimExpediente} onChange={e => setFimExpediente(e.target.value)} />
            </div>
            <div>
              <label className="agenda-label-menor">Início do almoço:</label>
              <input type="time" value={inicioAlmoco} onChange={e => setInicioAlmoco(e.target.value)} />
              <label className="agenda-label-menor">Fim do almoço:</label>
              <input type="time" value={fimAlmoco} onChange={e => setFimAlmoco(e.target.value)} />
            </div>
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: -30 }}>
            <button onClick={salvarExpediente} className="agenda-action-btn salvar-btn">Salvar</button>
          </div>
          <div className="agenda-duas-colunas">
          <div className="agenda-blocos-lado-a-lado">
            <div className="agenda-indisponibilidade">
              <h4 className='title-indisponibilidade'>Horário de Indisponibilidade</h4>
              <p className='text-explicacao'>Adicione períodos em que não haverá atendimento.</p>
              <form onSubmit={e => { e.preventDefault(); addIndisponibilidade(); }} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ width: '100%' }}>
                  <input type="date" value={novaIndisponibilidade.dia} onChange={e => setNovaIndisponibilidade({ ...novaIndisponibilidade, dia: e.target.value })} placeholder="Dia" />
                  <input type="time" value={novaIndisponibilidade.inicio} onChange={e => setNovaIndisponibilidade({ ...novaIndisponibilidade, inicio: e.target.value })} placeholder="Início" />
                  <input type="time" value={novaIndisponibilidade.fim} onChange={e => setNovaIndisponibilidade({ ...novaIndisponibilidade, fim: e.target.value })} placeholder="Fim" />
                  <textarea value={novaIndisponibilidade.motivo} onChange={e => setNovaIndisponibilidade({ ...novaIndisponibilidade, motivo: e.target.value })} placeholder="Motivo" className="motivo-textarea" />
                  <button type="submit" className="agenda-action-btn">Adicionar</button>
                </div>
              </form>
              <ul>
                {indisponibilidade.map((ind, idx) => (
                  <li key={idx}>{ind.dia} - {ind.inicio} às {ind.fim} ({ind.motivo})</li>
                ))}
              </ul>
            </div>
            <div className="agenda-encerramento-antecipado">
              <h4 className='title-indisponibilidade'>Encerramento antecipado</h4>
              <p className='text-explicacao'>Adicione períodos em que o expediente será encerrado antes do horário normal.</p>
              <form onSubmit={definirEncerramentoAntecipado} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ width: '100%' }}>
                  <div className="agenda-encerramento-inputs">
                    <input type="date" value={encerramentoAntecipado.dia} onChange={e => setEncerramentoAntecipado({ ...encerramentoAntecipado, dia: e.target.value })} placeholder="Dia" />
                    <input type="time" value={encerramentoAntecipado.hora} onChange={e => setEncerramentoAntecipado({ ...encerramentoAntecipado, hora: e.target.value })} placeholder="Hora" />
                    <textarea value={encerramentoAntecipado.motivo} onChange={e => setEncerramentoAntecipado({ ...encerramentoAntecipado, motivo: e.target.value })} placeholder="Motivo" className="motivo-textarea" />
                  </div>
                  <button type="submit" className="agenda-action-btn definir-btn">Definir</button>
                </div>
              </form>
              {encerramentoAntecipado.dia && encerramentoAntecipado.hora && encerramentoAntecipado.motivo && (
                <div>Encerramento: {encerramentoAntecipado.dia} às {encerramentoAntecipado.hora} ({encerramentoAntecipado.motivo})</div>
              )}
            </div>
          </div>
    </div>
      {erro && <div className="erro">{erro}</div>}
      {sucesso && <div className="sucesso">{sucesso}</div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Agenda;
