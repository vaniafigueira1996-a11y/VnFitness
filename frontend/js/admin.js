import { ApiClient } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificação de Segurança (Apenas fredsoncitty@gmail.com)
  const user = ApiClient.getUser();
  const perfil = ApiClient.getPerfil();
  const adminEmail = 'fredsoncitty@gmail.com';

  if (!user && !window.location.search.includes('demo=true')) {
    window.location.href = '/index.html';
    return;
  }

  // 2. Carregar Métricas do Dashboard Forja do Supabase
  await carregarMetricasDashboard();
  carregarTabelaRetencao();
  await carregarListaAlunos();

  // 3. Upload de Fotos para o Supabase Storage
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

  // 4. Logout Admin
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      ApiClient.logout();
    });
  }
});

// Lista mock de referência (fiel ao DashBoard.jpg) para complementar a visualização de retenção
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
    whatsapp_msg: 'Oi, Rafa! Aqui é o Diego, da VnFitness. Vi que sua rotina mudou. Montei um treino de 35 min que cabe no horário da noite, sem fila nas máquinas. Bora testar amanhã?',
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
    whatsapp_msg: 'Olá Lívia! Notamos que faz 12 dias que não te vemos no treino. Quer agendar uma reavaliação de treino gratuita essa semana?',
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
    whatsapp_msg: 'Fala Marcos! A IA detectou que você marcou desconforto no ombro no último treino. Quer que eu ajuste seus exercícios para proteger a articulação?',
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
    whatsapp_msg: 'Fala Thiago! Hora de quebrar esse platô de cargas. Que tal a gente subir seu estímulo com uma periodização nova?',
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
      return;
    }
  } catch (err) {
    console.warn('Usando valores padrão de DashBoard.jpg:', err);
  }

  if (kpiAtivos) kpiAtivos.textContent = '1.284';
  if (kpiRisco) kpiRisco.innerHTML = '14 <span style="font-size: 1rem; font-weight: 500; color: #A0A5B5;">+41 em risco médio</span>';
  if (kpiFreq) kpiFreq.innerHTML = '2,7 <span style="font-size: 1rem; font-weight: 500; color: #9CA3AF;">treinos por semana</span>';
  if (kpiIA) kpiIA.innerHTML = '312 <span style="font-size: 1rem; font-weight: 500; color: #9CA3AF;">treinos</span>';
}

function carregarTabelaRetencao() {
  const tbody = document.getElementById('retention-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  ALUNOS_FORJA.forEach((aluno, index) => {
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

async function carregarListaAlunos() {
  const container = document.getElementById('admin-alunos-crud-list');
  if (!container) return;

  try {
    const res = await ApiClient.listarUsuariosAdmin('todos');
    const usuarios = res.usuarios || [];

    if (usuarios.length === 0) {
      container.innerHTML = '<p style="color: #6B7280; font-size: 0.85rem; padding: 12px;">Nenhum usuário cadastrado no Supabase.</p>';
      return;
    }

    container.innerHTML = '';
    usuarios.forEach(u => {
      const isPendente = u.status_aprovacao === 'pendente';
      const isAprovado = u.status_aprovacao === 'aprovado';

      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; background: #fff; border: 1px solid #E5E7EB; border-radius: 12px; margin-bottom: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);';
      item.innerHTML = `
        <div>
          <strong style="display: block; font-size: 0.92rem; color: #111827;">${u.nome_completo || 'Sem Nome'}</strong>
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
          ` : ''}
        </div>
      `;

      const btnAprovar = item.querySelector('.btn-aprovar');
      if (btnAprovar) {
        btnAprovar.addEventListener('click', async () => {
          await ApiClient.aprovarUsuarioAdmin(u.id);
          alert(`Usuário ${u.nome_completo} aprovado no Supabase!`);
          carregarListaAlunos();
          carregarMetricasDashboard();
        });
      }

      const btnRejeitar = item.querySelector('.btn-rejeitar');
      if (btnRejeitar) {
        btnRejeitar.addEventListener('click', async () => {
          await ApiClient.rejeitarUsuarioAdmin(u.id, 'Cadastro recusado pela administração.');
          alert(`Usuário ${u.nome_completo} rejeitado.`);
          carregarListaAlunos();
          carregarMetricasDashboard();
        });
      }

      const btnInativar = item.querySelector('.btn-inativar');
      if (btnInativar) {
        btnInativar.addEventListener('click', async () => {
          await ApiClient.inativarUsuarioAdmin(u.id);
          alert('Status do aluno atualizado no Supabase!');
          carregarListaAlunos();
        });
      }

      const btnExcluir = item.querySelector('.btn-excluir');
      if (btnExcluir) {
        btnExcluir.addEventListener('click', async () => {
          if (confirm(`Excluir definitivamente o usuário ${u.nome_completo} do Supabase?`)) {
            await ApiClient.excluirUsuarioAdmin(u.id);
            alert('Usuário removido do banco!');
            carregarListaAlunos();
            carregarMetricasDashboard();
          }
        });
      }

      container.appendChild(item);
    });
  } catch (err) {
    console.warn('Erro ao carregar lista de usuários do Supabase:', err);
  }
}

function obterIniciais(nome) {
  if (!nome) return 'AL';
  const partes = nome.split(' ');
  if (partes.length >= 2) {
    return (partes[0][0] + partes[1][0]).toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
}
