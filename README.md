# 🏋️‍♂️ VnFitness — Aplicativo de Fitness e Nutrição com IA

Sistema completo de fitness e nutrição com inteligência artificial generativa (**Google Gemini**), banco de dados relacional e autenticação com **Supabase** (PostgreSQL + RLS + Storage) e front-end responsivo moderno construído exclusivamente em **HTML5**, **CSS3 puro** (Flexbox & CSS Grid) e **JavaScript Vanilla**.

---

## 🎨 Referências Visuais Implementadas

| Arquivo de Referência | Aplicação no VnFitness |
| :--- | :--- |
| `login.png` | Tela de autenticação em `index.html` com glassmorphism translúcido (`backdrop-filter`), gradiente neon fitness, card flutuante arredondado e botões sociais circulares. |
| `telas.jpg` | Tema Claro no app mobile (`app.html`), tons pastéis, verdes menta, anéis de atividade concêntricos (calorias, minutos, passos), cartões de refeições e cálculo de macronutrientes. |
| `Tela de evolução.png` | Tema Dark Moderno no app mobile (`app.html`), fundos escuros com contrastes em laranja neon, gráfico de área iluminado com projeção futura da IA, heatmap de 13 semanas estilo GitHub e botão central flutuante de check-in. |
| `DashBoard.jpg` | Painel Administrativo desktop "Forja" em `admin.html`: sidebar escura, cards de KPIs com métricas de retenção, tabela com motivos gerados por IA, score de risco de cancelamento e disparo de mensagem no WhatsApp. |

---

## 🚀 Estrutura do Projeto

```
VnFitness/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.ts         # Cliente Supabase & Service Role
│   │   │   └── gemini.ts           # Inicialização do Google GenAI
│   │   ├── controllers/
│   │   │   ├── authController.ts   # Login e cadastro
│   │   │   ├── coachIAController.ts# Cálculo de IMC e geração de treino/dieta com IA
│   │   │   ├── adminController.ts  # CRUD de usuários, aprovação, KPIs e fotos
│   │   │   └── userController.ts   # Perfil, evolução e check-ins do aluno
│   │   ├── middleware/
│   │   │   └── authMiddleware.ts   # RLS no backend, bloqueio de pendentes e admin único
│   │   ├── services/
│   │   │   ├── geminiCoachService.ts # Prompt estruturado do Coach IA
│   │   │   └── churnPredictorService.ts # IA de Retenção e mensagens de WhatsApp
│   │   ├── routes/index.ts         # Centralização de endpoints REST
│   │   └── server.ts               # Servidor Express com entrega dos arquivos estáticos
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── database/
│   └── schema.sql                  # DDL completo do Supabase com RLS e Admin Único
└── frontend/
    ├── css/
    │   ├── base.css                # Variáveis :root (Temas Claro & Dark), reset, flex/grid
    │   ├── auth.css                # Estilo Glassmorphism fiel a login.png
    │   ├── app.css                 # Estilos mobile, anéis, gráfico de carga e heatmap
    │   └── admin.css               # Grid Desktop Forja fiel a DashBoard.jpg
    ├── js/
    │   ├── api.js                  # Wrapper HTTP com JWT
    │   ├── auth.js                 # Lógica de login/cadastro
    │   ├── app.js                  # Lógica do aluno, cálculo de IMC e Coach IA
    │   └── admin.js                # Lógica do painel Forja e WhatsApp
    ├── index.html                  # Tela de Login / Cadastro
    ├── app.html                    # Interface do Aluno
    └── admin.html                  # Painel Administrativo Desktop
```

---

## ⚙️ Configuração Passo a Passo

### 1. Banco de Dados e Supabase
1. Crie um projeto no [Supabase](https://supabase.com).
2. Vá até o **SQL Editor** do Supabase.
3. Cole e execute todo o conteúdo do arquivo [`database/schema.sql`](file:///c:/Users/freds/OneDrive/Documentos/VnFitness/database/schema.sql).
4. O script já cria:
   - As tabelas: `usuarios`, `dados_biometricos`, `treinos`, `planos_nutricionais`, `checkins_treino`, `insights_retencao_ia`.
   - As políticas de segurança RLS garantindo que **apenas `fredsoncitty@gmail.com`** seja Admin.
   - A regra de bloqueio que mantém novos cadastros no status `pendente` até aprovação no painel admin.
   - Os buckets de imagens: `avatars`, `evolucao` e `exercicios`.

### 2. Configurar Variáveis de Ambiente
Na pasta `backend/`, duplique o arquivo `.env.example` para `.env`:
```bash
cd backend
cp .env.example .env
```
Preencha as chaves:
```env
PORT=3000
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
GEMINI_API_KEY=sua-chave-gemini-gratuita
ADMIN_EMAIL=fredsoncitty@gmail.com
```

### 3. Instalar Dependências e Iniciar o Servidor
```bash
cd backend
npm install
npm run dev
```

O servidor iniciará na porta `3000` servindo a API e todo o front-end:
- **Tela de Login / Cadastro**: `http://localhost:3000/index.html`
- **App do Aluno**: `http://localhost:3000/app.html`
- **Painel Administrativo Forja**: `http://localhost:3000/admin.html`

---

## 🔒 Credenciais do Administrador Único
- **E-mail**: `fredsoncitty@gmail.com`
- **Senha**: `SophiA27`

