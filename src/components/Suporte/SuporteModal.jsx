import { useState, useRef, useEffect } from 'react';
import { FiX, FiSend, FiMessageCircle } from 'react-icons/fi';
import s from './SuporteModal.module.css';

const tok = () => sessionStorage.getItem('token');

const CATEGORIES = [
  { key: 'login',        label: '🔑 Não consigo fazer login' },
  { key: 'whatsapp',     label: '📱 WhatsApp não conecta' },
  { key: 'agendamento',  label: '📅 Problema com agendamentos' },
  { key: 'clientes',     label: '👥 Clientes / Usuários' },
  { key: 'configuracoes',label: '⚙️ Configurações do sistema' },
  { key: 'pagamento',    label: '💳 Pagamento / Cobrança' },
  { key: 'other',        label: '🔧 Outro problema' },
];

const FAQ = {
  login: [
    { sender: 'bot', content: 'Vou te ajudar com o problema de login. Verifique os itens abaixo:' },
    { sender: 'bot', content: '✅ Você está usando o e-mail correto?\n✅ O Caps Lock está desativado?\n✅ Tentou clicar em "Esqueceu sua senha?" na tela de login?' },
    { sender: 'bot', content: 'Se ainda não acessou, seu administrador pode ter desativado seu usuário. Peça para ele verificar em Usuários > Lista de Usuários.' },
  ],
  whatsapp: [
    { sender: 'bot', content: 'Para reconectar o WhatsApp, siga os passos:' },
    { sender: 'bot', content: '1️⃣ No menu lateral, vá em Conta > QR Code WhatsApp\n2️⃣ Clique em "Atualizar" para gerar um novo QR Code\n3️⃣ Abra o WhatsApp no celular → Aparelhos Conectados → Conectar dispositivo\n4️⃣ Escaneie o QR Code' },
    { sender: 'bot', content: 'Alternativa: use a aba "Código" e informe o número do celular para receber um código de 8 dígitos.' },
  ],
  agendamento: [
    { sender: 'bot', content: 'Para problemas com agendamentos, verifique:' },
    { sender: 'bot', content: '✅ O expediente está configurado? (Agenda > Expediente)\n✅ Há horários disponíveis no dia selecionado?\n✅ O profissional está ativo no sistema?\n✅ O cliente está acessando o link correto da barbearia?' },
    { sender: 'bot', content: 'Se o agendamento não aparece na lista, tente atualizar a página e verificar o filtro de data.' },
  ],
  clientes: [
    { sender: 'bot', content: 'Para cadastrar ou gerenciar clientes e usuários:' },
    { sender: 'bot', content: '👥 Clientes: use o menu Clientes > Cadastro\n👤 Usuários/Barbeiros: use o menu Usuários > Cadastrar\n🔐 Para definir permissões, configure os Grupos em Usuários > Grupo' },
    { sender: 'bot', content: 'Para remover um usuário do sistema, vá em Usuários > Lista de Usuários e use o botão de desativar ou excluir.' },
  ],
  configuracoes: [
    { sender: 'bot', content: 'Para configurações do sistema:' },
    { sender: 'bot', content: '🏪 Dados da barbearia: menu Conta\n🎨 Tela do cliente: menu Clientes > Tela do Cliente\n📋 Serviços: menu Serviços\n⏰ Horários: menu Agenda > Expediente' },
    { sender: 'bot', content: 'Todas as configurações ficam salvas automaticamente após clicar em Salvar.' },
  ],
  pagamento: [
    { sender: 'bot', content: 'Questões de pagamento e cobrança são tratadas diretamente com nossa equipe.' },
    { sender: 'bot', content: '💳 Para verificar sua mensalidade, plano ou forma de pagamento, precisamos abrir um chamado para você ser atendido pessoalmente.' },
  ],
  other: [
    { sender: 'bot', content: 'Entendido! Para outros problemas não listados, vou abrir um chamado para nossa equipe te atender.' },
  ],
};

export default function SuporteModal({ onClose }) {
  const [phase, setPhase]         = useState('category'); // category | faq | resolved | ticket | done
  const [category, setCategory]   = useState(null);
  const [messages, setMessages]   = useState([
    { sender: 'bot', content: 'Olá! 👋 Sou o assistente do Barbeiro ON. Como posso te ajudar hoje?' },
  ]);
  const [description, setDesc]    = useState('');
  const [ticketId, setTicketId]   = useState(null);
  const [sending, setSending]     = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const addMsg = (msg) => setMessages(prev => [...prev, msg]);

  const selectCategory = (cat) => {
    setCategory(cat);
    addMsg({ sender: 'user', content: cat.label });
    const faqMsgs = FAQ[cat.key] || FAQ.other;
    let delay = 400;
    faqMsgs.forEach(m => {
      setTimeout(() => addMsg(m), delay);
      delay += 600;
    });
    setTimeout(() => {
      if (cat.key === 'pagamento' || cat.key === 'other') {
        setPhase('ticket');
        addMsg({ sender: 'bot', content: 'Por favor, descreva seu problema em detalhes para abrir o chamado:' });
      } else {
        setPhase('resolved');
        addMsg({ sender: 'bot', content: 'Essas orientações resolveram seu problema?' });
      }
    }, delay + 400);
    setPhase('waiting');
  };

  const handleResolved = (yes) => {
    if (yes) {
      addMsg({ sender: 'user', content: 'Sim, problema resolvido!' });
      addMsg({ sender: 'bot', content: '✅ Ótimo! Fico feliz em ter ajudado. Se precisar de mais alguma coisa, estou aqui.' });
      setPhase('done');
    } else {
      addMsg({ sender: 'user', content: 'Não, ainda preciso de ajuda.' });
      addMsg({ sender: 'bot', content: 'Sem problema! Vou abrir um chamado para nossa equipe te atender. Descreva seu problema com mais detalhes:' });
      setPhase('ticket');
    }
  };

  const submitTicket = async () => {
    if (!description.trim()) return;
    setSending(true);
    addMsg({ sender: 'user', content: description });
    try {
      const chatHistory = messages
        .filter(m => m.sender === 'bot')
        .map(m => ({ sender: 'bot', content: m.content }));

      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
        body: JSON.stringify({ category: category?.key || 'other', description, chatHistory }),
      });
      const d = await res.json();
      const id = d.ticket?.id;
      setTicketId(id);

      addMsg({
        sender: 'bot',
        content: `✅ Chamado #${id} aberto com sucesso!\n\nNossa equipe foi notificada via WhatsApp e entrará em contato em breve.`,
      });
      setPhase('done');
      setDesc('');
    } catch {
      addMsg({ sender: 'bot', content: '❌ Erro ao abrir chamado. Tente novamente.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <FiMessageCircle size={18} />
            <span>Suporte Barbeiro ON</span>
          </div>
          <button className={s.closeBtn} onClick={onClose} title="Fechar">
            <FiX size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className={s.body}>
          {messages.map((m, i) => (
            <div key={i} className={`${s.bubble} ${s[m.sender]}`}>
              <p className={s.bubbleText}>{m.content}</p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Actions */}
        <div className={s.footer}>
          {phase === 'category' && (
            <div className={s.categories}>
              {CATEGORIES.map(c => (
                <button key={c.key} className={s.catBtn} onClick={() => selectCategory(c)}>
                  {c.label}
                </button>
              ))}
            </div>
          )}

          {phase === 'resolved' && (
            <div className={s.resolvedBtns}>
              <button className={s.btnYes} onClick={() => handleResolved(true)}>✅ Sim, resolveu!</button>
              <button className={s.btnNo}  onClick={() => handleResolved(false)}>❌ Não, preciso de ajuda</button>
            </div>
          )}

          {phase === 'ticket' && (
            <div className={s.ticketForm}>
              <textarea
                className={s.textarea}
                placeholder="Descreva seu problema em detalhes..."
                value={description}
                onChange={e => setDesc(e.target.value)}
                rows={3}
              />
              <button className={s.sendBtn} onClick={submitTicket} disabled={sending || !description.trim()}>
                {sending ? 'Enviando...' : <><FiSend size={14} /> Abrir chamado</>}
              </button>
            </div>
          )}

          {phase === 'done' && (
            <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--color-muted)', fontSize: '0.8rem' }}>
              Conversa encerrada. Obrigado pelo contato!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
