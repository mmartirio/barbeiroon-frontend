import { useState, useEffect, useRef } from 'react';
import { FiX, FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

const TOK = () => sessionStorage.getItem('gestor_token');

const EMPTY = {
  name: '', title: '', subtitle: '', body: '',
  maxShows: 3, expiresAt: '', isActive: true, imageFile: null, imagePreview: '',
};

function fmtDate(d) {
  if (!d) return '—';
  const [y, m, day] = String(d).split('-');
  return `${day}/${m}/${y}`;
}

/* ── Preview do Banner ─────────────────────────────────────── */
function BannerPreview({ form }) {
  const hasContent = form.title || form.subtitle || form.body || form.imagePreview;
  if (!hasContent) {
    return (
      <div style={{
        border: '2px dashed var(--border)', borderRadius: 16,
        padding: '2rem', textAlign: 'center', color: 'var(--color-muted)',
        fontSize: '0.85rem',
      }}>
        Preencha os campos para ver o preview
      </div>
    );
  }
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden',
      background: '#fff', boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
      maxWidth: 380, margin: '0 auto',
    }}>
      {form.imagePreview && (
        <img src={form.imagePreview} alt="preview" style={{ width: '100%', display: 'block' }} />
      )}
      {(form.title || form.subtitle || form.body) && (
        <div style={{ padding: '1rem 1.25rem', background: '#fff' }}>
          {form.title && (
            <p style={{ fontWeight: 800, fontSize: '1.05rem', color: '#111', margin: '0 0 0.25rem' }}>{form.title}</p>
          )}
          {form.subtitle && (
            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#444', margin: '0 0 0.5rem' }}>{form.subtitle}</p>
          )}
          {form.body && (
            <p style={{ fontSize: '0.85rem', color: '#555', margin: 0, lineHeight: 1.5 }}>{form.body}</p>
          )}
        </div>
      )}
      <div style={{ padding: '0.75rem 1rem', textAlign: 'center', borderTop: '1px solid #eee', background: '#fff' }}>
        <button style={{
          background: '#16a34a', color: '#fff', border: 'none', borderRadius: 99,
          padding: '0.55rem 2rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'default',
        }}>Entendido!</button>
      </div>
    </div>
  );
}

/* ── Modal de criação / edição ─────────────────────────────── */
function AvisoModal({ aviso, onClose, onSaved }) {
  const [form, setForm] = useState(aviso ? {
    name: aviso.name || '',
    title: aviso.title || '',
    subtitle: aviso.subtitle || '',
    body: aviso.body || '',
    maxShows: aviso.maxShows ?? 3,
    expiresAt: aviso.expiresAt || '',
    isActive: aviso.isActive !== false,
    imageFile: null,
    imagePreview: aviso.imageUrl || '',
  } : { ...EMPTY });

  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const fileRef = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    set('imageFile', file);
    const reader = new FileReader();
    reader.onload = ev => set('imagePreview', ev.target.result);
    reader.readAsDataURL(file);
  }

  function removeImage() {
    set('imageFile', null);
    set('imagePreview', '');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function save() {
    if (!form.name.trim()) return setError('Nome do aviso é obrigatório.');
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('title', form.title);
      fd.append('subtitle', form.subtitle);
      fd.append('body', form.body);
      fd.append('maxShows', form.maxShows === '' || form.maxShows == null ? '' : String(form.maxShows));
      fd.append('expiresAt', form.expiresAt || '');
      fd.append('isActive', String(form.isActive));
      if (form.imageFile) fd.append('image', form.imageFile);
      // Sinaliza remoção de imagem se preview foi limpo
      if (!form.imagePreview && !form.imageFile && aviso?.imageUrl) fd.append('imageUrl', '');

      const url = aviso ? `/api/gestor/avisos/${aviso.id}` : '/api/gestor/avisos';
      const method = aviso ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: { Authorization: `Bearer ${TOK()}` }, body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.message || 'Erro ao salvar');
      onSaved(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inp = { className: 'form-input', style: { width: '100%' } };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 900, width: '100%' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{aviso ? 'Editar Aviso' : 'Novo Aviso'}</h3>
          <button className="modal-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* ── Formulário ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

            <div className="form-group">
              <label className="form-label">Nome do Aviso <span style={{ color: '#dc2626' }}>*</span></label>
              <small style={{ color: 'var(--color-muted)', fontSize: '0.72rem', display: 'block', marginBottom: 4 }}>Identificação interna — não aparece no banner</small>
              <input {...inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Promoção Junho 2026" />
            </div>

            <div className="form-group">
              <label className="form-label">Título <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>(opcional)</span></label>
              <input {...inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ex: Novidades do mês!" />
            </div>

            <div className="form-group">
              <label className="form-label">Subtítulo <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>(opcional)</span></label>
              <input {...inp} value={form.subtitle} onChange={e => set('subtitle', e.target.value)} placeholder="Ex: Confira as novidades" />
            </div>

            <div className="form-group">
              <label className="form-label">Parágrafo <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>(opcional)</span></label>
              <textarea {...inp} rows={3} value={form.body} onChange={e => set('body', e.target.value)} placeholder="Texto complementar do banner..." style={{ ...inp.style, resize: 'vertical' }} />
            </div>

            <div className="form-group">
              <label className="form-label">Imagem <span style={{ color: 'var(--color-muted)', fontSize: '0.75rem' }}>(opcional)</span></label>
              {form.imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={form.imagePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 8, display: 'block' }} />
                  <button onClick={removeImage} style={{
                    position: 'absolute', top: 4, right: 4,
                    background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%',
                    width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', cursor: 'pointer',
                  }}><FiX size={12} /></button>
                </div>
              ) : (
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  border: '2px dashed var(--border)', borderRadius: 8, padding: '0.75rem 1rem',
                  cursor: 'pointer', color: 'var(--color-muted)', fontSize: '0.85rem',
                }}>
                  <FiPlus size={16} /> Selecionar imagem
                  <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
                </label>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Máx. de exibições</label>
                <small style={{ color: 'var(--color-muted)', fontSize: '0.72rem', display: 'block', marginBottom: 4 }}>Vazio = ilimitado</small>
                <input {...inp} type="number" min={1} value={form.maxShows ?? ''} onChange={e => set('maxShows', e.target.value === '' ? null : e.target.value)} placeholder="Ex: 3" />
              </div>
              <div className="form-group">
                <label className="form-label">Expirar em</label>
                <small style={{ color: 'var(--color-muted)', fontSize: '0.72rem', display: 'block', marginBottom: 4 }}>Vazio = sem data limite</small>
                <input {...inp} type="date" value={form.expiresAt || ''} onChange={e => set('expiresAt', e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label className="form-label" style={{ margin: 0 }}>Ativo</label>
              <button
                onClick={() => set('isActive', !form.isActive)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: form.isActive ? '#16a34a' : 'var(--bg-input)',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, left: form.isActive ? 22 : 2,
                  width: 20, height: 20, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                {form.isActive ? 'Aviso ativo — será exibido' : 'Aviso inativo — não será exibido'}
              </span>
            </div>

            {error && <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>}
          </div>

          {/* ── Preview ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-muted)', letterSpacing: '0.05em', margin: 0 }}>Preview do Banner</p>
            <BannerPreview form={form} />
            <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: '0.75rem', fontSize: '0.78rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--color)' }}>Regras de exibição:</strong><br />
              {form.maxShows ? `• Desativa após ${form.maxShows}x exibição por usuário` : '• Sem limite de exibições'}<br />
              {form.expiresAt ? `• Expira em ${fmtDate(form.expiresAt)}` : '• Sem data de expiração'}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Salvando...' : aviso ? 'Salvar Alterações' : 'Criar Aviso'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Página principal ──────────────────────────────────────── */
export default function GestorAvisos() {
  const [avisos,   setAvisos]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null); // null | 'new' | aviso object
  const [confirm,  setConfirm]  = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/gestor/avisos', { headers: { Authorization: `Bearer ${TOK()}` } });
    const d = await r.json().catch(() => []);
    setAvisos(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function onSaved(saved) {
    setAvisos(prev => {
      const idx = prev.findIndex(a => a.id === saved.id);
      return idx >= 0 ? prev.map(a => a.id === saved.id ? saved : a) : [saved, ...prev];
    });
    setModal(null);
  }

  async function doDelete() {
    if (!confirm) return;
    setDeleting(true);
    await fetch(`/api/gestor/avisos/${confirm.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${TOK()}` },
    });
    setAvisos(p => p.filter(a => a.id !== confirm.id));
    setConfirm(null);
    setDeleting(false);
  }

  async function toggleActive(aviso) {
    const fd = new FormData();
    fd.append('isActive', String(!aviso.isActive));
    const r = await fetch(`/api/gestor/avisos/${aviso.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${TOK()}` },
      body: fd,
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) setAvisos(p => p.map(a => a.id === aviso.id ? { ...a, isActive: d.isActive } : a));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Avisos</h2>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Banners exibidos no painel do barbeiro após o login</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={() => setModal('new')}>
          <FiPlus size={15} /> Novo Aviso
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Carregando...</p>
      ) : avisos.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-muted)' }}>
            Nenhum aviso cadastrado. Clique em <strong>Novo Aviso</strong> para criar.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {avisos.map(a => (
            <div key={a.id} className="card">
              <div className="card-body" style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Miniatura */}
                {a.imageUrl && (
                  <img src={a.imageUrl} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
                )}

                {/* Conteúdo */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{a.name}</span>
                    <span className={`badge ${a.isActive ? 'badge-green' : 'badge-gray'}`}>
                      {a.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  {a.title && <p style={{ margin: '0 0 0.15rem', fontSize: '0.85rem', color: 'var(--color)' }}><strong>Título:</strong> {a.title}</p>}
                  {a.subtitle && <p style={{ margin: '0 0 0.15rem', fontSize: '0.85rem', color: 'var(--color-muted)' }}>{a.subtitle}</p>}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                      {a.maxShows ? `Exibe até ${a.maxShows}x por usuário` : 'Sem limite de exibições'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-muted)' }}>
                      {a.expiresAt ? `Expira em ${fmtDate(a.expiresAt)}` : 'Sem data de expiração'}
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button
                    className={`btn btn-sm btn-icon ${a.isActive ? 'btn-ghost' : 'btn-success'}`}
                    title={a.isActive ? 'Desativar' : 'Ativar'}
                    onClick={() => toggleActive(a)}
                  >
                    {a.isActive ? <FiEyeOff size={14} /> : <FiEye size={14} />}
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" title="Editar" onClick={() => setModal(a)}>
                    <FiEdit2 size={14} />
                  </button>
                  <button className="btn btn-danger btn-sm btn-icon" title="Excluir" onClick={() => setConfirm(a)}>
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      {modal && (
        <AvisoModal
          aviso={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      )}

      {/* Confirmação de exclusão */}
      {confirm && (
        <div className="modal-overlay" onClick={() => setConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Excluir Aviso</h3>
              <button className="modal-close" onClick={() => setConfirm(null)}><FiX /></button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir o aviso <strong>"{confirm.name}"</strong>?</p>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>Esta ação não pode ser desfeita.</p>
            </div>
            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button className="btn btn-ghost" onClick={() => setConfirm(null)} disabled={deleting}>Cancelar</button>
              <button className="btn btn-danger" onClick={doDelete} disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
