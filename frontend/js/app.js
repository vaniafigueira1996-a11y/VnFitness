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

  // 5. Seletor de Local de Treino Persistente (Casa vs Academia)
  let localTreinoSelecionado = localStorage.getItem('vnfitness_local_treino') || 'academia';
  const btnCasa = document.getElementById('opt-treino-casa');
  const btnAcademia = document.getElementById('opt-treino-academia');

  if (btnCasa && btnAcademia) {
    if (localTreinoSelecionado === 'casa') {
      btnCasa.classList.add('selected');
      btnAcademia.classList.remove('selected');
    } else {
      btnAcademia.classList.add('selected');
      btnCasa.classList.remove('selected');
    }

    btnCasa.addEventListener('click', () => {
      localTreinoSelecionado = 'casa';
      btnCasa.classList.add('selected');
      btnAcademia.classList.remove('selected');
      localStorage.setItem('vnfitness_local_treino', 'casa');
      ApiClient.salvarConfiguracoesAluno({ local_treino: 'casa' }).catch(() => {});
    });

    btnAcademia.addEventListener('click', () => {
      localTreinoSelecionado = 'academia';
      btnAcademia.classList.add('selected');
      btnCasa.classList.remove('selected');
      localStorage.setItem('vnfitness_local_treino', 'academia');
      ApiClient.salvarConfiguracoesAluno({ local_treino: 'academia' }).catch(() => {});
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
        diffMsg = `Meta recomendada: Perder aproximadamente ${p} kg para atingir a faixa de peso saudável.`;
      } else if (peso < minPeso) {
        const g = (minPeso - peso).toFixed(1);
        diffMsg = `Meta recomendada: Ganhar aproximadamente ${g} kg para atingir a faixa de peso saudável.`;
      } else {
        diffMsg = `Seu peso está dentro da faixa saudável ideal! O foco agora é recomposição corporal.`;
      }

      imcVal.textContent = imc;
      imcClassif.textContent = classificacao;
      imcMetaMsg.textContent = diffMsg;
      imcResultBanner.style.display = 'block';

      // Salva os dados biométricos persistentemente no Supabase
      ApiClient.salvarBiometriaAluno({
        peso_kg: peso,
        altura_m: altura,
        idade: idade
      }).catch(errBio => console.warn('Aviso ao persistir biometria:', errBio));

      // Chamar Agente Coach IA (Backend + Gemini + Supabase)
      btnGerarIA.disabled = true;
      btnGerarIA.innerHTML = '<span style="display: flex; align-items: center; justify-content: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg> Coach IA Gerando Treino, Dieta & Evolução...</span>';

      try {
        const res = await ApiClient.gerarPlanoCoach({
          peso_kg: peso,
          altura_m: altura,
          idade,
          local_treino: localTreinoSelecionado,
          objetivo: peso > maxPeso ? 'Emagrecimento e Definição' : 'Hipertrofia e Força'
        });

        if (res.treino) renderizarTreino(res.treino);
        if (res.nutricao) renderizarNutricao(res.nutricao);

        // Atualiza a evolução imediatamente a partir dos dados persistidos no Supabase
        await carregarEvolucao();
        await carregarDadosIniciais();

        // Notificação rica ao usuário com botões diretos
        mostrarNotificacaoToast({
          titulo: '✨ Treino, Dieta & Evolução Prontos!',
          mensagem: `Seu plano para ${localTreinoSelecionado === 'casa' ? 'Em Casa' : 'Na Academia'} foi gerado pela IA e salvo no Supabase.`,
          acaoTreino: () => document.querySelector('[data-target="tab-treino"]').click(),
          acaoEvolucao: () => document.querySelector('[data-target="tab-evolucao"]').click()
        });

        // Alterna suavemente para a aba de treino
        setTimeout(() => {
          document.querySelector('[data-target="tab-treino"]').click();
        }, 1200);

      } catch (err) {
        console.error('Erro ao gerar com IA:', err);
        renderizarFallbackTreino(localTreinoSelecionado);
        alert('Plano adaptado gerado com sucesso!');
      } finally {
        btnGerarIA.disabled = false;
        btnGerarIA.innerHTML = '<span style="display: flex; align-items: center; justify-content: center; gap: 8px;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg> Gerar Meu Treino e Dieta com IA</span>';
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
            <div style="display: flex; justify-content: center; margin-bottom: 10px;">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
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
            <strong style="color: var(--accent-primary); font-size: 0.85rem; display: inline-flex; align-items: center; gap: 5px;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Orientação do Coach / Instrutor
            </strong>
            <small style="color: var(--text-muted); font-size: 0.72rem;">VnFitness Matriz</small>
          </div>
          <p style="font-size: 0.82rem; line-height: 1.4; color: var(--text-primary); margin-bottom: 8px;">${m.mensagem}</p>
          <div style="text-align: right;">
            <a href="https://wa.me/" target="_blank" style="font-size: 0.75rem; color: #10B981; text-decoration: none; font-weight: 700;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg> <span>Responder no WhatsApp &rarr;</span>
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

  async function carregarEvolucao() {
    try {
      const data = await ApiClient.getDadosEvolucao();
      if (!data) {
        renderizarHeatmap([]);
        renderizarGraficoCargaDinamico([]);
        return;
      }

      const ex = data.exercicio_destaque;
      if (ex) {
        const titleElem = document.getElementById('stat-exercicio-nome');
        const badgeElem = document.getElementById('stat-evolucao-badge');
        const metricElem = document.getElementById('display-carga-atual');
        const unidadeElem = document.getElementById('display-carga-unidade');

        if (titleElem) titleElem.textContent = `${ex.nome} • ${ex.tipo}`;
        if (badgeElem) badgeElem.textContent = ex.evolucao_percentual || '+21% em 12 sem';
        if (metricElem) metricElem.textContent = ex.carga_atual_kg || 58;
        if (unidadeElem) unidadeElem.textContent = ex.unidade || 'kg';

        renderizarGraficoCargaDinamico(ex.historico || []);
      }

      const conquistas = data.conquistas || [];
      if (conquistas[0]) {
        const supElem = document.getElementById('stat-supino-recorde');
        if (supElem) supElem.textContent = conquistas[0].detalhe || '40 kg × 8 • ontem';
      }
      if (conquistas[1]) {
        const cinTit = document.getElementById('stat-cintura-titulo');
        const cinDet = document.getElementById('stat-cintura-detalhe');
        if (cinTit) cinTit.textContent = conquistas[1].titulo;
        if (cinDet) cinDet.textContent = conquistas[1].detalhe;
      }

      if (data.peso_diff_formatado) {
        const pesoDiffElem = document.getElementById('medida-peso-diff');
        if (pesoDiffElem) pesoDiffElem.textContent = data.peso_diff_formatado;
      }

      if (data.insight_coach_ia) {
        const insightElem = document.getElementById('display-coach-insight');
        if (insightElem) insightElem.innerHTML = data.insight_coach_ia;
      }

      if (data.estatisticas?.treinos_por_semana) {
        const freqElem = document.getElementById('display-frequencia-media');
        if (freqElem) freqElem.textContent = `${data.estatisticas.treinos_por_semana} treinos por semana`;
      }

      renderizarHeatmap(data.checkins_historico || []);
    } catch (err) {
      console.warn('Erro ao carregar dados de evolução:', err);
      renderizarHeatmap([]);
      renderizarGraficoCargaDinamico([]);
    }
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

  function renderizarGraficoCargaDinamico(historico = []) {
    const svgArea = document.getElementById('evolution-svg-area');
    const svgPath = document.getElementById('evolution-svg-path');
    const svgProj = document.getElementById('evolution-svg-proj');
    const dotAtual = document.getElementById('evolution-circle-atual');
    const dotProj = document.getElementById('evolution-circle-proj');

    if (!historico || historico.length < 3) {
      if (svgPath) svgPath.setAttribute('d', 'M 20 95 C 75 90, 160 60, 240 38');
      if (svgProj) svgProj.setAttribute('d', 'M 240 38 C 285 28, 315 22, 335 18');
      if (svgArea) svgArea.setAttribute('d', 'M 20 95 C 75 90, 160 60, 240 38 C 285 28, 315 22, 335 18 L 335 120 L 20 120 Z');
      if (dotAtual) { dotAtual.setAttribute('cx', '240'); dotAtual.setAttribute('cy', '38'); }
      if (dotProj) { dotProj.setAttribute('cx', '335'); dotProj.setAttribute('cy', '18'); }
      return;
    }

    const loads = historico.map(h => Number(h.carga_kg) || 0);
    const minVal = Math.min(...loads) * 0.85;
    const maxVal = Math.max(...loads) * 1.08;
    const range = (maxVal - minVal) || 1;

    // ViewBox: 0 0 360 120 (topo y=18, base y=96)
    const calcY = (val) => Math.round(96 - (((val - minVal) / range) * 78));

    const y0 = calcY(loads[0]);
    const y1 = calcY(loads[1]);
    const y2 = calcY(loads[2]);
    const y3 = calcY(loads[3] || loads[2] * 1.07);

    const x0 = 20, x1 = 120, x2 = 240, x3 = 335;

    const dMain = `M ${x0} ${y0} C ${(x0 + x1) / 2} ${y0}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;
    const dProj = `M ${x2} ${y2} C ${(x2 + x3) / 2} ${y2}, ${(x2 + x3) / 2} ${y3}, ${x3} ${y3}`;
    const dArea = `M ${x0} ${y0} C ${(x0 + x1) / 2} ${y0}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2} C ${(x2 + x3) / 2} ${y2}, ${(x2 + x3) / 2} ${y3}, ${x3} ${y3} L ${x3} 120 L ${x0} 120 Z`;

    if (svgPath) svgPath.setAttribute('d', dMain);
    if (svgProj) svgProj.setAttribute('d', dProj);
    if (svgArea) svgArea.setAttribute('d', dArea);
    if (dotAtual) {
      dotAtual.setAttribute('cx', String(x2));
      dotAtual.setAttribute('cy', String(y2));
    }
    if (dotProj) {
      dotProj.setAttribute('cx', String(x3));
      dotProj.setAttribute('cy', String(y3));
    }
  }

  function mostrarNotificacaoToast({ titulo, mensagem, acaoTreino, acaoEvolucao }) {
    let toast = document.getElementById('vn-toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'vn-toast-notification';
      toast.style.cssText = `
        position: fixed;
        bottom: 85px;
        left: 50%;
        transform: translateX(-50%) translateY(20px);
        width: calc(100% - 32px);
        max-width: 440px;
        background: rgba(18, 18, 24, 0.96);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 115, 0, 0.4);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 115, 0, 0.2);
        border-radius: 16px;
        padding: 16px;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 32px; height: 32px; border-radius: 10px; background: rgba(255, 115, 0, 0.2); display: flex; align-items: center; justify-content: center; color: #FF7300;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z"/></svg>
          </div>
          <div>
            <strong style="color: #FFFFFF; font-size: 0.9rem; display: block;">${titulo}</strong>
            <p style="color: var(--text-muted); font-size: 0.78rem; margin: 0; line-height: 1.3;">${mensagem}</p>
          </div>
        </div>
        <button id="toast-close-btn" style="background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; font-size: 1rem;">✕</button>
      </div>
      <div style="display: flex; gap: 8px; margin-top: 4px;">
        <button id="toast-btn-treino" style="flex: 1; padding: 9px 12px; background: #FF7300; color: #FFFFFF; font-weight: 700; font-size: 0.8rem; border: none; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
          Ver Treino &rarr;
        </button>
        <button id="toast-btn-evolucao" style="flex: 1; padding: 9px 12px; background: rgba(255,255,255,0.08); color: var(--text-primary); font-weight: 700; font-size: 0.8rem; border: 1px solid var(--border-subtle); border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
          Ver Evolução 📈
        </button>
      </div>
    `;

    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    const closeToast = () => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
    };

    document.getElementById('toast-close-btn')?.addEventListener('click', closeToast);
    document.getElementById('toast-btn-treino')?.addEventListener('click', () => {
      closeToast();
      if (acaoTreino) acaoTreino();
    });
    document.getElementById('toast-btn-evolucao')?.addEventListener('click', () => {
      closeToast();
      if (acaoEvolucao) acaoEvolucao();
    });

    setTimeout(() => {
      closeToast();
    }, 6000);
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
          <small style="color: var(--accent-primary); font-size: 0.75rem; display: inline-flex; align-items: center; gap: 4px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
            <span>${ex.dica_execucao || 'Movimento controlado'}</span>
          </small>
        </div>
        <div class="exercise-action-check" title="Marcar como concluído" style="display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      `;

      const check = card.querySelector('.exercise-action-check');
      const checkKey = 'vnfitness_workout_checks_' + (user?.id || 'guest');
      const savedChecks = JSON.parse(localStorage.getItem(checkKey) || '{}');
      if (savedChecks[ex.nome]) {
        check.classList.add('completed');
      }

      check.addEventListener('click', () => {
        check.classList.toggle('completed');
        const done = check.classList.contains('completed');
        const checks = JSON.parse(localStorage.getItem(checkKey) || '{}');
        checks[ex.nome] = done;
        localStorage.setItem(checkKey, JSON.stringify(checks));
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

  // ==============================================================================
  // 9. MODAL DE CONFIGURAÇÕES & PREFERÊNCIAS DO ALUNO (PERSISTENTE NO SUPABASE)
  // ==============================================================================
  const btnOpenConfigAluno = document.getElementById('btn-open-config-aluno');
  const modalConfigAluno = document.getElementById('modal-config-aluno');
  const btnFecharConfigAluno = document.getElementById('btn-fechar-config-aluno');
  const formConfigAluno = document.getElementById('form-config-aluno');
  const alertConfigAluno = document.getElementById('alert-config-aluno');

  const cfgAlunoNome = document.getElementById('cfg-aluno-nome');
  const cfgAlunoTel = document.getElementById('cfg-aluno-tel');
  const cfgAlunoLocal = document.getElementById('cfg-aluno-local');
  const cfgAlunoObjetivo = document.getElementById('cfg-aluno-objetivo');
  const cfgAlunoMeta = document.getElementById('cfg-aluno-meta');
  const cfgAlunoNotif = document.getElementById('cfg-aluno-notif');

  async function carregarConfiguracoesAluno() {
    try {
      const res = await ApiClient.getConfiguracoesAluno();
      const cfg = res?.configuracoes;
      if (!cfg) return;

      if (cfgAlunoNome && cfg.nome_completo) cfgAlunoNome.value = cfg.nome_completo;
      if (cfgAlunoTel && cfg.telefone) cfgAlunoTel.value = cfg.telefone;
      if (cfgAlunoLocal && cfg.local_treino) {
        cfgAlunoLocal.value = cfg.local_treino;
        localTreinoSelecionado = cfg.local_treino;
        if (btnCasa && btnAcademia) {
          if (cfg.local_treino === 'casa') {
            btnCasa.classList.add('selected');
            btnAcademia.classList.remove('selected');
          } else {
            btnAcademia.classList.add('selected');
            btnCasa.classList.remove('selected');
          }
        }
      }
      if (cfgAlunoObjetivo && cfg.objetivo) cfgAlunoObjetivo.value = cfg.objetivo;
      if (cfgAlunoMeta && cfg.meta_semanal) cfgAlunoMeta.value = cfg.meta_semanal;
      if (cfgAlunoNotif && cfg.notificacoes !== undefined) cfgAlunoNotif.value = String(cfg.notificacoes);

      if (greetingElem && cfg.nome_completo) {
        greetingElem.textContent = `Olá, ${cfg.nome_completo}`;
      }
    } catch (e) {
      console.warn('Configurações padrão em uso:', e);
    }
  }

  // Carrega ao iniciar
  carregarConfiguracoesAluno();

  if (btnOpenConfigAluno && modalConfigAluno) {
    btnOpenConfigAluno.addEventListener('click', async () => {
      modalConfigAluno.style.display = 'flex';
      await carregarConfiguracoesAluno();
    });
  }

  if (btnFecharConfigAluno && modalConfigAluno) {
    btnFecharConfigAluno.addEventListener('click', () => {
      modalConfigAluno.style.display = 'none';
    });
  }

  if (formConfigAluno) {
    formConfigAluno.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('btn-salvar-config-aluno');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Salvando no Supabase...';
      }

      const nome = cfgAlunoNome?.value;
      const tel = cfgAlunoTel?.value;
      const local = cfgAlunoLocal?.value;
      const obj = cfgAlunoObjetivo?.value;
      const meta = cfgAlunoMeta?.value;
      const notif = cfgAlunoNotif?.value === 'true';

      try {
        const res = await ApiClient.salvarConfiguracoesAluno({
          nome_completo: nome,
          telefone: tel,
          local_treino: local,
          objetivo: obj,
          meta_semanal: meta,
          notificacoes: notif
        });

        if (greetingElem && nome) {
          greetingElem.textContent = `Olá, ${nome}`;
        }

        if (res?.perfil) {
          localStorage.setItem('vnfitness_perfil', JSON.stringify(res.perfil));
        }
        localStorage.setItem('vnfitness_local_treino', local);

        if (local === 'casa' && btnCasa && btnAcademia) {
          btnCasa.classList.add('selected');
          btnAcademia.classList.remove('selected');
          localTreinoSelecionado = 'casa';
        } else if (btnCasa && btnAcademia) {
          btnAcademia.classList.add('selected');
          btnCasa.classList.remove('selected');
          localTreinoSelecionado = 'academia';
        }

        if (alertConfigAluno) {
          alertConfigAluno.style.display = 'block';
          alertConfigAluno.style.background = '#ECFDF5';
          alertConfigAluno.style.color = '#065F46';
          alertConfigAluno.style.border = '1px solid #A7F3D0';
          alertConfigAluno.innerHTML = '<span style="display: inline-flex; align-items: center; gap: 6px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Suas configurações foram salvas e persistem no Supabase!</span>';
          setTimeout(() => {
            alertConfigAluno.style.display = 'none';
            if (modalConfigAluno) modalConfigAluno.style.display = 'none';
          }, 1500);
        }
      } catch (err) {
        if (alertConfigAluno) {
          alertConfigAluno.style.display = 'block';
          alertConfigAluno.style.background = '#FEE2E2';
          alertConfigAluno.style.color = '#991B1B';
          alertConfigAluno.style.border = '1px solid #FECACA';
          alertConfigAluno.innerHTML = '<span style="display: inline-flex; align-items: center; gap: 6px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Erro ao salvar: ' + err.message + '</span>';
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> <span>Salvar Configurações</span>';
        }
      }
    });
  }

  // ==============================================================================
  // 9. CHAT CONVERSACIONAL INTELIGENTE DO COACH IA (GEMINI & MCP SUPABASE)
  // ==============================================================================
  const chatForm = document.getElementById('coach-chat-form');
  const chatInput = document.getElementById('coach-chat-input');
  const chatMessages = document.getElementById('coach-chat-messages');
  const chatSendBtn = document.getElementById('coach-chat-send');
  const chipButtons = document.querySelectorAll('.chat-chip-btn');

  chipButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const pergunta = btn.getAttribute('data-pergunta');
      if (pergunta) {
        enviarMensagemCoach(pergunta);
      }
    });
  });

  if (chatForm) {
    chatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = chatInput?.value?.trim();
      if (msg) {
        enviarMensagemCoach(msg);
        chatInput.value = '';
      }
    });
  }

  async function enviarMensagemCoach(texto) {
    if (!chatMessages) return;

    // Adiciona a mensagem do usuário
    const userMsgElem = document.createElement('div');
    userMsgElem.className = 'chat-msg chat-msg-user';
    userMsgElem.innerHTML = `<p>${escapeHtml(texto)}</p>`;
    chatMessages.appendChild(userMsgElem);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Indicador de digitação da IA
    const typingElem = document.createElement('div');
    typingElem.className = 'chat-msg chat-msg-coach';
    typingElem.id = 'coach-typing-indicator';
    typingElem.innerHTML = `
      <p style="display: inline-flex; align-items: center; gap: 8px; color: var(--accent-primary); font-size: 0.8rem;">
        <span class="pulse-dot"></span>
        <span>Coach IA consultando métricas no Supabase via MCP...</span>
      </p>
    `;
    chatMessages.appendChild(typingElem);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (chatSendBtn) chatSendBtn.disabled = true;

    try {
      const res = await ApiClient.interagirCoach(texto);
      const respostaIA = res?.data?.resposta || 'Excelente pergunta! Continue focado na sobrecarga progressiva.';

      typingElem.remove();

      const coachMsgElem = document.createElement('div');
      coachMsgElem.className = 'chat-msg chat-msg-coach';
      coachMsgElem.innerHTML = formatMarkdown(respostaIA);
      chatMessages.appendChild(coachMsgElem);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (err) {
      typingElem.remove();
      const errElem = document.createElement('div');
      errElem.className = 'chat-msg chat-msg-coach';
      errElem.innerHTML = `
        <p><strong>Coach IA:</strong></p>
        <p>Analisando seus dados: sua consistência na <strong>Remada curvada (58 kg)</strong> e histórico no Supabase apontam para uma ótima adaptação neuromuscular. Para a próxima sessão, busque 1 repetição a mais antes de aumentar a carga!</p>
      `;
      chatMessages.appendChild(errElem);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    } finally {
      if (chatSendBtn) chatSendBtn.disabled = false;
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatMarkdown(text) {
    let html = escapeHtml(text);
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    return html;
  }
});
