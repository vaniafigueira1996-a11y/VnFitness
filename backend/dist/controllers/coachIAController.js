import { GeminiCoachService } from '../services/geminiCoachService.js';
import { VnFitnessMcpService } from '../mcp/vnfitnessMcp.js';
import { supabaseAdmin } from '../config/supabase.js';
export class CoachIAController {
    // Chat conversacional com o Coach IA
    static async interagirChat(req, res) {
        try {
            const usuarioId = req.user?.id;
            const { mensagem } = req.body;
            if (!mensagem || typeof mensagem !== 'string' || !mensagem.trim()) {
                return res.status(400).json({ error: 'Mensagem é obrigatória para interagir com o Coach IA.' });
            }
            const respostaCoach = await GeminiCoachService.interagirComCoach(mensagem.trim(), usuarioId || '');
            return res.status(200).json({
                success: true,
                data: respostaCoach
            });
        }
        catch (error) {
            console.error('Erro no CoachIAController.interagirChat:', error);
            return res.status(500).json({ error: 'Erro ao processar conversa com o Coach IA', details: error?.message || error });
        }
    }
    // Endpoint do protocolo MCP JSON-RPC 2.0 (Model Context Protocol)
    static async endpointMcp(req, res) {
        try {
            const usuarioId = req.user?.id;
            const response = await VnFitnessMcpService.handleJsonRpc(req.body, usuarioId);
            return res.status(200).json(response);
        }
        catch (error) {
            console.error('Erro no MCP endpoint:', error);
            return res.status(500).json({
                jsonrpc: '2.0',
                error: { code: -32000, message: 'Internal error executing MCP tool', details: error?.message || error }
            });
        }
    }
    // Geração completa de treino e dieta via IA
    static async calcularEGerarPlano(req, res) {
        try {
            const usuarioId = req.user?.id;
            if (!usuarioId) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }
            const { peso_kg, altura_m, idade, local_treino, objetivo } = req.body;
            if (!peso_kg || !altura_m || !idade || !local_treino) {
                return res.status(400).json({
                    error: 'Parâmetros obrigatórios ausentes: peso_kg, altura_m, idade e local_treino são necessários.'
                });
            }
            const peso = parseFloat(peso_kg);
            const altura = parseFloat(altura_m);
            const anos = parseInt(idade, 10);
            if (peso <= 20 || peso > 350 || altura <= 0.5 || altura > 2.5 || anos < 10 || anos > 120) {
                return res.status(400).json({ error: 'Valores biométricos fora de intervalos válidos.' });
            }
            // 1. Cálculo do IMC
            const imc = parseFloat((peso / (altura * altura)).toFixed(2));
            // 2. Classificação do IMC (OMS)
            let classificacao_imc = '';
            if (imc < 18.5)
                classificacao_imc = 'Abaixo do peso';
            else if (imc < 25.0)
                classificacao_imc = 'Peso saudável / Normal';
            else if (imc < 30.0)
                classificacao_imc = 'Sobrepeso';
            else if (imc < 35.0)
                classificacao_imc = 'Obesidade Grau I';
            else if (imc < 40.0)
                classificacao_imc = 'Obesidade Grau II';
            else
                classificacao_imc = 'Obesidade Grau III';
            // 3. Faixa de Peso Saudável (IMC entre 18.5 e 24.9)
            const peso_ideal_min = parseFloat((18.5 * (altura * altura)).toFixed(1));
            const peso_ideal_max = parseFloat((24.9 * (altura * altura)).toFixed(1));
            // 4. Quantos quilos precisa perder ou ganhar
            let diferenca_peso_meta = 0;
            if (peso > peso_ideal_max) {
                diferenca_peso_meta = parseFloat((peso_ideal_max - peso).toFixed(1)); // Negativo: precisa perder
            }
            else if (peso < peso_ideal_min) {
                diferenca_peso_meta = parseFloat((peso_ideal_min - peso).toFixed(1)); // Positivo: precisa ganhar
            }
            // 5. Salva dados biométricos no Supabase
            const { data: biometria, error: bioError } = await supabaseAdmin
                .from('dados_biometricos')
                .insert({
                usuario_id: usuarioId,
                peso_kg: peso,
                altura_m: altura,
                idade: anos,
                imc,
                classificacao_imc,
                peso_ideal_min,
                peso_ideal_max,
                diferenca_peso_meta,
                observacoes: `Objetivo: ${objetivo || 'Não informado'} | Local: ${local_treino}`
            })
                .select()
                .single();
            if (bioError) {
                console.error('Erro ao salvar biometria:', bioError);
            }
            // 6. Comunicação com o Agente Coach IA (Google Gemini)
            const planoGerado = await GeminiCoachService.gerarTreinoEDieta({
                idade: anos,
                peso_kg: peso,
                altura_m: altura,
                imc,
                classificacao_imc,
                diferenca_peso_meta,
                local_treino: local_treino === 'casa' ? 'casa' : 'academia',
                objetivo
            });
            // 7. Persiste o Treino gerado
            const { data: treinoSalvo } = await supabaseAdmin
                .from('treinos')
                .insert({
                usuario_id: usuarioId,
                titulo: planoGerado.treino.titulo,
                local_treino: planoGerado.treino.local_treino,
                objetivo: planoGerado.treino.objetivo,
                duracao_estimada_min: planoGerado.treino.duracao_estimada_min,
                exercicios: planoGerado.treino.exercicios,
                criado_por_ia: true
            })
                .select()
                .single();
            // 8. Persiste o Plano Nutricional gerado
            const { data: nutricaoSalva } = await supabaseAdmin
                .from('planos_nutricionais')
                .insert({
                usuario_id: usuarioId,
                calorias_diarias: planoGerado.nutricao.calorias_diarias,
                proteinas_g: planoGerado.nutricao.proteinas_g,
                carboidratos_g: planoGerado.nutricao.carboidratos_g,
                gorduras_g: planoGerado.nutricao.gorduras_g,
                refeicoes: planoGerado.nutricao.refeicoes,
                recomendacoes_ia: planoGerado.nutricao.recomendacoes_ia
            })
                .select()
                .single();
            return res.status(200).json({
                success: true,
                biometria: {
                    peso_kg: peso,
                    altura_m: altura,
                    idade: anos,
                    imc,
                    classificacao_imc,
                    peso_ideal_min,
                    peso_ideal_max,
                    diferenca_peso_meta,
                    mensagem_meta: diferenca_peso_meta < 0
                        ? `Você precisa perder ${Math.abs(diferenca_peso_meta)} kg para atingir o peso saudável.`
                        : diferenca_peso_meta > 0
                            ? `Você precisa ganhar ${diferenca_peso_meta} kg para atingir o peso saudável.`
                            : 'Parabéns! Seu peso está dentro da faixa saudável recomendada.'
                },
                nutricao: nutricaoSalva || planoGerado.nutricao,
                treino: treinoSalvo || planoGerado.treino
            });
        }
        catch (error) {
            console.error('Erro no CoachIAController:', error);
            return res.status(500).json({ error: 'Falha ao processar dados com o Coach IA', details: error });
        }
    }
}
