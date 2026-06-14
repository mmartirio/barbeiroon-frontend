import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/Layout/Layout';

const tok = () => sessionStorage.getItem('token');

const fmtPhone = (v) => {
  const c = v.replace(/\D/g, '');
  if (c.length <= 2) return c;
  if (c.length <= 7) return `(${c.slice(0,2)}) ${c.slice(2)}`;
  return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`;
};

const fmtBirth = (v) => {
  const d = v.replace(/\D/g, '');
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0,2)}/${d.slice(2)}`;
  return `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4,8)}`;
};

const birthToApi = (v) => {
  if (!v || !v.includes('/')) return null;
  const [d, m, y] = v.split('/');
  if (!d || !m || !y || y.length < 4) return null;
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
};

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtCurrency = (v) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v || 0));

const maskPhone = (raw) => {
  const c = String(raw || '').replace(/\D/g, '');
  if (c.length <= 2) return c;
  if (c.length <= 7) return `(${c.slice(0,2)}) ${c.slice(2)}`;
  return `(${c.slice(0,2)}) ${c.slice(2,7)}-${c.slice(7,11)}`;
};

export default function AtendimentoAvulso() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantSlug = slug || user?.tenantSlug || '';
  const canManage = !!(user?.permissions?.canManageTenant || user?.permissions?.canViewAppointments);

  const [phone, setPhone] = useState('');
  const [noPhone, setNoPhone] = useState(false);
  const [customerStatus, setCustomerStatus] = useState('idle'); // idle | searching | found | not_found
  const [customerName, setCustomerName] = useState('');
  const [newName, setNewName] = useState('');
  const [newBirth, setNewBirth] = useState('');

  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const [services, setServices] = useState([]);
  const [professionals, setProfessionals] = useState([]);
  const [serviceId, setServiceId] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [date, setDate] = useState(today());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const abortRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    fetch('/api/service?limit=200', { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).catch(() => ({}))
      .then(d => setServices((d.services || d.data || []).filter(s => s.ativo !== false)));
  }, []);

  useEffect(() => {
    if (canManage) {
      fetch('/api/user/barbers', { headers: { Authorization: `Bearer ${tok()}` } })
        .then(r => r.json()).catch(() => ({}))
        .then(d => setProfessionals(d.users || d.barbers || d.data || []));
    } else if (user?.id) {
      setProfessionalId(String(user.id));
    }
  }, [canManage, user]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handle = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // Busca com debounce a partir de 6 dígitos
  useEffect(() => {
    const digits = phone.replace(/\D/g, '');

    if (digits.length < 6) {
      setSuggestions([]);
      setShowDropdown(false);
      if (customerStatus !== 'idle') {
        setCustomerStatus('idle');
        setCustomerName('');
      }
      return;
    }

    setCustomerStatus('searching');
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const r = await fetch(`/api/customer?search=${digits}&limit=6`, {
          headers: { Authorization: `Bearer ${tok()}` },
          signal: controller.signal,
        });
        if (!r.ok) { setCustomerStatus('idle'); return; }
        const d = await r.json().catch(() => ({}));
        const list = d.customers || d.data || [];
        setSuggestions(list);
        if (list.length > 0) {
          setShowDropdown(true);
          setCustomerStatus('idle');
        } else {
          setShowDropdown(false);
          // Com 8+ dígitos e sem sugestões: cliente não existe
          setCustomerStatus(digits.length >= 8 ? 'not_found' : 'idle');
        }
      } catch (err) {
        if (err.name !== 'AbortError') setCustomerStatus('idle');
      }
    }, 300);

    return () => { clearTimeout(timer); controller.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const selectSuggestion = (customer) => {
    setPhone(maskPhone(customer.phone));
    setCustomerName(customer.name);
    setCustomerStatus('found');
    setSuggestions([]);
    setShowDropdown(false);
    setNewName('');
    setNewBirth('');
  };

  const handlePhoneChange = (e) => {
    const formatted = fmtPhone(e.target.value);
    setPhone(formatted);
    setCustomerName('');
    setNewName('');
    setNewBirth('');
    setCustomerStatus('idle');
  };

  const resetForm = () => {
    setPhone('');
    setNoPhone(false);
    setCustomerStatus('idle');
    setCustomerName('');
    setNewName('');
    setNewBirth('');
    setSuggestions([]);
    setShowDropdown(false);
    setServiceId('');
    setDate(today());
    if (!canManage && user?.id) setProfessionalId(String(user.id));
    else setProfessionalId('');
  };

  const handleNoPhoneToggle = () => {
    setNoPhone(v => {
      if (!v) {
        // Ativando "sem número": limpa campos de telefone
        setPhone('');
        setCustomerStatus('idle');
        setCustomerName('');
        setSuggestions([]);
        setShowDropdown(false);
      } else {
        // Desativando: limpa nome avulso
        setNewName('');
        setNewBirth('');
      }
      return !v;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!noPhone) {
      const raw = phone.replace(/\D/g, '');
      if (!raw) { setError('Telefone é obrigatório.'); return; }
      if (customerStatus === 'not_found' && !newName.trim()) {
        setError('Nome do cliente é obrigatório para novo cadastro.');
        return;
      }
    } else {
      if (!newName.trim()) { setError('Nome do cliente é obrigatório.'); return; }
    }
    if (!serviceId) { setError('Selecione um serviço.'); return; }
    if (!professionalId) { setError('Selecione um profissional.'); return; }
    if (!date) { setError('Informe a data do atendimento.'); return; }

    setLoading(true);
    try {
      const body = {
        serviceId: Number(serviceId),
        professionalId: Number(professionalId),
        date,
      };

      if (noPhone) {
        body.noPhone = true;
        body.customerName = newName.trim();
        const bd = birthToApi(newBirth);
        if (bd) body.customerBirthDate = bd;
      } else {
        body.customerPhone = phone.replace(/\D/g, '');
        if (customerStatus === 'not_found') {
          body.customerName = newName.trim();
          const bd = birthToApi(newBirth);
          if (bd) body.customerBirthDate = bd;
        }
      }

      const r = await fetch('/api/appointment/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Erro ao registrar atendimento.');

      setSuccess('Atendimento avulso registrado com sucesso!');
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Atendimento Avulso">
      <div style={{ maxWidth: 520 }}>
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>
        )}

        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Telefone com autocomplete */}
            <div className="form-group">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Telefone do cliente *</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: noPhone ? 'var(--accent)' : 'var(--color-muted)', transition: 'color 0.2s' }}>
                    Sem número
                  </span>
                  <span
                    onClick={handleNoPhoneToggle}
                    role="switch"
                    aria-checked={noPhone}
                    style={{
                      display: 'inline-block',
                      width: 36,
                      height: 20,
                      borderRadius: 10,
                      background: noPhone ? 'var(--accent)' : 'var(--border)',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: 2,
                      left: noPhone ? 18 : 2,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.35)',
                      transition: 'left 0.2s',
                    }} />
                  </span>
                </label>
              </div>
              <div ref={wrapperRef} style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  placeholder={noPhone ? 'Atendimento sem número' : '(11) 99999-9999'}
                  value={noPhone ? '' : phone}
                  onChange={handlePhoneChange}
                  onFocus={() => !noPhone && suggestions.length > 0 && setShowDropdown(true)}
                  maxLength={15}
                  autoComplete="off"
                  disabled={noPhone}
                  style={{
                    width: '100%',
                    paddingRight: customerStatus === 'searching' ? '2.5rem' : undefined,
                    opacity: noPhone ? 0.5 : 1,
                  }}
                />

                {customerStatus === 'searching' && (
                  <span style={{
                    position: 'absolute', right: '0.75rem', top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.75rem', color: 'var(--color-muted, #888)',
                    pointerEvents: 'none',
                  }}>
                    Buscando...
                  </span>
                )}

                {/* Dropdown de sugestões */}
                {showDropdown && suggestions.length > 0 && (
                  <ul style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    zIndex: 100,
                    background: 'var(--color-card, #fff)',
                    border: '1px solid var(--color-border, #e5e7eb)',
                    borderRadius: '0 0 8px 8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    margin: 0, padding: 0, listStyle: 'none',
                    maxHeight: 220, overflowY: 'auto',
                  }}>
                    {suggestions.map((c) => (
                      <li
                        key={c.phone}
                        onMouseDown={(e) => { e.preventDefault(); selectSuggestion(c); }}
                        style={{
                          padding: '0.65rem 1rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--color-border, #f3f4f6)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-hover, #f9fafb)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-muted, #6b7280)', fontFamily: 'monospace' }}>
                          {maskPhone(c.phone)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {customerStatus === 'found' && (
                <div style={{
                  marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8,
                  background: 'var(--color-success-bg, #dcfce7)',
                  color: 'var(--color-success-text, #166534)',
                  fontSize: '0.875rem',
                }}>
                  ✓ Cliente: <strong>{customerName}</strong>
                </div>
              )}

              {customerStatus === 'not_found' && (
                <div style={{
                  marginTop: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: 8,
                  background: 'var(--color-warning-bg, #fef9c3)',
                  color: 'var(--color-warning-text, #854d0e)',
                  fontSize: '0.875rem',
                }}>
                  Cliente não encontrado. Preencha os dados abaixo para cadastrá-lo.
                </div>
              )}
            </div>

            {/* Campos de novo cliente */}
            {(customerStatus === 'not_found' || noPhone) && (
              <>
                <div className="form-group">
                  <label className="form-label">
                    Nome completo *
                    {noPhone && (
                      <span style={{ marginLeft: '0.4rem', fontSize: '0.72rem', color: 'var(--color-muted)', fontWeight: 400 }}>
                        (sem número)
                      </span>
                    )}
                  </label>
                  <input
                    className="form-input"
                    placeholder="Nome do cliente"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    autoFocus={noPhone}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Data de nascimento</label>
                  <input
                    className="form-input"
                    placeholder="DD/MM/AAAA"
                    value={newBirth}
                    onChange={e => setNewBirth(fmtBirth(e.target.value))}
                    maxLength={10}
                  />
                </div>
              </>
            )}

            {/* Serviço */}
            <div className="form-group">
              <label className="form-label">Serviço *</label>
              <select
                className="form-input"
                value={serviceId}
                onChange={e => setServiceId(e.target.value)}
              >
                <option value="">Selecione um serviço</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {fmtCurrency(s.price)}
                  </option>
                ))}
              </select>
            </div>

            {/* Profissional (somente para admins) */}
            {canManage && (
              <div className="form-group">
                <label className="form-label">Profissional *</label>
                <select
                  className="form-input"
                  value={professionalId}
                  onChange={e => setProfessionalId(e.target.value)}
                >
                  <option value="">Selecione o profissional</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Data */}
            <div className="form-group">
              <label className="form-label">Data do atendimento *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                max={today()}
                onChange={e => setDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => navigate(`/${tenantSlug}/dashboard`)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Registrar Atendimento'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
