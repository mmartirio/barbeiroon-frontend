import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';

const tok = () => sessionStorage.getItem('token');

const compressToBase64 = (file, maxBytes = 100_000) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 500;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round((height * MAX_DIM) / width); width = MAX_DIM; }
          else                { width  = Math.round((width  * MAX_DIM) / height); height = MAX_DIM; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas não suportado')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.7;
        let result;
        do {
          result = canvas.toDataURL('image/jpeg', quality);
          quality -= 0.1;
        } while (result.length > maxBytes * 1.37 && quality > 0.05);
        resolve(result);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

export default function UsuarioCadastro() {
  const navigate = useNavigate();
  const [groups,  setGroups]  = useState([]);
  const [form,    setForm]    = useState({ name: '', email: '', password: '', groupId: '', isBarber: false, photo: null });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  useEffect(() => {
    fetch('/api/group?limit=100', { headers: { Authorization: `Bearer ${tok()}` } })
      .then(r => r.json()).catch(() => ({}))
      .then(d => setGroups(d.groups || d.data || []));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.name.trim())  { setError('Nome obrigatório'); return; }
    if (!form.email.trim()) { setError('E-mail obrigatório'); return; }
    if (!form.password)     { setError('Senha obrigatória'); return; }
    if (form.password.length < 6) { setError('Senha deve ter mínimo 6 caracteres'); return; }
    setLoading(true);
    try {
      // Enviar como multipart/form-data se houver foto, senão enviar JSON
      let res;
      if (form.photo) {
        const base64 = await compressToBase64(form.photo);
        const body = {
          name:     form.name.trim(),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
          isBarber: form.isBarber,
          ...(form.groupId ? { groupId: Number(form.groupId) } : {}),
          profileImageBase64:       base64,
          profileImageContentType:  form.photo.type || 'image/jpeg',
        };
        res = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify(body),
        });
      } else {
        const body = {
          name:     form.name.trim(),
          email:    form.email.trim().toLowerCase(),
          password: form.password,
          isBarber: form.isBarber,
          ...(form.groupId ? { groupId: Number(form.groupId) } : {}),
        };
        res = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify(body),
        });
      }
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.message || 'Erro ao cadastrar');
      setSuccess('Usuário cadastrado com sucesso!');
      setForm({ name: '', email: '', password: '', groupId: '', isBarber: false, photo: null });
      setPreview('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Layout title="Cadastrar Usuário">
      <div style={{ maxWidth: 480 }}>
        {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <label htmlFor="photo" style={{ width: 96, height: 96, borderRadius: 999, overflow: 'hidden', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                {preview ? (
                  <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#9CA3AF' }}>Foto</div>
                )}
              </label>
              <input id="photo" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                const f = e.target.files && e.target.files[0];
                if (f) {
                  if (preview) URL.revokeObjectURL(preview);
                  set('photo', f);
                  const url = URL.createObjectURL(f);
                  setPreview(url);
                } else {
                  set('photo', null);
                  if (preview) { URL.revokeObjectURL(preview); setPreview(''); }
                }
              }} />
              {preview && <button type="button" className="btn btn-ghost" onClick={() => { set('photo', null); if (preview) { URL.revokeObjectURL(preview); setPreview(''); } }}>Remover</button>}
            </div>
            <div className="form-group">
              <label className="form-label">Nome *</label>
              <input className="form-input" placeholder="Nome completo" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail *</label>
              <input className="form-input" type="email" placeholder="email@exemplo.com" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Senha *</label>
              <input className="form-input" type="password" placeholder="Mín. 6 caracteres" value={form.password} onChange={e => set('password', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Grupo</label>
              <select className="form-input" value={form.groupId} onChange={e => set('groupId', e.target.value)}>
                <option value="">Sem grupo</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input type="checkbox" id="isBarber" checked={form.isBarber} onChange={e => set('isBarber', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
              <label htmlFor="isBarber" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>É barbeiro</label>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => navigate('/usuario-lista')}>Cancelar</button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Salvando...' : 'Cadastrar'}</button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}
