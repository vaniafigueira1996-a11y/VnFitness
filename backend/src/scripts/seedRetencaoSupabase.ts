import { supabaseAdmin } from '../config/supabase.js';
import crypto from 'crypto';

interface AlunoSeed {
  email: string;
  nome_completo: string;
  telefone: string;
  matricula: string;
  professor: string;
  plano: string;
  ultimo_treino: string;
  frequencia_antiga: string;
  motivo_ia: string;
  score_risco: number;
  nivel_risco: 'alto' | 'medio' | 'baixo';
  acao_sugerida: string;
  dias_sem_treinar: number;
  frequencia_semanal_atual: number;
  fatores: Array<{ texto: string; peso: string }>;
  whatsapp_msg: string;
  timeline: Array<{ dot: string; texto: string }>;
}

const ALUNOS_SEMENTES: AlunoSeed[] = [
  {
    email: 'rafael.tavares@vnfitness.com',
    nome_completo: 'Rafael Tavares',
    telefone: '11988887701',
    matricula: '04821',
    professor: 'Prof. Diego Lima',
    plano: 'Mensal (1 ano e 2 meses)',
    ultimo_treino: 'há 9 dias',
    frequencia_antiga: 'era 4x por semana',
    motivo_ia: 'Mudou de horário e parou de abrir o treino',
    score_risco: 82,
    nivel_risco: 'alto',
    acao_sugerida: 'Mensagem',
    dias_sem_treinar: 9,
    frequencia_semanal_atual: 1.0,
    fatores: [
      { texto: 'Caiu de 4 para 1 treino/semana', peso: '+34' },
      { texto: 'Horário mudou de 7h para 21h', peso: '+22' },
      { texto: 'Não abre o treino há 9 dias', peso: '+18' },
      { texto: 'Plano mensal, sem fidelidade', peso: '-8' }
    ],
    whatsapp_msg: 'Oi, Rafa! Aqui é o Diego da VnFitness. Vi que sua rotina mudou. Montei um treino de 35 min que cabe no seu novo horário da noite, sem fila nas máquinas. Bora testar amanhã?',
    timeline: [
      { dot: 'red', texto: 'Hoje, 06:00: risco passou de 61 para 82' },
      { dot: 'green', texto: '21/09: último check-in, às 21:14' },
      { dot: 'green', texto: '02/09: recorde no supino, 60 kg' }
    ]
  },
  {
    email: 'livia.sampaio@vnfitness.com',
    nome_completo: 'Lívia Sampaio',
    telefone: '11988887702',
    matricula: '03912',
    professor: 'Profª. Amanda Rocha',
    plano: 'Anual (vence em 40 dias)',
    ultimo_treino: 'há 12 dias',
    frequencia_antiga: 'sem abrir o app',
    motivo_ia: 'Renovação perto e queda contínua de treinos',
    score_risco: 74,
    nivel_risco: 'alto',
    acao_sugerida: 'Ligar hoje',
    dias_sem_treinar: 12,
    frequencia_semanal_atual: 0.5,
    fatores: [
      { texto: 'Vencimento do plano em 40 dias', peso: '+40' },
      { texto: '12 dias sem registro de check-in', peso: '+30' }
    ],
    whatsapp_msg: 'Olá Lívia! Notamos que faz 12 dias que não te vemos no treino na VnFitness. Quer agendar uma reavaliação de treino gratuita com a equipe essa semana?',
    timeline: [
      { dot: 'red', texto: 'Hoje: score de retenção 74' },
      { dot: 'green', texto: '15/09: último check-in' }
    ]
  },
  {
    email: 'marcos.freitas@vnfitness.com',
    nome_completo: 'Marcos Freitas',
    telefone: '11988887703',
    matricula: '05120',
    professor: 'Prof. Lucas Mendes',
    plano: 'Mensal (5 meses)',
    ultimo_treino: 'há 4 dias',
    frequencia_antiga: 'marcou "doeu" 2x',
    motivo_ia: 'Relatou dor no ombro em duas séries seguidas',
    score_risco: 68,
    nivel_risco: 'medio',
    acao_sugerida: 'Reavaliar',
    dias_sem_treinar: 4,
    frequencia_semanal_atual: 2.0,
    fatores: [
      { texto: 'Feedback de desconforto articular no ombro', peso: '+45' }
    ],
    whatsapp_msg: 'Fala Marcos! A IA da VnFitness detectou que você marcou desconforto no ombro no último treino. Ajustei sua série para proteger a articulação. Quer ver?',
    timeline: [
      { dot: 'red', texto: 'Ontem: dor relatada em desenvolvimento com halteres' }
    ]
  },
  {
    email: 'juliana.araujo@vnfitness.com',
    nome_completo: 'Juliana Araújo',
    telefone: '11988887704',
    matricula: '06233',
    professor: 'Prof. Diego Lima',
    plano: 'Trimestral (3 semanas)',
    ultimo_treino: 'há 6 dias',
    frequencia_antiga: '3 treinos no total',
    motivo_ia: 'Aluna nova ainda sem rotina de treino',
    score_risco: 63,
    nivel_risco: 'medio',
    acao_sugerida: 'Mensagem',
    dias_sem_treinar: 6,
    frequencia_semanal_atual: 1.5,
    fatores: [
      { texto: 'Matrícula recente com frequência irregular', peso: '+38' }
    ],
    whatsapp_msg: 'Oi Juliana! Como estão sendo suas primeiras semanas na VnFitness? Posso te acompanhar no treino de amanhã?',
    timeline: [
      { dot: 'green', texto: '3 treinos completados no mês' }
    ]
  },
  {
    email: 'thiago.correia@vnfitness.com',
    nome_completo: 'Thiago Correia',
    telefone: '11988887705',
    matricula: '02890',
    professor: 'Profª. Amanda Rocha',
    plano: 'Mensal (2 anos)',
    ultimo_treino: 'há 5 dias',
    frequencia_antiga: 'treinos 40% mais curtos',
    motivo_ia: 'Carga parada há 6 semanas, sem evolução',
    score_risco: 58,
    nivel_risco: 'medio',
    acao_sugerida: 'Reavaliar',
    dias_sem_treinar: 5,
    frequencia_semanal_atual: 2.5,
    fatores: [
      { texto: 'Estagnação de cargas e treinos abreviados', peso: '+35' }
    ],
    whatsapp_msg: 'Fala Thiago! Hora de quebrar esse platô de cargas na VnFitness. Que tal a gente subir seu estímulo com uma periodização nova?',
    timeline: [
      { dot: 'green', texto: 'Frequente há 2 anos' }
    ]
  }
];

export async function seedRetencaoSupabase() {
  console.log('⚡ Semeando alunos e insights de retenção no Supabase...');

  for (const aluno of ALUNOS_SEMENTES) {
    // 1. Cria ou atualiza usuário na tabela 'usuarios'
    // Busca por e-mail para reaproveitar ou cria novo
    let { data: usuarioExistente } = await supabaseAdmin
      .from('usuarios')
      .select('id')
      .eq('email', aluno.email)
      .maybeSingle();

    let usuarioId = usuarioExistente?.id;

    const preferencias = {
      matricula: aluno.matricula,
      professor: aluno.professor,
      plano: aluno.plano,
      ultimo_treino: aluno.ultimo_treino,
      frequencia_antiga: aluno.frequencia_antiga,
      fatores: aluno.fatores,
      timeline: aluno.timeline
    };

    if (!usuarioId) {
      // 1. Cria usuário no Supabase Auth usando a Service Role Key
      let authUserId: string | null = null;

      const { data: authCreated, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: aluno.email,
        password: 'VnFitness2026!#',
        email_confirm: true,
        user_metadata: { nome_completo: aluno.nome_completo }
      });

      if (authErr) {
        // Se já existe no Auth, busca pelo e-mail
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const found = listData.users.find(u => u.email === aluno.email);
        if (found) {
          authUserId = found.id;
        } else {
          console.error(`Erro ao criar usuário no Auth para ${aluno.nome_completo}:`, authErr);
          continue;
        }
      } else {
        authUserId = authCreated.user.id;
      }

      usuarioId = authUserId;

      const { data: novoUsuario, error: userErr } = await supabaseAdmin
        .from('usuarios')
        .upsert({
          id: usuarioId,
          email: aluno.email,
          nome_completo: aluno.nome_completo,
          telefone: aluno.telefone,
          role: 'aluno',
          status_aprovacao: 'aprovado',
          preferencias,
          atualizado_em: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();

      if (userErr) {
        console.error(`Erro ao criar aluno ${aluno.nome_completo}:`, userErr);
        continue;
      }
    } else {
      await supabaseAdmin
        .from('usuarios')
        .update({
          nome_completo: aluno.nome_completo,
          telefone: aluno.telefone,
          preferencias,
          atualizado_em: new Date().toISOString()
        })
        .eq('id', usuarioId);
    }

    // 2. Cria ou atualiza na tabela 'insights_retencao_ia'
    const { error: insErr } = await supabaseAdmin
      .from('insights_retencao_ia')
      .upsert({
        usuario_id: usuarioId,
        score_risco: aluno.score_risco,
        nivel_risco: aluno.nivel_risco,
        motivo_apontado: aluno.motivo_ia,
        acao_sugerida: aluno.acao_sugerida,
        mensagem_whatsapp_sugerida: aluno.whatsapp_msg,
        dias_sem_treinar: aluno.dias_sem_treinar,
        frequencia_semanal_atual: aluno.frequencia_semanal_atual,
        atualizado_em: new Date().toISOString()
      }, { onConflict: 'usuario_id' });

    if (insErr) {
      console.error(`Erro ao salvar insight de retenção para ${aluno.nome_completo}:`, insErr);
    } else {
      console.log(`✅ Aluno ${aluno.nome_completo} salvo no Supabase com score ${aluno.score_risco}`);
    }
  }

  // 3. Semeia os professores se a tabela estiver vazia
  const { data: profsExistentes } = await supabaseAdmin.from('professores').select('id');
  if (!profsExistentes || profsExistentes.length === 0) {
    await supabaseAdmin.from('professores').insert([
      { nome: 'Prof. Diego Lima', email: 'diego@vnfitness.com', telefone: '11988887710', especialidade: 'Hipertrofia & Força', alunos_atribuidos: 142 },
      { nome: 'Profª. Amanda Rocha', email: 'amanda@vnfitness.com', telefone: '11988887711', especialidade: 'Emagrecimento & Funcional', alunos_atribuidos: 118 },
      { nome: 'Prof. Lucas Mendes', email: 'lucas@vnfitness.com', telefone: '11988887712', especialidade: 'Reabilitação & Postura', alunos_atribuidos: 89 }
    ]);
    console.log('✅ Professores semeados no Supabase');
  }

  console.log('🎉 Sincronização de Retenção com o Supabase finalizada com sucesso!');
}

seedRetencaoSupabase().catch(console.error);
