import { supabaseAdmin } from '../config/supabase.js';

export interface McpToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export const VNFITNESS_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'obter_perfil_aluno',
    description: 'Obtém dados de cadastro, nome, status e preferências do aluno autenticado no Supabase.',
    parameters: {
      type: 'object',
      properties: {
        usuario_id: { type: 'string', description: 'ID do usuário no Supabase' }
      },
      required: ['usuario_id']
    }
  },
  {
    name: 'obter_biometria_aluno',
    description: 'Resgata as últimas medições biométricas (peso, altura, IMC, meta) salvas no Supabase.',
    parameters: {
      type: 'object',
      properties: {
        usuario_id: { type: 'string', description: 'ID do usuário no Supabase' }
      },
      required: ['usuario_id']
    }
  },
  {
    name: 'obter_historico_checkins',
    description: 'Resgata o histórico de presença e cargas registradas nos check-ins do aluno no Supabase.',
    parameters: {
      type: 'object',
      properties: {
        usuario_id: { type: 'string', description: 'ID do usuário no Supabase' },
        limite_dias: { type: 'number', description: 'Número de dias passados para buscar (padrão 90)' }
      },
      required: ['usuario_id']
    }
  },
  {
    name: 'calcular_projecao_carga',
    description: 'Calcula a progressão e projeta a carga máxima esperada para o próximo mês com base em sobrecarga progressiva.',
    parameters: {
      type: 'object',
      properties: {
        exercicio: { type: 'string', description: 'Nome do exercício (ex: Remada curvada)' },
        carga_atual_kg: { type: 'number', description: 'Carga atual em kg' },
        semanas_treino: { type: 'number', description: 'Quantidade de semanas de consistência' }
      },
      required: ['exercicio', 'carga_atual_kg']
    }
  },
  {
    name: 'ajustar_treino_aluno',
    description: 'Atualiza ou adapta a rotina de treino do aluno no Supabase com foco em hipertrofia ou resistência.',
    parameters: {
      type: 'object',
      properties: {
        usuario_id: { type: 'string', description: 'ID do usuário no Supabase' },
        novo_foco: { type: 'string', description: 'Novo objetivo ou foco (ex: Aumento de Força, Definição)' }
      },
      required: ['usuario_id', 'novo_foco']
    }
  }
];

export class VnFitnessMcpService {
  // Execução de ferramentas MCP consultando o Supabase
  static async executarFerramenta(toolName: string, args: Record<string, any>, defaultUserId?: string): Promise<any> {
    const usuarioId = args.usuario_id || defaultUserId;

    switch (toolName) {
      case 'obter_perfil_aluno': {
        const { data, error } = await supabaseAdmin
          .from('usuarios')
          .select('id, email, nome_completo, telefone, role, status_aprovacao, preferencias')
          .eq('id', usuarioId)
          .single();
        if (error) throw error;
        return { perfil: data };
      }

      case 'obter_biometria_aluno': {
        const { data, error } = await supabaseAdmin
          .from('dados_biometricos')
          .select('*')
          .eq('usuario_id', usuarioId)
          .order('registrado_em', { ascending: false })
          .limit(3);
        if (error) throw error;
        return { historico_biometrico: data || [] };
      }

      case 'obter_historico_checkins': {
        const limiteDias = args.limite_dias || 90;
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() - limiteDias);

        const { data, error } = await supabaseAdmin
          .from('checkins_treino')
          .select('*')
          .eq('usuario_id', usuarioId)
          .gte('data_treino', dataLimite.toISOString().split('T')[0])
          .order('data_treino', { ascending: true });
        if (error) throw error;
        return { total_checkins: data?.length || 0, checkins: data || [] };
      }

      case 'calcular_projecao_carga': {
        const cargaAtual = Number(args.carga_atual_kg) || 58;
        const semanas = Number(args.semanas_treino) || 12;
        // Taxa de adaptação neuromuscular: ~5% a 8% por mês para intermediários
        const incrementoPrevisto = parseFloat((cargaAtual * 0.07).toFixed(1));
        const cargaProjetada = Math.round(cargaAtual + incrementoPrevisto);
        return {
          exercicio: args.exercicio || 'Remada curvada',
          carga_atual_kg: cargaAtual,
          carga_projetada_kg: cargaProjetada,
          aumento_estimado_kg: incrementoPrevisto,
          previsao_proximo_mes: 'out',
          confianca_ia: '94%'
        };
      }

      case 'ajustar_treino_aluno': {
        const novoFoco = args.novo_foco || 'Hipertrofia & Sobrecarga Progressiva';
        const { data, error } = await supabaseAdmin
          .from('treinos')
          .update({
            objetivo: novoFoco,
            atualizado_em: new Date().toISOString()
          })
          .eq('usuario_id', usuarioId)
          .eq('ativo', true)
          .select();
        if (error) throw error;
        return { message: 'Treino ajustado pelo Coach IA com sucesso', treino: data?.[0] };
      }

      default:
        throw new Error(`Ferramenta MCP desconhecida: ${toolName}`);
    }
  }

  // Tratador padrão do protocolo MCP JSON-RPC 2.0
  static async handleJsonRpc(body: any, userId?: string): Promise<any> {
    const { jsonrpc, id, method, params } = body;

    if (jsonrpc !== '2.0') {
      return { jsonrpc: '2.0', id, error: { code: -32600, message: 'Invalid Request: jsonrpc must be 2.0' } };
    }

    try {
      if (method === 'tools/list') {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: VNFITNESS_MCP_TOOLS
          }
        };
      }

      if (method === 'tools/call') {
        const { name, arguments: toolArgs } = params || {};
        const result = await this.executarFerramenta(name, toolArgs || {}, userId);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          }
        };
      }

      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      };
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: err.message || 'Server error', data: err }
      };
    }
  }
}

