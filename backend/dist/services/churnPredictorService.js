import { genAI } from '../config/gemini.js';
export class ChurnPredictorService {
    static async analisarRetencao(aluno) {
        const prompt = `
Você é a IA de Retenção do sistema administrativo "Forja" da academia VnFitness.
Sua função é prever o risco de desistência/cancelamento do aluno e sugerir uma mensagem humana e acolhedora para envio pelo WhatsApp pelo coordenador técnico ou professor.

Dados do aluno:
- Nome: ${aluno.nome}
- Dias sem treinar: ${aluno.dias_sem_treinar} dias
- Frequência atual: ${aluno.frequencia_semanal_atual} treinos/semana (anteriormente era ${aluno.frequencia_semanal_anterior})
- Tipo de plano: ${aluno.plano}
- Observações/Relatos: ${aluno.queixas_recentes || 'Nenhum relato direto registrado'}

Retorne APENAS um JSON no formato:
{
  "score_risco": 82,
  "nivel_risco": "alto",
  "motivo_apontado_ia": "Caiu de 4 para 1 treino/semana e não abre o app há 9 dias",
  "acao_sugerida": "Mensagem WhatsApp",
  "mensagem_whatsapp_sugerida": "Oi, ${aluno.nome}! Aqui é o coordenador da VnFitness. Vi que sua rotina mudou esta semana. Quer que a gente ajuste um treino mais rápido de 30 min pra você não perder o ritmo? Bora testar?"
}
`;
        try {
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const responseText = response.text() || '{}';
            return JSON.parse(responseText);
        }
        catch (error) {
            console.error('Erro na IA de Retenção Gemini:', error);
            // Fallback analítico
            let score = 20;
            if (aluno.dias_sem_treinar > 7)
                score += 40;
            if (aluno.frequencia_semanal_atual < 2)
                score += 25;
            score = Math.min(score, 95);
            const nivel = score >= 70 ? 'alto' : score >= 40 ? 'medio' : 'baixo';
            return {
                aluno_id: aluno.id,
                score_risco: score,
                nivel_risco: nivel,
                motivo_apontado_ia: aluno.dias_sem_treinar > 5 ? `Ausente há ${aluno.dias_sem_treinar} dias e queda na frequência` : 'Frequência regular',
                acao_sugerida: score >= 60 ? 'Mensagem WhatsApp' : 'Acompanhamento normal',
                mensagem_whatsapp_sugerida: `Olá ${aluno.nome}! Notamos sua ausência nos treinos recentes. Estamos com o time pronto para te apoiar em novos horários se precisar!`
            };
        }
    }
}
