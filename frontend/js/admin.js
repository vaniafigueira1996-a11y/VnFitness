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

  // 2. Gerenciador de Navegação dos Menus Laterais
  configurarNavegacaoMenus();

  // 3. Carregamento dos Dados das Seções
  await carregarMetricasDashboard();
  carregarTabelaRetencao();
  await carregarListaAlunos();
  await carregarProfessores();
  await carregarMensagensWhatsApp();
  await carregarCheckins();
  await carregarTreinosIA();

  // 4. Upload de Fotos para o Supabase Storage
  configurarUploadStorage();

  // 5. Botões de Ação Rápida (Novo Aluno, Novo Professor, Exportar)
  configurarAcoesModais();

  // 6. Logout Admin
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      ApiClient.logout();
    });
  }
});

// ==============================================================================
// 1. NAVEGAÇÃO ENTRE OS MENUS LATERAIS
// ==============================================================================
function configurarNavegacaoMenus() {
  const navBtns = document.querySelectorAll('.nav-item-btn[data-sec]');
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

  navBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSecId = btn.getAttribute('data-sec');
      if (!targetSecId) return;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      sections.forEach(sec => sec.classList.remove('active'));
      const activeSec = document.getElementById(targetSecId);
      if (activeSec) activeSec.classList.add('active');

      // Título do Topbar
      if (titulosPorSecao[targetSecId]) {
        if (topbarTitle) topbarTitle.textContent = titulosPorSecao[targetSecId].title;
        if (topbarSubtitle) topbarSubtitle.textContent = titulosPorSecao[targetSecId].sub;
      }

      // Seção de Retenção exibe o Drawer lateral direito; outras seções usam largura total
      if (targetSecId === 'sec-retencao') {
        mainLayout.classList.remove('drawer-hidden');
      } else {
        mainLayout.classList.add('drawer-hidden');
      }
    });
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
        <div style="font-size: 0.8rem; color: #0284C7; display: flex; align-items: center; gap: 4px;">
          ✨ ${aluno.motivo_ia}
        </div>
      </td>
      <td>
        <span class="risk-num-badge ${aluno.score_risco >= 70 ? 'risk-high' : 'risk-mid'}">${aluno.score_risco}</span>
      </td>
      <td>
        <button class="action-btn-pill ${aluno.acao === 'Mensagem' ? 'action-msg' : 'action-call'}">
          ${aluno.acao === 'Mensagem' ? '💬 Mensagem' : aluno.acao === 'Ligar hoje' ? '📞 Ligar hoje' : '🔄 Reavaliar'}
        </button>
      </td>
    `;

    tr.addEventListener('click', () => {
      abrirDetalhesAluno(aluno);
    });

    tbody.appendChild(tr);

    if (index === 0) {
      abrirDetalhesAluno(aluno);
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

function abrirDetalhesAluno(aluno) {
  const nomeElem = document.getElementById('drawer-aluno-nome');
  const matElem = document.getElementById('drawer-aluno-matricula');
  const scoreElem = document.getElementById('drawer-aluno-score');
  const reasonsContainer = document.getElementById('drawer-reasons-list');
  const whatsappBox = document.getElementById('drawer-whatsapp-text');
  const sendBtn = document.getElementById('drawer-whatsapp-btn');
  const timelineContainer = document.getElementById('drawer-timeline-list');

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
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);';
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
            <button class="btn-aprovar" style="padding: 7px 14px; background: #10B981; color: #fff; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">✓ Aprovar</button>
            <button class="btn-rejeitar" style="padding: 7px 14px; background: #EF4444; color: #fff; border-radius: 8px; font-weight: 700; font-size: 0.78rem; cursor: pointer;">✕ Rejeitar</button>
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
        <div style="font-size: 0.8rem; color: #4B5563; margin-bottom: 12px;">
          <div>📞 ${p.telefone || '(11) 99999-0000'}</div>
          <div>👥 <b>${p.alunos_atribuidos || 0}</b> alunos sob acompanhamento</div>
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
// 5. WHATSAPP (Fila de Disparo)
// ==============================================================================
async function carregarMensagensWhatsApp() {
  const container = document.getElementById('whatsapp-queue-list');
  if (!container) return;

  try {
    const res = await ApiClient.getMensagensWhatsAppAdmin();
    const msgs = res.mensagens || [];

    const badge = document.getElementById('badge-whatsapp-count');
    if (badge) badge.textContent = msgs.length;

    container.innerHTML = '';
    msgs.forEach(m => {
      const box = document.createElement('div');
      box.className = 'whatsapp-draft-box';
      box.style.marginBottom = '14px';
      box.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="color: #14532D; font-size: 0.9rem;">Para: ${m.aluno_nome} ${m.telefone ? `(${m.telefone})` : ''}</strong>
          <span class="badge ${m.status === 'enviada' ? 'badge-success' : 'badge-warning'}" style="font-size: 0.7rem;">
            ${m.status.toUpperCase()}
          </span>
        </div>
        <small style="color: #0284C7; display: block; margin-bottom: 6px;">✨ Motivo IA: ${m.motivo_ia || 'Acompanhamento preventivo'}</small>
        <div class="whatsapp-text-content">${m.mensagem}</div>
        <button class="btn-whatsapp-send btn-send-queue" style="margin-top: 10px;">
          📱 Abrir e Enviar via WhatsApp Web
        </button>
      `;

      box.querySelector('.btn-send-queue').onclick = async () => {
        const text = encodeURIComponent(m.mensagem);
        const tel = m.telefone ? m.telefone.replace(/\D/g, '') : '';
        const url = tel ? `https://wa.me/55${tel}?text=${text}` : `https://wa.me/?text=${text}`;
        window.open(url, '_blank');
        await ApiClient.marcarMensagemWhatsAppEnviadaAdmin(m.id);
        carregarMensagensWhatsApp();
      };

      container.appendChild(box);
    });
  } catch (e) {
    console.warn('Erro ao carregar WhatsApp:', e);
  }
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
          <span class="badge badge-success">✨ Coach IA</span>
        </div>
        <p style="font-size: 0.8rem; color: #6B7280; margin-bottom: 8px;">
          Aluno: <b>${t.usuarios?.nome_completo || 'Aluno'}</b> | Local: ${t.local_treino === 'casa' ? '🏠 Em Casa' : '🏋️ Na Academia'}
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
    item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 10px;';
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
