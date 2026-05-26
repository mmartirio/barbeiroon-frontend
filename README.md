# Barbeiro On — Frontend

Interface web do sistema **Barbeiro On**, plataforma SaaS multi-tenant para gestão de barbearias. Construída com React 18 e Webpack 5, hospedada na Vercel.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 |
| Roteamento | React Router DOM v6 |
| Bundler | Webpack 5 |
| Gráficos | Chart.js + react-chartjs-2 |
| Internacionalização | i18next + react-i18next |
| PDF | pdf-lib |
| Ícones | react-icons |
| Calendário | react-calendar |

---

## Estrutura do Projeto

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── administrador/          # Painel do administrador da barbearia
│   │   ├── components/         # Agenda, profissionais, serviços, promoções
│   │   ├── loginAdmin/         # Login e recuperação de senha
│   │   └── painel/             # Dashboard, configurações, conta
│   ├── gestor/                 # Painel super-admin (Barbeiro On)
│   │   ├── dashboard/
│   │   ├── empresas/           # CRUD de barbearias
│   │   ├── planos/             # CRUD de planos
│   │   ├── pagamentos/         # Métodos de pagamento
│   │   ├── admins/             # Gestão de admins
│   │   └── relatorios/
│   ├── components/             # Componentes compartilhados
│   │   ├── agendamento/        # Fluxo de agendamento público
│   │   ├── Layout/
│   │   ├── register/           # Registro de nova barbearia
│   │   └── customer-portal/    # Portal do cliente
│   ├── context/                # AuthContext, ThemeContext
│   ├── hooks/                  # useApi, useAuth, useTheme
│   ├── routes/                 # Configuração de rotas e PrivateRoute
│   ├── utils/                  # Utilitários (feriados, etc.)
│   ├── i18n.js                 # Configuração de idioma
│   ├── App.js
│   ├── index.js
│   └── setupProxy.js           # Proxy para dev (API local)
├── webpack.config.js
└── package.json
```

---

## Pré-requisitos

- Node.js 20

---

## Configuração Local

### 1. Clonar e instalar dependências

```bash
git clone https://github.com/mmartirio/barbeiroon-frontend.git
cd barbeiroon-frontend
npm install
```

### 2. Configurar a URL da API

O frontend usa um proxy em desenvolvimento — edite `src/setupProxy.js` para apontar para o backend local:

```js
// src/setupProxy.js — já configurado por padrão para localhost:3001
```

Em produção, o proxy do webpack aponta para a variável de ambiente `API_PROXY_TARGET`.

### 3. Iniciar em modo desenvolvimento

```bash
npm start
```

O servidor sobe em `http://localhost:3000` e faz proxy de `/api` e `/uploads` para `http://localhost:3001`.

---

## Build para Produção

```bash
npm run build
```

Os arquivos são gerados na pasta `build/` com:
- Bundle minificado e com hash de conteúdo (`bundle-[hash].js`)
- Assets otimizados
- `console.log` removidos (TerserPlugin com `drop_console: true`)
- Code splitting automático (`splitChunks`)

---

## Deploy na Vercel

### 1. Criar conta e conectar repositório

1. Acesse [vercel.com](https://vercel.com) e faça login com GitHub
2. Clique em **Add New → Project**
3. Selecione o repositório `barbeiroon-frontend`
4. Clique em **Import**

### 2. Configurar o projeto na Vercel

Na tela de configuração do projeto:

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Other |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |
| **Install Command** | `npm install` |

### 3. Variáveis de ambiente na Vercel

Acesse **Settings → Environment Variables** e adicione:

| Variável | Valor |
|----------|-------|
| `API_PROXY_TARGET` | `https://api.barbeiroon.com.br` (URL do backend na Locaweb) |
| `NODE_ENV` | `production` |

> **Importante:** substitua `https://api.barbeiroon.com.br` pela URL real do seu backend Nginx/Certbot na Locaweb.

### 4. Configurar rewrite de rotas (SPA)

Como o app usa React Router, todas as rotas devem servir `index.html`. Crie o arquivo `vercel.json` na raiz do projeto:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 5. Deploy

Clique em **Deploy**. A Vercel vai:
1. Instalar dependências (`npm install`)
2. Executar o build (`npm run build`)
3. Servir a pasta `build/`

Após o primeiro deploy, cada `git push origin main` dispara um novo deploy automaticamente.

---

## Domínio Personalizado (Opcional)

1. Acesse **Settings → Domains** no projeto Vercel
2. Adicione seu domínio (ex: `app.barbeiroon.com.br`)
3. Configure o DNS no painel do seu registrador:
   - **Tipo:** CNAME
   - **Nome:** `app`
   - **Valor:** `cname.vercel-dns.com`
4. Aguarde a propagação (~5 min com Vercel DNS)

---

## Fluxo de Autenticação

```
Usuário →  Login (JWT) → AuthContext → PrivateRoute → Painel Admin
                ↓
         Gestor Login → GestorLayout → Painel Gestor (Super Admin)
```

- Tokens JWT são armazenados no `localStorage`
- `PrivateRoute` redireciona para `/login` se não autenticado
- O tenant é identificado pelo slug na URL (ex: `/barbearia-do-joao`)

---

## Páginas e Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Página inicial / agendamento público |
| `/:slug` | Agendamento público da barbearia |
| `/login` | Login do administrador |
| `/admin/*` | Painel do administrador (protegido) |
| `/admin/dashboard` | Dashboard com métricas |
| `/admin/agenda` | Agenda de agendamentos |
| `/admin/clientes` | Lista de clientes |
| `/admin/servicos` | Serviços cadastrados |
| `/admin/profissionais` | Profissionais |
| `/admin/promocoes` | Promoções |
| `/admin/relatorios` | Relatórios |
| `/admin/conta` | Configurações da conta/barbearia |
| `/gestor/login` | Login do super-admin |
| `/gestor/*` | Painel do gestor (protegido) |
| `/register` | Cadastro de nova barbearia |

---

## Internacionalização

O app suporta múltiplos idiomas via `i18next`. Os arquivos de tradução ficam em `src/i18n.js` e podem ser expandidos adicionando novos namespaces.

---

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm start` | Servidor de desenvolvimento (porta 3000) |
| `npm run build` | Build de produção (pasta `build/`) |
| `npm run dev` | Alias para `npm start` |
| `npm run analyze` | Analisa o tamanho do bundle (requer build prévia) |

---

## Integração com o Backend

O frontend se comunica com o backend via HTTP:

- **Desenvolvimento:** proxy automático via webpack-dev-server para `http://localhost:3001`
- **Produção (Vercel):** variável `API_PROXY_TARGET` aponta para a URL do backend na Locaweb

Todas as chamadas à API usam o prefixo `/api/` — o proxy redireciona para o backend sem expor a URL diretamente ao browser.

---

## Licença

Proprietário — todos os direitos reservados.
