import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout';
import { FiChevronDown, FiUpload, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const tok = () => sessionStorage.getItem('token');

const ESTADOS_BR = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

function fmtPrice(val) {
  const n = parseFloat(val);
  return isNaN(n) || n === 0 ? 'Gratuito' : n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) + '/mês';
}

const daysUntil = (dateStr) => {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export default function Conta() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', companyName: '', cnpj: '', phone: '',
    address: '', neighborhood: '', city: '', state: '', logo: '',
    pixKey: '', pixOwnerName: '', pixCity: '',
  });
  const [planId,            setPlanId]            = useState(null);
  const [billingDay,        setBillingDay]        = useState('');
  const [plans,             setPlans]             = useState([]);
  const [scheduledDeleteAt, setScheduledDeleteAt] = useState(null);
  const [loading,           setLoading]           = useState(true);
  const [saving,            setSaving]            = useState(false);
  const [error,             setError]             = useState('');
  const [success,           setSuccess]           = useState('');
  const [showEstados,       setShowEstados]       = useState(false);
  const [deleteModal,       setDeleteModal]       = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading,     setDeleteLoading]     = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, plansRes] = await Promise.all([
        fetch('/api/tenant/settings', { headers: { Authorization: `Bearer ${tok()}` } }),
        fetch('/api/tenant/plans',    { headers: { Authorization: `Bearer ${tok()}` } }),
      ]);
      const data      = await settingsRes.json().catch(() => ({}));
      const plansData = await plansRes.json().catch(() => ({}));

      setForm({
        name:         data.name         || '',
        companyName:  data.companyName  || '',
        cnpj:         data.cnpj         || '',
        phone:        data.phone        || '',
        address:      data.address      || '',
        neighborhood: data.neighborhood || '',
        city:         data.city         || '',
        state:        data.state        || '',
        logo:         data.logo         || '',
        pixKey:       data.pixKey       || '',
        pixOwnerName: data.pixOwnerName || '',
        pixCity:      data.pixCity      || '',
      });
      setPlans(Array.isArray(plansData.plans) ? plansData.plans : []);
      setPlanId(data.planId ?? null);
      setBillingDay(data.billingDay ? String(data.billingDay) : '');
      setScheduledDeleteAt(data.scheduledDeleteAt || null);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Imagem muito grande. Máximo 5 MB.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => set('logo', ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Nome da empresa é obrigatório'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      const res  = await fetch('/api/tenant/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ ...form, planId, billingDay: billingDay ? Number(billingDay) : null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao salvar');
      setSuccess('Dados salvos com sucesso!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const selectedPlan = plans.find(p => p.id === planId) || null;

  const handleRequestDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/tenant/me/request-delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao solicitar exclusão');
      setScheduledDeleteAt(data.scheduledDeleteAt);
      setDeleteModal(false);
      setDeleteConfirmText('');
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
      setDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch('/api/tenant/me/cancel-delete', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tok()}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Erro ao cancelar exclusão');
      setScheduledDeleteAt(null);
      setSuccess('Exclusão cancelada. Conta reativada com sucesso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) return <Layout title="Conta"><div className="empty-state"><p>Carregando...</p></div></Layout>;

  return (
    <Layout title="Conta">
      <div style={{ maxWidth: 600, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error   && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Logo */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Logomarca</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
              {form.logo ? (
                <img src={form.logo.startsWith('data:') || form.logo.startsWith('http') ? form.logo : `/uploads/${form.logo.replace(/^\/uploads\//, '')}`}
                  alt="Logo" style={{ width: 120, height: 120, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }} />
              ) : (
                <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-input)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', gap: '0.25rem' }}>
                  <FiUpload size={32} />
                  <span style={{ fontSize: '0.75rem' }}>Sem logo</span>
                </div>
              )}
              <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', textAlign: 'center' }}>Recomendado: quadrado 1:1, mín. 200×200 px, máx. 5 MB. JPG ou PNG.</p>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiUpload size={13} /> Selecionar imagem
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={pickLogo} />
                </label>
                {form.logo && (
                  <button className="btn btn-danger btn-sm btn-icon" onClick={() => set('logo', '')}><FiTrash2 size={13} /></button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company data */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Dados da Empresa</h3>
            <div className="form-group">
              <label className="form-label">Nome da Empresa *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Nome fantasia" />
            </div>
            <div className="form-group">
              <label className="form-label">Razão Social</label>
              <input className="form-input" value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Razão social (opcional)" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">CNPJ</label>
                <input className="form-input" value={form.cnpj} onChange={e => set('cnpj', e.target.value)} placeholder="00.000.000/0000-00" maxLength={18} />
              </div>
              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(00) 00000-0000" maxLength={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Endereço</h3>
            <div className="form-group">
              <label className="form-label">Logradouro e Número</label>
              <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Ex.: Rua das Flores, 123" />
            </div>
            <div className="form-group">
              <label className="form-label">Bairro</label>
              <input className="form-input" value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} placeholder="Bairro" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Cidade</label>
                <input className="form-input" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Cidade" />
              </div>
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">Estado</label>
                <button type="button" onClick={() => setShowEstados(p => !p)}
                  style={{ width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', padding:'0.6rem 0.75rem', display:'flex', alignItems:'center', justifyContent:'space-between', color: form.state ? 'var(--color)' : 'var(--color-muted)', fontSize:'0.875rem' }}>
                  <span>{form.state || 'UF'}</span>
                  <FiChevronDown size={14} />
                </button>
                {showEstados && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius-xs)', zIndex:50, maxHeight:180, overflowY:'auto' }}>
                    {ESTADOS_BR.map(uf => (
                      <button key={uf} type="button" onClick={() => { set('state', uf); setShowEstados(false); }}
                        style={{ width:'100%', padding:'0.5rem 0.75rem', textAlign:'left', background: form.state === uf ? 'var(--accent)' : 'transparent', color: form.state === uf ? '#fff' : 'var(--color)', fontSize:'0.875rem', border:'none', borderBottom:'1px solid var(--border)', cursor:'pointer', fontWeight: form.state === uf ? 700 : 400 }}>
                        {uf}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '1rem' }}>Plano Contratado</h3>
            {plans.length === 0 ? (
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Nenhum plano disponível.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <select
                  className="form-input"
                  value={planId ?? ''}
                  onChange={e => setPlanId(e.target.value ? Number(e.target.value) : null)}
                  style={{ width: '100%' }}
                >
                  <option value="">— Selecione um plano —</option>
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedPlan && (
                  <div style={{ border: '1.5px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', background: 'rgba(124,58,237,0.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '1rem' }}>{selectedPlan.name}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{fmtPrice(selectedPlan.priceMonthly)}</span>
                    </div>
                    {selectedPlan.description && (
                      <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', margin: 0 }}>{selectedPlan.description}</p>
                    )}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                      <span>Usuários: {selectedPlan.maxUsers ?? '∞'}</span>
                      <span>Agendamentos/mês: {selectedPlan.maxAppointments ?? '∞'}</span>
                    </div>
                  </div>
                )}

                {/* Dia de vencimento */}
                {selectedPlan && parseFloat(selectedPlan.priceMonthly) > 0 && (
                  <div className="form-group" style={{ marginTop: '0.75rem' }}>
                    <label className="form-label">Dia de vencimento</label>
                    <select
                      className="form-input"
                      value={billingDay}
                      onChange={e => setBillingDay(e.target.value)}
                      style={{ maxWidth: 160 }}
                    >
                      <option value="">— Selecione —</option>
                      {[1, 5, 10, 15, 20].map(d => (
                        <option key={d} value={d}>Dia {String(d).padStart(2, '0')}</option>
                      ))}
                    </select>
                    {billingDay && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.3rem' }}>
                        Próxima cobrança vencerá no dia <strong>{String(billingDay).padStart(2, '0')}</strong>. Prorateamento aplicado automaticamente.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', textAlign: 'center', marginTop: '0.5rem' }}>Administrador pode alterar o plano diretamente aqui.</p>
          </div>
        </div>

        {/* PIX para receber pagamentos de planos */}
        <div className="card">
          <div className="card-body">
            <h3 style={{ marginBottom: '0.25rem' }}>PIX — Receber pagamentos de planos</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
              Configure sua chave PIX para gerar cobranças automáticas quando clientes contratarem planos de serviço.
            </p>
            <div className="form-group">
              <label className="form-label">Chave PIX</label>
              <input className="form-input" value={form.pixKey} onChange={e => set('pixKey', e.target.value)} placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Nome <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>(máx. 25 caracteres)</span></label>
                <input className="form-input" value={form.pixOwnerName} maxLength={25} onChange={e => set('pixOwnerName', e.target.value)} placeholder="Ex: João Barbearia" />
              </div>
              <div className="form-group">
                <label className="form-label">Cidade <span style={{ fontSize: '0.72rem', color: 'var(--color-muted)' }}>(máx. 15 caracteres)</span></label>
                <input className="form-input" value={form.pixCity} maxLength={15} onChange={e => set('pixCity', e.target.value)} placeholder="Ex: Sao Paulo" />
              </div>
            </div>
            {form.pixKey && (
              <p style={{ fontSize: '0.78rem', color: '#22c55e' }}>✓ PIX configurado — clientes receberão código de pagamento ao contratar um plano.</p>
            )}
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ alignSelf: 'stretch' }}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>

        {/* Danger zone */}
        <div className="card" style={{ border: '1px solid rgba(220,38,38,0.35)' }}>
          <div className="card-body">
            <h3 style={{ color: '#f87171', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiAlertTriangle size={16} /> Zona de Perigo
            </h3>

            {scheduledDeleteAt ? (
              <>
                <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 'var(--radius-xs)', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
                  <p style={{ color: '#f87171', fontWeight: 700, marginBottom: '0.25rem' }}>
                    Conta agendada para exclusão
                  </p>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>
                    Sua conta e todos os dados serão excluídos permanentemente em{' '}
                    <strong style={{ color: 'var(--color)' }}>{daysUntil(scheduledDeleteAt)} dia(s)</strong>{' '}
                    ({new Date(scheduledDeleteAt).toLocaleDateString('pt-BR')}).
                  </p>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={handleCancelDelete}
                  disabled={deleteLoading}
                  style={{ borderColor: 'var(--border)' }}
                >
                  {deleteLoading ? 'Cancelando...' : 'Cancelar exclusão e reativar conta'}
                </button>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  Ao solicitar a exclusão, sua conta ficará desativada por <strong>30 dias</strong>.
                  Após esse período todos os dados serão removidos permanentemente e não poderão ser recuperados.
                  Você pode cancelar a exclusão durante esse prazo.
                </p>
                <button
                  className="btn btn-danger"
                  onClick={() => { setDeleteModal(true); setDeleteConfirmText(''); }}
                  style={{ fontSize: '0.875rem' }}
                >
                  <FiTrash2 size={14} /> Solicitar exclusão da conta
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmação */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 420, border: '1px solid rgba(220,38,38,0.4)' }}>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171' }}>
                <FiAlertTriangle size={20} />
                <h3 style={{ color: '#f87171' }}>Confirmar exclusão da conta</h3>
              </div>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
                Esta ação irá <strong style={{ color: 'var(--color)' }}>desativar sua conta imediatamente</strong>.
                Após 30 dias, todos os dados — agendamentos, clientes, serviços e configurações —
                serão excluídos permanentemente. Você poderá cancelar dentro desse prazo.
              </p>
              <div className="form-group">
                <label className="form-label">
                  Digite <strong>EXCLUIR</strong> para confirmar
                </label>
                <input
                  className="form-input"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="EXCLUIR"
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={handleRequestDelete}
                  disabled={deleteConfirmText !== 'EXCLUIR' || deleteLoading}
                >
                  {deleteLoading ? 'Aguarde...' : 'Confirmar exclusão'}
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setDeleteModal(false)}
                  disabled={deleteLoading}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
