import React, { useState, useEffect } from "react";
import './profissional.css';
import Servico from '../service/servico';
import { useApi } from '../../../hooks/useApi';

const Profissional = () => {
  const [selectedProf, setSelectedProf] = useState(null);
  const [profissionais, setProfissionais] = useState([]);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    async function fetchProfissionais() {
      setLoading(true);
      try {
        const data = await get('/api/professional');
        setProfissionais(data);
      } catch (e) {
        setProfissionais([]);
      }
      setLoading(false);
    }
    fetchProfissionais();
  }, [get]);

  return (
    <>
      {!selectedProf ? (
        <section className='container-pro'>
          <h2 className='title-pro'>Selecione o Profissional</h2>
          {loading ? (
            <div>Carregando profissionais...</div>
          ) : profissionais.length === 0 ? (
            <div>Nenhum profissional cadastrado.</div>
          ) : (
            profissionais.map(prof => (
              <div className='pro' key={prof.id} onClick={() => setSelectedProf(prof)}>
                <h3>{prof.name}</h3>
              </div>
            ))
          )}
        </section>
      ) : <Servico />}
    </>
  );
};

export default Profissional;
