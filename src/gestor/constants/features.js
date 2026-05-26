export const FEATURE_CATEGORIES = [
    {
        id: 'agendamento',
        label: 'Agendamento',
        icon: '📅',
        features: [
            { key: 'Notificação de horário de indisponibilidade', icon: '🚫', desc: 'Alerta automático quando um profissional fica indisponível no horário agendado' },
            { key: 'Encerramento antecipado',                     icon: '⏹️', desc: 'Permite encerrar o expediente antes do horário previsto com aviso aos clientes' },
            { key: 'Solicitações fora do expediente',             icon: '📨', desc: 'Clientes podem solicitar horários fora do expediente para aprovação' },
        ],
    },
    {
        id: 'promocoes',
        label: 'Promoções',
        icon: '🎁',
        features: [
            { key: 'Promoções por critério',      icon: '🎯', desc: 'Promoções para aniversariantes, após N compras ou serviço específico' },
            { key: 'Desconto fixo ou percentual', icon: '💲', desc: 'Aplica desconto em R$ ou % no valor do serviço' },
            { key: 'Promoção na próxima compra',  icon: '🔄', desc: 'Ativa desconto automaticamente no próximo agendamento do cliente' },
        ],
    },
    {
        id: 'relatorios',
        label: 'Relatórios',
        icon: '📊',
        features: [
            { key: 'Relatórios financeiros',              icon: '💰', desc: 'Relatórios de receita por período (diário, semanal, mensal, anual)' },
            { key: 'Filtros por profissional e status',   icon: '🔎', desc: 'Filtros avançados nos relatórios por profissional e status do agendamento' },
            { key: 'Relatório de comissão por barbeiro',  icon: '💵', desc: 'Controle quanto cada barbeiro faturou e sua comissão individual' },
            { key: 'Dashboard com indicadores',           icon: '📈', desc: 'Visualize principais métricas do negócio em tempo real' },
            { key: 'Relatórios avançados comparativos',   icon: '📊', desc: 'Compare performance entre filiais e períodos' },
        ],
    },
    {
        id: 'permissoes',
        label: 'Grupos e Permissões',
        icon: '🔐',
        features: [
            { key: 'Grupos e permissões personalizadas', icon: '🔐', desc: 'Controle granular de permissões por grupo de usuários' },
        ],
    },
    {
        id: 'gestao',
        label: 'Gestão',
        icon: '⚙️',
        features: [
            { key: 'Gestão de produtos (estoque/vendas)', icon: '🧴', desc: 'Cadastre produtos vendidos na barbearia e controle estoque' },
            { key: 'Lembrete automático (disparo)',        icon: '🔔', desc: 'Cliente recebe lembrete automático no WhatsApp antes do horário' },
            { key: 'Múltiplas filiais (unidades)',         icon: '🏪', desc: 'Gerencie mais de uma unidade no mesmo app' },
            { key: 'Suporte prioritário (chat/WhatsApp)',  icon: '🎧', desc: 'Atendimento prioritário via chat e WhatsApp dedicado' },
        ],
    },
];

export const FEATURES_MAP = Object.fromEntries(
    FEATURE_CATEGORIES.flatMap(c => c.features.map(f => [f.key, { ...f, category: c.label, categoryIcon: c.icon }]))
);

export const ALL_FEATURE_KEYS = FEATURE_CATEGORIES.flatMap(c => c.features.map(f => f.key));

// Recursos incluídos automaticamente em todos os planos (não aparecem no seletor)
export const AUTO_FEATURE_KEYS = [
    'Agendamento pelo painel',
    'Agendamento online por clientes',
    'Validação de conflito de horário',
    'Configuração de expediente',
    'Clientes agendados por período',
    'Cadastro de clientes',
    'Lista e busca de clientes',
    'Histórico do cliente',
    'Cadastro de serviços',
    'Lista e filtro de serviços',
    'Notificações WhatsApp para a barbearia',
    'Confirmação WhatsApp para o cliente',
    'Alertas de solicitações pendentes',
    'Múltiplos usuários e profissionais',
    'Upload de logo e imagem de fundo',
    'Dados da empresa editáveis',
];

// Mapeamento de nomes amigáveis para os recursos automáticos (quando precisar exibir)
export const AUTO_FEATURES_MAP = {
    'Agendamento pelo painel': { icon: '📋', desc: 'Agende serviços diretamente pelo painel administrativo' },
    'Agendamento online por clientes': { icon: '🌐', desc: 'Clientes agendam pelo site ou app' },
    'Validação de conflito de horário': { icon: '✓', desc: 'Evita duplicidade de agendamentos' },
    'Configuração de expediente': { icon: '⏰', desc: 'Defina horários de funcionamento' },
    'Clientes agendados por período': { icon: '📆', desc: 'Visualize agendamentos por dia/semana/mês' },
    'Cadastro de clientes': { icon: '👤', desc: 'Cadastre e gerencie seus clientes' },
    'Lista e busca de clientes': { icon: '🔍', desc: 'Busque clientes por nome, telefone ou histórico' },
    'Histórico do cliente': { icon: '📜', desc: 'Veja todos os serviços e agendamentos anteriores' },
    'Cadastro de serviços': { icon: '✂️', desc: 'Cadastre serviços, preços e duração' },
    'Lista e filtro de serviços': { icon: '📋', desc: 'Organize e filtre serviços por categoria' },
    'Notificações WhatsApp para a barbearia': { icon: '📱', desc: 'Receba notificações de novos agendamentos' },
    'Confirmação WhatsApp para o cliente': { icon: '✅', desc: 'Cliente confirma agendamento via WhatsApp' },
    'Alertas de solicitações pendentes': { icon: '⚠️', desc: 'Notificações de agendamentos pendentes' },
    'Múltiplos usuários e profissionais': { icon: '👥', desc: 'Adicione vários barbeiros na mesma conta' },
    'Upload de logo e imagem de fundo': { icon: '🖼️', desc: 'Personalize sua barbearia com logo e capa' },
    'Dados da empresa editáveis': { icon: '✏️', desc: 'Altere nome, endereço, contato e horários' },
};

// Planos padrão para preenchimento rápido
export const DEFAULT_PLANS = {
    'Grátis': {
        name: 'Grátis',
        description: 'Plano gratuito para você testar o sistema sem compromisso. Ideal para barbeiro autônomo que está começando.',
        priceMonthly: 0,
        priceAnnual: 0,
        maxUsers: 1,
        maxAppointments: 100,
        trialMonths: null,
        sortOrder: 0,
        features: [], // Não precisa adicionar features extras além das AUTO_FEATURE_KEYS
    },
    'Básico': {
        name: 'Básico',
        description: 'Ideal para barbearia de pequeno porte com até 2 barbeiros e fluxo moderado de clientes. Por menos de R$ 2 por dia, organize sua agenda e reduza faltas.',
        priceMonthly: 49.90,
        priceAnnual: 499,
        maxUsers: 2,
        maxAppointments: 700,
        trialMonths: null,
        sortOrder: 1,
        features: [], // Básico tem apenas as features automáticas
    },
    'Essencial': {
        name: 'Essencial',
        description: '⭐ MAIS VENDIDO ⭐ Ideal para barbearia em crescimento com até 5 barbeiros. Controle comissões, estoque e aumente seu faturamento.',
        priceMonthly: 89.90,
        priceAnnual: 899,
        maxUsers: 5,
        maxAppointments: 1400,
        trialMonths: null,
        sortOrder: 2,
        features: [
            'Relatório de comissão por barbeiro',
            'Gestão de produtos (estoque/vendas)',
            'Lembrete automático (disparo)',
            'Dashboard com indicadores',
        ],
    },
    'Premium': {
        name: 'Premium',
        description: '👑 Ideal para redes ou barbearias de grande porte com até 8 barbeiros e atendimento ilimitado. Suporte prioritário e múltiplas filiais.',
        priceMonthly: 139.90,
        priceAnnual: 1399,
        maxUsers: 8,
        maxAppointments: null, // null = ilimitado
        trialMonths: null,
        sortOrder: 3,
        features: [
            'Relatório de comissão por barbeiro',
            'Gestão de produtos (estoque/vendas)',
            'Lembrete automático (disparo)',
            'Dashboard com indicadores',
            'Múltiplas filiais (unidades)',
            'Suporte prioritário (chat/WhatsApp)',
            'Relatórios avançados comparativos',
        ],
    },
};