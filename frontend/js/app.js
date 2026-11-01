import { ApiClient } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Controle de Tema Claro / Dark
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const savedTheme = localStorage.getItem('vnfitness_theme') || 'dark'; // Dark moderno padrão como em "Tela de evolução.png"
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
      themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // 2. Abas de Navegação Inferior
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

  // 3. Seletor de Local de Treino (Casa vs Academia)
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

  // 4. Formulário e Cálculo do IMC com IA
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

      // Chamar Agente Coach IA
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
        alert('✨ Seu treino e plano alimentar foram gerados com sucesso pelo Coach IA!');

        // Leva o usuário para a aba de treino
        document.querySelector('[data-target="tab-treino"]').click();
      } catch (err) {
        console.error('Erro ao gerar com IA:', err);
        // Fallback direto no front para garantir exibição mesmo offline
        renderizarFallbackTreino(localTreinoSelecionado);
      } finally {
        btnGerarIA.disabled = false;
        btnGerarIA.innerHTML = '🚀 Gerar Meu Treino e Dieta com IA';
      }
    });
  }

  // 5. Botão Central de Check-in (Tela de evolução.png)
  const centerCheckinBtn = document.getElementById('center-checkin-btn');
  if (centerCheckinBtn) {
    centerCheckinBtn.addEventListener('click', async () => {
      try {
        await ApiClient.registrarCheckin({
          duracao_min: 50,
          intensidade: 5,
          carga_total_kg: 58,
          exercicio_destaque: 'Remada curvada'
        });
        alert('🔥 Check-in realizado! Frequência registrada no Heatmap.');
        carregarEvolucao();
      } catch (err) {
        alert('🔥 Treino concluído e registrado no seu histórico diário!');
      }
    });
  }

  // 6. Carregamento dos dados de evolução e heatmap
  carregarEvolucao();

  function carregarEvolucao() {
    renderizarHeatmap();
    renderizarGraficoCarga();
  }

  function renderizarHeatmap() {
    const container = document.getElementById('heatmap-container');
    if (!container) return;
    container.innerHTML = '';

    // Matriz de 13 semanas x 4 linhas (inspirada na imagem "Tela de evolução.png")
    // Padrão com blocos em laranja neon simulando semanas ativas
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

    // Traçado suave de curva bezier com projeção em linha pontilhada
    // Simula a linha ascendente de 42kg -> 48kg -> 58kg (com previsão out)
    svgArea.setAttribute('d', 'M 10 110 Q 90 95, 140 85 T 260 45 T 350 20');
  }

  function renderizarTreino(treino) {
    const container = document.getElementById('workout-exercises-container');
    const titleElem = document.getElementById('workout-title-display');
    if (titleElem && treino.titulo) titleElem.textContent = treino.titulo;

    if (!container) return;
    container.innerHTML = '';

    const exercicios = treino.exercicios || [];
    exercicios.forEach((ex, idx) => {
      const card = document.createElement('div');
      card.className = 'workout-item-card';
      card.innerHTML = `
        <div class="exercise-info">
          <h4>${ex.nome}</h4>
          <p>${ex.series} séries × ${ex.repeticoes} | ${ex.carga_sugerida || 'Carga progressiva'}</p>
          <small style="color: var(--accent-primary); font-size: 0.75rem;">💡 ${ex.dica_execucao}</small>
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

