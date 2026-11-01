import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase.js';
import { requireAuth, requireApprovedUser, requireAdminOnly } from '../middleware/authMiddleware.js';
import { CoachIAController } from '../controllers/coachIAController.js';
import { AdminController } from '../controllers/adminController.js';
import { UserController } from '../controllers/userController.js';

export const routes = Router();

// ==============================================================================
// 1. ROTAS DE AUTENTICAÇÃO (Interligadas com Supabase Auth)
// ==============================================================================
routes.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, nome_completo } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nome_completo || splitEmailName(email)
        }
      }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    const isMasterAdmin = email.toLowerCase() === 'fredsoncitty@gmail.com';

    return res.status(201).json({
      message: isMasterAdmin
        ? 'Conta de Administrador Mestre criada com sucesso!'
        : 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o aplicativo.',
      user: data.user,
      session: data.session,
      aguarda_aprovacao: !isMasterAdmin
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro no cadastro', details: err });
  }
});

routes.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Credenciais inválidas: e-mail ou senha incorretos.' });
    }

    // Consulta perfil para checar status de aprovação
    const { data: perfil } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', data.user.id)
      .single();

    return res.status(200).json({
      user: data.user,
      session: data.session,
      perfil: perfil || {
        role: email.toLowerCase() === 'fredsoncitty@gmail.com' ? 'admin' : 'aluno',
        status_aprovacao: email.toLowerCase() === 'fredsoncitty@gmail.com' ? 'aprovado' : 'pendente'
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Erro no login', details: err });
  }
});

// ==============================================================================
// 2. ROTAS DO ALUNO (Coach IA, Biometria, Treinos, Nutrição e Evolução)
// ==============================================================================
routes.get('/user/perfil', requireAuth, UserController.obterMeuPerfil);
routes.get('/user/biometria', requireAuth, requireApprovedUser, UserController.obterBiometria);
routes.get('/user/treino-ativo', requireAuth, requireApprovedUser, UserController.obterTreinoAtivo);
routes.get('/user/nutricao-ativa', requireAuth, requireApprovedUser, UserController.obterNutricaoAtiva);
routes.post('/user/checkin', requireAuth, requireApprovedUser, UserController.registrarCheckin);
routes.get('/user/evolucao', requireAuth, requireApprovedUser, UserController.obterDadosEvolucao);

// Endpoint principal do Coach IA (Gera cálculo de IMC, meta de peso, dieta e ficha de treinos)
routes.post('/coach/gerar-plano', requireAuth, requireApprovedUser, CoachIAController.calcularEGerarPlano);

// ==============================================================================
// 3. ROTAS DO PAINEL ADMINISTRATIVO (Exclusivas para fredsoncitty@gmail.com)
// ==============================================================================
routes.get('/admin/metricas-dashboard', requireAuth, requireAdminOnly, AdminController.obterMetricasDashboard);
routes.get('/admin/usuarios', requireAuth, requireAdminOnly, AdminController.listarUsuarios);
routes.get('/admin/usuarios/:id', requireAuth, requireAdminOnly, AdminController.obterDetalhesUsuario);
routes.patch('/admin/usuarios/:id/aprovar', requireAuth, requireAdminOnly, AdminController.aprovarUsuario);
routes.patch('/admin/usuarios/:id/rejeitar', requireAuth, requireAdminOnly, AdminController.rejeitarUsuario);
routes.patch('/admin/usuarios/:id/inativar', requireAuth, requireAdminOnly, AdminController.inativarUsuario);
routes.put('/admin/usuarios/:id/editar', requireAuth, requireAdminOnly, AdminController.editarUsuario);
routes.delete('/admin/usuarios/:id', requireAuth, requireAdminOnly, AdminController.excluirUsuario);
routes.post('/admin/upload-foto', requireAuth, requireAdminOnly, AdminController.uploadFoto);
routes.post('/admin/analisar-retencao', requireAuth, requireAdminOnly, AdminController.analisarRetencaoAluno);

function splitEmailName(email: string): string {
  const namePart = email.split('@')[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

