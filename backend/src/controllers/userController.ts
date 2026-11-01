import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { supabaseAdmin } from '../config/supabase.js';

export class UserController {
  // Obter perfil do usuário logado
  static async obterMeuPerfil(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.id;
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('id', usuarioId)
        .single();

      if (error) throw error;
      return res.status(200).json({ perfil: data });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar perfil', details: error });
    }
  }

  // Obter dados biométricos mais recentes
  static async obterBiometria(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.id;
      const { data, error } = await supabaseAdmin
        .from('dados_biometricos')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('registrado_em', { ascending: false })
        .limit(1);

      if (error) throw error;
      return res.status(200).json({ biometria: data?.[0] || null });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar dados biométricos', details: error });
    }
  }

  // Obter plano de treino ativo
  static async obterTreinoAtivo(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.id;
      const { data, error } = await supabaseAdmin
        .from('treinos')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('ativo', true)
        .order('criado_em', { ascending: false })
        .limit(1);

      if (error) throw error;
      return res.status(200).json({ treino: data?.[0] || null });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar treino', details: error });
    }
  }

  // Obter plano nutricional ativo
  static async obterNutricaoAtiva(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.id;
      const { data, error } = await supabaseAdmin
        .from('planos_nutricionais')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('criado_em', { ascending: false })
        .limit(1);

      if (error) throw error;
      return res.status(200).json({ nutricao: data?.[0] || null });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar plano nutricional', details: error });
    }
  }

  // Registrar check-in de treino
  static async registrarCheckin(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.id;
      const { duracao_min = 45, intensidade = 4, carga_total_kg, exercicio_destaque } = req.body;

      const { data, error } = await supabaseAdmin
        .from('checkins_treino')
        .insert({
          usuario_id: usuarioId,
          data_treino: new Date().toISOString().split('T')[0],
          duracao_min: Number(duracao_min),
          intensidade: Number(intensidade),
          carga_total_kg: carga_total_kg ? Number(carga_total_kg) : null,
          exercicio_destaque: exercicio_destaque || 'Treino Concluído'
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json({ message: 'Check-in registrado com sucesso!', checkin: data });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao registrar check-in', details: error });
    }
  }

  // Obter dados da tela de evolução (conforme "Tela de evolução.png")
  static async obterDadosEvolucao(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.id;

      // Buscar check-ins dos últimos 90 dias
      const dataLimite = new Date();
      dataLimite.setDate(dataLimite.getDate() - 91);

      const { data: checkins } = await supabaseAdmin
        .from('checkins_treino')
        .select('*')
        .eq('usuario_id', usuarioId)
        .gte('data_treino', dataLimite.toISOString().split('T')[0])
        .order('data_treino', { ascending: true });

      // Calcular frequência média semanal
      const totalCheckins = checkins?.length || 0;
      const frequenciaSemanal = parseFloat((totalCheckins / 13).toFixed(1));

      // Insight do Coach IA na evolução
      const insightIA = totalCheckins >= 10
        ? `Melhor mês até aqui! Com ${frequenciaSemanal >= 3 ? 3 : 2.5} treinos por semana, a carga da Remada passa de 60 kg em breve. Terça é seu ponto fraco: que tal um treino curto de 35 min?`
        : 'Inicie sua sequência de treinos esta semana para liberar os gráficos preditivos de carga!';

      // Simulação de evolução de carga (ex: Remada Curvada como na imagem de referência)
      const historicoCarga = [
        { mes: 'jul', carga_kg: 42 },
        { mes: 'ago', carga_kg: 48 },
        { mes: 'set', carga_kg: 58 },
        { mes: 'previsao out', carga_kg: 62, isPrevisao: true }
      ];

      return res.status(200).json({
        exercicio_destaque: {
          nome: 'Remada curvada',
          tipo: 'Carga máxima',
          carga_atual_kg: 58,
          evolucao_percentual: '+21% em 12 sem',
          historico: historicoCarga
        },
        conquistas: [
          { titulo: 'Recorde supino', detalhe: '40 kg × 8', tempo: 'ontem', icone: 'trophy' },
          { titulo: 'Cintura -3 cm', detalhe: 'avaliação de 12/09', tempo: 'recente', icone: 'ruler' }
        ],
        estatisticas: {
          periodo: 'Últimas 13 semanas',
          treinos_por_semana: frequenciaSemanal || 2.9,
          total_treinos: totalCheckins
        },
        checkins_historico: checkins || [],
        insight_coach_ia: insightIA
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao obter dados de evolução', details: error });
    }
  }

  // Obter configurações/preferências salvas do aluno
  static async obterConfiguracoes(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.id;
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('id, email, nome_completo, telefone, foto_url, preferencias')
        .eq('id', usuarioId)
        .single();

      if (error) throw error;

      const prefs = data?.preferencias || {
        tema: 'dark',
        local_treino: 'academia',
        objetivo: 'Hipertrofia e Força',
        meta_semanal: 3,
        notificacoes: true
      };

      return res.status(200).json({
        configuracoes: {
          nome_completo: data?.nome_completo,
          email: data?.email,
          telefone: data?.telefone || '',
          foto_url: data?.foto_url,
          ...prefs
        }
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar configurações do aluno', details: error });
    }
  }

  // Salvar configurações/preferências do aluno
  static async salvarConfiguracoes(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.id;
      const {
        nome_completo,
        telefone,
        tema = 'dark',
        local_treino = 'academia',
        objetivo = 'Hipertrofia e Força',
        meta_semanal = 3,
        notificacoes = true
      } = req.body;

      const novasPrefs = {
        tema,
        local_treino,
        objetivo,
        meta_semanal: Number(meta_semanal) || 3,
        notificacoes: Boolean(notificacoes)
      };

      const updateData: any = {
        preferencias: novasPrefs,
        atualizado_em: new Date().toISOString()
      };

      if (nome_completo) updateData.nome_completo = nome_completo.trim();
      if (telefone !== undefined) updateData.telefone = telefone.trim();

      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .update(updateData)
        .eq('id', usuarioId)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        message: 'Preferências salvas com sucesso no Supabase!',
        perfil: data
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao salvar configurações do aluno', details: error });
    }
  }

  // Salvar/atualizar biometria do aluno
  static async salvarBiometria(req: AuthenticatedRequest, res: Response) {
    try {
      const usuarioId = req.user?.id;
      const { peso_kg, altura_m, idade } = req.body;

      if (!peso_kg || !altura_m || !idade) {
        return res.status(400).json({ error: 'Peso, altura e idade são obrigatórios.' });
      }

      const peso = Number(peso_kg);
      const altura = Number(altura_m);
      const id = Number(idade);

      const imc = parseFloat((peso / (altura * altura)).toFixed(2));
      let classificacao = '';
      if (imc < 18.5) classificacao = 'Abaixo do peso';
      else if (imc < 25.0) classificacao = 'Peso saudável';
      else if (imc < 30.0) classificacao = 'Sobrepeso';
      else classificacao = 'Obesidade';

      const pesoMin = parseFloat((18.5 * altura * altura).toFixed(1));
      const pesoMax = parseFloat((24.9 * altura * altura).toFixed(1));
      const diffMeta = peso > pesoMax ? -(peso - pesoMax) : (peso < pesoMin ? (pesoMin - peso) : 0);

      const { data, error } = await supabaseAdmin
        .from('dados_biometricos')
        .insert({
          usuario_id: usuarioId,
          peso_kg: peso,
          altura_m: altura,
          idade: id,
          imc,
          classificacao_imc: classificacao,
          peso_ideal_min: pesoMin,
          peso_ideal_max: pesoMax,
          diferenca_peso_meta: diffMeta,
          observacoes: `Biometria registrada pelo Aluno via App`
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({
        message: 'Biometria salva no Supabase com sucesso!',
        biometria: data
      });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao salvar biometria', details: error });
    }
  }
}

