/**
 * VnFitness - Cliente de API Vanilla JS
 * Comunicação com o backend Node.js / Supabase
 */

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : '/api';

export const ApiClient = {
  getToken() {
    return localStorage.getItem('vnfitness_token');
  },

  setSession(token, user, perfil) {
    localStorage.setItem('vnfitness_token', token);
    localStorage.setItem('vnfitness_user', JSON.stringify(user));
    if (perfil) {
      localStorage.setItem('vnfitness_perfil', JSON.stringify(perfil));
    }
  },

  getUser() {
    const raw = localStorage.getItem('vnfitness_user');
    return raw ? JSON.parse(raw) : null;
  },

  getPerfil() {
    const raw = localStorage.getItem('vnfitness_perfil');
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem('vnfitness_token');
    localStorage.removeItem('vnfitness_user');
    localStorage.removeItem('vnfitness_perfil');
    window.location.href = '/index.html';
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `Erro HTTP: ${response.status}`);
      }

      return data;
    } catch (err) {
      console.error(`Erro na requisição ${endpoint}:`, err);
      throw err;
    }
  },

  // Auth
  async login(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  async signup(email, password, nome_completo) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, nome_completo })
    });
  },

  // Aluno
  async getPerfilAluno() {
    return this.request('/user/perfil');
  },

  async getBiometria() {
    return this.request('/user/biometria');
  },

  async getTreinoAtivo() {
    return this.request('/user/treino-ativo');
  },

  async getNutricaoAtiva() {
    return this.request('/user/nutricao-ativa');
  },

  async getDadosEvolucao() {
    return this.request('/user/evolucao');
  },

  async getConfiguracoesAluno() {
    return this.request('/user/configuracoes');
  },

  async salvarConfiguracoesAluno(dados) {
    return this.request('/user/configuracoes', {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  },

  async salvarBiometriaAluno(dados) {
    return this.request('/user/biometria', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  },

  async registrarCheckin(dados) {
    return this.request('/user/checkin', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  },

  async gerarPlanoCoach(biometria) {
    return this.request('/coach/gerar-plano', {
      method: 'POST',
      body: JSON.stringify(biometria)
    });
  },

  async interagirCoach(mensagem) {
    return this.request('/coach/chat', {
      method: 'POST',
      body: JSON.stringify({ mensagem })
    });
  },

  async chamarMcp(method, params = {}) {
    return this.request('/mcp', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params
      })
    });
  },

  // Admin
  async getMetricasAdmin() {
    return this.request('/admin/metricas-dashboard');
  },

  async listarUsuariosAdmin(status = 'todos', busca = '') {
    return this.request(`/admin/usuarios?status=${encodeURIComponent(status)}&busca=${encodeURIComponent(busca)}`);
  },

  async getDetalhesUsuarioAdmin(id) {
    return this.request(`/admin/usuarios/${id}`);
  },

  async aprovarUsuarioAdmin(id) {
    return this.request(`/admin/usuarios/${id}/aprovar`, { method: 'PATCH' });
  },

  async rejeitarUsuarioAdmin(id, motivo) {
    return this.request(`/admin/usuarios/${id}/rejeitar`, {
      method: 'PATCH',
      body: JSON.stringify({ motivo })
    });
  },

  async inativarUsuarioAdmin(id) {
    return this.request(`/admin/usuarios/${id}/inativar`, { method: 'PATCH' });
  },

  async editarUsuarioAdmin(id, dados) {
    return this.request(`/admin/usuarios/${id}/editar`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  },

  async excluirUsuarioAdmin(id) {
    return this.request(`/admin/usuarios/${id}`, { method: 'DELETE' });
  },

  async uploadFotoAdmin(payload) {
    return this.request('/admin/upload-foto', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async analisarRetencaoIA(usuario_id, parametros) {
    return this.request('/admin/analisar-retencao', {
      method: 'POST',
      body: JSON.stringify({ usuario_id, ...parametros })
    });
  },

  // Menus Adicionais do Painel VnFitness
  async getProfessoresAdmin() {
    return this.request('/admin/professores');
  },

  async criarProfessorAdmin(dados) {
    return this.request('/admin/professores', {
      method: 'POST',
      body: JSON.stringify(dados)
    });
  },

  async excluirProfessorAdmin(id) {
    return this.request(`/admin/professores/${id}`, { method: 'DELETE' });
  },

  async getMensagensWhatsAppAdmin() {
    return this.request('/admin/mensagens-whatsapp');
  },

  async marcarMensagemWhatsAppEnviadaAdmin(id) {
    return this.request(`/admin/mensagens-whatsapp/${id}/enviar`, { method: 'PATCH' });
  },

  async getCheckinsRecentesAdmin() {
    return this.request('/admin/checkins-recentes');
  },

  async getTreinosIAAdmin() {
    return this.request('/admin/treinos-ia');
  },

  async getDesempenhoAdmin() {
    return this.request('/admin/desempenho');
  },

  async getConfiguracoesAdmin() {
    return this.request('/admin/configuracoes');
  },

  async salvarConfiguracoesAdmin(dados) {
    return this.request('/admin/configuracoes', {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  }
};

