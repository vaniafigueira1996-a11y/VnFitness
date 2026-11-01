const ACCESS_TOKEN = 'sbp_fc8c24f3dee483ee4606e3378d9706dcb5ad8236';
const PROJECT_ID = 'sothigunxokciqpsuhmn';

async function runSQL(sql, label = '') {
  console.log(`[SQL] Executando: ${label}...`);
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ Erro em ${label}:`, errText);
    return { ok: false, error: errText };
  }

  const data = await res.json();
  console.log(`✅ Sucesso: ${label}`);
  return { ok: true, data };
}

async function main() {
  console.log(`Iniciando migração completa do projeto ${PROJECT_ID}...`);

  // 1. Extensões e ENUMs
  await runSQL(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    DO $$ BEGIN
      CREATE TYPE status_usuario_enum AS ENUM ('pendente', 'aprovado', 'rejeitado', 'inativo');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE role_usuario_enum AS ENUM ('admin', 'aluno');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE local_treino_enum AS ENUM ('casa', 'academia');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE nivel_risco_enum AS ENUM ('baixo', 'medio', 'alto');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `, '1. Extensões e ENUMs');

  // 2. Tabelas do Sistema
  await runSQL(`
    -- Tabela usuarios
    CREATE TABLE IF NOT EXISTS public.usuarios (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT NOT NULL UNIQUE,
      nome_completo TEXT NOT NULL,
      telefone TEXT,
      role role_usuario_enum NOT NULL DEFAULT 'aluno',
      status_aprovacao status_usuario_enum NOT NULL DEFAULT 'pendente',
      foto_url TEXT,
      motivo_rejeicao TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );

    -- Tabela dados_biometricos
    CREATE TABLE IF NOT EXISTS public.dados_biometricos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
      peso_kg NUMERIC(5,2) NOT NULL,
      altura_m NUMERIC(3,2) NOT NULL,
      idade INT NOT NULL,
      imc NUMERIC(4,2) NOT NULL,
      classificacao_imc TEXT NOT NULL,
      peso_ideal_min NUMERIC(5,2) NOT NULL,
      peso_ideal_max NUMERIC(5,2) NOT NULL,
      diferenca_peso_meta NUMERIC(5,2) NOT NULL,
      observacoes TEXT,
      registrado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );

    -- Tabela treinos
    CREATE TABLE IF NOT EXISTS public.treinos (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
      titulo TEXT NOT NULL,
      local_treino local_treino_enum NOT NULL DEFAULT 'academia',
      objetivo TEXT NOT NULL,
      nivel_dificuldade TEXT NOT NULL DEFAULT 'Intermediário',
      duracao_estimada_min INT NOT NULL DEFAULT 45,
      exercicios JSONB NOT NULL DEFAULT '[]'::jsonb,
      criado_por_ia BOOLEAN NOT NULL DEFAULT true,
      ativo BOOLEAN NOT NULL DEFAULT true,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );

    -- Tabela planos_nutricionais
    CREATE TABLE IF NOT EXISTS public.planos_nutricionais (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
      calorias_diarias INT NOT NULL,
      proteinas_g INT NOT NULL,
      carboidratos_g INT NOT NULL,
      gorduras_g INT NOT NULL,
      refeicoes JSONB NOT NULL DEFAULT '[]'::jsonb,
      recomendacoes_ia TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );

    -- Tabela checkins_treino
    CREATE TABLE IF NOT EXISTS public.checkins_treino (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
      data_treino DATE NOT NULL DEFAULT CURRENT_DATE,
      duracao_min INT NOT NULL DEFAULT 45,
      intensidade INT CHECK (intensidade BETWEEN 1 AND 5),
      carga_total_kg NUMERIC(7,2),
      exercicio_destaque TEXT,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );

    -- Tabela insights_retencao_ia
    CREATE TABLE IF NOT EXISTS public.insights_retencao_ia (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
      score_risco INT NOT NULL CHECK (score_risco BETWEEN 0 AND 100),
      nivel_risco nivel_risco_enum NOT NULL DEFAULT 'baixo',
      motivo_apontado TEXT NOT NULL,
      acao_sugerida TEXT NOT NULL,
      mensagem_whatsapp_sugerida TEXT,
      dias_sem_treinar INT DEFAULT 0,
      frequencia_semanal_atual NUMERIC(3,1) DEFAULT 0.0,
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );

    -- Tabela professores
    CREATE TABLE IF NOT EXISTS public.professores (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      nome TEXT NOT NULL,
      especialidade TEXT NOT NULL,
      telefone TEXT,
      alunos_atribuidos INT DEFAULT 0,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );

    -- Tabela mensagens_whatsapp
    CREATE TABLE IF NOT EXISTS public.mensagens_whatsapp (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      aluno_nome TEXT NOT NULL,
      telefone TEXT,
      mensagem TEXT NOT NULL,
      motivo_ia TEXT,
      status TEXT DEFAULT 'pendente',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
    );
  `, '2. Tabelas do Sistema');

  // 3. Trigger Seguro para novos usuários no Auth
  await runSQL(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    DECLARE
      v_nome TEXT;
      v_is_master BOOLEAN;
    BEGIN
      v_nome := COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1));
      v_is_master := (LOWER(NEW.email) = 'fredsoncitty@gmail.com');

      INSERT INTO public.usuarios (id, email, nome_completo, role, status_aprovacao)
      VALUES (
        NEW.id,
        LOWER(NEW.email),
        v_nome,
        CASE WHEN v_is_master THEN 'admin'::public.role_usuario_enum ELSE 'aluno'::public.role_usuario_enum END,
        CASE WHEN v_is_master THEN 'aprovado'::public.status_usuario_enum ELSE 'pendente'::public.status_usuario_enum END
      )
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        nome_completo = COALESCE(EXCLUDED.nome_completo, public.usuarios.nome_completo),
        role = CASE WHEN v_is_master THEN 'admin'::public.role_usuario_enum ELSE public.usuarios.role END,
        status_aprovacao = CASE WHEN v_is_master THEN 'aprovado'::public.status_usuario_enum ELSE public.usuarios.status_aprovacao END;

      RETURN NEW;
    EXCEPTION
      WHEN OTHERS THEN
        RETURN NEW;
    END;
    $$;

    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `, '3. Trigger seguro on_auth_user_created');

  // 4. Buckets do Storage
  await runSQL(`
    INSERT INTO storage.buckets (id, name, public) 
    VALUES 
      ('avatars', 'avatars', true),
      ('evolucao', 'evolucao', false),
      ('exercicios', 'exercicios', true)
    ON CONFLICT (id) DO NOTHING;
  `, '4. Storage Buckets');

  // 5. Seed do Administrador Master (fredsoncitty@gmail.com / SophiA27)
  await runSQL(`
    DO $$
    DECLARE
      v_admin_id UUID := 'e5b2e9c6-6363-4a75-b01c-76dab528317e';
    BEGIN
      -- Garante no auth.users com confirmação de email ativa
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        role,
        aud,
        created_at,
        updated_at
      ) VALUES (
        v_admin_id,
        '00000000-0000-0000-0000-000000000000',
        'fredsoncitty@gmail.com',
        crypt('SophiA27', gen_salt('bf')),
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{"nome_completo":"Fredson Citty"}'::jsonb,
        'authenticated',
        'authenticated',
        now(),
        now()
      )
      ON CONFLICT (id) DO UPDATE SET
        encrypted_password = crypt('SophiA27', gen_salt('bf')),
        email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now()),
        raw_user_meta_data = '{"nome_completo":"Fredson Citty"}'::jsonb;

      -- Garante no public.usuarios
      INSERT INTO public.usuarios (id, email, nome_completo, role, status_aprovacao)
      VALUES (v_admin_id, 'fredsoncitty@gmail.com', 'Fredson Citty', 'admin', 'aprovado')
      ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        status_aprovacao = 'aprovado',
        nome_completo = 'Fredson Citty';
    END $$;
  `, '5. Seed Admin Master Fredson Citty');

  // 6. Seed dos Alunos de Retenção e Professores
  await runSQL(`
    DO $$
    DECLARE
      v_users RECORD;
    BEGIN
      -- Professores
      INSERT INTO public.professores (nome, especialidade, telefone, alunos_atribuidos)
      VALUES 
        ('Prof. Diego Lima', 'Hipertrofia & Força', '5511988880001', 42),
        ('Profª. Amanda Rocha', 'Emagrecimento & Mobilidade', '5511988880002', 38),
        ('Prof. Lucas Mendes', 'Biomecânica & Reabilitação', '5511988880003', 29)
      ON CONFLICT DO NOTHING;

      -- Mensagens de WhatsApp
      INSERT INTO public.mensagens_whatsapp (aluno_nome, telefone, mensagem, motivo_ia, status)
      VALUES
        ('Rafael Tavares', '5511999990001', 'Oi, Rafa! Aqui é o Diego da VnFitness. Vi que sua rotina mudou. Montei um treino de 35 min que cabe no seu novo horário da noite. Bora testar amanhã?', 'Mudou de horário e parou de abrir o treino', 'pendente'),
        ('Lívia Sampaio', '5511999990002', 'Olá Lívia! Notamos que faz 12 dias que não te vemos no treino na VnFitness. Quer agendar uma reavaliação de treino gratuita essa semana?', 'Renovação perto e queda contínua de treinos', 'pendente')
      ON CONFLICT DO NOTHING;

      -- Alunos de Retenção
      FOR v_users IN 
        SELECT * FROM (VALUES
          ('00000000-0000-0000-0000-000000000001'::uuid, 'rafael.tavares@vnfitness.com', 'Rafael Tavares', '5511999990001', 82, 'alto', 'Mudou de horário e parou de abrir o treino', 'Mensagem', 'Oi, Rafa! Aqui é o Diego da VnFitness. Vi que sua rotina mudou. Montei um treino de 35 min que cabe no seu novo horário da noite.', 9, 1.0),
          ('00000000-0000-0000-0000-000000000002'::uuid, 'livia.sampaio@vnfitness.com', 'Lívia Sampaio', '5511999990002', 74, 'alto', 'Renovação perto e queda contínua de treinos', 'Ligar hoje', 'Olá Lívia! Notamos que faz 12 dias que não te vemos no treino na VnFitness.', 12, 0.5),
          ('00000000-0000-0000-0000-000000000003'::uuid, 'marcos.freitas@vnfitness.com', 'Marcos Freitas', '5511999990003', 68, 'medio', 'Relatou dor no ombro em duas séries seguidas', 'Reavaliar', 'Olá Marcos! Nosso sistema detectou que você sentiu desconforto no ombro.', 4, 2.0),
          ('00000000-0000-0000-0000-000000000004'::uuid, 'juliana.araujo@vnfitness.com', 'Juliana Araújo', '5511999990004', 63, 'medio', 'Aluna nova ainda sem rotina de treino', 'Mensagem', 'Oi Juliana! Tudo bem? Como está sendo seu início aqui na VnFitness?', 6, 1.0),
          ('00000000-0000-0000-0000-000000000005'::uuid, 'thiago.correia@vnfitness.com', 'Thiago Correia', '5511999990005', 58, 'medio', 'Carga parada há 6 semanas, sem evolução', 'Reavaliar', 'Fala Thiago! O Coach IA da VnFitness preparou um estímulo diferente.', 5, 2.5)
        ) AS t(uid, mail, nome, fone, score, nivel, motivo, acao, wpp, dias, freq)
      LOOP
        INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, role, aud)
        VALUES (v_users.uid, '00000000-0000-0000-0000-000000000000', v_users.mail, crypt('Password123!', gen_salt('bf')), now(), json_build_object('nome_completo', v_users.nome)::jsonb, 'authenticated', 'authenticated')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

        INSERT INTO public.usuarios (id, email, nome_completo, telefone, role, status_aprovacao)
        VALUES (v_users.uid, v_users.mail, v_users.nome, v_users.fone, 'aluno', 'aprovado')
        ON CONFLICT (id) DO UPDATE SET nome_completo = EXCLUDED.nome_completo, telefone = EXCLUDED.telefone;

        DELETE FROM public.insights_retencao_ia WHERE usuario_id = v_users.uid;
        INSERT INTO public.insights_retencao_ia (usuario_id, score_risco, nivel_risco, motivo_apontado, acao_sugerida, mensagem_whatsapp_sugerida, dias_sem_treinar, frequencia_semanal_atual)
        VALUES (v_users.uid, v_users.score, v_users.nivel::nivel_risco_enum, v_users.motivo, v_users.acao, v_users.wpp, v_users.dias, v_users.freq);
      END LOOP;

      -- Check-in e Biometria de Demonstração para Fredson Citty
      DELETE FROM public.dados_biometricos WHERE usuario_id = 'e5b2e9c6-6363-4a75-b01c-76dab528317e';
      INSERT INTO public.dados_biometricos (usuario_id, peso_kg, altura_m, idade, imc, classificacao_imc, peso_ideal_min, peso_ideal_max, diferenca_peso_meta)
      VALUES ('e5b2e9c6-6363-4a75-b01c-76dab528317e', 83.0, 1.78, 28, 26.20, 'Sobrepeso Leve', 59.0, 79.0, -4.0);

      INSERT INTO public.checkins_treino (usuario_id, data_treino, duracao_min, intensidade, carga_total_kg, exercicio_destaque)
      VALUES 
        ('e5b2e9c6-6363-4a75-b01c-76dab528317e', CURRENT_DATE, 50, 5, 58.0, 'Remada curvada')
      ON CONFLICT DO NOTHING;
    END $$;
  `, '6. Seed Alunos Retenção, Biometria e Checkin');

  console.log('🎉 Migração concluída com sucesso!');
}

main().catch(err => {
  console.error('Falha geral:', err);
  process.exit(1);
});

