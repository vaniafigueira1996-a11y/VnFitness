import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { supabaseAdmin } from '../config/supabase.js';
import { ChurnPredictorService } from '../services/churnPredictorService.js';

export class AdminController {
  // 1. Listar usuários com filtros
  static async listarUsuarios(req: AuthenticatedRequest, res: Response) {
    try {
      const { status, busca } = req.query;

      let query = supabaseAdmin
        .from('usuarios')
        .select('*')
        .order('criado_em', { ascending: false });

      if (status && typeof status === 'string' && status !== 'todos') {
        query = query.eq('status_aprovacao', status);
      }

      if (busca && typeof busca === 'string') {
        query = query.or(`nome_completo.ilike.%${busca}%,email.ilike.%${busca}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return res.status(200).json({ usuarios: data });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao listar usuários', details: error });
    }
  }

  // 2. Detalhes completos do aluno
  static async obterDetalhesUsuario(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const { data: usuario, error: userErr } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('id', id)
        .single();

      if (userErr || !usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Buscar biometria mais recente
      const { data: biometria } = await supabaseAdmin
        .from('dados_biometricos')
        .select('*')
        .eq('usuario_id', id)
        .order('registrado_em', { ascending: false })
        .limit(1);

      // Buscar treinos
      const { data: treinos } = await supabaseAdmin
        .from('treinos')
        .select('*')
        .eq('usuario_id', id)
        .order('criado_em', { ascending: false });

      // Buscar check-ins recentes
      const { data: checkins } = await supabaseAdmin
        .from('checkins_treino')
        .select('*')
        .eq('usuario_id', id)
        .order('data_treino', { ascending: false })
        .limit(15);

      // Buscar insight de retenção
      const { data: retencao } = await supabaseAdmin
        .from('insights_retencao_ia')
        .select('*')
        .eq('usuario_id', id)
        .maybeSingle();

      return res.status(200).json({
        usuario,
        biometria_atual: biometria?.[0] || null,
        treinos: treinos || [],
        checkins: checkins || [],
        retencao: retencao || null
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao obter detalhes', details: error });
    }
  }

  // 3. Aprovar cadastro de usuário
  static async aprovarUsuario(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .update({ status_aprovacao: 'aprovado' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ message: 'Usuário aprovado com sucesso!', usuario: data });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao aprovar usuário', details: error });
    }
  }

  // 4. Rejeitar cadastro de usuário
  static async rejeitarUsuario(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;

      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .update({
          status_aprovacao: 'rejeitado',
          motivo_rejeicao: motivo || 'Cadastro rejeitado pelo administrador.'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ message: 'Usuário rejeitado.', usuario: data });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao rejeitar usuário', details: error });
    }
  }

  // 5. Inativar usuário
  static async inativarUsuario(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .update({ status_aprovacao: 'inativo' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ message: 'Usuário inativado.', usuario: data });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao inativar usuário', details: error });
    }
  }

  // 6. Editar usuário
  static async editarUsuario(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { nome_completo, telefone, foto_url } = req.body;

      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .update({
          nome_completo,
          telefone,
          foto_url
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return res.status(200).json({ message: 'Dados atualizados com sucesso.', usuario: data });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao editar usuário', details: error });
    }
  }

  // 7. Excluir usuário definitivamente
  static async excluirUsuario(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;

      // Impede que o próprio admin seja excluído
      const { data: alvo } = await supabaseAdmin.from('usuarios').select('email, role').eq('id', id).single();
      if (alvo?.email.toLowerCase() === 'fredsoncitty@gmail.com' || alvo?.role === 'admin') {
        return res.status(403).json({ error: 'O Administrador Mestre não pode ser excluído.' });
      }

      // Deleta do Supabase Auth (o cascade limpa o public.usuarios)
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authErr) {
        // Tenta deletar diretamente na tabela se não estiver no auth
        await supabaseAdmin.from('usuarios').delete().eq('id', id);
      }

      return res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao excluir usuário', details: error });
    }
  }

  // 8. Upload de Fotos (Supabase Storage)
  static async uploadFoto(req: AuthenticatedRequest, res: Response) {
    try {
      const { bucket = 'avatars', nome_arquivo, base64_data, content_type = 'image/jpeg' } = req.body;

      if (!nome_arquivo || !base64_data) {
        return res.status(400).json({ error: 'nome_arquivo e base64_data são obrigatórios.' });
      }

      const buffer = Buffer.from(base64_data.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const path = `${Date.now()}_${nome_arquivo}`;

      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(path, buffer, {
          contentType: content_type,
          upsert: true
        });

      if (error) throw error;

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return res.status(200).json({
        message: 'Foto enviada com sucesso!',
        path: data.path,
        url: publicUrlData.publicUrl
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro no upload de foto', details: error });
    }
  }

  // 9. Dados do Dashboard Forja (KPIs e Lista de Retenção com IA)
  static async obterMetricasDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      // Total de alunos ativos
      const { count: totalAtivos } = await supabaseAdmin
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('status_aprovacao', 'aprovado')
        .eq('role', 'aluno');

      // Alunos pendentes aguardando aprovação
      const { count: totalPendentes } = await supabaseAdmin
        .from('usuarios')
        .select('*', { count: 'exact', head: true })
        .eq('status_aprovacao', 'pendente');

      // Treinos criados por IA
      const { count: treinosIA } = await supabaseAdmin
        .from('treinos')
        .select('*', { count: 'exact', head: true })
        .eq('criado_por_ia', true);

      // Buscar alunos com alertas de retenção
      const { data: retencoes } = await supabaseAdmin
        .from('insights_retencao_ia')
        .select(`
          *,
          usuarios (
            id,
            nome_completo,
            email,
            telefone,
            foto_url
          )
        `)
        .order('score_risco', { ascending: false });

      const riscoAltoCount = (retencoes || []).filter(r => r.score_risco >= 70).length;

      return res.status(200).json({
        kpis: {
          alunos_ativos: totalAtivos || 0,
          alunos_pendentes: totalPendentes || 0,
          risco_alto_cancelar: riscoAltoCount,
          frequencia_media_semanal: 2.7,
          ajustes_ia_semana: treinosIA || 0
        },
        alunos_risco: retencoes || []
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao carregar métricas', details: error });
    }
  }

  // 10. Executar Análise de Retenção IA para um Aluno
  static async analisarRetencaoAluno(req: AuthenticatedRequest, res: Response) {
    try {
      const { usuario_id, dias_sem_treinar = 7, frequencia_atual = 1, frequencia_anterior = 4, queixas } = req.body;

      const { data: usuario } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('id', usuario_id)
        .single();

      if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const analise = await ChurnPredictorService.analisarRetencao({
        id: usuario.id,
        nome: usuario.nome_completo,
        telefone: usuario.telefone,
        dias_sem_treinar: Number(dias_sem_treinar),
        frequencia_semanal_atual: Number(frequencia_atual),
        frequencia_semanal_anterior: Number(frequencia_anterior),
        plano: 'Mensal',
        queixas_recentes: queixas
      });

      // Salva ou atualiza no Supabase
      const { data: salvo, error: upsertErr } = await supabaseAdmin
        .from('insights_retencao_ia')
        .upsert({
          usuario_id: usuario.id,
          score_risco: analise.score_risco,
          nivel_risco: analise.nivel_risco,
          motivo_apontado: analise.motivo_apontado_ia,
          acao_sugerida: analise.acao_sugerida,
          mensagem_whatsapp_sugerida: analise.mensagem_whatsapp_sugerida,
          dias_sem_treinar: Number(dias_sem_treinar),
          frequencia_semanal_atual: Number(frequencia_atual),
          atualizado_em: new Date().toISOString()
        }, { onConflict: 'usuario_id' })
        .select()
        .single();

      if (upsertErr) throw upsertErr;

      return res.status(200).json({ success: true, insight: salvo });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao analisar retenção', details: error });
    }
  }
}

