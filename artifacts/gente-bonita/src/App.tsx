import { useState, useEffect, lazy, Suspense, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { 
  ArrowUpRight, Check, ChevronRight, Gem, Instagram, 
  MessageCircle, Palette, Scissors, Sparkles, Wand2, 
  HeartHandshake, Play, Lock 
} from 'lucide-react';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useSiteConfig, useServices, useGallery } from '@/hooks/use-site-data';

// Code-splitting: carrega as páginas de administração somente sob demanda
const AdminLogin = lazy(() => import('@/pages/admin/login'));
const AdminDashboard = lazy(() => import('@/pages/admin/dashboard'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

const OPENING_HOURS = [
  { day: 'segunda-feira', hours: 'Fechado' },
  { day: 'terça-feira', hours: '09:00–18:00' },
  { day: 'quarta-feira', hours: '09:00–18:00' },
  { day: 'quinta-feira', hours: '09:00–18:00' },
  { day: 'sexta-feira', hours: '09:00–18:00' },
  { day: 'sábado', hours: '09:00–18:00' },
  { day: 'domingo', hours: 'Fechado' },
];

const NAV_ITEMS = [
  { label: 'Início', href: '#inicio' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Cabelo & Unhas', href: '#cabelo-e-unhas' },
  { label: 'O Espaço', href: '#sobre' },
  { label: 'Galeria', href: '#galeria' },
];

// Serviços de Cassiano (Cabelo & Mega Hair)
const DEFAULT_SERVICOS_CASSIANO = [
  { id: 'corte', title: 'Corte', description: 'Visagismo e desenho sob medida para valorizar sua estrutura e estilo.', icon: Scissors, detalhe: 'A consultar' },
  { id: 'escova', title: 'Escova', description: 'Finalização impecável com brilho duradouro e movimento natural.', icon: Wand2, detalhe: 'A consultar' },
  { id: 'mega-hair', title: 'Extensão Capilar (Mega Hair)', description: 'Técnica avançada com acabamento imperceptível, comprimento e volume.', icon: Gem, featured: true, detalhe: 'A consultar' },
  { id: 'mechas', title: 'Mechas (Loiras e Morenas Iluminadas)', description: 'Dimensões personalizadas que harmonizam perfeitamente com seu tom de pele.', icon: Palette, detalhe: 'A consultar' },
  { id: 'penteado', title: 'Penteado', description: 'Criações exclusivas para ocasiões especiais, noivas e celebrações.', icon: Sparkles, detalhe: 'A consultar' },
  { id: 'progressiva-formol', title: 'Progressiva com Formol (Selagem)', description: 'Alinhamento intenso, controle de frizz e redução expressiva de volume.', icon: Wand2, detalhe: 'A consultar' },
  { id: 'progressiva-organica', title: 'Progressiva Orgânica (Selagem)', description: 'Alinhamento suave sem formol, fios sedosos e tratamento profundo.', icon: Wand2, detalhe: 'A consultar' },
  { id: 'coloracao', title: 'Coloração', description: 'Cobertura impecável, nuances ricas e durabilidade com produtos nobres.', icon: Palette, detalhe: 'A consultar' },
  { id: 'tonalizacao', title: 'Tonalização de Fios Brancos', description: 'Camuflagem elegante e natural dos primeiros fios brancos.', icon: Palette, detalhe: 'A consultar' },
  { id: 'hidratacao', title: 'Hidratação', description: 'Rituais de nutrição e reposição lipídica para devolver vida e sedosidade.', icon: Sparkles, detalhe: 'A consultar' },
];

// Serviços de Isabella Morandi (Nail Designer)
const DEFAULT_SERVICOS_ISABELLA = [
  { id: 'esmaltacao-gel', title: 'Esmaltação em gel', description: 'Brilho espelhado e durabilidade prolongada sem descascar.', icon: Gem, detalhe: 'A consultar' },
  { id: 'banho-gel', title: 'Banho de gel', description: 'Camada de proteção e fortalecimento para as unhas naturais.', icon: Sparkles, detalhe: 'A consultar' },
  { id: 'alongamento-f1', title: 'Alongamento em molde F1', description: 'Formato impecável, curvatura perfeita e acabamento ultra natural.', icon: Gem, featured: true, detalhe: 'A consultar' },
  { id: 'manutencao', title: 'Manutenção', description: 'Cuidado periódico para manter o alinhamento e estrutura das unhas.', icon: Wand2, detalhe: 'A consultar' },
  { id: 'pe-mao', title: 'Pé e mão', description: 'Cuidado completo e detalhado com cuticulagem e esmaltação refinada.', icon: HeartHandshake, detalhe: 'A consultar' },
  { id: 'mao', title: 'Mão', description: 'Design e higienização das unhas das mãos com acabamento de alta precisão.', icon: Sparkles, detalhe: 'A consultar' },
  { id: 'pe', title: 'Pé', description: 'Tratamento das unhas dos pés, hidratação e esmaltação elegante.', icon: Sparkles, detalhe: 'A consultar' },
  { id: 'pacote-4-2', title: 'Pacote (4 mãos e 2 pés)', description: 'Combo mensal de cuidados regulares com atendimento prioritário.', icon: Gem, detalhe: 'A consultar' },
  { id: 'plastica-pes', title: 'Plástica dos pés', description: 'Renovação e hidratação profunda para pés macios e aveludados.', icon: Wand2, detalhe: 'A consultar' },
];

function formatPhone(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function scrollToSection(href: string) {
  const id = href.replace('#', '');
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  window.history.replaceState(null, '', href);
}

function BrandMark() {
  const { data: config } = useSiteConfig();
  const logoImage = config?.logoImage || '/images/duo-espaco-logo.jpg';

  return (
    <a
      href="#inicio"
      onClick={(event) => { event.preventDefault(); scrollToSection('#inicio'); }}
      className="inline-flex items-center gap-3.5 group"
      data-testid="link-brand"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#BB8D5B]/60 bg-[#0B0908] p-0.5 shadow-[0_0_16px_rgba(187,141,91,0.25)] transition-transform group-hover:scale-105">
        <img
          src={logoImage}
          alt="DUO ESPAÇO"
          loading="eager"
          decoding="async"
          className="h-full w-full object-cover rounded-full"
        />
      </span>
      <span className="leading-tight">
        <strong className="block text-[18px] font-semibold tracking-[.18em] text-[#F5F0E8] font-serif">DUO ESPAÇO</strong>
        <span className="block text-[9px] font-mono tracking-[.25em] text-[#BB8D5B] uppercase">Por Cassiano e Isabella</span>
      </span>
    </a>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#0B0908]/95 backdrop-blur-md border-b border-[#BB8D5B]/20 transition-all">
      <div className="gb-shell flex h-[84px] items-center justify-between">
        <BrandMark />

        <nav className="hidden lg:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => { e.preventDefault(); scrollToSection(item.href); }}
              className="gb-nav-link"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  const { data: config } = useSiteConfig();
  const heroImage = config?.heroImage || '/images/cassiano-e-isabella.jpg';
  const heroTitle = config?.heroTitle || 'Sua beleza merece uma experiência extraordinária.';

  return (
    <section id="inicio" className="relative flex min-h-[calc(100vh-84px)] items-center overflow-hidden bg-[#0B0908] py-14 sm:py-20 md:py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(187,141,91,0.18),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(187,141,91,0.1),transparent_50%)] pointer-events-none" />
      <div className="gb-luxe-glow absolute -left-20 top-20 h-96 w-96 rounded-full pointer-events-none" />

      <div className="gb-shell relative z-10 w-full">
        <div className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          {/* Coluna Texto */}
          <div className="gb-reveal order-2 md:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#BB8D5B]/40 bg-[#BB8D5B]/10 px-4 py-1.5 mb-6">
              <Sparkles size={13} className="text-[#BB8D5B]" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-[.2em] text-[#E0BC8D]">
                Atelier de Beleza & Estética
              </span>
            </div>

            <h1 className="gb-display text-4xl sm:text-5xl lg:text-6xl xl:text-[4.2rem] leading-[1.02] text-[#F5F0E8] tracking-tight">
              {heroTitle.includes('experiência extraordinária.') ? (
                <>
                  Sua beleza merece uma <em className="text-[#E0BC8D] italic block sm:inline">experiência extraordinária.</em>
                </>
              ) : (
                heroTitle
              )}
            </h1>

            <p className="mt-6 text-base sm:text-base md:text-[17px] lg:text-lg leading-relaxed text-[#A99B90] max-w-xl md:max-w-2xl">
              A união do cuidado e transformação capilar por <strong className="whitespace-nowrap font-semibold text-[#F5F0E8]">Cassiano&nbsp;Monteiro</strong> com a alta precisão e elegância em unhas de <strong className="whitespace-nowrap font-semibold text-[#F5F0E8]">Isabella&nbsp;Morandi</strong>.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#agendamento"
                onClick={(e) => { e.preventDefault(); scrollToSection('#agendamento'); }}
                className="gb-button gb-button-primary shadow-[0_6px_22px_rgba(187,141,91,0.35)]"
              >
                Agendar Horário <ArrowUpRight size={16} />
              </a>
            </div>
          </div>

          {/* Coluna Foto Cassiano & Isabella com Moldura Editorial de Luxo */}
          <div className="gb-reveal gb-reveal-delay order-1 md:order-2 flex justify-center md:justify-end">
            <div className="relative w-full max-w-[340px] sm:max-w-[390px] lg:max-w-[430px]">
              <div className="absolute -inset-3 sm:-inset-4 rounded-3xl border border-[#BB8D5B]/35 rotate-1 pointer-events-none transition-transform duration-500 hover:rotate-0" />
              <div className="absolute -inset-1.5 rounded-2xl border border-[#E0BC8D]/25 pointer-events-none" />

              <div className="relative overflow-hidden rounded-2xl border border-[#BB8D5B]/50 bg-[#14100E] shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_35px_rgba(187,141,91,0.2)] aspect-[3/4] w-full">
                <img
                  src={heroImage}
                  alt="Cassiano e Isabella — DUO ESPAÇO"
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-102"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Services({ onSelectService }: { onSelectService: (service: string, prof: 'Cassiano' | 'Isabella') => void }) {
  const [activeTab, setActiveTab] = useState<'Cassiano' | 'Isabella'>('Cassiano');
  const { data: config } = useSiteConfig();
  const { data: dynamicServices } = useServices();

  const isValuesActive = config?.exibirValores === 'true';

  const cassianoList = dynamicServices && dynamicServices.length > 0
    ? dynamicServices.filter((s: any) => s.profissional === 'Cassiano' || !s.profissional)
    : DEFAULT_SERVICOS_CASSIANO;

  const isabellaList = dynamicServices && dynamicServices.length > 0
    ? dynamicServices.filter((s: any) => s.profissional === 'Isabella')
    : DEFAULT_SERVICOS_ISABELLA;

  const currentList = activeTab === 'Cassiano' ? cassianoList : isabellaList;

  return (
    <section id="servicos" className="scroll-mt-6 bg-[#F5F0E8] py-20 text-[#0B0908] md:py-28 transition-colors">
      <div className="gb-shell">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end gb-reveal">
          <div className="max-w-2xl">
            <h2 className="font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-[#0B0908] md:text-6xl">
              Serviços desenhados com <em className="text-[#BB8D5B] italic">perfeição.</em>
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5C5046]">
              Escolha o profissional e toque no serviço desejado para agendar. Todos os rituais contam com atendimento personalizado.
            </p>
          </div>

          {/* Seletor de Profissional */}
          <div className="flex rounded-full bg-[#EAE2D5] p-1.5 border border-[#BB8D5B]/30 shrink-0 self-start md:self-auto shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab('Cassiano')}
              className={`rounded-full px-6 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-all ${
                activeTab === 'Cassiano'
                  ? 'bg-[#0B0908] text-[#E0BC8D] shadow-md'
                  : 'text-[#5C5046] hover:text-[#0B0908]'
              }`}
            >
              Cassiano · Cabelos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Isabella')}
              className={`rounded-full px-6 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-all ${
                activeTab === 'Isabella'
                  ? 'bg-[#0B0908] text-[#E0BC8D] shadow-md'
                  : 'text-[#5C5046] hover:text-[#0B0908]'
              }`}
            >
              Isabella · Nail Designer
            </button>
          </div>
        </div>

        {/* Grade de Serviços */}
        <div className="mt-10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {currentList.map((srv: any) => {
              const Icon = srv.icon || (activeTab === 'Cassiano' ? Scissors : Gem);
              const title = srv.title || srv.titulo;
              const description = srv.description || srv.descricao;
              const detalhe = srv.detalhe;

              const badgeText = isValuesActive
                ? (detalhe && detalhe !== 'A consultar' ? detalhe : 'Sob Consulta')
                : 'A consultar';

              return (
                <button
                  key={srv.id || title}
                  type="button"
                  onClick={() => onSelectService(title, activeTab)}
                  className={`duo-card-offwhite ${srv.featured ? 'is-featured' : ''} group`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FAF5ED] border border-[#BB8D5B]/40 text-[#BB8D5B] transition-transform group-hover:scale-110">
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <span className="font-mono text-[10px] font-bold tracking-wider text-[#BB8D5B] uppercase bg-[#BB8D5B]/10 px-2 py-0.5 rounded">
                      {badgeText}
                    </span>
                  </div>

                  <div className="mt-4 text-left">
                    <h4 className="font-serif text-xl font-bold text-[#0B0908] group-hover:text-[#BB8D5B] transition-colors">
                      {title}
                    </h4>
                    <p className="mt-2 text-xs leading-5 text-[#63554B]">
                      {description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#BB8D5B] group-hover:translate-x-1 transition-transform">
                    <span>Selecionar serviço</span>
                    <ChevronRight size={14} />
                  </div>
                </button>
              );
            })}
          </div>

          {activeTab === 'Isabella' && (
            <div className="mt-8 rounded-xl border border-[#BB8D5B]/30 bg-[#FAF5ED] p-5 text-center">
              <p className="font-serif text-lg text-[#0B0908] italic">
                “Pacotes personalizados serão feitos conforme o pedido da cliente!”
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Seção Cabelo e Unhas
function CabeloEUnhas({ onSelectService }: { onSelectService: (service: string, prof: 'Cassiano' | 'Isabella') => void }) {
  const { data: config } = useSiteConfig();
  const megaHairImg = config?.megaHairImage || '/images/mega-hair.jpg';
  const unhasImg = config?.unhasImage || '/images/unhas-nail-spa.jpg';

  return (
    <section id="cabelo-e-unhas" className="scroll-mt-6 bg-[#0B0908] py-20 text-[#F5F0E8] md:py-28 border-t border-[#BB8D5B]/15">
      <div className="gb-shell grid gap-20">
        {/* Bloco 1: Cabelo & Mega Hair (Cassiano) */}
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <div className="relative gb-reveal">
            <div className="absolute -left-4 -top-4 h-full w-full border border-[#BB8D5B]/40 md:-left-6 md:-top-6 rounded-lg pointer-events-none" />
            <img
              src={megaHairImg}
              alt="Cabelo e Mega Hair por Cassiano"
              loading="lazy"
              decoding="async"
              className="relative h-[380px] w-full rounded-lg object-cover shadow-2xl md:h-[500px]"
            />
            <span className="absolute -bottom-5 -right-3 flex h-24 w-24 items-center justify-center rounded-full border border-[#BB8D5B] bg-[#0B0908] text-center font-mono text-[9px] uppercase leading-tight tracking-[.1em] text-[#E0BC8D] shadow-xl md:-right-6">
              Arte &<br />Movimento<br />por Cassiano
            </span>
          </div>

          <div className="gb-reveal gb-reveal-delay">
            <p className="gb-eyebrow mb-3">Especialidade Capilar</p>
            <h2 className="gb-display text-4xl leading-[.98] text-[#F5F0E8] md:text-6xl">
              Cabelos que contam <em className="text-[#E0BC8D] italic">sua essência.</em>
            </h2>
            <p className="mt-6 text-[15px] leading-7 text-[#A99B90]">
              O cuidado com o cabelo vai além do visual: é sobre autoestima e identidade. <strong className="whitespace-nowrap font-medium text-[#F5F0E8]">Cassiano&nbsp;Monteiro</strong> une técnicas consagradas de corte, visagismo, mechas iluminadas e a arte imperceptível da extensão capilar (Mega Hair).
            </p>
            <p className="mt-4 text-[15px] leading-7 text-[#A99B90]">
              Cada fio tratado com respeito, brilho e movimento sob medida para você se sentir deslumbrante em todos os momentos.
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => onSelectService('Extensão Capilar (Mega Hair)', 'Cassiano')}
                className="gb-button gb-button-primary shadow-[0_4px_18px_rgba(187,141,91,0.25)]"
              >
                Agendar com Cassiano <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Bloco 2: Unhas & Nail Design (Isabella Morandi) */}
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16 pt-8 border-t border-[#BB8D5B]/15">
          <div className="order-2 md:order-1 gb-reveal">
            <p className="gb-eyebrow mb-3">Nail Designer</p>
            <h2 className="gb-display text-4xl leading-[.98] text-[#F5F0E8] md:text-6xl">
              A elegância nas <em className="text-[#E0BC8D] italic">pontas dos dedos.</em>
            </h2>
            <p className="mt-6 text-[15px] leading-7 text-[#A99B90]">
              Isabella Morandi traz precisão cirúrgica e refinamento ao universo das unhas. Do clássico pé e mão ao sofisticado alongamento em molde F1, banho de gel e esmaltação duradoura.
            </p>
            <p className="mt-4 text-[15px] leading-7 text-[#A99B90]">
              Rituais que combinam estética, saúde e carinho para mãos e pés impecáveis por semanas. Pacotes personalizados pensados para a sua rotina.
            </p>

            <div className="mt-8">
              <button
                type="button"
                onClick={() => onSelectService('Alongamento em molde F1', 'Isabella')}
                className="gb-button gb-button-primary shadow-[0_4px_18px_rgba(187,141,91,0.25)]"
              >
                Agendar com Isabella <ArrowUpRight size={16} />
              </button>
            </div>
          </div>

          <div className="relative order-1 md:order-2 gb-reveal gb-reveal-delay">
            <div className="absolute -right-4 -top-4 h-full w-full border border-[#BB8D5B]/40 md:-right-6 md:-top-6 rounded-lg pointer-events-none" />
            <img
              src={unhasImg}
              alt="Unhas e Nail Design por Isabella Morandi"
              loading="lazy"
              decoding="async"
              className="relative h-[380px] w-full rounded-lg object-cover shadow-2xl md:h-[500px]"
            />
            <span className="absolute -bottom-5 -left-3 flex h-24 w-24 items-center justify-center rounded-full border border-[#BB8D5B] bg-[#0B0908] text-center font-mono text-[9px] uppercase leading-tight tracking-[.1em] text-[#E0BC8D] shadow-xl md:-left-6">
              Nails &<br />Design por<br />Isabella
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Seção Sobre: Layout preenchido dividindo a tela na horizontal (Texto do lado da moldura no Desktop/Tablet)
function About() {
  const { data: config } = useSiteConfig();
  const videoSrc = config?.videoUrl || '/videos/duo-espaco.mp4';
  const customPoster = config?.posterImage && config.posterImage.trim() !== '' && config.posterImage !== '/images/salao-luxury.jpg' ? config.posterImage : undefined;

  return (
    <section id="sobre" className="scroll-mt-6 bg-[#0E0B0A] py-20 text-[#F5F0E8] md:py-28 border-t border-[#BB8D5B]/20">
      <div className="gb-shell">
        {/* Bloco Superior: Dividindo a tela para Moldura e Texto na lateral em tablets e computadores */}
        <div className="grid items-center gap-10 md:grid-cols-2 lg:gap-16 gb-reveal">
          {/* Lado Texto Editorial */}
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[.25em] text-[#BB8D5B] mb-3">
              DUO ESPAÇO
            </p>
            <h2 className="gb-display text-3xl sm:text-4xl lg:text-5xl leading-[1.08] text-[#F5F0E8]">
              Mais do que um espaço de beleza, um encontro de <em className="text-[#E0BC8D] italic">histórias, sonhos e dedicação.</em>
            </h2>
            <p className="mt-6 text-base sm:text-lg leading-relaxed text-[#C9BEB5]">
              Toda grande história começa com um sonho. A nossa nasceu da paixão pela beleza, do desejo de transformar a autoestima das pessoas e da vontade de construir um espaço onde cada cliente se sentisse especial, acolhido e valorizado.
            </p>
            <div className="mt-8 border-l-2 border-[#BB8D5B]/40 pl-5">
              <p className="font-serif italic text-[#E0BC8D] text-lg sm:text-xl">
                O Duo Espaço representa a união de duas trajetórias, duas personalidades e duas paixões que se complementam.
              </p>
            </div>
          </div>

          {/* Lado Moldura 9:16 Vertical (Limpa, SEM TEXTOS dentro ou embaixo da moldura) */}
          <div className="flex justify-center md:justify-end gb-reveal gb-reveal-delay">
            <div className="relative w-full max-w-[320px] sm:max-w-[360px] md:max-w-[380px] overflow-hidden rounded-3xl border-2 border-[#BB8D5B]/45 bg-[#0B0908] shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(187,141,91,0.2)]">
              <div className="aspect-[9/16] w-full relative bg-[#0B0908]">
                <video
                  key={videoSrc}
                  src={videoSrc}
                  controls
                  playsInline
                  preload="metadata"
                  poster={customPoster}
                  className="h-full w-full object-cover rounded-2xl"
                >
                  <source src={videoSrc} type="video/mp4" />
                  Seu navegador não suporta a reprodução deste vídeo.
                </video>
              </div>
            </div>
          </div>
        </div>

        {/* Texto Editorial: As Duas Trajetórias */}
        <div className="mt-20 space-y-12 gb-reveal">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Bloco Cassiano */}
            <div className="rounded-2xl border border-[#BB8D5B]/30 bg-[#14100E] p-8 sm:p-10 transition-all hover:border-[#BB8D5B]/60 shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BB8D5B]/20 border border-[#BB8D5B]/40 text-[#BB8D5B]">
                  <Scissors size={18} />
                </span>
                <div>
                  <h4 className="font-serif text-2xl font-bold text-[#F5F0E8]">Cassiano</h4>
                  <p className="font-mono text-xs text-[#BB8D5B] uppercase tracking-wider">Cabeleireiro há 6 anos</p>
                </div>
              </div>

              <p className="text-[15px] leading-7 text-[#C9BEB5]">
                Profissional apaixonado pela beleza e pela transformação. Com um olhar atento aos detalhes, criatividade e dedicação, construiu sua trajetória buscando aperfeiçoamento constante e excelência em cada trabalho.
              </p>
              <p className="mt-4 text-[15px] leading-7 text-[#C9BEB5]">
                Especialista em extensões capilares, penteados, loiros e morenos iluminados, acredita que cada cabelo carrega uma identidade e que a verdadeira beleza está em valorizar aquilo que torna cada pessoa única.
              </p>
            </div>

            {/* Bloco Isabella */}
            <div className="rounded-2xl border border-[#BB8D5B]/30 bg-[#14100E] p-8 sm:p-10 transition-all hover:border-[#BB8D5B]/60 shadow-xl">
              <div className="flex items-center gap-3 mb-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BB8D5B]/20 border border-[#BB8D5B]/40 text-[#BB8D5B]">
                  <Gem size={18} />
                </span>
                <div>
                  <h4 className="font-serif text-2xl font-bold text-[#F5F0E8]">Isabella</h4>
                  <p className="font-mono text-xs text-[#BB8D5B] uppercase tracking-wider">Nail Designer há 7 anos</p>
                </div>
              </div>

              <p className="text-[15px] leading-7 text-[#C9BEB5]">
                Uma profissional que transformou o cuidado com as unhas em uma verdadeira expressão de arte, delicadeza e autoestima. Com dedicação, capricho e atenção a cada detalhe, acredita que pequenos cuidados podem proporcionar grandes transformações.
              </p>
              <p className="mt-4 text-[15px] leading-7 text-[#C9BEB5]">
                Seu trabalho vai muito além da estética: envolve acolhimento, confiança e a satisfação de entregar sempre o melhor a cada cliente.
              </p>
            </div>
          </div>

          {/* O Encontro e o Propósito */}
          <div className="rounded-2xl border border-[#BB8D5B]/25 bg-[#120E0C] p-8 sm:p-12 shadow-2xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-[#BB8D5B] mb-3">
                  Sinergia & Propósito
                </p>
                <h4 className="font-serif text-2xl sm:text-3xl font-semibold leading-snug text-[#F5F0E8]">
                  A união de duas visões em perfeita harmonia.
                </h4>
                <p className="mt-5 text-[15px] leading-7 text-[#A99B90]">
                  Juntos, somos a união de duas personalidades que se complementam. Cassiano traz criatividade, ousadia e um olhar voltado à transformação. Isabella acrescenta delicadeza, sensibilidade e precisão. Duas formas diferentes de enxergar a beleza, mas com o mesmo propósito: fazer cada pessoa se sentir ainda mais bonita e confiante.
                </p>
                <p className="mt-4 text-[15px] leading-7 text-[#A99B90]">
                  Foi dessa união que nasceu o <strong>Duo Espaço</strong>: um ambiente pensado para oferecer mais do que serviços de beleza. Um lugar onde qualidade, profissionalismo, cuidado e experiências se encontram.
                </p>
              </div>

              <div className="border-t border-[#BB8D5B]/20 pt-6 lg:border-t-0 lg:border-l lg:pl-10">
                <p className="text-[15px] leading-7 text-[#A99B90]">
                  Acreditamos que confiança não se conquista apenas com palavras, mas com dedicação, responsabilidade, respeito e resultados construídos diariamente. Por isso, cada cliente que entra em nosso espaço é recebido com atenção, carinho e o compromisso de entregar uma experiência à altura de suas expectativas.
                </p>
                <p className="mt-4 text-[15px] leading-7 text-[#C9BEB5] font-medium">
                  Nossa maior conquista não está apenas naquilo que fazemos, mas na confiança de quem escolhe estar conosco.
                </p>
              </div>
            </div>

            {/* Citação Final Elegante */}
            <div className="mt-10 pt-8 border-t border-[#BB8D5B]/25 text-center">
              <p className="font-serif text-xl sm:text-2xl text-[#E0BC8D] italic">
                “Duas histórias. Duas especialidades. Um só propósito: revelar o melhor de você.”
              </p>
              <p className="mt-3 font-mono text-xs uppercase tracking-[.25em] text-[#BB8D5B]">
                Duo Espaço por Cassiano e Isabella
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const { data: dynamicGallery } = useGallery();
  const galleryList = (dynamicGallery && dynamicGallery.length > 0)
    ? dynamicGallery
    : [
        { rotulo: 'Textura & Luz', texto_alternativo: 'Cabelos iluminados', url_imagem: '/images/hero-beauty.jpg' },
        { rotulo: 'Mega Hair & Volume', texto_alternativo: 'Extensão capilar autoral', url_imagem: '/images/mega-hair.jpg' },
        { rotulo: 'Unhas & Detalhes', texto_alternativo: 'Design de unhas sofisticado', url_imagem: '/images/unhas-nail-spa.jpg' },
        { rotulo: 'Ambiente & Atelier', texto_alternativo: 'O espaço DUO', url_imagem: '/images/salao-luxury.jpg' },
      ];

  return (
    <section id="galeria" className="scroll-mt-6 bg-[#0B0908] py-20 text-[#F5F0E8] md:py-24 border-t border-[#BB8D5B]/15">
      <div className="gb-shell">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end gb-reveal">
          <div>
            <p className="gb-eyebrow mb-2">Curadoria Visual</p>
            <h2 className="gb-display text-4xl leading-[.98] text-[#F5F0E8] md:text-6xl">
              A beleza <em className="text-[#E0BC8D] italic">em detalhes.</em>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#A99B90]">
            Alguns registros dos nossos trabalhos e do ambiente preparado exclusivamente para receber você.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {galleryList.map((item: any, index: number) => (
            <figure
              key={`${item.rotulo || item.label || 'galeria'}-${index}`}
              className="group relative overflow-hidden rounded-xl aspect-[3/4] border border-[#BB8D5B]/20 bg-[#14100E]"
            >
              <img
                src={item.url_imagem || item.src}
                alt={item.texto_alternativo || item.alt || 'DUO ESPAÇO'}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0908]/90 via-[#0B0908]/20 to-transparent opacity-80" />
              <figcaption className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono uppercase tracking-[.14em] text-[#F5F0E8]">
                <span>{item.rotulo || item.label}</span>
                <ArrowUpRight size={15} className="text-[#BB8D5B]" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

type BookingForm = {
  professional: 'Cassiano' | 'Isabella';
  name: string;
  whatsapp: string;
  services: string[];
  date: string;
  time: string;
  observations: string;
};

function Booking({
  initialProfessional,
  initialService,
}: {
  initialProfessional: 'Cassiano' | 'Isabella';
  initialService?: string;
}) {
  const { data: config } = useSiteConfig();
  const { data: dynamicServices } = useServices();

  const [form, setForm] = useState<BookingForm>({
    professional: initialProfessional,
    name: '',
    whatsapp: '',
    services: initialService ? [initialService] : [],
    date: '',
    time: '',
    observations: '',
  });

  const [serviceError, setServiceError] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      professional: initialProfessional,
      services: initialService ? [initialService] : prev.services,
    }));
  }, [initialProfessional, initialService]);

  const activeServicesList = form.professional === 'Cassiano' 
    ? (dynamicServices?.filter((s: any) => s.profissional === 'Cassiano' || !s.profissional) || DEFAULT_SERVICOS_CASSIANO)
    : (dynamicServices?.filter((s: any) => s.profissional === 'Isabella') || DEFAULT_SERVICOS_ISABELLA);

  function toggleService(serviceTitle: string) {
    setForm((prev) => {
      const exists = prev.services.includes(serviceTitle);
      const updated = exists
        ? prev.services.filter((s) => s !== serviceTitle)
        : [...prev.services, serviceTitle];
      return { ...prev, services: updated };
    });
    setServiceError(false);
  }

  function switchProfessional(prof: 'Cassiano' | 'Isabella') {
    setForm((prev) => ({
      ...prev,
      professional: prof,
      services: [],
    }));
  }

  function updateField(key: keyof BookingForm, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (form.services.length === 0) {
      setServiceError(true);
      return;
    }

    const targetPhone = form.professional === 'Isabella'
      ? (config?.isabellaWhatsapp || '5565999225844')
      : (config?.cassianoWhatsapp || '5565996611206');

    const msg = [
      `*SOLICITAÇÃO DE AGENDAMENTO — DUO ESPAÇO*`,
      ``,
      `*Profissional:* ${form.professional}`,
      `*Cliente:* ${form.name}`,
      `*Contato:* ${form.whatsapp}`,
      `*Procedimentos:* ${form.services.join(', ')}`,
      `*Data Pretendida:* ${form.date}`,
      `*Horário Desejado:* ${form.time}`,
      form.observations ? `*Observações:* ${form.observations}` : null,
      ``,
      `_Enviado através do site duoespaco.com_`
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <section id="agendamento" className="scroll-mt-6 bg-[#0E0B0A] py-20 text-[#F5F0E8] md:py-28 border-t border-[#BB8D5B]/20">
      <div className="gb-shell max-w-4xl">
        <div className="text-center gb-reveal">
          <p className="gb-eyebrow mb-2">Atendimento Sob Medida</p>
          <h2 className="gb-display text-4xl leading-[1.02] text-[#F5F0E8] md:text-5xl">
            Reserve o seu <em className="text-[#E0BC8D] italic">momento.</em>
          </h2>
          <p className="mt-4 text-sm leading-6 text-[#A99B90] max-w-xl mx-auto">
            Selecione o profissional e os serviços desejados. Seu pedido será enviado diretamente ao WhatsApp de atendimento para confirmação de horário.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-[#BB8D5B]/30 bg-[#120E0C] p-7 md:p-10 shadow-2xl gb-reveal gb-reveal-delay">
          <form onSubmit={submit} className="grid gap-6">
            {/* Escolha do Profissional */}
            <div>
              <span className="block mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#BB8D5B]">
                1. Escolha o Profissional
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => switchProfessional('Cassiano')}
                  className={`flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border text-center transition-all ${
                    form.professional === 'Cassiano'
                      ? 'border-[#BB8D5B] bg-[#BB8D5B]/15 text-[#E0BC8D] shadow-[0_0_15px_rgba(187,141,91,0.2)]'
                      : 'border-[#BB8D5B]/20 bg-[#0B0908] text-[#A99B90] hover:border-[#BB8D5B]/50'
                  }`}
                >
                  <strong className="font-serif text-lg">Cassiano</strong>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#BB8D5B]">Cabelos & Mega Hair</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchProfessional('Isabella')}
                  className={`flex flex-col items-center justify-center py-3.5 px-4 rounded-xl border text-center transition-all ${
                    form.professional === 'Isabella'
                      ? 'border-[#BB8D5B] bg-[#BB8D5B]/15 text-[#E0BC8D] shadow-[0_0_15px_rgba(187,141,91,0.2)]'
                      : 'border-[#BB8D5B]/20 bg-[#0B0908] text-[#A99B90] hover:border-[#BB8D5B]/50'
                  }`}
                >
                  <strong className="font-serif text-lg">Isabella</strong>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#BB8D5B]">Unhas & Nail Design</span>
                </button>
              </div>
            </div>

            {/* Escolha dos Serviços */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#BB8D5B]">
                  2. Procedimentos Desejados ({form.professional})
                </span>
                <span className="text-[10px] font-mono text-[#BB8D5B] uppercase">A consultar</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {activeServicesList.map((srv: any) => {
                  const title = srv.title || srv.titulo;
                  const selected = form.services.includes(title);
                  return (
                    <label
                      key={srv.id || title}
                      className={`gb-service-choice ${selected ? 'gb-service-choice-selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleService(title)}
                        className="sr-only"
                      />
                      <span className="text-xs">{title}</span>
                      {selected ? <Check size={14} className="text-[#BB8D5B]" /> : <span className="text-[10px] text-[#A99B90]/60">+</span>}
                    </label>
                  );
                })}
              </div>
              {serviceError && (
                <p className="mt-2 text-xs text-[#E0BC8D] font-mono">
                  Por favor, escolha pelo menos um serviço para continuar.
                </p>
              )}
            </div>

            {/* Dados Pessoais */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="block mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#BB8D5B]">Seu Nome</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="gb-field"
                  placeholder="Como podemos te chamar?"
                />
              </label>

              <label>
                <span className="block mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#BB8D5B]">WhatsApp</span>
                <input
                  required
                  value={form.whatsapp}
                  onChange={(e) => updateField('whatsapp', formatPhone(e.target.value))}
                  className="gb-field"
                  placeholder="(65) 90000-0000"
                />
              </label>
            </div>

            {/* Data e Horário */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="block mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#BB8D5B]">Data Desejada</span>
                <input
                  required
                  type="date"
                  min={todayStr}
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="gb-field"
                />
              </label>

              <label>
                <span className="block mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#BB8D5B]">Horário Desejado</span>
                <input
                  required
                  type="time"
                  value={form.time}
                  onChange={(e) => updateField('time', e.target.value)}
                  className="gb-field"
                />
              </label>
            </div>

            {/* Observações */}
            <label>
              <span className="block mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#BB8D5B]">Observações</span>
              <textarea
                value={form.observations}
                onChange={(e) => updateField('observations', e.target.value)}
                className="gb-field min-h-[90px] resize-y"
                placeholder="Ex: preferência de horário, dúvida sobre procedimento..."
              />
            </label>

            {/* Botão de Agendamento */}
            <button
              type="submit"
              className="gb-button w-full justify-center bg-[#BB8D5B] text-[#0B0908] hover:bg-[#E0BC8D] font-bold text-xs tracking-[.18em] shadow-[0_4px_22px_rgba(187,141,91,0.35)] transition-all py-4"
            >
              Enviar Pedido de Agendamento ({form.professional}) <ArrowUpRight size={16} />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { data: config } = useSiteConfig();

  const showLocation = config?.exibirLocalizacao !== 'false';
  const showHours = config?.exibirHorarios !== 'false';
  const hasMiddleCol = showLocation || showHours;

  const cassianoWhats = config?.cassianoWhatsapp || '5565996611206';
  const cassianoWhatsLabel = config?.cassianoWhatsappLabel || '(65) 9 9661-1206';
  const cassianoInsta = config?.cassianoInstagram || '@cassianomonteiro_';
  const cassianoInstaUrl = config?.cassianoInstagramUrl || 'https://instagram.com/cassianomonteiro_';

  const isabellaWhats = config?.isabellaWhatsapp || '5565999225844';
  const isabellaWhatsLabel = config?.isabellaWhatsappLabel || '(65) 9 9922-5844';
  const isabellaInsta = config?.isabellaInstagram || '@isabellamorandinails';
  const isabellaInstaUrl = config?.isabellaInstagramUrl || 'https://instagram.com/isabellamorandinails';

  const address = config?.address || 'Lucas do Rio Verde - MT';
  const mapsUrl = config?.mapsUrl || 'https://maps.app.goo.gl/MjawqW4HePjDFeKVA';

  return (
    <footer className="bg-[#0B0908] border-t border-[#BB8D5B]/20 pb-12 pt-20 text-[#F5F0E8]">
      <div className="gb-shell">
        <div className={`grid gap-10 lg:gap-16 border-b border-[#BB8D5B]/15 pb-14 ${
          hasMiddleCol 
            ? 'md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1.3fr]' 
            : 'md:grid-cols-2 lg:grid-cols-[1fr_1.4fr] items-center'
        }`}>
          {/* Coluna 1: Marca & Descrição */}
          <div className="max-w-md">
            <BrandMark />
            <p className="mt-6 text-sm leading-6 text-[#A99B90]">
              Atelier de beleza exclusivo por <strong className="whitespace-nowrap text-[#F5F0E8]">Cassiano&nbsp;Monteiro</strong> e <strong className="whitespace-nowrap text-[#F5F0E8]">Isabella&nbsp;Morandi</strong>. Cabelos, unhas e experiências de luxo com atendimento personalizado.
            </p>
          </div>

          {/* Coluna 2: Localização e Horários (se ativados) */}
          {hasMiddleCol && (
            <div className="space-y-6">
              {showLocation && (
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#BB8D5B] mb-3">Localização</p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-sm leading-6 text-[#C9BEB5] hover:text-[#E0BC8D] transition-colors"
                  >
                    {address}
                  </a>
                </div>
              )}

              {showHours && (
                <div className={showLocation ? "border-t border-[#BB8D5B]/15 pt-5" : ""}>
                  <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#BB8D5B] mb-3">Horário de Funcionamento</p>
                  <div className="grid gap-2 text-xs text-[#A99B90]">
                    {OPENING_HOURS.map((oh) => (
                      <div key={oh.day} className="flex justify-between gap-4 border-b border-[#BB8D5B]/10 pb-1 last:border-0">
                        <span className="capitalize">{oh.day}</span>
                        <span className={oh.hours === 'Fechado' ? 'text-[#A99B90]/40' : 'text-[#E0BC8D]'}>
                          {oh.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Coluna de Perfis: quando não tem coluna do meio, os dois cards ficam lado a lado preenchendo a tela de forma equilibrada */}
          <div className="w-full">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#BB8D5B] mb-4">Contato Direto & Redes</p>
            
            <div className={hasMiddleCol ? "space-y-4" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
              {/* Card Cassiano */}
              <div className="rounded-xl border border-[#BB8D5B]/25 bg-[#14100E] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-[#F5F0E8]">Cassiano Monteiro</span>
                  <span className="text-[10px] font-mono uppercase text-[#BB8D5B]">Cabelos & Mega Hair</span>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={`https://wa.me/${cassianoWhats}?text=${encodeURIComponent('Olá Cassiano, gostaria de consultar informações sobre procedimentos capilares.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#BB8D5B]/15 border border-[#BB8D5B]/30 text-xs text-[#E0BC8D] hover:bg-[#BB8D5B] hover:text-[#0B0908] transition-all font-mono"
                  >
                    <span className="flex items-center gap-2"><MessageCircle size={14} /> WhatsApp</span>
                    <span className="text-[11px] font-semibold">{cassianoWhatsLabel}</span>
                  </a>
                  <a
                    href={cassianoInstaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#0B0908] border border-[#BB8D5B]/20 text-xs text-[#C9BEB5] hover:text-[#E0BC8D] hover:border-[#BB8D5B]/50 transition-all font-mono"
                  >
                    <span className="flex items-center gap-2"><Instagram size={14} /> Instagram</span>
                    <span className="text-[11px] text-[#BB8D5B]">{cassianoInsta}</span>
                  </a>
                </div>
              </div>

              {/* Card Isabella */}
              <div className="rounded-xl border border-[#BB8D5B]/25 bg-[#14100E] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-[#F5F0E8]">Isabella Morandi</span>
                  <span className="text-[10px] font-mono uppercase text-[#BB8D5B]">Nail Designer</span>
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <a
                    href={`https://wa.me/${isabellaWhats}?text=${encodeURIComponent('Olá Isabella, gostaria de consultar informações sobre unhas e procedimentos.')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#BB8D5B]/15 border border-[#BB8D5B]/30 text-xs text-[#E0BC8D] hover:bg-[#BB8D5B] hover:text-[#0B0908] transition-all font-mono"
                  >
                    <span className="flex items-center gap-2"><MessageCircle size={14} /> WhatsApp</span>
                    <span className="text-[11px] font-semibold">{isabellaWhatsLabel}</span>
                  </a>
                  <a
                    href={isabellaInstaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-between px-3.5 py-2 rounded-lg bg-[#0B0908] border border-[#BB8D5B]/20 text-xs text-[#C9BEB5] hover:text-[#E0BC8D] hover:border-[#BB8D5B]/50 transition-all font-mono"
                  >
                    <span className="flex items-center gap-2"><Instagram size={14} /> Instagram</span>
                    <span className="text-[11px] text-[#BB8D5B]">{isabellaInsta}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Inferior com Link Minimalista para Admin */}
        <div className="flex flex-col justify-between items-center gap-4 pt-8 text-[11px] font-mono uppercase tracking-[.14em] text-[#786A5E] md:flex-row">
          <span>© {new Date().getFullYear()} DUO ESPAÇO — Por Cassiano Monteiro e Isabella Morandi.</span>
          <a 
            href="/admin/login" 
            className="text-[#A99B90]/50 hover:text-[#E0BC8D] transition-colors flex items-center gap-1 tracking-wider text-[11px]"
            title="Acesso Administrativo"
          >
            <Lock size={11} className="opacity-70" /> admin
          </a>
        </div>
      </div>
    </footer>
  );
}

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '50px 0px 50px 0px' });

    const scanAndObserve = () => {
      const els = document.querySelectorAll('.gb-reveal');
      els.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 100 && rect.bottom > -100) {
          el.classList.add('is-visible');
        } else if (!el.classList.contains('is-observed')) {
          observer.observe(el);
          el.classList.add('is-observed');
        }
      });
    };

    scanAndObserve();

    // Re-escaneia quando imagens e mídias carregarem e alterarem a altura da página
    const timeout1 = setTimeout(scanAndObserve, 300);
    const timeout2 = setTimeout(scanAndObserve, 1000);
    const timeout3 = setTimeout(scanAndObserve, 2500);

    // Fallback de segurança absoluto: após 3.5s garante que nenhuma seção permaneça oculta
    const timeoutSafety = setTimeout(() => {
      document.querySelectorAll('.gb-reveal:not(.is-visible)').forEach(el => {
        el.classList.add('is-visible');
      });
    }, 3500);

    window.addEventListener('resize', scanAndObserve);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeoutSafety);
      window.removeEventListener('resize', scanAndObserve);
      observer.disconnect();
    };
  }, []);
}

function Home() {
  useScrollReveal();
  const [selectedService, setSelectedService] = useState<{ service: string; prof: 'Cassiano' | 'Isabella' }>({
    service: '',
    prof: 'Cassiano',
  });

  function handleSelectService(service: string, prof: 'Cassiano' | 'Isabella') {
    setSelectedService({ service, prof });
    document.getElementById('agendamento')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(null, '', '#agendamento');
  }

  return (
    <div className="site-noise min-h-[100dvh] overflow-x-hidden bg-[#0B0908]">
      <Header />
      <main>
        <Hero />
        <Services onSelectService={handleSelectService} />
        <CabeloEUnhas onSelectService={handleSelectService} />
        <About />
        <Gallery />
        <Booking
          key={`${selectedService.prof}-${selectedService.service}`}
          initialProfessional={selectedService.prof}
          initialService={selectedService.service}
        />
      </main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0B0908] text-[#E0BC8D] font-mono text-xs">
          Carregando painel DUO ESPAÇO...
        </div>
      }>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin" component={AdminDashboard} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
