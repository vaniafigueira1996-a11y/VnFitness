import { Router, Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { requireAuth, requireApprovedUser, requireAdminOnly } from '../middleware/authMiddleware.js';
import { CoachIAController } from '../controllers/coachIAController.js';
import { AdminController } from '../controllers/adminController.js';
import { UserController } from '../controllers/userController.js';

export const routes = Router();

// ==============================================================================
// 1. ROTAS DE AUTENTICAÇÃO (Sincronização 100% Garantida com a Tabela 'usuarios')
// ==============================================================================
routes.post('/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, nome_completo } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isMasterAdmin = cleanEmail === 'fredsoncitty@gmail.com';
    const fullName = nome_completo?.trim() || splitEmailName(cleanEmail);

    // 1. Tenta criar usuário no Supabase Auth
    let userId: string | null = null;
    let authUser: any = null;
    let authSession: any = null;

    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { nome_completo: fullName }
      }
    });

    if (signUpErr) {
      // Se já estiver cadastrado no Auth, tenta fazer login para resgatar o id
      const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password
      });

      if (loginErr) {
        return res.status(400).json({ error: signUpErr.message });
      }

      userId = loginData.user.id;
      authUser = loginData.user;
      authSession = loginData.session;
    } else {
      userId = signUpData.user?.id || null;
      authUser = signUpData.user;
      authSession = signUpData.session;
    }

    if (!userId) {
      return res.status(500).json({ error: 'Falha ao obter identificador do usuário.' });
    }

    // 2. GARANTIA ABSOLUTA: Gravação direta na tabela 'public.usuarios'
    const { data: userProfile, error: profileErr } = await supabaseAdmin
      .from('usuarios')
      .upsert({
        id: userId,
        email: cleanEmail,
        nome_completo: fullName,
        role: isMasterAdmin ? 'admin' : 'aluno',
        status_aprovacao: isMasterAdmin ? 'aprovado' : 'pendente',
        atualizado_em: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (profileErr) {
      console.error('Aviso ao sincronizar perfil na tabela usuarios:', profileErr);
    }

    return res.status(201).json({
      message: isMasterAdmin
        ? 'Conta de Administrador Mestre registrada e sincronizada com sucesso!'
        : 'Cadastro realizado com sucesso! Aguarde a aprovação do administrador para acessar o aplicativo.',
      user: authUser,
      session: authSession,
      perfil: userProfile || {
        id: userId,
        email: cleanEmail,
        nome_completo: fullName,
        role: isMasterAdmin ? 'admin' : 'aluno',
        status_aprovacao: isMasterAdmin ? 'aprovado' : 'pendente'
      },
      aguarda_aprovacao: !isMasterAdmin
    });
  } catch (err: any) {
    console.error('Erro no signup:', err);
    return res.status(500).json({ error: 'Erro no cadastro', details: err?.message || err });
  }
});

routes.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isMasterAdmin = cleanEmail === 'fredsoncitty@gmail.com';

    // 1. Autenticação no Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (authErr) {
      return res.status(401).json({ error: 'Credenciais inválidas: e-mail ou senha incorretos.' });
    }

    const userId = authData.user.id;

    // 2. Busca ou cria o registro na tabela 'public.usuarios'
    let { data: perfil, error: perfilErr } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!perfil) {
      // Se não estava na tabela por qualquer motivo, insere agora mesmo!
      const fullName = authData.user.user_metadata?.nome_completo || splitEmailName(cleanEmail);
      const { data: novoPerfil } = await supabaseAdmin
        .from('usuarios')
        .upsert({
          id: userId,
          email: cleanEmail,
          nome_completo: fullName,
          role: isMasterAdmin ? 'admin' : 'aluno',
          status_aprovacao: isMasterAdmin ? 'aprovado' : 'pendente'
        }, { onConflict: 'id' })
        .select()
        .single();

      perfil = novoPerfil;
    }

    return res.status(200).json({
      user: authData.user,
      session: authData.session,
      perfil: perfil || {
        id: userId,
        email: cleanEmail,
        role: isMasterAdmin ? 'admin' : 'aluno',
        status_aprovacao: isMasterAdmin ? 'aprovado' : 'pendente'
      }
    });
  } catch (err: any) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro no login', details: err?.message || err });
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

// Endpoint principal do Coach IA
routes.post('/coach/gerar-plano', requireAuth, requireApprovedUser, CoachIAController.calcularEGerarPlano);

// ==============================================================================
// 3. ROTAS DO PAINEL ADMINISTRATIVO FORJA (CRUD de Usuários com Supabase)
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

// Rotas dos Menus Adicionais (Professores, WhatsApp, Check-ins, Treinos IA, Desempenho)
routes.get('/admin/professores', requireAuth, requireAdminOnly, AdminController.listarProfessores);
routes.post('/admin/professores', requireAuth, requireAdminOnly, AdminController.criarProfessor);
routes.delete('/admin/professores/:id', requireAuth, requireAdminOnly, AdminController.excluirProfessor);

routes.get('/admin/mensagens-whatsapp', requireAuth, requireAdminOnly, AdminController.listarMensagensWhatsApp);
routes.patch('/admin/mensagens-whatsapp/:id/enviar', requireAuth, requireAdminOnly, AdminController.marcarMensagemWhatsAppEnviada);

routes.get('/admin/checkins-recentes', requireAuth, requireAdminOnly, AdminController.listarCheckinsRecentes);
routes.get('/admin/treinos-ia', requireAuth, requireAdminOnly, AdminController.listarTreinosIA);
routes.get('/admin/desempenho', requireAuth, requireAdminOnly, AdminController.obterDesempenho);

function splitEmailName(email: string): string {
  const namePart = email.split('@')[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}
