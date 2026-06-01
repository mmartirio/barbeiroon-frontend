import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiBell, FiSave, FiInfo } from 'react-icons/fi';

const tok = () => sessionStorage.getItem('token');

const REMINDER_OPTIONS = [
  { label: '15 minutos antes',  value: 15 },
  { label: '30 minutos antes',  value: 30 },
  { label: '1 hora antes',      value: 60 },
  { label: '2 horas antes',     value: 120 },
  { label: '3 horas antes',     value: 180 },
  { label: '6 horas antes',     value: 360 },
  { label: '12 horas antes',    value: 720 },
  { label: '24 horas antes',    value: 1440 },
  { label: '48 horas antes',    value: 2880 },
];

export default function AgendaRegras() {
  const [reminderMinutes, setReminderMinutes] = useState(1440);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/agenda/rules', { headers: { Authorization: `Bearer ${tok()}` } });
        const d   = await res.json().catch(() => ({}));
        if (res.ok) setReminderMinutes(Number(d.reminderMinutesBefore ?? 1440));
      } catch { /* silent */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/agenda/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ reminderMinutesBefore: reminderMinutes }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao salvar regras.');
      setSuccess('Regras salvas com sucesso!');
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const selectedLabel = REMINDER_OPTIONS.find(o => o.value === reminderMinutes)?.label
    ?? `${reminderMinutes} minutos antes`;

  return (
    <Layout title="Regras de Agenda">
      <div style={{ maxWidth: 600 }}>
        {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

        {loading ? (
          <div className="empty-state"><p>Carregando...</p></div>
        ) : (
          <>
            {/* Lembrete de agendamento */}
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <div className="card-header">
                <p className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiBell size={14} /> Lembretes de Agendamento
                </p>
              </div>
              <div className="card-body">
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '1rem' }}>
                  Defina com quanto tempo de antecedência o cliente receberá um lembrete via WhatsApp antes do horário do agendamento.
                </p>

                <div className="form-group">
                  <label className="form-label">Tempo de antecedência do lembrete</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    {REMINDER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`btn btn-sm ${reminderMinutes === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setReminderMinutes(opt.value)}
                        style={{ justifyContent: 'flex-start', gap: '0.4rem' }}
                      >
                        <FiBell size={12} />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--color-muted)' }}>
                    Selecionado: <strong style={{ color: 'var(--color)' }}>{selectedLabel}</strong>
                  </p>
                </div>

                <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 'var(--radius-xs)', padding: '0.75rem', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--color-muted)' }}>
                  <FiInfo size={14} style={{ flexShrink: 0, marginTop: 2, color: '#60a5fa' }} />
                  <span>O lembrete é enviado pelo WhatsApp conectado da barbearia. O envio requer que o WhatsApp esteja conectado em <strong style={{ color: 'var(--color)' }}>Conta → QR Code WhatsApp</strong>.</span>
                </div>
              </div>
            </div>

            {/* Outras regras futuras podem ser adicionadas aqui */}

            <button className="btn btn-primary" onClick={save} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FiSave size={14} />
              {saving ? 'Salvando...' : 'Salvar Regras'}
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
