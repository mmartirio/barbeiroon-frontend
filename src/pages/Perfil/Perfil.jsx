import React, { useState } from 'react';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../hooks/useAuth';

const tok = () => sessionStorage.getItem('token');
const BASE = '/api';

export default function Perfil() {
  const { user } = useAuth();

  const [info,    setInfo]    = useState({ name: user?.name || '', email: user?.email || '' });
  const [pass,    setPass]    = useState({ current: '', next: '', confirm: '' });
  const [saving1, setSaving1] = useState(false);
  const [saving2, setSaving2] = useState(false);
  const [msg1,    setMsg1]    = useState({ type: '', text: '' });
  const [msg2,    setMsg2]    = useState({ type: '', text: '' });

  const setI = (k, v) => setInfo(p => ({ ...p, [k]: v }));
  const setP = (k, v) => setPass(p => ({ ...p, [k]: v }));

  const saveInfo = async (e) => {
    e.preventDefault(); setMsg1({ type: '', text: '' });
    if (!info.name.trim()) { setMsg1({ type: 'error', text: 'Nome obrigatório' }); return; }
    setSaving1(true);
    try {
      const res = await fetch(`${BASE}/user/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ name: info.name, email: info.email }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro ao salvar'); }
      setMsg1({ type: 'success', text: 'Dados atualizados com sucesso!' });
    } catch (err) { setMsg1({ type: 'error', text: err.message }); }
    finally { setSaving1(false); }
  };

  const savePass = async (e) => {
    e.preventDefault(); setMsg2({ type: '', text: '' });
    if (!pass.current || !pass.next) { setMsg2({ type: 'error', text: 'Preencha todos os campos' }); return; }
    if (pass.next !== pass.confirm)  { setMsg2({ type: 'error', text: 'As senhas não coincidem' }); return; }
    if (pass.next.length < 6)        { setMsg2({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres' }); return; }
    setSaving2(true);
    try {
      const res = await fetch(`${BASE}/user/${user.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ currentPassword: pass.current, newPassword: pass.next }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Erro ao alterar senha'); }
      setMsg2({ type: 'success', text: 'Senha alterada com sucesso!' });
      setPass({ current: '', next: '', confirm: '' });
    } catch (err) { setMsg2({ type: 'error', text: err.message }); }
    finally { setSaving2(false); }
  };

  return (
    <Layout title="Meu Perfil">
      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Personal info */}
        <form className="card" onSubmit={saveInfo}>
          <div className="card-header"><h3 className="card-title">Informações pessoais</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {msg1.text && <div className={`alert alert-${msg1.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '0.75rem' }}>{msg1.text}</div>}
            <div className="form-field"><label className="form-label">Nome</label><input className="form-input" value={info.name} onChange={e => setI('name', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">E-mail</label><input className="form-input" type="email" value={info.email} onChange={e => setI('email', e.target.value)} /></div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={saving1}>{saving1 ? 'Salvando...' : 'Salvar dados'}</button>
          </div>
        </form>

        {/* Change password */}
        <form className="card" onSubmit={savePass}>
          <div className="card-header"><h3 className="card-title">Alterar senha</h3></div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {msg2.text && <div className={`alert alert-${msg2.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '0.75rem' }}>{msg2.text}</div>}
            <div className="form-field"><label className="form-label">Senha atual</label><input className="form-input" type="password" value={pass.current} onChange={e => setP('current', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Nova senha</label><input className="form-input" type="password" value={pass.next} onChange={e => setP('next', e.target.value)} /></div>
            <div className="form-field"><label className="form-label">Confirmar nova senha</label><input className="form-input" type="password" value={pass.confirm} onChange={e => setP('confirm', e.target.value)} /></div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }} disabled={saving2}>{saving2 ? 'Alterando...' : 'Alterar senha'}</button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
