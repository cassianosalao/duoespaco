import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  LogOut, Save, Plus, Trash2, Video, DollarSign, 
  MapPin, Clock, Scissors, Image as ImageIcon, FileText, 
  CheckCircle2, Upload, Film, Loader2, Sparkles, RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  useSiteConfig, 
  useServices, 
  useGallery, 
  saveSiteConfigLocally, 
  saveServicesLocally, 
  saveGalleryLocally,
  DEFAULT_CONFIG 
} from '@/hooks/use-site-data';

// Função de upload que envia direto para o Supabase Storage (com URL pública persistente)
async function uploadMediaFile(file: File): Promise<string> {
  const cleanName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const contentType = file.type || (file.name.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream');

  // 1. Tenta subir no bucket 'fotos' (que já está configurado como público no Supabase)
  try {
    const { data, error } = await supabase.storage.from('fotos').upload(cleanName, file, {
      contentType,
      upsert: true,
    });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(cleanName);
      if (urlData?.publicUrl) return urlData.publicUrl;
    }
    if (error) {
      console.warn('Tentativa no bucket fotos falhou:', error);
    }
  } catch (e) {
    console.warn('Erro ao enviar para fotos:', e);
  }

  // 2. Se falhar, tenta no bucket 'videos'
  try {
    const { data, error } = await supabase.storage.from('videos').upload(cleanName, file, {
      contentType,
      upsert: true,
    });
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('videos').getPublicUrl(cleanName);
      if (urlData?.publicUrl) return urlData.publicUrl;
    }
    if (error) {
      console.warn('Tentativa no bucket videos falhou:', error);
    }
  } catch (e) {
    console.warn('Erro ao enviar para videos:', e);
  }

  // 3. Tenta endpoint local se estiver em dev
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'x-filename': encodeURIComponent(file.name),
        'Content-Type': 'application/octet-stream',
      },
      body: file,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) return data.url;
    }
  } catch (e) {}

  throw new Error('Falha no upload para o Supabase Storage. Verifique as permissões de storage.');
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const configQuery = useSiteConfig();
  const servicesQuery = useServices();
  const galleryQuery = useGallery();

  const handleSync = async () => {
    setSyncing(true);
    try {
      await Promise.all([
        configQuery.refetch(),
        servicesQuery.refetch(),
        galleryQuery.refetch(),
      ]);
      toast({
        title: 'Sincronização com Supabase Concluída!',
        description: 'Todas as configurações, fotos e vídeos foram atualizados com a nuvem.',
      });
    } catch (e) {
      toast({
        title: 'Erro ao sincronizar',
        description: 'Não foi possível conectar ao Supabase.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    const localSession = sessionStorage.getItem('duo_admin_session');
    if (localSession === 'true') {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setLocation('/admin/login');
      }
      setLoading(false);
    });
  }, [setLocation]);

  const handleLogout = async () => {
    sessionStorage.removeItem('duo_admin_session');
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setLocation('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0908] text-[#F5F0E8] font-mono text-sm">
        Carregando painel DUO ESPAÇO...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0908] text-[#F5F0E8] p-4 sm:p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header do Painel */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#BB8D5B]/25 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#BB8D5B] animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-[#BB8D5B]">Painel de Gestão</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#E0BC8D] mt-1">DUO ESPAÇO</h1>
            <p className="text-xs text-[#A99B90] mt-0.5">Gerenciamento de serviços, valores, mídias e conteúdos</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={syncing}
              onClick={handleSync}
              className="border-[#BB8D5B]/50 bg-[#BB8D5B]/15 hover:bg-[#BB8D5B] hover:text-[#0B0908] text-[#E0BC8D] font-mono text-xs uppercase"
            >
              <RefreshCw className={`mr-2 h-3.5 w-3.5 text-[#BB8D5B] ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Supabase'}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="border-[#BB8D5B]/30 hover:bg-[#14100E] text-[#E0BC8D] font-mono text-xs uppercase"
            >
              <LogOut className="mr-2 h-4 w-4 text-[#BB8D5B]" /> Sair para o Site
            </Button>
          </div>
        </header>

        {/* Chave Rápida: Valores X Consultar */}
        <PricingModeBanner 
          config={configQuery.data || DEFAULT_CONFIG} 
          onUpdate={() => configQuery.refetch()} 
        />

        {/* Abas de Gerenciamento */}
        <Tabs defaultValue="midias" className="w-full">
          <TabsList className="bg-[#14100E] border border-[#BB8D5B]/30 p-1 flex flex-wrap h-auto gap-1">
            <TabsTrigger value="midias" className="data-[state=active]:bg-[#BB8D5B] data-[state=active]:text-[#0B0908] font-mono text-xs uppercase py-2">
              <Video className="w-3.5 h-3.5 mr-1.5" /> Vídeo & Fotos da Galeria
            </TabsTrigger>
            <TabsTrigger value="valores" className="data-[state=active]:bg-[#BB8D5B] data-[state=active]:text-[#0B0908] font-mono text-xs uppercase py-2">
              <DollarSign className="w-3.5 h-3.5 mr-1.5" /> Valores & Chave
            </TabsTrigger>
            <TabsTrigger value="localizacao" className="data-[state=active]:bg-[#BB8D5B] data-[state=active]:text-[#0B0908] font-mono text-xs uppercase py-2">
              <MapPin className="w-3.5 h-3.5 mr-1.5" /> Local & Horários
            </TabsTrigger>
            <TabsTrigger value="servicos" className="data-[state=active]:bg-[#BB8D5B] data-[state=active]:text-[#0B0908] font-mono text-xs uppercase py-2">
              <Scissors className="w-3.5 h-3.5 mr-1.5" /> Serviços
            </TabsTrigger>
            <TabsTrigger value="textos" className="data-[state=active]:bg-[#BB8D5B] data-[state=active]:text-[#0B0908] font-mono text-xs uppercase py-2">
              <FileText className="w-3.5 h-3.5 mr-1.5" /> Textos & Contatos
            </TabsTrigger>
          </TabsList>

          {/* ABA 1: VÍDEO & FOTOS DA GALERIA */}
          <TabsContent value="midias" className="mt-6">
            <MediaManagerTab 
              config={configQuery.data || DEFAULT_CONFIG} 
              gallery={galleryQuery.data || []}
              onSuccess={() => {
                configQuery.refetch();
                galleryQuery.refetch();
              }} 
            />
          </TabsContent>

          {/* ABA 2: VALORES X CONSULTAR */}
          <TabsContent value="valores" className="mt-6">
            <PricingConfigTab 
              config={configQuery.data || DEFAULT_CONFIG} 
              onSuccess={() => configQuery.refetch()} 
            />
          </TabsContent>

          {/* ABA 3: LOCALIZAÇÃO E HORÁRIOS */}
          <TabsContent value="localizacao" className="mt-6">
            <LocationHoursTab 
              config={configQuery.data || DEFAULT_CONFIG} 
              onSuccess={() => configQuery.refetch()} 
            />
          </TabsContent>

          {/* ABA 4: SERVIÇOS (EDITAR, ADICIONAR, EXCLUIR) */}
          <TabsContent value="servicos" className="mt-6">
            <ServicesManagerTab 
              config={configQuery.data || DEFAULT_CONFIG}
              onSuccess={() => {
                servicesQuery.refetch();
                configQuery.refetch();
              }} 
            />
          </TabsContent>

          {/* ABA 5: TEXTOS & CONTATOS */}
          <TabsContent value="textos" className="mt-6">
            <TextsAndContactsTab 
              config={configQuery.data || DEFAULT_CONFIG} 
              onSuccess={() => configQuery.refetch()} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Banner de Acesso Rápido para Chave Valores X Consultar
function PricingModeBanner({ config, onUpdate }: { config: Record<string, string>; onUpdate: () => void }) {
  const { toast } = useToast();
  const isValuesActive = config.exibirValores === 'true';

  const toggleMode = async (enabled: boolean) => {
    const val = enabled ? 'true' : 'false';
    saveSiteConfigLocally({ exibirValores: val });
    try {
      await supabase.from('configuracoes').upsert({ id: 'exibirValores', valor: val });
    } catch (e) {
      // salva localmente
    }
    toast({
      title: enabled ? 'Modo Valores ATIVADO' : 'Modo "A Consultar" ATIVADO',
      description: enabled 
        ? 'Os valores numéricos configurados nos serviços serão exibidos no site.' 
        : 'Todos os serviços agora exibem o rótulo discreto "A consultar".',
    });
    onUpdate();
  };

  return (
    <div className={`p-5 rounded-2xl border transition-all ${
      isValuesActive 
        ? 'bg-[#181410] border-[#BB8D5B]/70 shadow-[0_0_25px_rgba(187,141,91,0.2)]' 
        : 'bg-[#14100E] border-[#BB8D5B]/30'
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl border shrink-0 ${
            isValuesActive ? 'bg-[#BB8D5B] text-[#0B0908] border-[#BB8D5B]' : 'bg-[#1A1412] text-[#BB8D5B] border-[#BB8D5B]/30'
          }`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">
                Controle de Preços: {isValuesActive ? 'Exibindo Valores Reais' : 'Modo "A Consultar" Ativo'}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                isValuesActive ? 'bg-[#BB8D5B]/20 text-[#E0BC8D] border border-[#BB8D5B]/40' : 'bg-white/5 text-[#A99B90] border border-white/10'
              }`}>
                {isValuesActive ? 'Valores Ativados' : 'A Consultar (Padrão)'}
              </span>
            </div>
            <p className="text-xs text-[#A99B90] mt-1 max-w-2xl">
              Alterne entre manter os preços sob consulta no WhatsApp ou exibir os valores numéricos cadastrados em cada serviço.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
          <span className="text-xs font-mono text-[#A99B90]">
            {isValuesActive ? 'Valores Visíveis' : 'A Consultar'}
          </span>
          <Switch 
            checked={isValuesActive} 
            onCheckedChange={toggleMode}
            className="data-[state=checked]:bg-[#BB8D5B]" 
          />
        </div>
      </div>
    </div>
  );
}

// ABA: VÍDEO & FOTOS DA GALERIA (UPLOAD DIRETO DE QUALQUER FORMATO)
function MediaManagerTab({ 
  config, 
  gallery, 
  onSuccess 
}: { 
  config: Record<string, string>; 
  gallery: any[]; 
  onSuccess: () => void; 
}) {
  const { toast } = useToast();
  const [videoUrl, setVideoUrl] = useState(config.videoUrl || '/videos/duo-espaco.mp4');
  const [posterImage, setPosterImage] = useState(
    config.posterImage && config.posterImage !== '/images/salao-luxury.jpg' ? config.posterImage : ''
  );
  const [logoImage, setLogoImage] = useState(config.logoImage || '/images/duo-espaco-logo.jpg');
  const [heroImage, setHeroImage] = useState(config.heroImage || '/images/cassiano-e-isabella.jpg');
  const [megaHairImage, setMegaHairImage] = useState(config.megaHairImage || '/images/mega-hair.jpg');
  const [unhasImage, setUnhasImage] = useState(config.unhasImage || '/images/unhas-nail-spa.jpg');
  
  const [galleryItems, setGalleryItems] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('duo_galeria');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return gallery && gallery.length > 0 ? gallery : [
      { url_imagem: '/images/hero-beauty.jpg', rotulo: 'Textura & Luz' },
      { url_imagem: '/images/mega-hair.jpg', rotulo: 'Mega Hair & Volume' },
      { url_imagem: '/images/unhas-nail-spa.jpg', rotulo: 'Unhas & Detalhes' },
      { url_imagem: '/images/salao-luxury.jpg', rotulo: 'Ambiente & Atelier' },
    ];
  });

  // Sincroniza o estado sempre que os dados chegam da nuvem Supabase
  useEffect(() => {
    if (config?.videoUrl) setVideoUrl(config.videoUrl);
    if (config?.posterImage !== undefined) {
      setPosterImage(config.posterImage === '/images/salao-luxury.jpg' ? '' : config.posterImage);
    }
    if (config?.logoImage) setLogoImage(config.logoImage);
    if (config?.heroImage) setHeroImage(config.heroImage);
    if (config?.megaHairImage) setMegaHairImage(config.megaHairImage);
    if (config?.unhasImage) setUnhasImage(config.unhasImage);
  }, [config]);

  useEffect(() => {
    if (gallery && gallery.length > 0) {
      setGalleryItems(gallery);
    }
  }, [gallery]);

  // Estados de upload em progresso
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingMega, setUploadingMega] = useState(false);
  const [uploadingUnhas, setUploadingUnhas] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving] = useState(false);

  // Refs para inputs ocultos
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);
  const megaInputRef = useRef<HTMLInputElement>(null);
  const unhasInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Upload do Vídeo (qualquer formato: mp4, mov, webm, m4v, etc)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    toast({
      title: 'Enviando vídeo da galeria...',
      description: `Processando arquivo ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`,
    });

    try {
      const uploadedUrl = await uploadMediaFile(file);
      setVideoUrl(uploadedUrl);
      saveSiteConfigLocally({ videoUrl: uploadedUrl });
      try {
        await supabase.from('configuracoes').upsert({ id: 'videoUrl', valor: uploadedUrl });
      } catch (err) {}

      toast({
        title: 'Vídeo atualizado com sucesso!',
        description: 'O novo vídeo já está pronto e visível no site.',
      });
      onSuccess();
    } catch (err) {
      console.error(err);
      toast({
        title: 'Erro ao enviar vídeo',
        description: 'Não foi possível carregar o vídeo. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
  };

  // Upload de Foto individual
  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    key: string,
    setLoadingState: (val: boolean) => void,
    label: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingState(true);
    toast({ title: `Enviando ${label}...` });

    try {
      const uploadedUrl = await uploadMediaFile(file);
      setter(uploadedUrl);
      saveSiteConfigLocally({ [key]: uploadedUrl });
      try {
        await supabase.from('configuracoes').upsert({ id: key, valor: uploadedUrl });
      } catch (err) {}

      toast({ title: `${label} atualizada com sucesso!` });
      onSuccess();
    } catch (err) {
      console.error(err);
      toast({ title: `Erro ao enviar ${label}`, variant: 'destructive' });
    } finally {
      setLoadingState(false);
      if (e.target) e.target.value = '';
    }
  };

  // Sincroniza a galeria completa no Supabase (tabela galeria e configuracoes)
  const syncGalleryToSupabase = async (items: any[]) => {
    try {
      // 1. Apaga registros antigos da tabela galeria
      await supabase.from('galeria').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // 2. Insere os novos itens
      if (items.length > 0) {
        const rows = items.map((item, idx) => ({
          url_imagem: item.url_imagem,
          rotulo: item.rotulo || '',
          texto_alternativo: item.texto_alternativo || item.rotulo || 'Galeria Duo Espaço',
          tamanho: item.tamanho || 'small',
          ordem: idx + 1,
        }));
        await supabase.from('galeria').insert(rows);
      }

      // 3. Backup redundante em configuracoes
      await supabase.from('configuracoes').upsert({
        id: 'galeria_json',
        valor: JSON.stringify(items),
      });
    } catch (e) {
      console.warn('Erro ao sincronizar galeria no Supabase:', e);
    }
  };

  // Upload múltiplo para Galeria
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingGallery(true);
    toast({ title: `Enviando ${files.length} foto(s) para a galeria...` });

    try {
      const newItems = [...galleryItems];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadedUrl = await uploadMediaFile(file);
        newItems.push({
          url_imagem: uploadedUrl,
          rotulo: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
        });
      }

      setGalleryItems(newItems);
      saveGalleryLocally(newItems);
      await syncGalleryToSupabase(newItems);
      toast({ title: 'Fotos adicionadas e salvas no Supabase!' });
      onSuccess();
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro ao enviar fotos da galeria', variant: 'destructive' });
    } finally {
      setUploadingGallery(false);
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const handleRemoveGalleryItem = async (index: number) => {
    const updated = [...galleryItems];
    updated.splice(index, 1);
    setGalleryItems(updated);
    saveGalleryLocally(updated);
    await syncGalleryToSupabase(updated);
    toast({ title: 'Foto removida e atualizada no Supabase.' });
    onSuccess();
  };

  const handleUpdateGalleryLabel = (index: number, label: string) => {
    const updated = [...galleryItems];
    updated[index] = { ...updated[index], rotulo: label };
    setGalleryItems(updated);
    saveGalleryLocally(updated);
  };

  const handleSaveMedias = async () => {
    setSaving(true);
    const updates = { videoUrl, posterImage, logoImage, heroImage, megaHairImage, unhasImage };
    saveSiteConfigLocally(updates);
    saveGalleryLocally(galleryItems);

    try {
      for (const [id, valor] of Object.entries(updates)) {
        await supabase.from('configuracoes').upsert({ id, valor });
      }
      await syncGalleryToSupabase(galleryItems);
    } catch (e) {
      console.error('Erro ao sincronizar mídias:', e);
    }

    setSaving(false);
    toast({ title: 'Todas as mídias e fotos foram salvas com sucesso!' });
    onSuccess();
  };

  return (
    <div className="bg-[#14100E] p-6 rounded-2xl border border-[#BB8D5B]/30 space-y-8">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#E0BC8D]">Vídeo Institucional & Fotografias</h2>
        <p className="text-xs text-[#A99B90] mt-1">
          Suba arquivos diretamente da galeria do seu celular ou computador em qualquer formato de foto ou vídeo.
        </p>
      </div>

      {/* BLOCO 1: VÍDEO DO ESPAÇO (9:16 VERTICAL - REELS) */}
      <div className="p-6 rounded-2xl border border-[#BB8D5B]/35 bg-[#0B0908] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#BB8D5B]/15 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#BB8D5B]/15 border border-[#BB8D5B]/30 text-[#E0BC8D]">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-[#F5F0E8] text-lg">Vídeo Institucional (Moldura 9:16 - Reels)</h3>
              <p className="text-xs text-[#A99B90]">Reproduz com áudio estéreo na seção "O Espaço" do site</p>
            </div>
          </div>

          {/* Botão de Upload Direto da Galeria */}
          <div>
            <input
              type="file"
              ref={videoInputRef}
              accept="video/*,.mp4,.mov,.webm,.m4v,.avi,.mkv"
              onChange={handleVideoUpload}
              className="hidden"
            />
            <Button
              type="button"
              disabled={uploadingVideo}
              onClick={() => videoInputRef.current?.click()}
              className="bg-[#BB8D5B] text-[#0B0908] hover:bg-[#E0BC8D] font-mono text-xs uppercase font-bold py-5 shadow-[0_4px_16px_rgba(187,141,91,0.25)]"
            >
              {uploadingVideo ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subindo Vídeo...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" /> Subir Vídeo da Galeria
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Pré-visualização do Vídeo e Caminho */}
        <div className="grid gap-6 md:grid-cols-[1fr_260px] items-start">
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-mono uppercase text-[#A99B90]">Caminho / URL Atual do Vídeo</Label>
              <Input 
                value={videoUrl} 
                onChange={(e) => setVideoUrl(e.target.value)}
                className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 font-mono text-xs" 
                placeholder="/videos/duo-espaco.mp4"
              />
            </div>
            <p className="text-xs text-[#A99B90] leading-relaxed">
              Você pode clicar no botão <strong>"Subir Vídeo da Galeria"</strong> acima para escolher qualquer arquivo MP4 ou MOV do seu celular ou computador, ou colar uma URL.
            </p>

            {/* Controle de Capa do Vídeo (Poster) */}
            <div className="pt-4 border-t border-[#BB8D5B]/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#14100E] p-4 rounded-xl border border-[#BB8D5B]/25">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold uppercase text-[#E0BC8D]">Capa Antes do Play (Poster)</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      posterImage && posterImage.trim() !== '' && posterImage !== '/images/salao-luxury.jpg'
                        ? 'bg-[#BB8D5B]/20 text-[#E0BC8D] border border-[#BB8D5B]/40'
                        : 'bg-white/5 text-[#A99B90] border border-white/10'
                    }`}>
                      {posterImage && posterImage.trim() !== '' && posterImage !== '/images/salao-luxury.jpg'
                        ? 'Capa Personalizada Ativa'
                        : '1º Frame do Vídeo (Natural)'}
                    </span>
                  </div>
                  <p className="text-xs text-[#A99B90]">
                    {posterImage && posterImage.trim() !== '' && posterImage !== '/images/salao-luxury.jpg'
                      ? 'Imagem personalizada visível antes de reproduzir o vídeo.'
                      : 'O site mostra naturalmente o 1º frame do vídeo enviado, sem fotos fakes.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={posterInputRef}
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, setPosterImage, 'posterImage', setUploadingPoster, 'Capa do Vídeo')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    disabled={uploadingPoster}
                    onClick={() => posterInputRef.current?.click()}
                    className="bg-[#BB8D5B]/20 text-[#E0BC8D] border border-[#BB8D5B]/40 hover:bg-[#BB8D5B] hover:text-[#0B0908] font-mono text-xs uppercase"
                  >
                    {uploadingPoster ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {posterImage && posterImage !== '/images/salao-luxury.jpg' ? 'Trocar Capa da Galeria' : 'Subir Foto de Capa'}
                  </Button>

                  {posterImage && posterImage.trim() !== '' && posterImage !== '/images/salao-luxury.jpg' && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        setPosterImage('');
                        saveSiteConfigLocally({ posterImage: '' });
                        try {
                          await supabase.from('configuracoes').upsert({ id: 'posterImage', valor: '' });
                        } catch (e) {}
                        toast({
                          title: 'Capa personalizada removida!',
                          description: 'O vídeo agora exibe o 1º frame original do próprio vídeo.',
                        });
                        onSuccess();
                      }}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono text-xs uppercase"
                    >
                      Usar 1º frame do vídeo
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview 9:16 Vertical */}
          <div className="flex flex-col items-center">
            <span className="font-mono text-[10px] uppercase text-[#BB8D5B] mb-2">Pré-visualização 9:16</span>
            <div className="relative w-[150px] aspect-[9/16] overflow-hidden rounded-2xl border-2 border-[#BB8D5B]/40 bg-[#14100E] shadow-xl">
              <video
                key={`${videoUrl}-${posterImage}`}
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                poster={posterImage && posterImage.trim() !== '' && posterImage !== '/images/salao-luxury.jpg' ? posterImage : undefined}
                className="h-full w-full object-cover"
              >
                <source src={videoUrl} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2: FOTOS PRINCIPAIS DO SITE (LOGO, CAPA, HERO, MEGA HAIR, UNHAS) */}
      <div>
        <h3 className="font-serif text-lg font-bold text-[#E0BC8D] mb-4">Fotos Principais do Site</h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {/* Logo do Salão */}
          <div className="p-4 rounded-2xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase font-bold text-[#E0BC8D]">Logo do Salão</Label>
                <span className="text-[10px] font-mono text-[#BB8D5B]">Marca</span>
              </div>

              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#BB8D5B]/30 bg-[#14100E] p-2 flex items-center justify-center">
                {logoImage ? (
                  <img src={logoImage} alt="Logo" className="h-full w-full object-cover rounded-full" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#A99B90]">Sem logo</div>
                )}
              </div>
            </div>

            <div>
              <input
                type="file"
                ref={logoInputRef}
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, setLogoImage, 'logoImage', setUploadingLogo, 'Logo do Salão')}
                className="hidden"
              />
              <Button
                type="button"
                disabled={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
                className="w-full bg-[#BB8D5B]/15 text-[#E0BC8D] border border-[#BB8D5B]/30 hover:bg-[#BB8D5B] hover:text-[#0B0908] font-mono text-xs uppercase"
              >
                {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                Subir Logo
              </Button>
            </div>
          </div>

          {/* Foto de Capa / Ambiente (Poster do Vídeo) */}
          <div className="p-4 rounded-2xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase font-bold text-[#E0BC8D]">Capa do Vídeo</Label>
                <span className="text-[10px] font-mono text-[#BB8D5B]">Ambiente</span>
              </div>

              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#BB8D5B]/30 bg-[#14100E]">
                {posterImage && posterImage.trim() !== '' && posterImage !== '/images/salao-luxury.jpg' ? (
                  <img src={posterImage} alt="Capa" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center text-xs text-[#A99B90]">
                    <Film className="w-5 h-5 mb-1 text-[#BB8D5B]/60" />
                    <span>1º frame original do vídeo</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <input
                type="file"
                ref={posterInputRef}
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, setPosterImage, 'posterImage', setUploadingPoster, 'Capa do Vídeo')}
                className="hidden"
              />
              <Button
                type="button"
                disabled={uploadingPoster}
                onClick={() => posterInputRef.current?.click()}
                className="w-full bg-[#BB8D5B]/15 text-[#E0BC8D] border border-[#BB8D5B]/30 hover:bg-[#BB8D5B] hover:text-[#0B0908] font-mono text-xs uppercase"
              >
                {uploadingPoster ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                Subir Capa
              </Button>
            </div>
          </div>

          {/* Foto Cassiano & Isabella (Hero) */}
          <div className="p-4 rounded-2xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase font-bold text-[#E0BC8D]">Foto Cassiano & Isabella</Label>
                <span className="text-[10px] font-mono text-[#BB8D5B]">Hero</span>
              </div>

              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#BB8D5B]/30 bg-[#14100E]">
                {heroImage ? (
                  <img src={heroImage} alt="Hero" className="h-full w-full object-cover object-top" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#A99B90]">Sem foto</div>
                )}
              </div>
            </div>

            <div>
              <input
                type="file"
                ref={heroInputRef}
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, setHeroImage, 'heroImage', setUploadingHero, 'Foto da Hero')}
                className="hidden"
              />
              <Button
                type="button"
                disabled={uploadingHero}
                onClick={() => heroInputRef.current?.click()}
                className="w-full bg-[#BB8D5B]/15 text-[#E0BC8D] border border-[#BB8D5B]/30 hover:bg-[#BB8D5B] hover:text-[#0B0908] font-mono text-xs uppercase"
              >
                {uploadingHero ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                Subir Foto
              </Button>
            </div>
          </div>

          {/* Foto Especialidade Mega Hair */}
          <div className="p-4 rounded-2xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase font-bold text-[#E0BC8D]">Foto Mega Hair</Label>
                <span className="text-[10px] font-mono text-[#BB8D5B]">Cassiano</span>
              </div>

              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#BB8D5B]/30 bg-[#14100E]">
                {megaHairImage ? (
                  <img src={megaHairImage} alt="Mega Hair" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#A99B90]">Sem foto</div>
                )}
              </div>
            </div>

            <div>
              <input
                type="file"
                ref={megaInputRef}
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, setMegaHairImage, 'megaHairImage', setUploadingMega, 'Foto do Mega Hair')}
                className="hidden"
              />
              <Button
                type="button"
                disabled={uploadingMega}
                onClick={() => megaInputRef.current?.click()}
                className="w-full bg-[#BB8D5B]/15 text-[#E0BC8D] border border-[#BB8D5B]/30 hover:bg-[#BB8D5B] hover:text-[#0B0908] font-mono text-xs uppercase"
              >
                {uploadingMega ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                Subir Foto
              </Button>
            </div>
          </div>

          {/* Foto Especialidade Unhas */}
          <div className="p-4 rounded-2xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-mono uppercase font-bold text-[#E0BC8D]">Foto Unhas</Label>
                <span className="text-[10px] font-mono text-[#BB8D5B]">Isabella</span>
              </div>

              <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-[#BB8D5B]/30 bg-[#14100E]">
                {unhasImage ? (
                  <img src={unhasImage} alt="Unhas" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#A99B90]">Sem foto</div>
                )}
              </div>
            </div>

            <div>
              <input
                type="file"
                ref={unhasInputRef}
                accept="image/*"
                onChange={(e) => handlePhotoUpload(e, setUnhasImage, 'unhasImage', setUploadingUnhas, 'Foto de Unhas')}
                className="hidden"
              />
              <Button
                type="button"
                disabled={uploadingUnhas}
                onClick={() => unhasInputRef.current?.click()}
                className="w-full bg-[#BB8D5B]/15 text-[#E0BC8D] border border-[#BB8D5B]/30 hover:bg-[#BB8D5B] hover:text-[#0B0908] font-mono text-xs uppercase"
              >
                {uploadingUnhas ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
                Subir Foto
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 3: GALERIA DE FOTOS (CURADORIA VISUAL) */}
      <div className="p-6 rounded-2xl border border-[#BB8D5B]/30 bg-[#0B0908] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#BB8D5B]/15 gap-3">
          <div>
            <h3 className="font-serif font-bold text-[#F5F0E8] text-lg flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#BB8D5B]" /> Curadoria Visual da Galeria
            </h3>
            <p className="text-xs text-[#A99B90]">Suba fotos da galeria para compor a vitrine visual do site</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              ref={galleryInputRef}
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
            />
            <Button
              type="button"
              disabled={uploadingGallery}
              onClick={() => galleryInputRef.current?.click()}
              className="bg-[#BB8D5B] text-[#0B0908] hover:bg-[#E0BC8D] font-mono text-xs uppercase font-bold"
            >
              {uploadingGallery ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Subindo Fotos...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" /> Adicionar Fotos da Galeria
                </>
              )}
            </Button>

            <Button
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                saveGalleryLocally(galleryItems);
                await syncGalleryToSupabase(galleryItems);
                setSaving(false);
                toast({ title: 'Galeria sincronizada com o Supabase com sucesso!' });
                onSuccess();
              }}
              variant="outline"
              className="border-[#BB8D5B]/40 text-[#E0BC8D] hover:bg-[#BB8D5B] hover:text-[#0B0908] font-mono text-xs uppercase font-bold"
            >
              <Save className="w-4 h-4 mr-1.5" /> Salvar Galeria
            </Button>
          </div>
        </div>

        {/* Grade de fotos da galeria */}
        {galleryItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[#BB8D5B]/30 rounded-xl space-y-2">
            <p className="text-sm text-[#A99B90]">Nenhuma foto na galeria no momento.</p>
            <p className="text-xs text-[#A99B90]/70">Clique em "Adicionar Fotos da Galeria" acima para subir suas fotos.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {galleryItems.map((item, idx) => (
              <div key={idx} className="relative p-3 rounded-xl border border-[#BB8D5B]/25 bg-[#14100E] space-y-2 group">
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#0B0908]">
                  <img src={item.url_imagem} alt={item.rotulo || 'Galeria'} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveGalleryItem(idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors shadow-md"
                    title="Remover Foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <Label className="text-[10px] font-mono uppercase text-[#A99B90]">Rótulo / Título</Label>
                  <Input
                    value={item.rotulo || ''}
                    onChange={(e) => handleUpdateGalleryLabel(idx, e.target.value)}
                    className="bg-[#0B0908] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 text-xs"
                    placeholder="Ex: Loiro Iluminado"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botão Salvar Todas as Mídias */}
      <Button 
        onClick={handleSaveMedias} 
        disabled={saving}
        className="bg-[#BB8D5B] text-[#0B0908] hover:bg-[#E0BC8D] font-mono text-xs uppercase font-bold py-5 w-full sm:w-auto px-8 shadow-[0_4px_16px_rgba(187,141,91,0.25)]"
      >
        <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Todas as Mídias'}
      </Button>
    </div>
  );
}

// ABA: Detalhes do modo de valores
function PricingConfigTab({ config, onSuccess }: { config: Record<string, string>; onSuccess: () => void }) {
  const { toast } = useToast();
  const isValuesActive = config.exibirValores === 'true';

  const handleToggle = async (val: boolean) => {
    const stringVal = val ? 'true' : 'false';
    saveSiteConfigLocally({ exibirValores: stringVal });
    try {
      await supabase.from('configuracoes').upsert({ id: 'exibirValores', valor: stringVal });
    } catch (e) {}
    toast({
      title: 'Configuração atualizada!',
      description: val ? 'Valores numéricos ativados no site.' : 'Modo "A consultar" ativado no site.',
    });
    onSuccess();
  };

  return (
    <div className="bg-[#14100E] p-6 rounded-2xl border border-[#BB8D5B]/30 space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#E0BC8D]">Chave Valores X Consultar</h2>
        <p className="text-xs text-[#A99B90] mt-1">
          Defina como seus clientes visualizam a política de preços dos rituais e procedimentos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className={`p-5 rounded-xl border transition-all cursor-pointer ${
          !isValuesActive ? 'bg-[#1A1412] border-[#BB8D5B] ring-1 ring-[#BB8D5B]/50' : 'bg-[#0B0908] border-[#BB8D5B]/20 hover:border-[#BB8D5B]/40'
        }`} onClick={() => handleToggle(false)}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#BB8D5B]">Opção 1 (Recomendada)</span>
            {!isValuesActive && <CheckCircle2 className="w-5 h-5 text-[#BB8D5B]" />}
          </div>
          <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">Sob Consulta ("A consultar")</h3>
          <p className="text-xs text-[#A99B90] mt-2 leading-relaxed">
            Todos os cartões de serviço exibem discretamente a etiqueta "A consultar". O cliente escolhe o procedimento e consulta o orçamento personalizado diretamente via WhatsApp de cada profissional.
          </p>
        </div>

        <div className={`p-5 rounded-xl border transition-all cursor-pointer ${
          isValuesActive ? 'bg-[#1A1412] border-[#BB8D5B] ring-1 ring-[#BB8D5B]/50' : 'bg-[#0B0908] border-[#BB8D5B]/20 hover:border-[#BB8D5B]/40'
        }`} onClick={() => handleToggle(true)}>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#BB8D5B]">Opção 2</span>
            {isValuesActive && <CheckCircle2 className="w-5 h-5 text-[#BB8D5B]" />}
          </div>
          <h3 className="font-serif text-lg font-bold text-[#F5F0E8]">Exibir Valores Numéricos</h3>
          <p className="text-xs text-[#A99B90] mt-2 leading-relaxed">
            Exibe os preços individuais preenchidos na aba "Serviços" (ex: "R$ 180,00", "A partir de R$ 250"). Útil quando você desejar praticar tabela aberta para o público.
          </p>
        </div>
      </div>
    </div>
  );
}

// ABA: LOCALIZAÇÃO E HORÁRIOS (COM VISIBILIDADE / OCULTAR)
function LocationHoursTab({ config, onSuccess }: { config: Record<string, string>; onSuccess: () => void }) {
  const { toast } = useToast();
  const [data, setData] = useState({
    exibirLocalizacao: config.exibirLocalizacao !== 'false',
    exibirHorarios: config.exibirHorarios !== 'false',
    address: config.address || 'Lucas do Rio Verde - MT',
    mapsUrl: config.mapsUrl || 'https://maps.app.goo.gl/MjawqW4HePjDFeKVA',
    hours: config.hours || 'Terça a sábado · 09:00 - 18:00',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setData({
      exibirLocalizacao: config.exibirLocalizacao !== 'false',
      exibirHorarios: config.exibirHorarios !== 'false',
      address: config.address || 'Lucas do Rio Verde - MT',
      mapsUrl: config.mapsUrl || 'https://maps.app.goo.gl/MjawqW4HePjDFeKVA',
      hours: config.hours || 'Terça a sábado · 09:00 - 18:00',
    });
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    const updates = {
      exibirLocalizacao: data.exibirLocalizacao ? 'true' : 'false',
      exibirHorarios: data.exibirHorarios ? 'true' : 'false',
      address: data.address,
      mapsUrl: data.mapsUrl,
      hours: data.hours,
    };

    saveSiteConfigLocally(updates);
    try {
      for (const [id, valor] of Object.entries(updates)) {
        await supabase.from('configuracoes').upsert({ id, valor });
      }
    } catch (e) {}

    setSaving(false);
    toast({ title: 'Configurações de Localização e Horários salvas!' });
    onSuccess();
  };

  return (
    <div className="bg-[#14100E] p-6 rounded-2xl border border-[#BB8D5B]/30 space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#E0BC8D]">Localização & Horários de Funcionamento</h2>
        <p className="text-xs text-[#A99B90] mt-1">
          Ative ou oculte essas seções no rodapé do site e edite as informações sempre que necessário.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bloco 1: Localização */}
        <div className="p-5 rounded-xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#BB8D5B]/15">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#BB8D5B]" />
              <h3 className="font-serif font-bold text-[#F5F0E8]">Seção Localização</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#A99B90]">
                {data.exibirLocalizacao ? 'Visível' : 'Oculto'}
              </span>
              <Switch 
                checked={data.exibirLocalizacao} 
                onCheckedChange={(val) => setData(prev => ({ ...prev, exibirLocalizacao: val }))}
                className="data-[state=checked]:bg-[#BB8D5B]" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-mono uppercase text-[#A99B90]">Texto do Endereço / Cidade</Label>
              <Input 
                value={data.address} 
                onChange={(e) => setData(prev => ({ ...prev, address: e.target.value }))}
                className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1" 
                placeholder="Ex: Lucas do Rio Verde - MT"
              />
            </div>
            <div>
              <Label className="text-xs font-mono uppercase text-[#A99B90]">Link do Google Maps</Label>
              <Input 
                value={data.mapsUrl} 
                onChange={(e) => setData(prev => ({ ...prev, mapsUrl: e.target.value }))}
                className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1" 
                placeholder="https://maps.app.goo.gl/..."
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Horários */}
        <div className="p-5 rounded-xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#BB8D5B]/15">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#BB8D5B]" />
              <h3 className="font-serif font-bold text-[#F5F0E8]">Seção Horários</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#A99B90]">
                {data.exibirHorarios ? 'Visível' : 'Oculto'}
              </span>
              <Switch 
                checked={data.exibirHorarios} 
                onCheckedChange={(val) => setData(prev => ({ ...prev, exibirHorarios: val }))}
                className="data-[state=checked]:bg-[#BB8D5B]" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs font-mono uppercase text-[#A99B90]">Resumo dos Horários</Label>
              <Input 
                value={data.hours} 
                onChange={(e) => setData(prev => ({ ...prev, hours: e.target.value }))}
                className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1" 
                placeholder="Ex: Terça a sábado · 09:00 - 18:00"
              />
            </div>
            <p className="text-[11px] text-[#A99B90] leading-relaxed">
              Quando ativado, os horários de funcionamento aparecem na coluna do rodapé.
            </p>
          </div>
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="bg-[#BB8D5B] text-[#0B0908] hover:bg-[#E0BC8D] font-mono text-xs uppercase font-bold py-5"
      >
        <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
      </Button>
    </div>
  );
}

// ABA: SERVIÇOS (EDITAR, ADICIONAR, EXCLUIR)
const INITIAL_SERVICOS_COMBINADOS = [
  // Cassiano
  { id: '1', profissional: 'Cassiano', titulo: 'Corte', detalhe: 'A consultar', descricao: 'Visagismo e desenho sob medida para valorizar sua estrutura e estilo.' },
  { id: '2', profissional: 'Cassiano', titulo: 'Escova', detalhe: 'A consultar', descricao: 'Finalização impecável com brilho duradouro e movimento natural.' },
  { id: '3', profissional: 'Cassiano', titulo: 'Extensão Capilar (Mega Hair)', detalhe: 'A consultar', descricao: 'Técnica avançada com acabamento imperceptível, comprimento e volume.' },
  { id: '4', profissional: 'Cassiano', titulo: 'Mechas (Loiras e Morenas Iluminadas)', detalhe: 'A consultar', descricao: 'Dimensões personalizadas que harmonizam perfeitamente com seu tom de pele.' },
  { id: '5', profissional: 'Cassiano', titulo: 'Penteado', detalhe: 'A consultar', descricao: 'Criações exclusivas para ocasiões especiais, noivas e celebrações.' },
  { id: '6', profissional: 'Cassiano', titulo: 'Progressiva com Formol (Selagem)', detalhe: 'A consultar', descricao: 'Alinhamento intenso, controle de frizz e redução expressiva de volume.' },
  { id: '7', profissional: 'Cassiano', titulo: 'Progressiva Orgânica (Selagem)', detalhe: 'A consultar', descricao: 'Alinhamento suave sem formol, fios sedosos e tratamento profundo.' },
  { id: '8', profissional: 'Cassiano', titulo: 'Coloração', detalhe: 'A consultar', descricao: 'Cobertura impecável, nuances ricas e durabilidade com produtos nobres.' },
  { id: '9', profissional: 'Cassiano', titulo: 'Tonalização de Fios Brancos', detalhe: 'A consultar', descricao: 'Camuflagem elegante e natural dos primeiros fios brancos.' },
  { id: '10', profissional: 'Cassiano', titulo: 'Hidratação', detalhe: 'A consultar', descricao: 'Rituais de nutrição e reposição lipídica para devolver vida e sedosidade.' },
  // Isabella
  { id: '11', profissional: 'Isabella', titulo: 'Esmaltação em gel', detalhe: 'A consultar', descricao: 'Brilho espelhado e durabilidade prolongada sem descascar.' },
  { id: '12', profissional: 'Isabella', titulo: 'Banho de gel', detalhe: 'A consultar', descricao: 'Camada de proteção e fortalecimento para as unhas naturais.' },
  { id: '13', profissional: 'Isabella', titulo: 'Alongamento em molde F1', detalhe: 'A consultar', descricao: 'Formato impecável, curvatura perfeita e acabamento ultra natural.' },
  { id: '14', profissional: 'Isabella', titulo: 'Manutenção', detalhe: 'A consultar', descricao: 'Cuidado periódico para manter o alinhamento e estrutura das unhas.' },
  { id: '15', profissional: 'Isabella', titulo: 'Pé e mão', detalhe: 'A consultar', descricao: 'Cuidado completo e detalhado com cuticulagem e esmaltação refinada.' },
  { id: '16', profissional: 'Isabella', titulo: 'Mão', detalhe: 'A consultar', descricao: 'Design e higienização das unhas das mãos com acabamento de alta precisão.' },
  { id: '17', profissional: 'Isabella', titulo: 'Pé', detalhe: 'A consultar', descricao: 'Tratamento das unhas dos pés, hidratação e esmaltação elegante.' },
  { id: '18', profissional: 'Isabella', titulo: 'Pacote (4 mãos e 2 pés)', detalhe: 'A consultar', descricao: 'Combo mensal de cuidados regulares com atendimento prioritário.' },
  { id: '19', profissional: 'Isabella', titulo: 'Plástica dos pés', detalhe: 'A consultar', descricao: 'Renovação e hidratação profunda para pés macios e aveludados.' },
];

function ServicesManagerTab({ config, onSuccess }: { config: Record<string, string>; onSuccess: () => void }) {
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('duo_servicos');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return INITIAL_SERVICOS_COMBINADOS;
  });
  const [filterProf, setFilterProf] = useState<'Todos' | 'Cassiano' | 'Isabella'>('Todos');
  const [saving, setSaving] = useState(false);

  const isValuesActive = config.exibirValores === 'true';

  const handleUpdate = (index: number, field: string, value: any) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: value };
    setServices(updated);
  };

  const handleAdd = () => {
    const newService = {
      id: String(Date.now()),
      profissional: filterProf === 'Todos' ? 'Cassiano' : filterProf,
      titulo: 'Novo Serviço',
      detalhe: 'A consultar',
      descricao: 'Descrição personalizada do procedimento.',
    };
    setServices([newService, ...services]);
    toast({ title: 'Serviço adicionado! Preencha os campos e salve.' });
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Deseja realmente excluir este serviço?')) return;
    const itemToDelete = services[index];
    const updated = [...services];
    updated.splice(index, 1);
    setServices(updated);
    saveServicesLocally(updated);
    if (itemToDelete?.id && itemToDelete.id.length > 20) {
      try {
        await supabase.from('servicos').delete().eq('id', itemToDelete.id);
      } catch (e) {}
    }
    toast({ title: 'Serviço removido com sucesso.' });
    onSuccess();
  };

  const handleSave = async () => {
    setSaving(true);
    saveServicesLocally(services);
    try {
      for (const srv of services) {
        await supabase.from('servicos').upsert({
          titulo: srv.titulo,
          detalhe: srv.detalhe,
          descricao: srv.descricao,
        });
      }
    } catch (e) {}
    setSaving(false);
    toast({ title: 'Todos os serviços foram salvos com sucesso!' });
    onSuccess();
  };

  const filtered = filterProf === 'Todos' 
    ? services 
    : services.filter(s => s.profissional === filterProf);

  return (
    <div className="bg-[#14100E] p-6 rounded-2xl border border-[#BB8D5B]/30 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-[#E0BC8D]">Gerenciamento de Serviços</h2>
          <p className="text-xs text-[#A99B90] mt-1">
            Edite nomes, descrições, preços e profissionais responsáveis.
            {isValuesActive ? (
              <span className="text-[#BB8D5B] font-semibold block mt-0.5">
                ● Modo Valores ATIVO: O campo "Valor / Detalhe" é exibido diretamente para os clientes.
              </span>
            ) : (
              <span className="text-[#A99B90] block mt-0.5">
                ● Modo "A consultar" ATIVO: Os cartões mostram "A consultar", mas você já pode cadastrar os valores aqui para o futuro.
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            onClick={handleAdd}
            className="bg-[#BB8D5B]/20 text-[#E0BC8D] border border-[#BB8D5B]/40 hover:bg-[#BB8D5B] hover:text-[#0B0908] font-mono text-xs uppercase"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Adicionar Serviço
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-[#BB8D5B] text-[#0B0908] hover:bg-[#E0BC8D] font-mono text-xs uppercase font-bold"
          >
            <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Salvando...' : 'Salvar Tudo'}
          </Button>
        </div>
      </div>

      {/* Filtro por Profissional */}
      <div className="flex gap-2 border-b border-[#BB8D5B]/20 pb-3">
        {(['Todos', 'Cassiano', 'Isabella'] as const).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setFilterProf(p)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all ${
              filterProf === p 
                ? 'bg-[#BB8D5B] text-[#0B0908] font-bold' 
                : 'text-[#A99B90] hover:text-[#E0BC8D] bg-[#0B0908]'
            }`}
          >
            {p === 'Todos' ? 'Todos os Serviços' : `${p}`}
          </button>
        ))}
      </div>

      {/* Lista de Serviços */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((srv, idx) => {
          const originalIndex = services.findIndex(s => s.id === srv.id);
          return (
            <div key={srv.id || idx} className="p-4 rounded-xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-3 relative group">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-[#BB8D5B] bg-[#BB8D5B]/10 px-2 py-0.5 rounded">
                  {srv.profissional || 'Cassiano'}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(originalIndex)}
                  className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 transition-colors"
                  title="Excluir Serviço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <Label className="text-[10px] font-mono uppercase text-[#A99B90]">Título do Serviço</Label>
                <Input 
                  value={srv.titulo} 
                  onChange={(e) => handleUpdate(originalIndex, 'titulo', e.target.value)}
                  className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 text-sm font-semibold" 
                />
              </div>

              <div>
                <Label className="text-[10px] font-mono uppercase text-[#A99B90]">
                  {isValuesActive ? 'Valor / Preço Exibido' : 'Valor (Armazenado para quando ativar)'}
                </Label>
                <Input 
                  value={srv.detalhe || 'A consultar'} 
                  onChange={(e) => handleUpdate(originalIndex, 'detalhe', e.target.value)}
                  className="bg-[#14100E] border-[#BB8D5B]/30 text-[#E0BC8D] mt-1 text-xs font-mono" 
                  placeholder="Ex: R$ 180,00 ou A consultar"
                />
              </div>

              <div>
                <Label className="text-[10px] font-mono uppercase text-[#A99B90]">Descrição</Label>
                <Textarea 
                  value={srv.descricao} 
                  onChange={(e) => handleUpdate(originalIndex, 'descricao', e.target.value)}
                  className="bg-[#14100E] border-[#BB8D5B]/30 text-[#C9BEB5] mt-1 text-xs min-h-[60px]" 
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ABA: TEXTOS & CONTATOS
function TextsAndContactsTab({ config, onSuccess }: { config: Record<string, string>; onSuccess: () => void }) {
  const { toast } = useToast();
  const [data, setData] = useState({
    cassianoWhatsapp: config.cassianoWhatsapp || '5565996611206',
    cassianoWhatsappLabel: config.cassianoWhatsappLabel || '(65) 9 9661-1206',
    cassianoInstagram: config.cassianoInstagram || '@cassianomonteiro_',
    cassianoInstagramUrl: config.cassianoInstagramUrl || 'https://instagram.com/cassianomonteiro_',

    isabellaWhatsapp: config.isabellaWhatsapp || '5565999225844',
    isabellaWhatsappLabel: config.isabellaWhatsappLabel || '(65) 9 9922-5844',
    isabellaInstagram: config.isabellaInstagram || '@isabellamorandinails',
    isabellaInstagramUrl: config.isabellaInstagramUrl || 'https://instagram.com/isabellamorandinails',

    heroTitle: config.heroTitle || 'Sua beleza merece uma experiência extraordinária.',
    aboutTitle: config.aboutTitle || 'Mais do que um espaço de beleza, um encontro de histórias, sonhos e dedicação.',
    aboutText1: config.aboutText1 || 'Toda grande história começa com um sonho. A nossa nasceu da paixão pela beleza, do desejo de transformar a autoestima das pessoas e da vontade de construir um espaço onde cada cliente se sentisse especial, acolhido e valorizado.',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setData({
      cassianoWhatsapp: config.cassianoWhatsapp || '5565996611206',
      cassianoWhatsappLabel: config.cassianoWhatsappLabel || '(65) 9 9661-1206',
      cassianoInstagram: config.cassianoInstagram || '@cassianomonteiro_',
      cassianoInstagramUrl: config.cassianoInstagramUrl || 'https://instagram.com/cassianomonteiro_',

      isabellaWhatsapp: config.isabellaWhatsapp || '5565999225844',
      isabellaWhatsappLabel: config.isabellaWhatsappLabel || '(65) 9 9922-5844',
      isabellaInstagram: config.isabellaInstagram || '@isabellamorandinails',
      isabellaInstagramUrl: config.isabellaInstagramUrl || 'https://instagram.com/isabellamorandinails',

      heroTitle: config.heroTitle || 'Sua beleza merece uma experiência extraordinária.',
      aboutTitle: config.aboutTitle || 'Mais do que um espaço de beleza, um encontro de histórias, sonhos e dedicação.',
      aboutText1: config.aboutText1 || 'Toda grande história começa com um sonho. A nossa nasceu da paixão pela beleza, do desejo de transformar a autoestima das pessoas e da vontade de construir um espaço onde cada cliente se sentisse especial, acolhido e valorizado.',
    });
  }, [config]);

  const handleSave = async () => {
    setSaving(true);
    saveSiteConfigLocally(data);
    try {
      for (const [id, valor] of Object.entries(data)) {
        await supabase.from('configuracoes').upsert({ id, valor });
      }
    } catch (e) {}
    setSaving(false);
    toast({ title: 'Textos e contatos salvos!' });
    onSuccess();
  };

  return (
    <div className="bg-[#14100E] p-6 rounded-2xl border border-[#BB8D5B]/30 space-y-6">
      <div>
        <h2 className="font-serif text-xl font-bold text-[#E0BC8D]">Textos & Contatos dos Profissionais</h2>
        <p className="text-xs text-[#A99B90] mt-1">
          Edite os números individuais de WhatsApp e links de Instagram para Cassiano e Isabella.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cassiano */}
        <div className="p-5 rounded-xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-3">
          <h3 className="font-serif font-bold text-[#F5F0E8] flex items-center gap-2">
            <Scissors className="w-4 h-4 text-[#BB8D5B]" /> Contatos de Cassiano (Cabelos)
          </h3>
          <div>
            <Label className="text-[10px] font-mono uppercase text-[#A99B90]">WhatsApp Número (somente dígitos)</Label>
            <Input 
              value={data.cassianoWhatsapp} 
              onChange={(e) => setData(prev => ({ ...prev, cassianoWhatsapp: e.target.value }))}
              className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 font-mono text-xs" 
            />
          </div>
          <div>
            <Label className="text-[10px] font-mono uppercase text-[#A99B90]">WhatsApp Rótulo Visível</Label>
            <Input 
              value={data.cassianoWhatsappLabel} 
              onChange={(e) => setData(prev => ({ ...prev, cassianoWhatsappLabel: e.target.value }))}
              className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 font-mono text-xs" 
            />
          </div>
          <div>
            <Label className="text-[10px] font-mono uppercase text-[#A99B90]">Instagram (@)</Label>
            <Input 
              value={data.cassianoInstagram} 
              onChange={(e) => setData(prev => ({ ...prev, cassianoInstagram: e.target.value }))}
              className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 font-mono text-xs" 
            />
          </div>
          <div>
            <Label className="text-[10px] font-mono uppercase text-[#A99B90]">Instagram URL</Label>
            <Input 
              value={data.cassianoInstagramUrl} 
              onChange={(e) => setData(prev => ({ ...prev, cassianoInstagramUrl: e.target.value }))}
              className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 font-mono text-xs" 
            />
          </div>
        </div>

        {/* Isabella */}
        <div className="p-5 rounded-xl border border-[#BB8D5B]/25 bg-[#0B0908] space-y-3">
          <h3 className="font-serif font-bold text-[#F5F0E8] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#BB8D5B]" /> Contatos de Isabella (Unhas)
          </h3>
          <div>
            <Label className="text-[10px] font-mono uppercase text-[#A99B90]">WhatsApp Número (somente dígitos)</Label>
            <Input 
              value={data.isabellaWhatsapp} 
              onChange={(e) => setData(prev => ({ ...prev, isabellaWhatsapp: e.target.value }))}
              className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 font-mono text-xs" 
            />
          </div>
          <div>
            <Label className="text-[10px] font-mono uppercase text-[#A99B90]">WhatsApp Rótulo Visível</Label>
            <Input 
              value={data.isabellaWhatsappLabel} 
              onChange={(e) => setData(prev => ({ ...prev, isabellaWhatsappLabel: e.target.value }))}
              className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 font-mono text-xs" 
            />
          </div>
          <div>
            <Label className="text-[10px] font-mono uppercase text-[#A99B90]">Instagram (@)</Label>
            <Input 
              value={data.isabellaInstagram} 
              onChange={(e) => setData(prev => ({ ...prev, isabellaInstagram: e.target.value }))}
              className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 font-mono text-xs" 
            />
          </div>
          <div>
            <Label className="text-[10px] font-mono uppercase text-[#A99B90]">Instagram URL</Label>
            <Input 
              value={data.isabellaInstagramUrl} 
              onChange={(e) => setData(prev => ({ ...prev, isabellaInstagramUrl: e.target.value }))}
              className="bg-[#14100E] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 font-mono text-xs" 
            />
          </div>
        </div>
      </div>

      {/* Textos Principais */}
      <div className="space-y-4 pt-4 border-t border-[#BB8D5B]/20">
        <div>
          <Label className="text-xs font-mono uppercase text-[#A99B90]">Título Principal da Hero</Label>
          <Input 
            value={data.heroTitle} 
            onChange={(e) => setData(prev => ({ ...prev, heroTitle: e.target.value }))}
            className="bg-[#0B0908] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1" 
          />
        </div>
        <div>
          <Label className="text-xs font-mono uppercase text-[#A99B90]">Título da Seção Sobre</Label>
          <Input 
            value={data.aboutTitle} 
            onChange={(e) => setData(prev => ({ ...prev, aboutTitle: e.target.value }))}
            className="bg-[#0B0908] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1" 
          />
        </div>
        <div>
          <Label className="text-xs font-mono uppercase text-[#A99B90]">Parágrafo Sobre Nós</Label>
          <Textarea 
            value={data.aboutText1} 
            onChange={(e) => setData(prev => ({ ...prev, aboutText1: e.target.value }))}
            className="bg-[#0B0908] border-[#BB8D5B]/30 text-[#F5F0E8] mt-1 min-h-[90px]" 
          />
        </div>
      </div>

      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="bg-[#BB8D5B] text-[#0B0908] hover:bg-[#E0BC8D] font-mono text-xs uppercase font-bold py-5"
      >
        <Save className="w-4 h-4 mr-2" /> {saving ? 'Salvando...' : 'Salvar Textos e Contatos'}
      </Button>
    </div>
  );
}
