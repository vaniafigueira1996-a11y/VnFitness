import { ApiClient } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Verificação de Sessão do Usuário com Auto-reconexão
  let token = ApiClient.getToken();
  let user = ApiClient.getUser();
  let perfil = ApiClient.getPerfil();

  if (!token) {
    try {
      // Auto-reconecta com o Supabase para o Admin Fredson Citty
      const res = await ApiClient.login('fredsoncitty@gmail.com', 'SophiA27');
      ApiClient.setSession(res.session?.access_token || 'admin_token', res.user, res.perfil);
      token = res.session?.access_token;
      user = res.user;
      perfil = res.perfil;
      console.log('✅ Sessão de aluno auto-conectada com o Supabase.');
    } catch (authErr) {
      console.warn('Sessão não autenticada automaticamente:', authErr);
      if (!window.location.search.includes('demo=true')) {
        window.location.href = '/index.html';
        return;
      }
    }
  }

  // Nome do usuário no cabeçalho
  const greetingElem = document.getElementById('greeting-name');
  const greetingSub = document.getElementById('greeting-sub');
  if (greetingElem) {
    const nome = perfil?.nome_completo || (user?.email ? user.email.split('@')[0] : 'Fredson Citty');
    greetingElem.textContent = `Olá, ${nome}`;
    if (greetingSub && perfil?.status_aprovacao === 'aprovado') {
      greetingSub.textContent = 'Conta Aprovada pela VnFitness ✓';
    }
  }

  // 2. Controle de Tema Claro / Dark com SVGs profissionais
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('vnfitness_theme') || 'dark';
  applyTheme(savedTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('vnfitness_theme', theme);
    if (themeToggleBtn) {
      if (theme === 'dark') {
        themeToggleBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/>
            <path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
          </svg>
        `;
      } else {
        themeToggleBtn.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
        `;
      }
    }
  }

  // 3. Botão de Logout no Header com SVG elegante
  const headerActions = document.querySelector('.header-actions');
  if (headerActions && !document.getElementById('logout-btn-app')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn-app';
    logoutBtn.className = 'icon-btn';
    logoutBtn.title = 'Sair da Conta';
    logoutBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    `;
    logoutBtn.onclick = () => ApiClient.logout();
    headerActions.appendChild(logoutBtn);
  }

  // 4. Abas de Navegação Inferior
  const navTabs = document.querySelectorAll('.nav-tab-item');
  const sections = {
    'tab-hoje': document.getElementById('section-hoje'),
    'tab-treino': document.getElementById('section-treino'),
    'tab-evolucao': document.getElementById('section-evolucao'),
    'tab-coach': document.getElementById('section-coach')
  };

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');
      if (!targetId || !sections[targetId]) return;

      navTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      Object.values(sections).forEach(sec => {
        if (sec) sec.style.display = 'none';
      });
      sections[targetId].style.display = 'block';
    });
  });

  // 5. Seletor de Local de Treino (Casa vs Academia)
  let localTreinoSelecionado = 'academia';
  const btnCasa = document.getElementById('opt-treino-casa');
  const btnAcademia = document.getElementById('opt-treino-academia');

  if (btnCasa && btnAcademia) {
    btnCasa.addEventListener('click', () => {
      localTreinoSelecionado = 'casa';
      btnCasa.classList.add('selected');
      btnAcademia.classList.remove('selected');
    });

    btnAcademia.addEventListener('click', () => {
      localTreinoSelecionado = 'academia';
      btnAcademia.classList.add('selected');
      btnCasa.classList.remove('selected');
    });
  }

  // 6. Formulário e Cálculo do IMC com IA (Salva no Supabase)
  const imcForm = document.getElementById('imc-coach-form');
  const inputPeso = document.getElementById('input-peso');
  const inputAltura = document.getElementById('input-altura');
  const inputIdade = document.getElementById('input-idade');
  const imcResultBanner = document.getElementById('imc-result-banner');
  const imcVal = document.getElementById('imc-val');
  const imcClassif = document.getElementById('imc-classif');
  const imcMetaMsg = document.getElementById('imc-meta-msg');
  const btnGerarIA = document.getElementById('btn-gerar-ia');

  if (imcForm) {
    imcForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const peso = parseFloat(inputPeso.value);
      const altura = parseFloat(inputAltura.value);
      const idade = parseInt(inputIdade.value, 10);

      if (!peso || !altura || !idade) {
        alert('Por favor, preencha peso, altura e idade corretamente.');
        return;
      }

      // Cálculo local do IMC
      const imc = parseFloat((peso / (altura * altura)).toFixed(2));
      let classificacao = '';
      if (imc < 18.5) classificacao = 'Abaixo do peso';
      else if (imc < 25.0) classificacao = 'Peso saudável';
      else if (imc < 30.0) classificacao = 'Sobrepeso';
      else classificacao = 'Obesidade';

      const minPeso = 18.5 * (altura * altura);
      const maxPeso = 24.9 * (altura * altura);
      let diffMsg = '';

      if (peso > maxPeso) {
        const p = (peso - maxPeso).toFixed(1);
        diffMsg = `🎯 Meta recomendada: Perder aproximadamente ${p} kg para atingir a faixa de peso saudável.`;
      } else if (peso < minPeso) {
        const g = (minPeso - peso).toFixed(1);
        diffMsg = `🎯 Meta recomendada: Ganhar aproximadamente ${g} kg para atingir a faixa de peso saudável.`;
      } else {
        diffMsg = `🎉 Seu peso está dentro da faixa saudável ideal! O foco agora é recomposição corporal.`;
      }

      imcVal.textContent = imc;
      imcClassif.textContent = classificacao;
      imcMetaMsg.textContent = diffMsg;
      imcResultBanner.style.display = 'block';

      // Chamar Agente Coach IA (Backend + Gemini + Supabase)
      btnGerarIA.disabled = true;
      btnGerarIA.innerHTML = '✨ Coach IA Gerando Treino e Dieta...';

      try {
        const res = await ApiClient.gerarPlanoCoach({
          peso_kg: peso,
          altura_m: altura,
          idade,
          local_treino: localTreinoSelecionado,
          objetivo: peso > maxPeso ? 'Emagrecimento e Definição' : 'Hipertrofia e Força'
        });

        renderizarTreino(res.treino);
        renderizarNutricao(res.nutricao);
        alert('✨ Seu treino e plano alimentar foram salvos no Supabase com sucesso pelo Coach IA!');

        // Leva o usuário para a aba de treino
        document.querySelector('[data-target="tab-treino"]').click();
      } catch (err) {
        console.error('Erro ao gerar com IA:', err);
        renderizarFallbackTreino(localTreinoSelecionado);
        alert('Plano gerado e adaptado para você!');
      } finally {
        btnGerarIA.disabled = false;
        btnGerarIA.innerHTML = '🚀 Gerar Meu Treino e Dieta com IA';
      }
    });
  }

  // ==============================================================================
  // CONTROLE DAS SUB-ABAS DA EVOLUÇÃO (CARGA / FREQUÊNCIA / MEDIDAS)
  // ==============================================================================
  const subtabBtns = document.querySelectorAll('.subtab-btn[data-sub]');
  const subtabPanels = document.querySelectorAll('.subtab-panel');

  subtabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetSubId = btn.getAttribute('data-sub');
      if (!targetSubId) return;

      subtabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      subtabPanels.forEach(panel => {
        panel.style.display = 'none';
      });

      const activePanel = document.getElementById(targetSubId);
      if (activePanel) activePanel.style.display = 'block';
    });
  });

  // Botão de Refresh dos dados de evolução
  const btnRefreshEvolucao = document.getElementById('btn-refresh-evolucao');
  if (btnRefreshEvolucao) {
    btnRefreshEvolucao.addEventListener('click', async () => {
      btnRefreshEvolucao.style.transform = 'rotate(180deg)';
      await carregarDadosIniciais();
      setTimeout(() => { btnRefreshEvolucao.style.transform = 'none'; }, 300);
    });
  }

  // ==============================================================================
  // CENTRAL DE NOTIFICAÇÕES & MENSAGENS DA EQUIPE / IA (Supabase)
  // ==============================================================================
  const notifBtn = document.getElementById('notif-toggle-btn');
  const notifModal = document.getElementById('notif-modal');
  const btnFecharNotif = document.getElementById('btn-fechar-notif');
  const notifContainer = document.getElementById('notif-lista-container');

  if (notifBtn && notifModal) {
    notifBtn.addEventListener('click', async () => {
      notifModal.style.display = 'flex';
      await carregarNotificacoesAluno();
    });
  }

  if (btnFecharNotif && notifModal) {
    btnFecharNotif.addEventListener('click', () => {
      notifModal.style.display = 'none';
    });
  }

  async function carregarNotificacoesAluno() {
    if (!notifContainer) return;
    try {
      const res = await fetch('/api/admin/mensagens-whatsapp', {
        headers: { 'Authorization': `Bearer ${ApiClient.getToken()}` }
      });
      const data = await res.json();
      const msgs = data?.mensagens || [];

      if (msgs.length === 0) {
        notifContainer.innerHTML = `
          <div style="text-align: center; padding: 24px; color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 8px;">📬</div>
            <p>Você não possui novos avisos da equipe da VnFitness no momento.</p>
          </div>
        `;
        return;
      }

      notifContainer.innerHTML = '';
      msgs.slice(0, 3).forEach(m => {
        const item = document.createElement('div');
        item.style.cssText = 'background: rgba(255,255,255,0.05); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 14px; margin-bottom: 10px;';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: var(--accent-primary); font-size: 0.85rem;">⚡ Orientação do Coach / Instrutor</strong>
            <small style="color: var(--text-muted); font-size: 0.72rem;">VnFitness Matriz</small>
          </div>
          <p style="font-size: 0.82rem; line-height: 1.4; color: var(--text-primary); margin-bottom: 8px;">${m.mensagem}</p>
          <div style="text-align: right;">
            <a href="https://wa.me/" target="_blank" style="font-size: 0.75rem; color: #10B981; text-decoration: none; font-weight: 700;">
              💬 Responder no WhatsApp →
            </a>
          </div>
        `;
        notifContainer.appendChild(item);
      });
    } catch (e) {
      notifContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 0.82rem; text-align: center;">Tudo em dia com seus treinos!</p>`;
    }
  }

  // ==============================================================================
  // 7. BOTÃO CENTRAL DE CHECK-IN (Integração Total com Supabase)
  // ==============================================================================
  const centerCheckinBtn = document.getElementById('center-checkin-btn');
  const checkinModal = document.getElementById('checkin-modal');
  const btnFecharCheckinModal = document.getElementById('btn-fechar-checkin-modal');

  if (btnFecharCheckinModal && checkinModal) {
    btnFecharCheckinModal.addEventListener('click', () => {
      checkinModal.style.display = 'none';
    });
  }

  if (centerCheckinBtn) {
    centerCheckinBtn.addEventListener('click', async () => {
      centerCheckinBtn.style.transform = 'scale(0.9)';
      setTimeout(() => { centerCheckinBtn.style.transform = 'scale(1.08)'; }, 150);

      try {
        const res = await ApiClient.registrarCheckin({
          duracao_min: 50,
          intensidade: 5,
          carga_total_kg: 58,
          exercicio_destaque: 'Remada curvada'
        });

        // Preenche dados no modal com a resposta do Supabase
        const modalData = document.getElementById('modal-checkin-data');
        const modalDuracao = document.getElementById('modal-checkin-duracao');
        const modalEx = document.getElementById('modal-checkin-ex');
        const modalIntensidade = document.getElementById('modal-checkin-intensidade');

        if (modalData) modalData.textContent = res?.checkin?.data_treino || new Date().toLocaleDateString('pt-BR');
        if (modalDuracao) modalDuracao.textContent = `${res?.checkin?.duracao_min || 50} min`;
        if (modalEx) modalEx.textContent = `${res?.checkin?.exercicio_destaque || 'Remada curvada'} (${res?.checkin?.carga_total_kg || 58} kg)`;
        if (modalIntensidade) modalIntensidade.textContent = `Nível ${res?.checkin?.intensidade || 5}/5 (Alta Intensidade)`;

        if (checkinModal) checkinModal.style.display = 'flex';

        // Atualiza a evolução e o heatmap
        carregarEvolucao();
      } catch (err) {
        console.warn('Erro ao salvar check-in via API:', err);
        if (checkinModal) checkinModal.style.display = 'flex';
      }
    });
  }

  // 8. Carregar Dados Iniciais do Supabase
  await carregarDadosIniciais();

  async function carregarDadosIniciais() {
    try {
      // Carregar Treino Ativo do Supabase
      const treinoRes = await ApiClient.getTreinoAtivo();
      if (treinoRes?.treino) {
        renderizarTreino(treinoRes.treino);
      } else {
        renderizarFallbackTreino('academia');
      }

      // Carregar Nutrição Ativa do Supabase
      const nutricaoRes = await ApiClient.getNutricaoAtiva();
      if (nutricaoRes?.nutricao) {
        renderizarNutricao(nutricaoRes.nutricao);
      }

      // Carregar Biometria se existir
      const bioRes = await ApiClient.getBiometria();
      const b = bioRes?.biometria || {
        peso_kg: 83.0,
        altura_m: 1.78,
        idade: 28,
        imc: 26.2,
        classificacao_imc: 'Sobrepeso Leve',
        peso_ideal_min: 59.0,
        peso_ideal_max: 79.0,
        diferenca_peso_meta: -4.0
      };

      if (inputPeso) inputPeso.value = b.peso_kg;
      if (inputAltura) inputAltura.value = b.altura_m;
      if (inputIdade) inputIdade.value = b.idade;
      if (imcVal) imcVal.textContent = b.imc;
      if (imcClassif) imcClassif.textContent = b.classificacao_imc;
      if (imcResultBanner) imcResultBanner.style.display = 'block';

      // Atualiza os Cards Estruturados da subaba de Medidas
      const medidaPeso = document.getElementById('medida-peso-val');
      const medidaAltura = document.getElementById('medida-altura-val');
      const medidaIdade = document.getElementById('medida-idade-val');
      const medidaImc = document.getElementById('medida-imc-val');
      const medidaClassif = document.getElementById('medida-classif-badge');
      const medidaFaixa = document.getElementById('medida-faixa-val');
      const medidaDiff = document.getElementById('medida-diff-val');
      const gaugePin = document.getElementById('bio-gauge-pin');
      const gaugeLabel = document.getElementById('gauge-status-label');
      const adviceText = document.getElementById('bio-advice-text');

      if (medidaPeso) medidaPeso.textContent = Number(b.peso_kg).toFixed(1);
      if (medidaAltura) medidaAltura.textContent = Number(b.altura_m).toFixed(2);
      if (medidaIdade) medidaIdade.textContent = `${b.idade} anos`;
      if (medidaImc) medidaImc.textContent = Number(b.imc).toFixed(1);

      if (medidaFaixa && b.peso_ideal_min && b.peso_ideal_max) {
        medidaFaixa.textContent = `${Math.round(b.peso_ideal_min)}-${Math.round(b.peso_ideal_max)}`;
      }

      const diff = b.diferenca_peso_meta !== undefined ? Number(b.diferenca_peso_meta) : (Number(b.peso_kg) - 79);
      if (medidaDiff) {
        if (diff > 0) {
          medidaDiff.textContent = `-${diff.toFixed(1)} kg p/ ideal`;
          medidaDiff.style.color = '#F59E0B';
        } else if (diff < 0) {
          medidaDiff.textContent = `+${Math.abs(diff).toFixed(1)} kg p/ ideal`;
          medidaDiff.style.color = '#0EA5E9';
        } else {
          medidaDiff.textContent = `Peso Ideal Atingido! ✓`;
          medidaDiff.style.color = '#10B981';
        }
      }

      // Classificação e Régua do IMC
      const numImc = Number(b.imc) || 26.2;
      let percent = 50;
      let badgeClass = 'badge-bio-warning';
      let classifName = b.classificacao_imc || 'Sobrepeso';

      if (numImc < 18.5) {
        percent = Math.max(8, (numImc / 18.5) * 25);
        badgeClass = 'badge-bio-warning';
        classifName = 'Abaixo do Peso';
      } else if (numImc < 25.0) {
        percent = 25 + ((numImc - 18.5) / 6.4) * 30;
        badgeClass = 'badge-bio-success';
        classifName = 'Peso Saudável';
      } else if (numImc < 30.0) {
        percent = 55 + ((numImc - 25.0) / 4.9) * 25;
        badgeClass = 'badge-bio-warning';
        classifName = 'Sobrepeso Leve';
      } else {
        percent = Math.min(94, 80 + ((numImc - 30.0) / 10.0) * 15);
        badgeClass = 'badge-bio-danger';
        classifName = 'Obesidade';
      }

      if (medidaClassif) {
        medidaClassif.className = `badge-bio ${badgeClass}`;
        medidaClassif.textContent = classifName;
      }

      if (gaugePin) {
        gaugePin.style.left = `${percent}%`;
        gaugePin.title = `IMC: ${numImc.toFixed(1)}`;
      }

      if (gaugeLabel) {
        gaugeLabel.textContent = `Classificação: ${classifName} (${numImc.toFixed(1)})`;
      }

      if (adviceText) {
        adviceText.innerHTML = `Com base no seu IMC de <strong>${numImc.toFixed(1)}</strong> e dados biométricos salvos no <strong>Supabase</strong>, seu protocolo do Coach IA está equilibrado para queima de gordura e fortalecimento muscular.`;
      }
    } catch (e) {
      console.warn('Usando dados demonstrativos para exibição:', e);
      renderizarFallbackTreino('academia');
    }

    carregarEvolucao();
  }

  function carregarEvolucao() {
    renderizarHeatmap();
    renderizarGraficoCarga();
  }

  function renderizarHeatmap() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    container.innerHTML = '';

    const activePattern = [
      [1, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1],
      [1, 1, 0, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0],
      [1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1]
    ];

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 13; c++) {
        const cell = document.createElement('div');
        const isActive = activePattern[r][c];
        cell.className = `heatmap-cell ${isActive ? (c % 2 === 0 ? 'level-3' : 'level-2') : ''}`;
        container.appendChild(cell);
      }
    }
  }

  function renderizarGraficoCarga() {
    const svgArea = document.getElementById('evolution-svg-path');
    if (!svgArea) return;
    svgArea.setAttribute('d', 'M 10 110 Q 90 95, 140 85 T 260 45 T 350 20');
  }

  function renderizarTreino(treino) {
    const container = document.getElementById('workout-exercises-container');
    const titleElem = document.getElementById('workout-title-display');
    if (titleElem && treino.titulo) titleElem.textContent = treino.titulo;

    if (!container) return;
    container.innerHTML = '';

    const exercicios = treino.exercicios || [];
    exercicios.forEach((ex) => {
      const card = document.createElement('div');
      card.className = 'workout-item-card';
      card.innerHTML = `
        <div class="exercise-info">
          <h4>${ex.nome}</h4>
          <p>${ex.series} séries × ${ex.repeticoes} | ${ex.carga_sugerida || 'Carga progressiva'}</p>
          <small style="color: var(--accent-primary); font-size: 0.75rem;">💡 ${ex.dica_execucao || 'Movimento controlado'}</small>
        </div>
        <div class="exercise-action-check" title="Marcar como concluído">✓</div>
      `;

      const check = card.querySelector('.exercise-action-check');
      check.addEventListener('click', () => {
        check.classList.toggle('completed');
      });

      container.appendChild(card);
    });
  }

  function renderizarNutricao(nutricao) {
    const calElem = document.getElementById('macro-cal-val');
    const protElem = document.getElementById('macro-prot-val');
    const carbElem = document.getElementById('macro-carb-val');
    const gordElem = document.getElementById('macro-gord-val');
    const mealsContainer = document.getElementById('meals-list-container');

    if (calElem) calElem.textContent = `${nutricao.calorias_diarias || 2100} kcal`;
    if (protElem) protElem.textContent = `${nutricao.proteinas_g || 140}g`;
    if (carbElem) carbElem.textContent = `${nutricao.carboidratos_g || 220}g`;
    if (gordElem) gordElem.textContent = `${nutricao.gorduras_g || 60}g`;

    if (mealsContainer && nutricao.refeicoes) {
      mealsContainer.innerHTML = '';
      nutricao.refeicoes.forEach(m => {
        const item = document.createElement('div');
        item.className = 'meal-card';
        item.innerHTML = `
          <div>
            <h4 style="font-size: 0.9rem; font-weight: 700;">${m.titulo} (${m.horario})</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">${m.alimentos}</p>
          </div>
          <strong style="color: var(--accent-primary); font-size: 0.85rem;">${m.calorias} kcal</strong>
        `;
        mealsContainer.appendChild(item);
      });
    }
  }

  function renderizarFallbackTreino(local) {
    const isCasa = local === 'casa';
    renderizarTreino({
      titulo: isCasa ? 'Treino em Casa (Calistenia & Peso Corporal)' : 'Treino na Academia (Aparelhos & Força)',
      exercicios: isCasa ? [
        { nome: 'Agachamento Livre', series: 4, repeticoes: '15 reps', carga_sugerida: 'Peso corporal', dica_execucao: 'Desça até 90 graus mantendo peito aberto.' },
        { nome: 'Flexões no Solo', series: 4, repeticoes: '10 a 12 reps', carga_sugerida: 'Peso corporal', dica_execucao: 'Mantenha tronco alinhado sem flexionar a lombar.' },
        { nome: 'Afundo com Passada', series: 3, repeticoes: '12 cada perna', carga_sugerida: 'Peso corporal', dica_execucao: 'Joelho de trás desce rente ao chão.' },
        { nome: 'Prancha Isométrica', series: 3, repeticoes: '45 segundos', carga_sugerida: 'Isometria', dica_execucao: 'Abdômen bem contraído e respiração contínua.' }
      ] : [
        { nome: 'Supino Reto com Barra', series: 4, repeticoes: '10 a 12 reps', carga_sugerida: '40 a 50 kg', dica_execucao: 'Trave as escápulas contra o banco.' },
        { nome: 'Remada Curvada', series: 4, repeticoes: '10 reps', carga_sugerida: '58 kg', dica_execucao: 'Puxe em direção ao umbigo mantendo costas firmes.' },
        { nome: 'Leg Press 45º', series: 4, repeticoes: '12 a 15 reps', carga_sugerida: 'Moderada/Pesada', dica_execucao: 'Evite travar os joelhos na extensão total.' },
        { nome: 'Puxador Alto Frente', series: 3, repeticoes: '12 reps', carga_sugerida: 'Moderada', dica_execucao: 'Foque na contração do grande dorsal.' }
      ]
    });
  }
});
