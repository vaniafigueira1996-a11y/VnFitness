import { ApiClient } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('auth-form');
  const title = document.getElementById('auth-title');
  const submitBtn = document.getElementById('submit-btn');
  const toggleLink = document.getElementById('toggle-auth-mode');
  const toggleQuestion = document.getElementById('toggle-question');
  const nameGroup = document.getElementById('name-group');
  const nameInput = document.getElementById('name-input');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const togglePassBtn = document.getElementById('toggle-password');
  const alertBox = document.getElementById('auth-alert');

  const tabLogin = document.getElementById('tab-btn-login');
  const tabSignup = document.getElementById('tab-btn-signup');

  // Gerenciamento de foto de fundo (Mulher atleta como padrão + Upload personalizado)
  const bgImg = document.getElementById('login-bg-img');
  const bgFileInput = document.getElementById('bg-file-input');
  const btnResetBg = document.getElementById('btn-reset-bg');
  const DEFAULT_BG = 'img/login_bg.jpg';
  const STORAGE_KEY = 'vnfitness_custom_login_bg';

  function initBackground() {
    const savedBg = localStorage.getItem(STORAGE_KEY);
    if (savedBg && bgImg) {
      bgImg.src = savedBg;
      if (btnResetBg) btnResetBg.style.display = 'inline-flex';
    } else if (bgImg) {
      bgImg.src = DEFAULT_BG;
      if (btnResetBg) btnResetBg.style.display = 'none';
    }
  }

  initBackground();

  if (bgFileInput) {
    bgFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        showAlert('Por favor, selecione um arquivo de imagem válido.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target.result;
        try {
          localStorage.setItem(STORAGE_KEY, dataUrl);
          if (bgImg) bgImg.src = dataUrl;
          if (btnResetBg) btnResetBg.style.display = 'inline-flex';
          showAlert('Foto de fundo atualizada com sucesso!', 'info');
          setTimeout(hideAlert, 2500);
        } catch (storageErr) {
          // Se a imagem for muito pesada para o localStorage, ainda aplica na sessão
          if (bgImg) bgImg.src = dataUrl;
          if (btnResetBg) btnResetBg.style.display = 'inline-flex';
          showAlert('Foto aplicada nesta sessão!', 'info');
        }
      };
      reader.readAsDataURL(file);
    });
  }

  if (btnResetBg) {
    btnResetBg.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      if (bgImg) bgImg.src = DEFAULT_BG;
      btnResetBg.style.display = 'none';
      if (bgFileInput) bgFileInput.value = '';
      showAlert('Foto padrão da atleta restaurada!', 'info');
      setTimeout(hideAlert, 2000);
    });
  }

  let isSignUpMode = false; // Inicia em modo LOGIN para o usuário conseguir logar direto

  // Alternância entre ENTRAR e CRIAR CONTA
  function setAuthMode(signUp) {
    isSignUpMode = signUp;

    if (isSignUpMode) {
      title.textContent = 'Crie sua Conta';
      submitBtn.textContent = 'CADASTRAR';
      if (toggleQuestion) toggleQuestion.textContent = 'Já possui uma conta?';
      if (toggleLink) toggleLink.textContent = 'Fazer Login';
      if (nameGroup) nameGroup.style.display = 'block';
      if (tabSignup) tabSignup.classList.add('active');
      if (tabLogin) tabLogin.classList.remove('active');
    } else {
      title.textContent = 'Bem-vindo de volta!';
      submitBtn.textContent = 'ENTRAR NO VNFITNESS';
      if (toggleQuestion) toggleQuestion.textContent = 'Não tem uma conta ainda?';
      if (toggleLink) toggleLink.textContent = 'Cadastre-se aqui';
      if (nameGroup) nameGroup.style.display = 'none';
      if (tabLogin) tabLogin.classList.add('active');
      if (tabSignup) tabSignup.classList.remove('active');
    }

    hideAlert();
  }

  // Inicializa em modo LOGIN
  setAuthMode(false);

  // Alternar por abas superiores
  if (tabLogin) {
    tabLogin.addEventListener('click', () => setAuthMode(false));
  }
  if (tabSignup) {
    tabSignup.addEventListener('click', () => setAuthMode(true));
  }

  // Alternar pelo link inferior
  if (toggleLink) {
    toggleLink.addEventListener('click', (e) => {
      e.preventDefault();
      setAuthMode(!isSignUpMode);
    });
  }

  // Alternar visualização da senha
  if (togglePassBtn) {
    togglePassBtn.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      togglePassBtn.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }

  // Submissão do Formulário conectado ao Supabase
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const nome = nameInput ? nameInput.value.trim() : '';

    if (!email || !password) {
      showAlert('Preencha o e-mail e a senha.', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = isSignUpMode ? 'CRIANDO CONTA...' : 'AUTENTICANDO COM SUPABASE...';

    try {
      if (isSignUpMode) {
        // Fluxo de Cadastro com Supabase
        const res = await ApiClient.signup(email, password, nome);
        showAlert(res.message, 'info');

        // Se for o admin cadastrando, sugere login
        if (email.toLowerCase() === 'fredsoncitty@gmail.com') {
          setTimeout(() => {
            setAuthMode(false);
            showAlert('Admin cadastrado! Faça seu login para acessar o painel.', 'info');
          }, 1000);
        }
      } else {
        // Fluxo de Login com Supabase
        const res = await ApiClient.login(email, password);
        const token = res.session?.access_token || 'mock_token_admin';
        ApiClient.setSession(token, res.user, res.perfil);

        const isAdmin = (email.toLowerCase() === 'fredsoncitty@gmail.com') || (res.perfil?.role === 'admin');
        const status = res.perfil?.status_aprovacao;

        showAlert('Login realizado com sucesso! Redirecionando...', 'info');

        setTimeout(() => {
          if (isAdmin) {
            window.location.href = '/admin.html';
            return;
          }

          if (status === 'pendente') {
            showAlert('Seu cadastro está aguardando aprovação do administrador da VnFitness.', 'info');
            submitBtn.disabled = false;
            submitBtn.textContent = 'ENTRAR NO VNFITNESS';
            return;
          }

          if (status === 'rejeitado' || status === 'inativo') {
            showAlert(`Acesso indisponível: ${res.perfil?.motivo_rejeicao || 'Cadastro inativo'}.`, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'ENTRAR NO VNFITNESS';
            return;
          }

          window.location.href = '/app.html';
        }, 600);
      }
    } catch (err) {
      showAlert(err.message || 'Erro ao realizar a operação com o Supabase.', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = isSignUpMode ? 'CADASTRAR' : 'ENTRAR NO VNFITNESS';
    }
  });

  function showAlert(msg, type = 'error') {
    if (!alertBox) return;
    alertBox.style.display = 'block';
    alertBox.className = `auth-alert ${type === 'error' ? 'auth-alert-error' : 'auth-alert-info'}`;
    alertBox.textContent = msg;
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.style.display = 'none';
  }
});
