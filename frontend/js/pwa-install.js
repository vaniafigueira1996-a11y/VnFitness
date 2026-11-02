/**
 * VnFitness — PWA Installation & Service Worker Controller
 * Compatível com Celulares (Android e iOS), Tablets e Computadores (Windows, Mac, Linux)
 */

(function () {
  let deferredPrompt = null;

  // 1. Registro do Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('✅ [PWA] Service Worker registrado com escopo:', reg.scope);
        })
        .catch((err) => {
          console.warn('⚠️ [PWA] Falha no registro do Service Worker:', err);
        });
    });
  }

  // 2. Detecção de Dispositivo e Modo Standalone
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const isMobileOrTablet =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  // Se já estiver rodando instalado, não exibe o banner
  if (isStandalone) {
    console.log('📱 [PWA] App rodando em modo standalone (já instalado).');
    return;
  }

  // 3. Captura do Evento Nativo 'beforeinstallprompt' (Android, Chrome, Edge, Computadores)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('💡 [PWA] Evento beforeinstallprompt capturado. Pronto para instalação!');

    // Verifica se o usuário dispensou o banner nas últimas 24 horas
    const dismissedAt = localStorage.getItem('vnfitness_pwa_dismissed');
    if (dismissedAt) {
      const hoursAgo = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60);
      if (hoursAgo < 24) {
        habilitarBotoesManuais();
        return;
      }
    }

    exibirBannerInstalacao();
    habilitarBotoesManuais();
  });

  // 4. Tratamento do evento de instalação concluída
  window.addEventListener('appinstalled', () => {
    console.log('🎉 [PWA] VnFitness instalado com sucesso no dispositivo!');
    deferredPrompt = null;
    removerBannerInstalacao();
    exibirToastSucesso();
  });

  // 5. Configuração para dispositivos iOS
  if (isIOS && !isStandalone) {
    const dismissedAt = localStorage.getItem('vnfitness_pwa_dismissed');
    if (!dismissedAt) {
      setTimeout(() => {
        exibirBannerInstalacao(true);
      }, 3000);
    }
    habilitarBotoesManuais(true);
  }

  // 6. Construção e exibição do Banner Flutuante de Instalação
  function exibirBannerInstalacao(isIosDevice = false) {
    if (document.getElementById('pwa-install-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'pwa-floating-banner';

    const deviceText = isMobileOrTablet
      ? 'Instalar no Celular / Tablet'
      : 'Instalar no Computador (App Desktop)';

    const deviceSub = isMobileOrTablet
      ? 'Acesso rápido na tela inicial, tela cheia e notificações.'
      : 'Janela nativa dedicada, inicialização rápida e sem barra de navegação.';

    banner.innerHTML = `
      <div class="pwa-banner-content">
        <div class="pwa-banner-icon-box">
          <svg width="28" height="28" viewBox="0 0 512 512" fill="none">
            <rect width="512" height="512" rx="128" fill="#182235" />
            <path d="M 280 64 L 144 288 L 264 288 L 232 448 L 368 224 L 248 224 Z" fill="#FF7300" />
          </svg>
        </div>
        <div class="pwa-banner-text">
          <strong>${deviceText}</strong>
          <span>${deviceSub}</span>
        </div>
      </div>
      <div class="pwa-banner-actions">
        <button id="pwa-btn-install" class="pwa-btn-primary">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Instalar Agora</span>
        </button>
        <button id="pwa-btn-dismiss" class="pwa-btn-close" title="Dispensar por hoje">✕</button>
      </div>
    `;

    document.body.appendChild(banner);

    // Eventos dos botões do banner
    const btnInstall = document.getElementById('pwa-btn-install');
    const btnDismiss = document.getElementById('pwa-btn-dismiss');

    if (btnInstall) {
      btnInstall.addEventListener('click', () => {
        if (isIosDevice) {
          abrirModalGuiaIOS();
        } else {
          acionarInstalacaoNativa();
        }
      });
    }

    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        localStorage.setItem('vnfitness_pwa_dismissed', Date.now().toString());
        removerBannerInstalacao();
      });
    }
  }

  function removerBannerInstalacao() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.opacity = '0';
      banner.style.transform = 'translateY(20px)';
      setTimeout(() => banner.remove(), 300);
    }
  }

  // 7. Acionamento do Prompt Nativo
  async function acionarInstalacaoNativa() {
    if (!deferredPrompt) {
      if (isIOS) {
        abrirModalGuiaIOS();
        return;
      }
      alert('Para instalar o VnFitness neste navegador, clique no ícone de instalar no canto da barra de endereços (ou no menu do navegador -> Instalar Aplicativo).');
      return;
    }

    try {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      console.log('Resultado da escolha do usuário:', choice.outcome);
      if (choice.outcome === 'accepted') {
        removerBannerInstalacao();
      }
      deferredPrompt = null;
    } catch (err) {
      console.warn('Erro ao acionar prompt de instalação:', err);
    }
  }

  // 8. Habilitação de botões manuais na interface
  function habilitarBotoesManuais(isIos = false) {
    const triggers = document.querySelectorAll('.pwa-install-trigger, #btn-pwa-install');
    triggers.forEach((btn) => {
      btn.style.display = 'inline-flex';
      btn.onclick = (e) => {
        e.preventDefault();
        if (isIos) {
          abrirModalGuiaIOS();
        } else {
          acionarInstalacaoNativa();
        }
      };
    });
  }

  // 9. Guia Passo a Passo para iPhone / iPad (Safari)
  function abrirModalGuiaIOS() {
    if (document.getElementById('pwa-ios-modal')) return;

    const modal = document.createElement('div');
    modal.id = 'pwa-ios-modal';
    modal.className = 'pwa-modal-overlay';
    modal.innerHTML = `
      <div class="pwa-modal-card">
        <div class="pwa-modal-header">
          <h3>Como Instalar no iPhone / iPad</h3>
          <button id="pwa-close-ios-modal" class="pwa-btn-close">✕</button>
        </div>
        <p style="font-size: 0.85rem; color: #9CA3AF; margin-bottom: 16px;">
          Adicione o <strong>VnFitness</strong> à sua Tela de Início para ter a experiência de aplicativo nativo em tela inteira:
        </p>
        <div class="pwa-ios-step">
          <div class="pwa-step-num">1</div>
          <div class="pwa-step-info">
            Toque no botão <strong>Compartilhar</strong> na barra inferior do Safari
            <div style="font-size: 1.2rem; margin-top: 4px;">⎋</div>
          </div>
        </div>
        <div class="pwa-ios-step">
          <div class="pwa-step-num">2</div>
          <div class="pwa-step-info">
            Role a lista para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>
            <div style="font-size: 1rem; margin-top: 4px; color: #FF7300;">➕ Adicionar à Tela de Início</div>
          </div>
        </div>
        <div class="pwa-ios-step">
          <div class="pwa-step-num">3</div>
          <div class="pwa-step-info">
            Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto!
          </div>
        </div>
        <button id="pwa-btn-ios-ok" class="pwa-btn-primary" style="width: 100%; margin-top: 14px; justify-content: center;">
          Entendi, vou adicionar!
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = document.getElementById('pwa-close-ios-modal');
    const okBtn = document.getElementById('pwa-btn-ios-ok');

    const fechar = () => modal.remove();
    if (closeBtn) closeBtn.onclick = fechar;
    if (okBtn) okBtn.onclick = fechar;
    modal.onclick = (e) => {
      if (e.target === modal) fechar();
    };
  }

  // 10. Toast de celebração após instalação
  function exibirToastSucesso() {
    const toast = document.createElement('div');
    toast.className = 'pwa-toast-success';
    toast.innerHTML = `
      <span style="font-size: 1.2rem;">🎉</span>
      <div>
        <strong>VnFitness Instalado!</strong>
        <p style="font-size: 0.75rem; margin: 0; color: rgba(255,255,255,0.85);">Acesse direto da sua tela de início ou área de trabalho.</p>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // Expor globalmente para uso direto em botões
  window.VnFitnessPWA = {
    instalar: acionarInstalacaoNativa,
    abrirGuiaIOS: abrirModalGuiaIOS
  };
})();
