-- ==============================================================================
-- DUO ESPAÇO — SUPABASE DATABASE SETUP & INITIALIZATION
-- Execute este script no SQL Editor do seu painel Supabase (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. TABELA DE CONFIGURAÇÕES GERAIS
CREATE TABLE IF NOT EXISTS public.configuracoes (
    id TEXT PRIMARY KEY,
    valor TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir dados padrão do DUO ESPAÇO se não existirem
INSERT INTO public.configuracoes (id, valor) VALUES
    ('whatsappNumber', '5566984165461'),
    ('whatsappLabel', '(66) 98416-5461'),
    ('address', 'Rua Simeão Arraya, 1091 - Centro, Barra do Garças - MT, 78600-001'),
    ('mapsUrl', 'https://maps.app.goo.gl/MjawqW4HePjDFeKVA'),
    ('hours', 'Terça a sábado · 09:00 - 18:00'),
    ('instagramHandle', '@duoespaco'),
    ('instagramUrl', 'https://instagram.com/gentebonitabg'),
    ('heroTitle', 'Sua beleza merece uma experiência extraordinária.'),
    ('aboutText1', 'O DUO ESPAÇO nasceu da união entre o talento de Cassiano no cuidado e transformação capilar e a excelência de Isabella no design de unhas.'),
    ('aboutText2', 'Um ambiente intimista, sofisticado e acolhedor em Barra do Garças, feito para que cada visita seja uma pausa prazerosa e revigorante no seu dia.'),
    ('combosVisiveis', 'false')
ON CONFLICT (id) DO UPDATE SET valor = EXCLUDED.valor;

-- 2. TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero TEXT,
    titulo TEXT NOT NULL,
    detalhe TEXT,
    descricao TEXT,
    icone TEXT DEFAULT 'Sparkles',
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir os serviços de Cassiano e Isabella
INSERT INTO public.servicos (numero, titulo, detalhe, descricao, icone, ordem, ativo) VALUES
    -- Cassiano (Cabelo & Mega Hair)
    ('01', 'Corte', 'A consultar', 'Visagismo e desenho sob medida para valorizar sua estrutura e estilo.', 'Scissors', 1, true),
    ('02', 'Escova', 'A consultar', 'Finalização impecável com brilho duradouro e movimento natural.', 'Wand2', 2, true),
    ('03', 'Extensão Capilar (Mega Hair)', 'A consultar', 'Técnica avançada com acabamento imperceptível, comprimento e volume.', 'Gem', 3, true),
    ('04', 'Mechas (Loiras e Morenas Iluminadas)', 'A consultar', 'Dimensões personalizadas que harmonizam perfeitamente com seu tom de pele.', 'Palette', 4, true),
    ('05', 'Penteado', 'A consultar', 'Criações exclusivas para ocasiões especiais, noivas e celebrações.', 'Sparkles', 5, true),
    ('06', 'Progressiva com Formol (Selagem)', 'A consultar', 'Alinhamento intenso, controle de frizz e redução expressiva de volume.', 'Wand2', 6, true),
    ('07', 'Progressiva Orgânica (Selagem)', 'A consultar', 'Alinhamento suave sem formol, fios sedosos e tratamento profundo.', 'Wand2', 7, true),
    ('08', 'Coloração', 'A consultar', 'Cobertura impecável, nuances ricas e durabilidade com produtos nobres.', 'Palette', 8, true),
    ('09', 'Tonalização de Fios Brancos', 'A consultar', 'Camuflagem elegante e natural dos primeiros fios brancos.', 'Palette', 9, true),
    ('10', 'Hidratação', 'A consultar', 'Rituais de nutrição e reposição lipídica para devolver vida e sedosidade.', 'Sparkles', 10, true),
    -- Isabella Morandi (Nail Designer)
    ('11', 'Esmaltação em gel', 'A consultar', 'Brilho espelhado e durabilidade prolongada sem descascar.', 'Gem', 11, true),
    ('12', 'Banho de gel', 'A consultar', 'Camada de proteção e fortalecimento para as unhas naturais.', 'Sparkles', 12, true),
    ('13', 'Alongamento em molde F1', 'A consultar', 'Formato impecável, curvatura perfeita e acabamento ultra natural.', 'Gem', 13, true),
    ('14', 'Manutenção', 'A consultar', 'Cuidado periódico para manter o alinhamento e estrutura das unhas.', 'Wand2', 14, true),
    ('15', 'Pé e mão', 'A consultar', 'Cuidado completo e detalhado com cuticulagem e esmaltação refinada.', 'HeartHandshake', 15, true),
    ('16', 'Mão', 'A consultar', 'Design e higienização das unhas das mãos com acabamento de alta precisão.', 'Sparkles', 16, true),
    ('17', 'Pé', 'A consultar', 'Tratamento das unhas dos pés, hidratação e esmaltação elegante.', 'Sparkles', 17, true),
    ('18', 'Pacote (4 mãos e 2 pés)', 'A consultar', 'Combo mensal de cuidados regulares com atendimento prioritário.', 'Gem', 18, true),
    ('19', 'Plástica dos pés', 'A consultar', 'Renovação e hidratação profunda para pés macios e aveludados.', 'Wand2', 19, true);

-- 3. TABELA DE GALERIA
CREATE TABLE IF NOT EXISTS public.galeria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_imagem TEXT NOT NULL,
    texto_alternativo TEXT,
    rotulo TEXT,
    tamanho TEXT DEFAULT 'small',
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir fotos iniciais da galeria
INSERT INTO public.galeria (url_imagem, texto_alternativo, rotulo, tamanho, ordem) VALUES
    ('/images/hero-beauty.jpg', 'Cabelos iluminados', 'Textura & Luz', 'large', 1),
    ('/images/mega-hair.jpg', 'Extensão capilar autoral', 'Mega Hair & Volume', 'tall', 2),
    ('/images/unhas-nail-spa.jpg', 'Design de unhas sofisticado', 'Unhas & Detalhes', 'small', 3),
    ('/images/salao-luxury.jpg', 'O espaço DUO', 'Ambiente & Atelier', 'small', 4);

-- 4. TABELA DE COMBOS PROMOCIONAIS
CREATE TABLE IF NOT EXISTS public.combos_promo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descricao TEXT,
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. BUCKET DE STORAGE PARA FOTOS
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos', 'fotos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 6. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY - RLS)

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.combos_promo ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem para evitar conflitos
DROP POLICY IF EXISTS "Permitir leitura pública em configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Permitir escrita total em configuracoes" ON public.configuracoes;
DROP POLICY IF EXISTS "Permitir leitura pública em servicos" ON public.servicos;
DROP POLICY IF EXISTS "Permitir escrita total em servicos" ON public.servicos;
DROP POLICY IF EXISTS "Permitir leitura pública em galeria" ON public.galeria;
DROP POLICY IF EXISTS "Permitir escrita total em galeria" ON public.galeria;
DROP POLICY IF EXISTS "Permitir leitura pública em combos_promo" ON public.combos_promo;
DROP POLICY IF EXISTS "Permitir escrita total em combos_promo" ON public.combos_promo;

-- Políticas de Leitura Pública (Site)
CREATE POLICY "Permitir leitura pública em configuracoes" ON public.configuracoes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública em servicos" ON public.servicos FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública em galeria" ON public.galeria FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública em combos_promo" ON public.combos_promo FOR SELECT USING (true);

-- Políticas de Modificação (Admin)
CREATE POLICY "Permitir escrita total em configuracoes" ON public.configuracoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir escrita total em servicos" ON public.servicos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir escrita total em galeria" ON public.galeria FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir escrita total em combos_promo" ON public.combos_promo FOR ALL USING (true) WITH CHECK (true);

-- Políticas de Storage (Bucket 'fotos')
DROP POLICY IF EXISTS "Acesso público às fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão de fotos" ON storage.objects;

CREATE POLICY "Acesso público às fotos" ON storage.objects FOR SELECT USING (bucket_id = 'fotos');
CREATE POLICY "Permitir upload de fotos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos');
CREATE POLICY "Permitir atualização de fotos" ON storage.objects FOR UPDATE USING (bucket_id = 'fotos');
CREATE POLICY "Permitir exclusão de fotos" ON storage.objects FOR DELETE USING (bucket_id = 'fotos');
