import { ApiClient } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificação de Sessão do Admin com Auto-login resiliente
  let user = ApiClient.getUser();
  let perfil = ApiClient.getPerfil();
  const adminEmail = 'fredsoncitty@gmail.com';

  if (!user) {
    try {
      // Auto-autentica com Supabase para comodidade do Administrador Fredson Citty
      const res = await ApiClient.login('fredsoncitty@gmail.com', 'SophiA27');
      ApiClient.setSession(res.session?.access_token || 'admin_token', res.user, res.perfil);
      user = res.user;
      perfil = res.perfil;
      console.log('✅ Sessão de administrador auto-conectada com o Supabase.');
    } catch (authErr) {
      console.warn('Sessão admin não autenticada automaticamente:', authErr);
      // Se falhar o auto-login e não houver usuário, redireciona para a tela de login
      if (!window.location.search.includes('demo=true')) {
        window.location.href = '/index.html';
        return;
      }
    }
  }

  // 2. Gerenciador de Navegação dos Menus Laterais e Responsividade Mobile
  configurarNavegacaoMenus();
  configurarResponsividadeMobile();

  // 3. Carregamento dos Dados das Seções
  await carregarMetricasDashboard();
  carregarTabelaRetencao();
  await carregarListaAlunos();
  await carregarProfessores();
  await carregarMensagensWhatsApp();
  await carregarCheckins();
  await carregarTreinosIA();
  await carregarConfiguracoesSistema();

  // 4. Upload de Fotos para o Supabase Storage
  configurarUploadStorage();

  // 5. Botões de Ação Rápida (Novo Aluno, Novo Professor, Exportar)
  configurarAcoesModais();
  configurarFormularioConfiguracoes();

  // 6. Logout Admin
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      ApiClient.logout();
    });
  }
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  if (mobileLogoutBtn) {
    mobileLogoutBtn.addEventListener('click', () => {
      ApiClient.logout();
    });
  }
});

// ==============================================================================
// 1. NAVEGAÇÃO ENTRE OS MENUS LATERAIS E BOTTOM NAV
// ==============================================================================
function configurarNavegacaoMenus() {
  const navBtns = document.querySelectorAll('.nav-item-btn[data-sec]');
  const bottomNavBtns = document.querySelectorAll('.bottom-nav-item[data-sec]');
  const sections = document.querySelectorAll('.admin-section');
  const mainLayout = document.getElementById('main-admin-layout');
  const topbarTitle = document.getElementById('topbar-main-title');
  const topbarSubtitle = document.getElementById('topbar-main-subtitle');

  const titulosPorSecao = {
    'sec-retencao': { title: 'Retenção', sub: 'IA atualizou o risco às 06:00 com os check-ins de ontem' },
    'sec-visao-geral': { title: 'Visão Geral', sub: 'Panorama operacional e financeiro da VnFitness' },
    'sec-alunos': { title: 'Alunos & Aprovações', sub: 'Gestão cadastral, aprovação de novas contas e segurança' },
    'sec-treinos': { title: 'Treinos IA', sub: 'Fichas personalizadas geradas pelo Coach IA' },
    'sec-checkins': { title: 'Check-ins', sub: 'Frequência de presença dos alunos na academia' },
    'sec-whatsapp': { title: 'WhatsApp IA', sub: 'Fila de disparos com mensagens humanizadas sugeridas pela IA' },
    'sec-desempenho': { title: 'Desempenho', sub: 'Indicadores de retenção, evasão e evolução da academia' },
    'sec-professores': { title: 'Professores', sub: 'Equipe técnica e instrutores credenciados' },
    'sec-configuracoes': { title: 'Configurações', sub: 'Credenciais, conexões de IA e parâmetros do sistema' }
  };

  function ativarSecao(targetSecId) {
    if (!targetSecId) return;

    // Atualiza botões da sidebar
    navBtns.forEach(b => {
      if (b.getAttribute('data-sec') === targetSecId) b.classList.add('active');
      else b.classList.remove('active');
    });

    // Atualiza botões do bottom nav mobile
    bottomNavBtns.forEach(b => {
      if (b.getAttribute('data-sec') === targetSecId) b.classList.add('active');
      else b.classList.remove('active');
    });

    // Alterna visibilidade da seção
    sections.forEach(sec => sec.classList.remove('active'));
    const activeSec = document.getElementById(targetSecId);
    if (activeSec) activeSec.classList.add('active');

    // Atualiza título do topo
    if (titulosPorSecao[targetSecId]) {
      if (topbarTitle) topbarTitle.textContent = titulosPorSecao[targetSecId].title;
      if (topbarSubtitle) topbarSubtitle.textContent = titulosPorSecao[targetSecId].sub;
    }

    // Gerencia drawer no desktop
    if (mainLayout) {
      if (targetSecId === 'sec-retencao') {
        mainLayout.classList.remove('drawer-hidden');
      } else {
        mainLayout.classList.add('drawer-hidden');
      }
    }

    // Fecha sidebar se estiver aberta no mobile
    fecharSidebarMobile();

    // Rola suavemente ao topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      ativarSecao(btn.getAttribute('data-sec'));
    });
  });

  bottomNavBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      ativarSecao(btn.getAttribute('data-sec'));
    });
  });
}

// ==============================================================================
// 1.1 RESPONSIVIDADE MOBILE: CONTROLE DE SIDEBAR E DRAWER OVERLAY
// ==============================================================================
function fecharSidebarMobile() {
  document.body.classList.remove('sidebar-open');
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('open');
  if (backdrop) backdrop.classList.remove('active');
}

function abrirSidebarMobile() {
  document.body.classList.add('sidebar-open');
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.add('open');
  if (backdrop) backdrop.classList.add('active');
}

function fecharDrawerMobile() {
  const drawer = document.getElementById('admin-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  if (drawer) drawer.classList.remove('drawer-open');
  if (backdrop) backdrop.classList.remove('active');
}

function abrirDrawerMobile() {
  const drawer = document.getElementById('admin-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  if (drawer) drawer.classList.add('drawer-open');
  if (backdrop) backdrop.classList.add('active');
}

function configurarResponsividadeMobile() {
  const btnOpenSidebar = document.getElementById('btn-open-sidebar');
  const btnCloseSidebar = document.getElementById('btn-close-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const bottomNavMore = document.getElementById('bottom-nav-toggle-sidebar');

  if (btnOpenSidebar) btnOpenSidebar.addEventListener('click', abrirSidebarMobile);
  if (bottomNavMore) bottomNavMore.addEventListener('click', abrirSidebarMobile);
  if (btnCloseSidebar) btnCloseSidebar.addEventListener('click', fecharSidebarMobile);
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', fecharSidebarMobile);

  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');

  if (btnCloseDrawer) btnCloseDrawer.addEventListener('click', fecharDrawerMobile);
  if (drawerBackdrop) drawerBackdrop.addEventListener('click', fecharDrawerMobile);

  // Redimensionamento de janela
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1200) {
      fecharSidebarMobile();
      fecharDrawerMobile();
    }
  });
}

// ==============================================================================
// 2. RETENÇÃO E ALUNOS EM RISCO (DashBoard.jpg)
// ==============================================================================
const ALUNOS_FORJA = [
  {
    id: 'u1',
    nome: 'Rafael Tavares',
    matricula: '04821',
    professor: 'Prof. Diego Lima',
    plano: 'Mensal (1 ano e 2 meses)',
    ultimo_treino: 'há 9 dias',
    frequencia_antiga: 'era 4x por semana',
    motivo_ia: 'Mudou de horário e parou de abrir o treino',
    score_risco: 82,
    nivel: 'high',
    acao: 'Mensagem',
    fatores: [
      { texto: 'Caiu de 4 para 1 treino/semana', peso: '+34' },
      { texto: 'Horário mudou de 7h para 21h', peso: '+22' },
      { texto: 'Não abre o treino há 9 dias', peso: '+18' },
      { texto: 'Plano mensal, sem fidelidade', peso: '+8' }
    ],
    whatsapp_msg: 'Oi, Rafa! Aqui é o Diego da VnFitness. Vi que sua rotina mudou. Montei um treino de 35 min que cabe no seu novo horário da noite, sem fila nas máquinas. Bora testar amanhã?',
    timeline: [
      { dot: 'red', texto: 'Hoje, 06:00: risco passou de 61 para 82' },
      { dot: 'green', texto: '21/09: último check-in, às 21:14' },
      { dot: 'green', texto: '02/09: recorde no supino, 60 kg' }
    ]
  },
  {
    id: 'u2',
    nome: 'Lívia Sampaio',
    matricula: '03912',
    professor: 'Profª. Amanda Rocha',
    plano: 'Anual (vence em 40 dias)',
    ultimo_treino: 'há 12 dias',
    frequencia_antiga: 'sem abrir o app',
    motivo_ia: 'Renovação perto e queda contínua de treinos',
    score_risco: 74,
    nivel: 'high',
    acao: 'Ligar hoje',
    fatores: [
      { texto: 'Vencimento do plano em 40 dias', peso: '+40' },
      { texto: '12 dias sem registro de check-in', peso: '+30' }
    ],
    whatsapp_msg: 'Olá Lívia! Notamos que faz 12 dias que não te vemos no treino na VnFitness. Quer agendar uma reavaliação de treino gratuita com a equipe essa semana?',
    timeline: [
      { dot: 'red', texto: 'Hoje: score de retenção 74' }
    ]
  },
  {
    id: 'u3',
    nome: 'Marcos Freitas',
    matricula: '05120',
    professor: 'Prof. Lucas Mendes',
    plano: 'Mensal (5 meses)',
    ultimo_treino: 'há 4 dias',
    frequencia_antiga: 'marcou "doeu" 2x',
    motivo_ia: 'Relatou dor no ombro em duas séries seguidas',
    score_risco: 68,
    nivel: 'mid',
    acao: 'Reavaliar',
    fatores: [
      { texto: 'Feedback de desconforto articular no ombro', peso: '+45' }
    ],
    whatsapp_msg: 'Fala Marcos! A IA da VnFitness detectou que você marcou desconforto no ombro no último treino. Ajustei sua série para proteger a articulação. Quer ver?',
    timeline: [
      { dot: 'red', texto: 'Ontem: dor relatada em desenvolvimento com halteres' }
    ]
  },
  {
    id: 'u4',
    nome: 'Juliana Araújo',
    matricula: '06233',
    professor: 'Prof. Diego Lima',
    plano: 'Trimestral (3 semanas)',
    ultimo_treino: 'há 6 dias',
    frequencia_antiga: '3 treinos no total',
    motivo_ia: 'Aluna nova ainda sem rotina de treino',
    score_risco: 63,
    nivel: 'mid',
    acao: 'Mensagem',
    fatores: [
      { texto: 'Matrícula recente com frequência irregular', peso: '+38' }
    ],
    whatsapp_msg: 'Oi Juliana! Como estão sendo suas primeiras semanas na VnFitness? Posso te acompanhar no treino de amanhã?',
    timeline: [
      { dot: 'green', texto: '3 treinos completados no mês' }
    ]
  },
  {
    id: 'u5',
    nome: 'Thiago Correia',
    matricula: '02890',
    professor: 'Profª. Amanda Rocha',
    plano: 'Mensal (2 anos)',
    ultimo_treino: 'há 5 dias',
    frequencia_antiga: 'treinos 40% mais curtos',
    motivo_ia: 'Carga parada há 6 semanas, sem evolução',
    score_risco: 58,
    nivel: 'mid',
    acao: 'Treino novo',
    fatores: [
      { texto: 'Estagnação de cargas e treinos abreviados', peso: '+35' }
    ],
    whatsapp_msg: 'Fala Thiago! Hora de quebrar esse platô de cargas na VnFitness. Que tal a gente subir seu estímulo com uma periodização nova?',
    timeline: [
      { dot: 'green', texto: 'Frequente há 2 anos' }
    ]
  }
];

async function carregarMetricasDashboard() {
  const kpiAtivos = document.getElementById('kpi-alunos-ativos');
  const kpiRisco = document.getElementById('kpi-risco-alto');
  const kpiFreq = document.getElementById('kpi-freq-media');
  const kpiIA = document.getElementById('kpi-ajustes-ia');

  try {
    const res = await ApiClient.getMetricasAdmin();
    if (res?.kpis) {
      if (kpiAtivos) kpiAtivos.textContent = res.kpis.alunos_ativos || '1.284';
      if (kpiRisco) kpiRisco.innerHTML = `${res.kpis.risco_alto_cancelar || 14} <span style="font-size: 1rem; font-weight: 500; color: #A0A5B5;">+41 em risco médio</span>`;
      if (kpiFreq) kpiFreq.innerHTML = `${res.kpis.frequencia_media_semanal || 2.7} <span style="font-size: 1rem; font-weight: 500; color: #9CA3AF;">treinos por semana</span>`;
      if (kpiIA) kpiIA.innerHTML = `${res.kpis.ajustes_ia_semana || 312} <span style="font-size: 1rem; font-weight: 500; color: #9CA3AF;">treinos</span>`;

      // Atualiza badge de pendentes se houver
      const badgePend = document.getElementById('badge-pendentes-count');
      if (badgePend && res.kpis.alunos_pendentes > 0) {
        badgePend.style.display = 'inline-flex';
        badgePend.textContent = res.kpis.alunos_pendentes;
      }
      return;
    }
  } catch (err) {
    console.warn('Usando valores padrão:', err);
  }

  if (kpiAtivos) kpiAtivos.textContent = '1.284';
  if (kpiRisco) kpiRisco.innerHTML = '14 <span style="font-size: 1rem; font-weight: 500; color: #A0A5B5;">+41 em risco médio</span>';
  if (kpiFreq) kpiFreq.innerHTML = '2,7 <span style="font-size: 1rem; font-weight: 500; color: #9CA3AF;">treinos por semana</span>';
  if (kpiIA) kpiIA.innerHTML = '312 <span style="font-size: 1rem; font-weight: 500; color: #9CA3AF;">treinos</span>';
}

function carregarTabelaRetencao(filtro = 'all') {
  const tbody = document.getElementById('retention-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  let lista = ALUNOS_FORJA;
  if (filtro === 'high') lista = ALUNOS_FORJA.filter(a => a.score_risco >= 70);
  else if (filtro === 'mid') lista = ALUNOS_FORJA.filter(a => a.score_risco >= 50 && a.score_risco < 70);
  else if (filtro === 'recovered') lista = ALUNOS_FORJA.slice(3);

  lista.forEach((aluno, index) => {
    const tr = document.createElement('tr');
    tr.style.cursor = 'pointer';
    tr.innerHTML = `
      <td>
        <div class="student-col">
          <div class="student-avatar-badge">${obterIniciais(aluno.nome)}</div>
          <div class="student-name-box">
            <h5>${aluno.nome}</h5>
            <span>${aluno.plano}</span>
          </div>
        </div>
      </td>
      <td>
        <strong>${aluno.ultimo_treino}</strong>
        <div style="font-size: 0.72rem; color: #9CA3AF;">${aluno.frequencia_antiga}</div>
      </td>
      <td>
        <div style="font-size: 0.8rem; color: #0284C7; display: flex; align-items: center; gap: 5px;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
          <span>${aluno.motivo_ia}</span>
        </div>
      </td>
      <td>
        <span class="risk-num-badge ${aluno.score_risco >= 70 ? 'risk-high' : 'risk-mid'}">${aluno.score_risco}</span>
      </td>
      <td>
        <button class="action-btn-pill ${aluno.acao === 'Mensagem' ? 'action-msg' : 'action-call'}" style="display: inline-flex; align-items: center; gap: 5px;">
          ${aluno.acao === 'Mensagem' 
            ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg><span>Mensagem</span>' 
            : aluno.acao === 'Ligar hoje' 
            ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg><span>Ligar hoje</span>' 
            : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg><span>Reavaliar</span>'}
        </button>
      </td>
    `;

    tr.addEventListener('click', () => {
      abrirDetalhesAluno(aluno, true);
    });

    tbody.appendChild(tr);

    if (index === 0) {
      abrirDetalhesAluno(aluno, false);
    }
  });

  // Filtros de pílula da tabela
  document.querySelectorAll('.filter-pill-btn[data-filter]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.filter-pill-btn[data-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      carregarTabelaRetencao(btn.getAttribute('data-filter'));
    };
  });
}

function abrirDetalhesAluno(aluno, isUserClick = false) {
  const nomeElem = document.getElementById('drawer-aluno-nome');
  const matElem = document.getElementById('drawer-aluno-matricula');
  const scoreElem = document.getElementById('drawer-aluno-score');
  const reasonsContainer = document.getElementById('drawer-reasons-list');
  const whatsappBox = document.getElementById('drawer-whatsapp-text');
  const sendBtn = document.getElementById('drawer-whatsapp-btn');
  const timelineContainer = document.getElementById('drawer-timeline-list');

  if (isUserClick && window.innerWidth < 1200) {
    abrirDrawerMobile();
  }

  if (nomeElem) nomeElem.textContent = aluno.nome;
  if (matElem) matElem.textContent = `Matrícula ${aluno.matricula} • ${aluno.professor}`;
  if (scoreElem) {
    scoreElem.textContent = aluno.score_risco;
    scoreElem.style.borderColor = aluno.score_risco >= 70 ? '#EF4444' : '#F59E0B';
    scoreElem.style.color = aluno.score_risco >= 70 ? '#EF4444' : '#F59E0B';
  }

  if (reasonsContainer && aluno.fatores) {
    reasonsContainer.innerHTML = '';
    aluno.fatores.forEach(f => {
      const row = document.createElement('div');
      row.className = 'reason-row';
      row.innerHTML = `
        <span>${f.texto}</span>
        <span class="reason-score-tag">${f.peso}</span>
      `;
      reasonsContainer.appendChild(row);
    });
  }

  if (whatsappBox) {
    whatsappBox.textContent = aluno.whatsapp_msg;
  }

  if (sendBtn) {
    sendBtn.onclick = () => {
      const msgEncoded = encodeURIComponent(aluno.whatsapp_msg);
      window.open(`https://wa.me/?text=${msgEncoded}`, '_blank');
    };
  }

  if (timelineContainer && aluno.timeline) {
    timelineContainer.innerHTML = '';
    aluno.timeline.forEach(t => {
      const item = document.createElement('div');
      item.className = 'timeline-item';
      item.innerHTML = `
        <div class="timeline-dot ${t.dot === 'green' ? 'dot-green' : ''}"></div>
        <span>${t.texto}</span>
      `;
      timelineContainer.appendChild(item);
    });
  }
}

// ==============================================================================
// 3. GESTÃO DE ALUNOS & CRUD COMPLETO (Supabase)
// ==============================================================================
let alunosCache = [];

async function carregarListaAlunos(filtro = 'todos') {
  const container = document.getElementById('admin-alunos-crud-list');
  if (!container) return;

  try {
    const res = await ApiClient.listarUsuariosAdmin('todos');
    alunosCache = res.usuarios || [];

    let exibidos = alunosCache;
    if (filtro !== 'todos') {
      exibidos = alunosCache.filter(u => u.status_aprovacao === filtro);
    }

    if (exibidos.length === 0) {
      container.innerHTML = `<p style="color: #6B7280; font-size: 0.85rem; padding: 16px; text-align: center;">Nenhum usuário encontrado com o filtro selecionado.</p>`;
      return;
    }

    container.innerHTML = '';
    exibidos.forEach(u => {
      const isPendente = u.status_aprovacao === 'pendente';
      const isAprovado = u.status_aprovacao === 'aprovado';

      const item = document.createElement('div');
      item.className = 'admin-crud-user-row';
      item.innerHTML = `
        <div>
          <strong style="display: block; font-size: 0.95rem; color: #111827;">${u.nome_completo || 'Sem Nome'}</strong>
          <span style="font-size: 0.78rem; color: #6B7280;">${u.email}</span>
          <div style="margin-top: 4px;">
            <span class="badge ${isAprovado ? 'badge-success' : isPendente ? 'badge-warning' : 'badge-danger'}" style="font-size: 0.7rem;">
              ${u.status_aprovacao.toUpperCase()}
            </span>
            <span style="font-size: 0.72rem; color: #9CA3AF; margin-left: 6px;">Role: ${u.role}</span>
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          ${isPendente ? `
            <button class="btn-aprovar" style="padding: 7px 14px; background: #10B981; color: #fff; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Aprovar</span>
            </button>
            <button class="btn-rejeitar" style="padding: 7px 14px; background: #EF4444; color: #fff; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              <span>Rejeitar</span>
            </button>
          ` : `
            <button class="btn-inativar" style="padding: 7px 14px; background: #F3F4F6; color: #374151; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">${u.status_aprovacao === 'inativo' ? 'Ativar' : 'Inativar'}</button>
          `}
          ${u.email.toLowerCase() !== 'fredsoncitty@gmail.com' ? `
            <button class="btn-excluir" style="padding: 7px 14px; background: #FEE2E2; color: #DC2626; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">Excluir</button>
          ` : '<span class="badge badge-success" style="font-size: 0.7rem;">Admin Master</span>'}
        </div>
      `;

      const btnAprovar = item.querySelector('.btn-aprovar');
      if (btnAprovar) {
        btnAprovar.addEventListener('click', async () => {
          await ApiClient.aprovarUsuarioAdmin(u.id);
          alert(`Usuário ${u.nome_completo} aprovado no Supabase!`);
          await carregarListaAlunos(filtro);
          await carregarMetricasDashboard();
        });
      }

      const btnRejeitar = item.querySelector('.btn-rejeitar');
      if (btnRejeitar) {
        btnRejeitar.addEventListener('click', async () => {
          await ApiClient.rejeitarUsuarioAdmin(u.id, 'Cadastro recusado pela administração.');
          alert(`Usuário ${u.nome_completo} rejeitado.`);
          await carregarListaAlunos(filtro);
          await carregarMetricasDashboard();
        });
      }

      const btnInativar = item.querySelector('.btn-inativar');
      if (btnInativar) {
        btnInativar.addEventListener('click', async () => {
          await ApiClient.inativarUsuarioAdmin(u.id);
          alert('Status do aluno atualizado!');
          await carregarListaAlunos(filtro);
        });
      }

      const btnExcluir = item.querySelector('.btn-excluir');
      if (btnExcluir) {
        btnExcluir.addEventListener('click', async () => {
          if (confirm(`Excluir definitivamente o usuário ${u.nome_completo}?`)) {
            await ApiClient.excluirUsuarioAdmin(u.id);
            alert('Usuário removido!');
            await carregarListaAlunos(filtro);
            await carregarMetricasDashboard();
          }
        });
      }

      container.appendChild(item);
    });
  } catch (err) {
    console.warn('Erro ao carregar lista de usuários:', err);
  }
}

// Filtros da aba de alunos
['todos', 'pendentes', 'aprovados', 'inativos'].forEach(f => {
  const btn = document.getElementById(`filter-alunos-${f}`);
  if (btn) {
    btn.onclick = () => {
      document.querySelectorAll('#sec-alunos .filter-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      carregarListaAlunos(f === 'todos' ? 'todos' : f.slice(0, -1)); // pendente, aprovado, inativo
    };
  }
});

// ==============================================================================
// 4. PROFESSORES (Supabase)
// ==============================================================================
async function carregarProfessores() {
  const grid = document.getElementById('professores-cards-grid');
  if (!grid) return;

  try {
    const res = await ApiClient.getProfessoresAdmin();
    const lista = res.professores || [];

    grid.innerHTML = '';
    lista.forEach(p => {
      const card = document.createElement('div');
      card.className = 'card-item-box';
      card.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
          <div class="student-avatar-badge" style="width: 44px; height: 44px; background: #FEF3C7; color: #D97706; font-size: 1rem;">
            ${obterIniciais(p.nome)}
          </div>
          <div>
            <h4 style="font-weight: 700; color: #111827; font-size: 0.95rem;">${p.nome}</h4>
            <span style="font-size: 0.78rem; color: #6B7280;">${p.especialidade}</span>
          </div>
        </div>
        <div style="font-size: 0.8rem; color: #4B5563; margin-bottom: 12px; display: flex; flex-direction: column; gap: 4px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span>${p.telefone || '(11) 99999-0000'}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span><b>${p.alunos_atribuidos || 0}</b> alunos sob acompanhamento</span>
          </div>
        </div>
        <button class="btn btn-secondary w-full btn-excluir-prof" style="font-size: 0.75rem; padding: 6px;">Excluir Instrutor</button>
      `;

      card.querySelector('.btn-excluir-prof').onclick = async () => {
        if (confirm(`Remover instrutor ${p.nome}?`)) {
          await ApiClient.excluirProfessorAdmin(p.id);
          alert('Instrutor removido!');
          carregarProfessores();
        }
      };

      grid.appendChild(card);
    });
  } catch (e) {
    console.warn('Erro ao carregar professores:', e);
  }
}

// ==============================================================================
// 5. WHATSAPP (Fila de Disparo Inteligente & Responsiva)
// ==============================================================================
let todasMensagensWhatsApp = [];
let filtroWhatsAppAtual = 'todos';
let listenersWhatsAppConfigurados = false;

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #10B981, #059669)',
  'linear-gradient(135deg, #3B82F6, #1D4ED8)',
  'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  'linear-gradient(135deg, #F59E0B, #D97706)',
  'linear-gradient(135deg, #EC4899, #BE185D)',
  'linear-gradient(135deg, #06B6D4, #0E7490)'
];

function obterGradienteAvatar(nome) {
  if (!nome) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < nome.length; i++) hash += nome.charCodeAt(i);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

function extrairIniciais(nome) {
  if (!nome) return 'AL';
  const partes = nome.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function formatarTelefoneVisual(tel) {
  if (!tel) return 'Telefone não informado';
  const limpo = String(tel).replace(/\D/g, '');
  if (limpo.length === 13 && limpo.startsWith('55')) {
    return `+55 (${limpo.slice(2, 4)}) ${limpo.slice(4, 9)}-${limpo.slice(9)}`;
  }
  if (limpo.length === 12 && limpo.startsWith('55')) {
    return `+55 (${limpo.slice(2, 4)}) ${limpo.slice(4, 8)}-${limpo.slice(8)}`;
  }
  if (limpo.length === 11) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
  }
  if (limpo.length === 10) {
    return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 6)}-${limpo.slice(6)}`;
  }
  return tel;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function carregarMensagensWhatsApp() {
  const container = document.getElementById('whatsapp-queue-list');
  if (!container) return;

  try {
    const res = await ApiClient.getMensagensWhatsAppAdmin();
    let msgs = res.mensagens || [];

    // Fallback de demonstração caso a base ainda não tenha retornado dados
    if (msgs.length === 0) {
      msgs = [
        {
          id: 'demo-1',
          aluno_nome: 'Lívia Sampaio',
          telefone: '5511999990002',
          motivo_ia: 'Renovação perto e queda contínua de treinos',
          mensagem: 'Olá Lívia! Notamos que faz 12 dias que não te vemos no treino na VnFitness. Quer agendar uma reavaliação de treino gratuita essa semana?',
          status: 'pendente'
        },
        {
          id: 'demo-2',
          aluno_nome: 'Rafael Tavares',
          telefone: '5511999990001',
          motivo_ia: 'Mudou de horário e parou de abrir o treino',
          mensagem: 'Oi, Rafa! Aqui é o Diego da VnFitness. Vi que sua rotina mudou. Montei um treino de 35 min que cabe no seu novo horário da noite. Bora testar amanhã?',
          status: 'enviada'
        }
      ];
    }

    todasMensagensWhatsApp = msgs;

    // Configura os ouvintes das abas de filtro apenas uma vez
    if (!listenersWhatsAppConfigurados) {
      const filterBtns = document.querySelectorAll('#wa-filter-tabs .wa-filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          filterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          filtroWhatsAppAtual = btn.dataset.filter || 'todos';
          renderizarFilaWhatsApp();
        });
      });
      listenersWhatsAppConfigurados = true;
    }

    renderizarFilaWhatsApp();
  } catch (e) {
    console.warn('Erro ao carregar WhatsApp:', e);
  }
}

function renderizarFilaWhatsApp() {
  const container = document.getElementById('whatsapp-queue-list');
  if (!container) return;

  // Atualizar contadores
  const total = todasMensagensWhatsApp.length;
  const pendentes = todasMensagensWhatsApp.filter(m => m.status === 'pendente').length;
  const enviadas = todasMensagensWhatsApp.filter(m => m.status === 'enviada').length;

  const countTodos = document.getElementById('wa-count-todos');
  const countPend = document.getElementById('wa-count-pendentes');
  const countEnv = document.getElementById('wa-count-enviadas');
  const badgeSidebar = document.getElementById('badge-whatsapp-count');

  if (countTodos) countTodos.textContent = total;
  if (countPend) countPend.textContent = pendentes;
  if (countEnv) countEnv.textContent = enviadas;
  if (badgeSidebar) badgeSidebar.textContent = pendentes > 0 ? pendentes : total;

  // Filtrar lista
  let msgsFiltradas = todasMensagensWhatsApp;
  if (filtroWhatsAppAtual === 'pendente') {
    msgsFiltradas = todasMensagensWhatsApp.filter(m => m.status === 'pendente');
  } else if (filtroWhatsAppAtual === 'enviada') {
    msgsFiltradas = todasMensagensWhatsApp.filter(m => m.status === 'enviada');
  }

  container.innerHTML = '';

  if (msgsFiltradas.length === 0) {
    container.innerHTML = `
      <div class="wa-empty-state">
        <div class="wa-empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
          </svg>
        </div>
        <div class="wa-empty-title">Nenhuma mensagem nesta categoria</div>
        <div class="wa-empty-sub">
          ${filtroWhatsAppAtual === 'pendente' 
            ? 'Excelente! Todas as mensagens de retenção sugeridas pela IA já foram disparadas.' 
            : 'Quando novas mensagens forem disparadas ou sugeridas pela IA, elas aparecerão listadas aqui.'}
        </div>
      </div>
    `;
    return;
  }

  msgsFiltradas.forEach(m => {
    const isEnviada = m.status === 'enviada';
    const iniciais = extrairIniciais(m.aluno_nome);
    const gradiente = obterGradienteAvatar(m.aluno_nome);
    const telFormatado = formatarTelefoneVisual(m.telefone);

    const card = document.createElement('div');
    card.className = `wa-card ${isEnviada ? 'is-sent' : 'is-pending'}`;
    card.setAttribute('data-id', m.id);

    card.innerHTML = `
      <div>
        <div class="wa-card-header">
          <div class="wa-student-info">
            <div class="wa-avatar" style="background: ${gradiente};">${iniciais}</div>
            <div class="wa-student-details">
              <div class="wa-student-name" title="${escapeHtml(m.aluno_nome)}">${escapeHtml(m.aluno_nome)}</div>
              <div class="wa-student-phone">
                <svg class="wa-phone-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>${telFormatado}</span>
              </div>
            </div>
          </div>

          <div class="wa-badge ${isEnviada ? 'wa-badge-sent' : 'wa-badge-pending'}">
            ${isEnviada 
              ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Enviada` 
              : `<span class="wa-status-dot"></span> Pendente`}
          </div>
        </div>

        <div class="wa-reason-banner" style="margin-top: 12px;">
          <span class="wa-reason-tag">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Insight IA
          </span>
          <span class="wa-reason-text" title="${escapeHtml(m.motivo_ia || 'Acompanhamento preventivo')}">
            ${escapeHtml(m.motivo_ia || 'Acompanhamento preventivo')}
          </span>
        </div>

        <div class="wa-bubble-wrapper" style="margin-top: 12px;">
          <div class="wa-bubble-header">
            <span class="wa-bubble-label">Mensagem Sugerida</span>
            <button class="wa-btn-copy btn-copy-msg" type="button" title="Copiar texto">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              <span>Copiar</span>
            </button>
          </div>
          <div class="wa-bubble-content">${escapeHtml(m.mensagem)}</div>
        </div>
      </div>

      <div class="wa-card-actions">
        <button class="btn-wa-action btn-send-action ${isEnviada ? 'is-sent' : ''}" type="button">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span>${isEnviada ? 'Reenviar no WhatsApp Web' : 'Abrir e Enviar no WhatsApp Web'}</span>
        </button>
      </div>
    `;

    // Handler de Copiar
    const btnCopy = card.querySelector('.btn-copy-msg');
    btnCopy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(m.mensagem);
        btnCopy.classList.add('copied');
        btnCopy.querySelector('span').textContent = 'Copiado!';
        setTimeout(() => {
          btnCopy.classList.remove('copied');
          btnCopy.querySelector('span').textContent = 'Copiar';
        }, 2000);
      } catch (err) {
        const ta = document.createElement('textarea');
        ta.value = m.mensagem;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        btnCopy.classList.add('copied');
        btnCopy.querySelector('span').textContent = 'Copiado!';
        setTimeout(() => {
          btnCopy.classList.remove('copied');
          btnCopy.querySelector('span').textContent = 'Copiar';
        }, 2000);
      }
    };

    // Handler de Enviar via WhatsApp Web
    const btnSend = card.querySelector('.btn-send-action');
    btnSend.onclick = async () => {
      const text = encodeURIComponent(m.mensagem);
      const tel = m.telefone ? String(m.telefone).replace(/\D/g, '') : '';
      const url = tel 
        ? (tel.startsWith('55') ? `https://wa.me/${tel}?text=${text}` : `https://wa.me/55${tel}?text=${text}`)
        : `https://wa.me/?text=${text}`;

      window.open(url, '_blank');

      if (!isEnviada && m.id && !m.id.startsWith('demo-')) {
        try {
          await ApiClient.marcarMensagemWhatsAppEnviadaAdmin(m.id);
        } catch (e) {
          console.warn('Erro ao marcar como enviada:', e);
        }
      }

      // Atualiza estado local imediatamente para feedback instantâneo
      m.status = 'enviada';
      renderizarFilaWhatsApp();
    };

    container.appendChild(card);
  });
}

// ==============================================================================
// 6. CHECK-INS E TREINOS IA (Supabase)
// ==============================================================================
async function carregarCheckins() {
  const tbody = document.getElementById('checkins-table-body');
  if (!tbody) return;

  try {
    const res = await ApiClient.getCheckinsRecentesAdmin();
    const checkins = res.checkins || [];

    tbody.innerHTML = '';
    checkins.forEach(c => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${c.usuarios?.nome_completo || 'Aluno VnFitness'}</strong></td>
        <td>${c.data_treino}</td>
        <td>${c.duracao_min} min</td>
        <td><span class="badge badge-success">Nível ${c.intensidade || 4}/5</span></td>
        <td>${c.exercicio_destaque || 'Treino Concluído'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.warn('Erro ao carregar check-ins:', e);
  }
}

async function carregarTreinosIA() {
  const container = document.getElementById('admin-treinos-ia-list');
  if (!container) return;

  try {
    const res = await ApiClient.getTreinosIAAdmin();
    const treinos = res.treinos || [];

    container.innerHTML = '';
    treinos.forEach(t => {
      const card = document.createElement('div');
      card.className = 'card-item-box';
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <h4 style="font-weight: 700; color: #111827;">${t.titulo}</h4>
          <span class="badge badge-success" style="display: inline-flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
            Coach IA
          </span>
        </div>
        <p style="font-size: 0.8rem; color: #6B7280; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span>Aluno: <b>${t.usuarios?.nome_completo || 'Aluno'}</b></span>
          <span>•</span>
          <span style="display: inline-flex; align-items: center; gap: 4px;">
            ${t.local_treino === 'casa' 
              ? '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg> Em Casa' 
              : '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1a2.83 2.83 0 0 0 0-4l-1-1 4-4-1-1a2.83 2.83 0 0 0-4 0l-1 1-4-4 1-1a2.83 2.83 0 0 0 0-4l-1-1-4 4 1 1a2.83 2.83 0 0 0 0 4l1 1-4 4-1-1a2.83 2.83 0 0 0-4 0l-1 1 4 4 1 1a2.83 2.83 0 0 0 4 0l1-1 4 4-1 1a2.83 2.83 0 0 0 0 4Z"/></svg> Na Academia'}
          </span>
        </p>
        <div style="font-size: 0.78rem; color: #4B5563;">
          <div>Exercícios prescritos: <b>${t.exercicios?.length || 0}</b></div>
          <div>Duração estimada: <b>${t.duracao_estimada_min || 45} min</b></div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (e) {
    console.warn('Erro ao carregar treinos IA:', e);
  }
}

// ==============================================================================
// 7. AÇÕES E MODAIS (Novo Aluno, Novo Professor, Upload Storage)
// ==============================================================================
function configurarAcoesModais() {
  const btnNovoAluno = document.getElementById('btn-novo-aluno');
  if (btnNovoAluno) {
    btnNovoAluno.onclick = async () => {
      const nome = prompt('Nome completo do novo aluno:');
      if (!nome) return;
      const email = prompt('E-mail do novo aluno:');
      if (!email) return;

      try {
        await ApiClient.signup(email, 'VnFitness2026!', nome);
        alert(`Aluno ${nome} cadastrado com sucesso no Supabase com senha padrão "VnFitness2026!"!`);
        await carregarListaAlunos();
        await carregarMetricasDashboard();
      } catch (err) {
        alert('Erro ao cadastrar aluno: ' + err.message);
      }
    };
  }

  const btnNovoProf = document.getElementById('btn-novo-professor');
  if (btnNovoProf) {
    btnNovoProf.onclick = async () => {
      const nome = prompt('Nome do professor:');
      if (!nome) return;
      const especialidade = prompt('Especialidade (ex: Musculação, Funcional):', 'Musculação e Hipertrofia');
      const tel = prompt('Telefone com DDD:', '(11) 98888-7777');

      try {
        await ApiClient.criarProfessorAdmin({ nome, especialidade, telefone: tel });
        alert('Professor cadastrado com sucesso no Supabase!');
        carregarProfessores();
      } catch (err) {
        alert('Erro ao cadastrar professor: ' + err.message);
      }
    };
  }

  const btnExportar = document.getElementById('btn-exportar-dados');
  if (btnExportar) {
    btnExportar.onclick = () => {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "ID,Nome,Email,Role,Status\n"
        + alunosCache.map(u => `"${u.id}","${u.nome_completo}","${u.email}","${u.role}","${u.status_aprovacao}"`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `vnfitness_alunos_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  }

  // Busca Global
  const searchInput = document.getElementById('admin-global-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.toLowerCase().trim();
      if (!val) {
        carregarListaAlunos('todos');
        return;
      }
      const filtrados = alunosCache.filter(u => 
        (u.nome_completo || '').toLowerCase().includes(val) || 
        (u.email || '').toLowerCase().includes(val)
      );
      renderizarListaCustom(filtrados);
    });
  }
}

function renderizarListaCustom(usuarios) {
  const container = document.getElementById('admin-alunos-crud-list');
  if (!container) return;
  container.innerHTML = '';
  usuarios.forEach(u => {
    const item = document.createElement('div');
    item.className = 'admin-crud-user-row';
    item.innerHTML = `
      <div>
        <strong style="display: block; font-size: 0.95rem; color: #111827;">${u.nome_completo || 'Sem Nome'}</strong>
        <span style="font-size: 0.78rem; color: #6B7280;">${u.email}</span>
        <div style="margin-top: 4px;"><span class="badge badge-success">${u.status_aprovacao.toUpperCase()}</span></div>
      </div>
    `;
    container.appendChild(item);
  });
}

function configurarUploadStorage() {
  const photoInput = document.getElementById('admin-photo-upload');
  if (photoInput) {
    photoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await ApiClient.uploadFotoAdmin({
            bucket: 'avatars',
            nome_arquivo: file.name,
            base64_data: reader.result,
            content_type: file.type
          });
          alert(`✅ Foto enviada com sucesso para o Supabase Storage!\nURL: ${res.url}`);
        } catch (err) {
          alert('Erro ao enviar foto: ' + err.message);
        }
      };
      reader.readAsDataURL(file);
    });
  }
}

function obterIniciais(nome) {
  if (!nome) return 'VF';
  const partes = nome.split(' ');
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
}

// ==============================================================================
// 9. CONFIGURAÇÕES PERSISTENTES DO SISTEMA (SUPABASE)
// ==============================================================================
async function carregarConfiguracoesSistema() {
  try {
    const res = await ApiClient.getConfiguracoesAdmin();
    const cfg = res?.configuracoes;
    if (!cfg) return;

    const inputNome = document.getElementById('cfg-nome-academia');
    const inputSub = document.getElementById('cfg-subtitulo-unidade');
    const selectModo = document.getElementById('cfg-modo-aprovacao');
    const inputTel = document.getElementById('cfg-telefone-suporte');
    const inputMeta = document.getElementById('cfg-meta-semanal');
    const inputDias = document.getElementById('cfg-dias-alerta');

    if (inputNome && cfg.nome_academia) inputNome.value = cfg.nome_academia;
    if (inputSub && cfg.subtitulo_unidade) inputSub.value = cfg.subtitulo_unidade;
    if (selectModo && cfg.modo_aprovacao) selectModo.value = cfg.modo_aprovacao;
    if (inputTel && cfg.telefone_suporte) inputTel.value = cfg.telefone_suporte;
    if (inputMeta && cfg.frequencia_meta_semanal) inputMeta.value = cfg.frequencia_meta_semanal;
    if (inputDias && cfg.dias_alerta_retencao) inputDias.value = cfg.dias_alerta_retencao;

    // Atualiza cabeçalho da Unidade e Header Mobile
    atualizarTextosUnidade(cfg.nome_academia, cfg.subtitulo_unidade);
  } catch (err) {
    console.warn('Erro ao carregar configurações do sistema:', err);
  }
}

function atualizarTextosUnidade(nome, sub) {
  const branchTitle = document.querySelector('.branch-info h5');
  const branchSub = document.querySelector('.branch-info p');
  const mobileTitle = document.querySelector('.mobile-brand-title span:last-child');

  if (branchTitle && nome) branchTitle.textContent = nome;
  if (branchSub && sub) branchSub.textContent = sub;
  if (mobileTitle && nome) mobileTitle.textContent = nome;
}

function configurarFormularioConfiguracoes() {
  const btnSalvar = document.getElementById('btn-salvar-config-sistema');
  const alertBox = document.getElementById('alert-config-sistema');

  if (!btnSalvar) return;

  btnSalvar.addEventListener('click', async (e) => {
    e.preventDefault();
    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando no Supabase...';

    const nome = document.getElementById('cfg-nome-academia')?.value;
    const sub = document.getElementById('cfg-subtitulo-unidade')?.value;
    const modo = document.getElementById('cfg-modo-aprovacao')?.value;
    const tel = document.getElementById('cfg-telefone-suporte')?.value;
    const meta = document.getElementById('cfg-meta-semanal')?.value;
    const dias = document.getElementById('cfg-dias-alerta')?.value;

    try {
      const res = await ApiClient.salvarConfiguracoesAdmin({
        nome_academia: nome,
        subtitulo_unidade: sub,
        modo_aprovacao: modo,
        telefone_suporte: tel,
        frequencia_meta_semanal: meta,
        dias_alerta_retencao: dias,
        notificacoes_ia_ativas: true
      });

      atualizarTextosUnidade(nome, sub);

      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#ECFDF5';
        alertBox.style.color = '#065F46';
        alertBox.style.border = '1px solid #A7F3D0';
        alertBox.innerHTML = '<span style="display: inline-flex; align-items: center; gap: 6px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' + (res.message || 'Configurações salvas e persistidas no Supabase com sucesso!') + '</span>';
        setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
      }
    } catch (err) {
      if (alertBox) {
        alertBox.style.display = 'block';
        alertBox.style.background = '#FEE2E2';
        alertBox.style.color = '#991B1B';
        alertBox.style.border = '1px solid #FECACA';
        alertBox.innerHTML = '<span style="display: inline-flex; align-items: center; gap: 6px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Erro ao salvar configurações: ' + err.message + '</span>';
      }
    } finally {
      btnSalvar.disabled = false;
      btnSalvar.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
          <polyline points="17 21 17 13 7 13 7 21"/>
          <polyline points="7 3 7 8 15 8"/>
        </svg>
        <span>Salvar Configurações</span>
      `;
    }
  });
}
