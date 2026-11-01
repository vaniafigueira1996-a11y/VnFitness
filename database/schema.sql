-- ==============================================================================
-- PROJETO: VnFitness - App de Fitness e Nutrição com IA
-- ARQUIVO: schema.sql (Tabelas, RLS, Storage Buckets e Seed do Admin)
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMs para controle de estados e tipos
CREATE TYPE status_usuario_enum AS ENUM ('pendente', 'aprovado', 'rejeitado', 'inativo');
CREATE TYPE role_usuario_enum AS ENUM ('admin', 'aluno');
CREATE TYPE local_treino_enum AS ENUM ('casa', 'academia');
CREATE TYPE nivel_risco_enum AS ENUM ('baixo', 'medio', 'alto');

-- ==============================================================================
-- 3. TABELA: usuarios
-- Guarda os dados de perfil vinculados ao Supabase Auth
-- ==============================================================================
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

-- ==============================================================================
-- 4. TABELA: dados_biometricos
-- Registra peso, altura, idade, cálculo de IMC e metas de peso do aluno
-- ==============================================================================
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
    diferenca_peso_meta NUMERIC(5,2) NOT NULL, -- negativo se precisa perder, positivo se precisa ganhar
    observacoes TEXT,
    registrado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABELA: treinos
-- Guarda os planos de treino gerados pelo Coach IA ou montados pelo Admin
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.treinos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    local_treino local_treino_enum NOT NULL DEFAULT 'academia',
    objetivo TEXT NOT NULL,
    nivel_dificuldade TEXT NOT NULL DEFAULT 'Intermediário',
    duracao_estimada_min INT NOT NULL DEFAULT 45,
    exercicios JSONB NOT NULL DEFAULT '[]'::jsonb, 
    -- Estrutura JSONB de exemplo:
    -- [{"nome": "Supino Reto", "series": 4, "repeticoes": "10-12", "carga_kg": 50, "descanso_seg": 60, "dica": "Manter escápulas retraídas"}]
    criado_por_ia BOOLEAN NOT NULL DEFAULT true,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. TABELA: planos_nutricionais
-- Guarda o plano alimentar gerado pelo Coach IA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.planos_nutricionais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    calorias_diarias INT NOT NULL,
    proteinas_g INT NOT NULL,
    carboidratos_g INT NOT NULL,
    gorduras_g INT NOT NULL,
    refeicoes JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- Estrutura JSONB:
    -- [{"horario": "07:30", "titulo": "Café da Manhã", "alimentos": "Ovos mexidos, aveia e banana", "calorias": 420}]
    recomendacoes_ia TEXT,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 7. TABELA: checkins_treino
-- Registro para o Heatmap de treinos e métricas de consistência
-- ==============================================================================
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

-- ==============================================================================
-- 8. TABELA: insights_retencao_ia (Para o Dashboard Administrativo Forja)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.insights_retencao_ia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    score_risco INT NOT NULL CHECK (score_risco BETWEEN 0 AND 100),
    nivel_risco nivel_risco_enum NOT NULL,
    motivo_apontado TEXT NOT NULL,
    acao_sugerida TEXT NOT NULL,
    mensagem_whatsapp_sugerida TEXT NOT NULL,
    dias_sem_treinar INT NOT NULL DEFAULT 0,
    frequencia_semanal_atual NUMERIC(3,1) NOT NULL DEFAULT 0.0,
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 9. FUNÇÃO E TRIGGER: Atualizar updated_at automaticamente
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_usuarios_updated
    BEFORE UPDATE ON public.usuarios
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- ==============================================================================
-- 10. TRIGGER PARA CRIAR PERFIL AUTOMÁTICO NO SIGNUP (Supabase Auth)
-- Garante que apenas fredsoncitty@gmail.com seja admin e nasça aprovado.
-- Demais usuários nascem como 'aluno' e 'pendente'.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_master_admin BOOLEAN;
BEGIN
    is_master_admin := (LOWER(NEW.email) = 'fredsoncitty@gmail.com');

    INSERT INTO public.usuarios (
        id,
        email,
        nome_completo,
        role,
        status_aprovacao
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', split_part(NEW.email, '@', 1)),
        CASE WHEN is_master_admin THEN 'admin'::role_usuario_enum ELSE 'aluno'::role_usuario_enum END,
        CASE WHEN is_master_admin THEN 'aprovado'::status_usuario_enum ELSE 'pendente'::status_usuario_enum END
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) - SEGURANÇA ESTATUTÁRIA
-- ==============================================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dados_biometricos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_nutricionais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins_treino ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights_retencao_ia ENABLE ROW LEVEL SECURITY;

-- Função auxiliar segura para verificar se o usuário atual é o Admin Único
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT (LOWER(email) = 'fredsoncitty@gmail.com' AND role = 'admin')
        FROM public.usuarios
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função auxiliar para verificar se o aluno está com status 'aprovado'
CREATE OR REPLACE FUNCTION public.is_aluno_aprovado()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.usuarios
        WHERE id = auth.uid() AND status_aprovacao = 'aprovado'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- Políticas da tabela 'usuarios':
-- 1) Admin único pode ver, atualizar e deletar todos os usuários.
-- 2) Usuários comuns só podem ver o próprio perfil se aprovados (ou pendentes para ler status).
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin tem controle total de usuarios"
    ON public.usuarios
    FOR ALL
    USING (public.is_admin());

CREATE POLICY "Usuario pode ler o seu proprio perfil"
    ON public.usuarios
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuario aprovado pode atualizar seu proprio perfil"
    ON public.usuarios
    FOR UPDATE
    USING (auth.uid() = id AND public.is_aluno_aprovado())
    WITH CHECK (auth.uid() = id AND role = 'aluno'); -- Impede escalada de privilégio

-- ------------------------------------------------------------------------------
-- Políticas para 'dados_biometricos', 'treinos', 'planos_nutricionais', 'checkins'
-- 1) Admin tem acesso total.
-- 2) Aluno aprovado tem acesso aos seus próprios dados.
-- 3) Usuários pendentes/rejeitados/inativos NÃO têm acesso.
-- ------------------------------------------------------------------------------
-- dados_biometricos
CREATE POLICY "Admin acesso total dados_biometricos"
    ON public.dados_biometricos FOR ALL USING (public.is_admin());

CREATE POLICY "Aluno aprovado gerencia seus dados_biometricos"
    ON public.dados_biometricos FOR ALL
    USING (auth.uid() = usuario_id AND public.is_aluno_aprovado())
    WITH CHECK (auth.uid() = usuario_id AND public.is_aluno_aprovado());

-- treinos
CREATE POLICY "Admin acesso total treinos"
    ON public.treinos FOR ALL USING (public.is_admin());

CREATE POLICY "Aluno aprovado visualiza seus treinos"
    ON public.treinos FOR SELECT
    USING (auth.uid() = usuario_id AND public.is_aluno_aprovado());

CREATE POLICY "Aluno aprovado insere treinos"
    ON public.treinos FOR INSERT
    WITH CHECK (auth.uid() = usuario_id AND public.is_aluno_aprovado());

-- planos_nutricionais
CREATE POLICY "Admin acesso total planos_nutricionais"
    ON public.planos_nutricionais FOR ALL USING (public.is_admin());

CREATE POLICY "Aluno aprovado visualiza seu plano nutricional"
    ON public.planos_nutricionais FOR SELECT
    USING (auth.uid() = usuario_id AND public.is_aluno_aprovado());

CREATE POLICY "Aluno aprovado insere plano nutricional"
    ON public.planos_nutricionais FOR INSERT
    WITH CHECK (auth.uid() = usuario_id AND public.is_aluno_aprovado());

-- checkins_treino
CREATE POLICY "Admin acesso total checkins"
    ON public.checkins_treino FOR ALL USING (public.is_admin());

CREATE POLICY "Aluno aprovado gerencia seus checkins"
    ON public.checkins_treino FOR ALL
    USING (auth.uid() = usuario_id AND public.is_aluno_aprovado())
    WITH CHECK (auth.uid() = usuario_id AND public.is_aluno_aprovado());

-- insights_retencao_ia (Apenas o Admin tem leitura e escrita)
CREATE POLICY "Admin acesso total insights_retencao_ia"
    ON public.insights_retencao_ia FOR ALL USING (public.is_admin());

-- ==============================================================================
-- 12. STORAGE BUCKETS (Fotos de Evolução, Avatares e Exercícios)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('avatars', 'avatars', true),
    ('evolucao', 'evolucao', false),
    ('exercicios', 'exercicios', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para o Bucket 'avatars'
CREATE POLICY "Avatar imagens publicas"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Usuarios autenticados podem fazer upload de avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Políticas de Storage para o Bucket 'exercicios' e 'evolucao' (Admin total)
CREATE POLICY "Admin gerencia todos os buckets de fotos"
    ON storage.objects FOR ALL
    USING (public.is_admin());

