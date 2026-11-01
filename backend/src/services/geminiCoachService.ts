import { genAI } from '../config/gemini.js';

export interface DadosAlunoCoach {
  idade: number;
  peso_kg: number;
  altura_m: number;
  imc: number;
  classificacao_imc: string;
  diferenca_peso_meta: number;
  local_treino: 'casa' | 'academia';
  objetivo?: string;
  nivel_experiencia?: string;
}

export interface PlanoNutricionalGerado {
  calorias_diarias: number;
  proteinas_g: number;
  carboidratos_g: number;
  gorduras_g: number;
  refeicoes: Array<{
    horario: string;
    titulo: string;
    alimentos: string;
    calorias: number;
  }>;
  recomendacoes_ia: string;
}

export interface ExercicioTreino {
  nome: string;
  series: number;
  repeticoes: string;
  carga_sugerida?: string;
  descanso_segundos: number;
  dica_execucao: string;
}

export interface PlanoTreinoGerado {
  titulo: string;
  local_treino: 'casa' | 'academia';
  objetivo: string;
  duracao_estimada_min: number;
  frequencia_semanal_dias: number;
  exercicios: ExercicioTreino[];
  mensagem_motivacional: string;
}

export interface RespostaCoachIA {
  nutricao: PlanoNutricionalGerado;
  treino: PlanoTreinoGerado;
}

export class GeminiCoachService {
  static async gerarTreinoEDieta(dados: DadosAlunoCoach): Promise<RespostaCoachIA> {
    const prompt = `
Você é o Agente "Coach IA" do aplicativo VnFitness. Sua missão é atuar como um treinador físico e nutricionista esportivo de elite.

Analise o perfil biométrico do usuário abaixo:
- Idade: ${dados.idade} anos
- Peso: ${dados.peso_kg} kg
- Altura: ${dados.altura_m} m
- IMC Atual: ${dados.imc} (${dados.classificacao_imc})
- Ajuste de Peso Necessário para IMC saudável: ${dados.diferenca_peso_meta > 0 ? `ganhar +${dados.diferenca_peso_meta} kg` : dados.diferenca_peso_meta < 0 ? `perder ${Math.abs(dados.diferenca_peso_meta)} kg` : 'manter peso atual'}
- Local onde irá treinar: ${dados.local_treino === 'casa' ? 'EM CASA (apenas peso corporal / calistenia e itens domésticos)' : 'NA ACADEMIA (com halteres, barras, cabos e máquinas completas)'}
- Objetivo primário: ${dados.objetivo || 'Saúde geral e evolução física'}

REQUISITOS OBRIGATÓRIOS:
1. Monte um plano de nutrição e cálculo de macronutrientes realista com distribuição calórica (Calorias, Proteínas em gramas, Carboidratos em gramas, Gorduras em gramas) e 4 refeições diárias saudáveis da culinária brasileira.
2. Monte um plano de exercícios adaptado RIGOROSAMENTE ao local selecionado (${dados.local_treino}).
   - Se for 'casa', NUNCA prescreva máquinas ou aparelhos de academia. Use flexões, agachamentos, pranchas, afundos, etc.
   - Se for 'academia', prescreva exercícios clássicos com carga (ex: supino, puxada, leg press, etc.).
3. Retorne APENAS um JSON estrito, sem markdown, sem blocos de texto fora do JSON.

FORMATO JSON ESPERADO:
{
  "nutricao": {
    "calorias_diarias": 2100,
    "proteinas_g": 140,
    "carboidratos_g": 220,
    "gorduras_g": 60,
    "refeicoes": [
      {
        "horario": "07:30",
        "titulo": "Café da Manhã",
        "alimentos": "3 ovos mexidos, 2 fatias de pão integral e 1 maçã",
        "calorias": 420
      },
      {
        "horario": "12:30",
        "titulo": "Almoço",
        "alimentos": "150g de peito de frango grelhado, 120g de arroz integral, feijão e salada verde",
        "calorias": 650
      },
      {
        "horario": "16:00",
        "titulo": "Lanche da Tarde",
        "alimentos": "Iogurte desnatado com 30g de aveia e morangos",
        "calorias": 280
      },
      {
        "horario": "20:00",
        "titulo": "Jantar",
        "alimentos": "150g de patinho moído ou peixe com legumes cozidos e azeite",
        "calorias": 520
      }
    ],
    "recomendacoes_ia": "Mantenha a ingestão de ao menos 2,5 litros de água diariamente."
  },
  "treino": {
    "titulo": "Treino Personalizado VnFitness",
    "local_treino": "${dados.local_treino}",
    "objetivo": "${dados.objetivo || 'Evolução e condicionamento'}",
    "duracao_estimada_min": 45,
    "frequencia_semanal_dias": 4,
    "exercicios": [
      {
        "nome": "Exercício Exemplo",
        "series": 3,
        "repeticoes": "12 a 15",
        "carga_sugerida": "Peso corporal",
        "descanso_segundos": 60,
        "dica_execucao": "Manter postura ereta e abdômen contraído"
      }
    ],
    "mensagem_motivacional": "Você está a poucos passos da sua melhor versão física!"
  }
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
      const parsedJson = JSON.parse(responseText) as RespostaCoachIA;
      return parsedJson;
    } catch (error) {
      console.error('Erro na integração com Google Gemini:', error);
      return this.gerarFallback(dados);
    }
  }

  private static gerarFallback(dados: DadosAlunoCoach): RespostaCoachIA {
    const isCasa = dados.local_treino === 'casa';
    const calorias = dados.diferenca_peso_meta < 0 ? Math.round(dados.peso_kg * 22) : Math.round(dados.peso_kg * 30);
    const proteinas = Math.round(dados.peso_kg * 2);
    const gorduras = Math.round(dados.peso_kg * 0.8);
    const carboidratos = Math.round((calorias - (proteinas * 4 + gorduras * 9)) / 4);

    return {
      nutricao: {
        calorias_diarias: calorias,
        proteinas_g: proteinas,
        carboidratos_g: carboidratos,
        gorduras_g: gorduras,
        refeicoes: [
          { horario: '07:30', titulo: 'Café da Manhã', alimentos: '3 ovos cozidos ou mexidos, 2 fatias de pão integral, café preto sem açúcar', calorias: Math.round(calorias * 0.25) },
          { horario: '12:30', titulo: 'Almoço', alimentos: '150g filé de frango grelhado, 120g arroz, 80g feijão e salada verde à vontade', calorias: Math.round(calorias * 0.35) },
          { horario: '16:00', titulo: 'Lanche', alimentos: 'Iogurte natural, 30g de aveia em flocos e 1 fruta (banana ou maçã)', calorias: Math.round(calorias * 0.15) },
          { horario: '20:00', titulo: 'Jantar', alimentos: 'Omelete com vegetais ou carne magra com legumes no vapor', calorias: Math.round(calorias * 0.25) }
        ],
        recomendacoes_ia: `Com base no seu IMC de ${dados.imc} (${dados.classificacao_imc}), priorize ingestão hídrica de no mínimo 3L/dia e reduza alimentos ultraprocessados.`
      },
      treino: {
        titulo: isCasa ? 'Treino Funcional Calistênico em Casa' : 'Treino de Força e Hipertrofia na Academia',
        local_treino: dados.local_treino,
        objetivo: dados.diferenca_peso_meta < 0 ? 'Definição e Gasto Calórico' : 'Ganho de Massa Muscular',
        duracao_estimada_min: 45,
        frequencia_semanal_dias: 4,
        exercicios: isCasa ? [
          { nome: 'Agachamento Livre (Air Squat)', series: 4, repeticoes: '15 a 20', carga_sugerida: 'Peso corporal', descanso_segundos: 45, dica_execucao: 'Pés na largura dos ombros, desça mantendo coluna neutra.' },
          { nome: 'Flexão de Braço (no solo ou joelhos)', series: 4, repeticoes: '10 a 12', carga_sugerida: 'Peso corporal', descanso_segundos: 60, dica_execucao: 'Cotovelos a 45 graus em relação ao tronco.' },
          { nome: 'Afundo Alternado', series: 3, repeticoes: '12 cada perna', carga_sugerida: 'Peso corporal', descanso_segundos: 45, dica_execucao: 'Passo largo e joelho traseiro quase tocando o solo.' },
          { nome: 'Prancha Isométrica', series: 3, repeticoes: '40 segundos', carga_sugerida: 'Isometria', descanso_segundos: 45, dica_execucao: 'Abdômen e glúteos contraídos, sem arquear a lombar.' }
        ] : [
          { nome: 'Supino Reto com Barra ou Halteres', series: 4, repeticoes: '10 a 12', carga_sugerida: 'Moderada / Progressiva', descanso_segundos: 60, dica_execucao: 'Escápulas travadas no banco e movimento controlado.' },
          { nome: 'Puxada Frontal na Polia', series: 4, repeticoes: '10 a 12', carga_sugerida: 'Moderada', descanso_segundos: 60, dica_execucao: 'Puxe em direção à parte superior do peito.' },
          { nome: 'Leg Press 45º', series: 4, repeticoes: '12 a 15', carga_sugerida: 'Moderada a Pesada', descanso_segundos: 75, dica_execucao: 'Amplitude completa sem estender os joelhos no limite.' },
          { nome: 'Elevação Lateral com Halteres', series: 3, repeticoes: '12 a 15', carga_sugerida: 'Leve a Moderada', descanso_segundos: 45, dica_execucao: 'Foco no deltoide medial, sem balanço com o tronco.' }
        ],
        mensagem_motivacional: `Excelente escolha ao treinar ${isCasa ? 'em casa' : 'na academia'}! Consistência vence intensidade.`
      }
    };
  }
}
