import 'dotenv/config';
import { supabase } from '../src/config/supabase.js';

async function seed() {
  const users = [
    { email: 'rafael.tavares@vnfitness.com', nome: 'Rafael Tavares', fone: '5511999990001', score: 82, nivel: 'alto', motivo: 'Mudou de horário e parou de abrir o treino', acao: 'Mensagem', wpp: 'Oi, Rafa! Aqui é o Diego da VnFitness. Vi que sua rotina mudou. Montei um treino de 35 min que cabe no seu novo horário da noite, sem fila nas máquinas. Bora testar amanhã?', dias: 9, freq: 1.0 },
    { email: 'livia.sampaio@vnfitness.com', nome: 'Lívia Sampaio', fone: '5511999990002', score: 74, nivel: 'alto', motivo: 'Renovação perto e queda contínua de treinos', acao: 'Ligar hoje', wpp: 'Olá Lívia! Notamos que faz 12 dias que não te vemos no treino na VnFitness. Quer agendar uma reavaliação de treino gratuita com a equipe essa semana?', dias: 12, freq: 0.5 },
    { email: 'marcos.freitas@vnfitness.com', nome: 'Marcos Freitas', fone: '5511999990003', score: 68, nivel: 'medio', motivo: 'Relatou dor no ombro em duas séries seguidas', acao: 'Reavaliar', wpp: 'Olá Marcos! Nosso sistema detectou que você sentiu desconforto no ombro no último treino. Que tal ajustarmos seu treino na VnFitness?', dias: 4, freq: 2.0 },
    { email: 'juliana.araujo@vnfitness.com', nome: 'Juliana Araújo', fone: '5511999990004', score: 63, nivel: 'medio', motivo: 'Aluna nova ainda sem rotina de treino', acao: 'Mensagem', wpp: 'Oi Juliana! Tudo bem? Como está sendo seu início aqui na VnFitness? Posso te ajudar com alguma dúvida sobre os aparelhos?', dias: 6, freq: 1.0 },
    { email: 'thiago.correia@vnfitness.com', nome: 'Thiago Correia', fone: '5511999990005', score: 58, nivel: 'medio', motivo: 'Carga parada há 6 semanas, sem evolução', acao: 'Reavaliar', wpp: 'Fala Thiago! O Coach IA da VnFitness preparou um estímulo diferente com variação de séries para você quebrar esse platô. Vamos conferir?', dias: 5, freq: 2.5 }
  ];

  // Adiciona aluna pendente
  const { data: pendData } = await supabase.auth.signUp({
    email: 'carolina.mendes@vnfitness.com',
    password: 'Password123!',
    options: { data: { nome_completo: 'Carolina Mendes' } }
  });
  const pendId = pendData?.user?.id;
  if (pendId) {
    await supabase.from('usuarios').upsert({
      id: pendId,
      email: 'carolina.mendes@vnfitness.com',
      nome_completo: 'Carolina Mendes',
      telefone: '5511999990006',
      role: 'aluno',
      status_aprovacao: 'pendente'
    });
    console.log('✅ Aluna pendente cadastrada:', pendId);
  }

  console.log('Cadastrando alunos de retenção no Supabase Auth...');

  for (const u of users) {
    let userId: string | null = null;
    const { data: signUpData, error: signErr } = await supabase.auth.signUp({
      email: u.email,
      password: 'Password123!',
      options: {
        data: { nome_completo: u.nome }
      }
    });

    if (signUpData?.user?.id) {
      userId = signUpData.user.id;
    } else {
      const { data: loginData } = await supabase.auth.signInWithPassword({
        email: u.email,
        password: 'Password123!'
      });
      userId = loginData?.user?.id || null;
    }

    if (userId) {
      const { error: upsertErr } = await supabase.from('usuarios').upsert({
        id: userId,
        email: u.email,
        nome_completo: u.nome,
        telefone: u.fone,
        role: 'aluno',
        status_aprovacao: 'aprovado'
      });

      if (upsertErr) console.error('Erro ao atualizar usuario:', upsertErr);

      await supabase.from('insights_retencao_ia').delete().eq('usuario_id', userId);
      const { error: insErr } = await supabase.from('insights_retencao_ia').insert({
        usuario_id: userId,
        score_risco: u.score,
        nivel_risco: u.nivel as any,
        motivo_apontado: u.motivo,
        acao_sugerida: u.acao,
        mensagem_whatsapp_sugerida: u.wpp,
        dias_sem_treinar: u.dias,
        frequencia_semanal_atual: u.freq
      });

      if (insErr) console.error('Erro ao inserir insight:', insErr);
      else console.log('✅ Aluno e Insight cadastrados com sucesso:', u.nome, userId);
    }
  }

  console.log('🎉 Operação concluída!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Erro no seed:', err);
  process.exit(1);
});
