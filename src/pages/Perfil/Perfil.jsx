import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../context/AuthContext';

const tok = () => sessionStorage.getItem('token');

export default function Perfil() {
  const { user } = useAuth();
  const [name,    setName]    = useState('');
  const [email,   setEmail]   = useState('');
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [conPass, setConPass] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  const userId = user?.id;
  const avatarLetter = useMemo(() => String(name || '?').trim().charAt(0).toUpperCase(), [name]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!name.trim() || !email.trim()) { setError('Preencha nome e e-mail'); return; }
    if (newPass || conPass || curPass) {
      if (!curPass) { setError('Informe a senha atual para alterar a senha'); return; }
      if (newPass.length < 6) { setError('A nova senha deve ter mínimo 6 caracteres'); return; }
      if (newPass !== conPass) { setError('A confirmação da senha não confere'); return; }
    }
    if (!userId) { setError('Usuário não identificado'); return; }
    setSaving(true);
    try {
      const updateRes = await fetch(`/api/user/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });
      const updateD = await updateRes.json().catch(() => ({}));
      if (!updateRes.ok) throw new Error(updateD.message || 'Erro ao atualizar perfil');

      if (newPass) {
        const passRes = await fetch(`/api/user/${userId}/password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
          body: JSON.stringify({ currentPassword: curPass, newPassword: newPass }),
        });
        const passD = await passRes.json().catch(() => ({}));
        if (!passRes.ok) throw new Error(passD.message || 'Erro ao atualizar senha');
      }

      setCurPass(''); setNewPass(''); setConPass('');
      setSuccess('Perfil atualizado com sucesso!');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <Layout title="Meu Perfil">
      <div style={{ maxWidth: 480 }}>
        {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

        <form className="card" onSubmit={handleSave}>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Avatar */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent)', border: '2px solid #60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700 }}>
                {avatarLetter}
              </div>
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>{name || 'Usuário'}</p>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.85rem' }}>{email || '—'}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Nome</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Nome" />
            </div>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" />
            </div>

            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.75rem' }}>Deixe em branco para não alterar a senha</p>
              <div className="form-group">
                <label className="form-label">Senha atual</label>
                <input className="form-input" type="password" value={curPass} onChange={e => setCurPass(e.target.value)} placeholder="Senha atual" />
              </div>
              <div className="form-group">
                <label className="form-label">Nova senha</label>
                <input className="form-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mín. 6 caracteres" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar nova senha</label>
                <input className="form-input" type="password" value={conPass} onChange={e => setConPass(e.target.value)} placeholder="Repita a nova senha" />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
