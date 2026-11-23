-- ==============================================================================
-- DUO ESPAÇO — SUPABASE PERMISSIONS & DATABASE FIX
-- Cole e execute este script no SQL Editor do seu Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. CONCEDER PERMISSÃO TOTAL NAS TABELAS PARA ANON E AUTHENTICATED
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- 2. TABELAS (CRIAR CASO NÃO EXISTAM)
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id TEXT PRIMARY KEY,
    valor TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT,
    titulo TEXT NOT NULL,
    detalhe TEXT,
    descricao TEXT,
    icone TEXT DEFAULT 'Sparkles',
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    profissional TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.galeria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_imagem TEXT NOT NULL,
    texto_alternativo TEXT,
    rotulo TEXT,
    tamanho TEXT DEFAULT 'small',
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. HABILITAR RLS E CRIAR POLÍTICAS ABERTAS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Escrita configuracoes" ON public.configuracoes;
CREATE POLICY "Leitura pública configuracoes" ON public.configuracoes FOR SELECT USING (true);
CREATE POLICY "Escrita configuracoes" ON public.configuracoes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Leitura pública servicos" ON public.servicos;
DROP POLICY IF EXISTS "Escrita servicos" ON public.servicos;
CREATE POLICY "Leitura pública servicos" ON public.servicos FOR SELECT USING (true);
CREATE POLICY "Escrita servicos" ON public.servicos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Leitura pública galeria" ON public.galeria;
DROP POLICY IF EXISTS "Escrita galeria" ON public.galeria;
CREATE POLICY "Leitura pública galeria" ON public.galeria FOR SELECT USING (true);
CREATE POLICY "Escrita galeria" ON public.galeria FOR ALL USING (true) WITH CHECK (true);

-- 4. BUCKETS DE STORAGE (FOTOS E VIDEOS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. POLÍTICAS DE STORAGE (PERMITIR UPLOAD E ACESSO PÚBLICO)
DROP POLICY IF EXISTS "Acesso público fotos" ON storage.objects;
DROP POLICY IF EXISTS "Upload fotos" ON storage.objects;
DROP POLICY IF EXISTS "Update fotos" ON storage.objects;
DROP POLICY IF EXISTS "Delete fotos" ON storage.objects;

DROP POLICY IF EXISTS "Acesso público videos" ON storage.objects;
DROP POLICY IF EXISTS "Upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Update videos" ON storage.objects;
DROP POLICY IF EXISTS "Delete videos" ON storage.objects;

CREATE POLICY "Acesso público fotos" ON storage.objects FOR SELECT USING (bucket_id = 'fotos');
CREATE POLICY "Upload fotos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos');
CREATE POLICY "Update fotos" ON storage.objects FOR UPDATE USING (bucket_id = 'fotos');
CREATE POLICY "Delete fotos" ON storage.objects FOR DELETE USING (bucket_id = 'fotos');

CREATE POLICY "Acesso público videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Upload videos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'videos');
CREATE POLICY "Update videos" ON storage.objects FOR UPDATE USING (bucket_id = 'videos');
CREATE POLICY "Delete videos" ON storage.objects FOR DELETE USING (bucket_id = 'videos');
