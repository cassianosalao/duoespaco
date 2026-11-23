import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export const DEFAULT_CONFIG: Record<string, string> = {
  // Configurações de exibição
  exibirValores: 'false', // 'false' = A consultar, 'true' = Mostrar valores
  exibirLocalizacao: 'true',
  exibirHorarios: 'true',

  // Contatos Cassiano (Cabelo)
  cassianoWhatsapp: '5565996611206',
  cassianoWhatsappLabel: '(65) 9 9661-1206',
  cassianoInstagram: '@cassianomonteiro_',
  cassianoInstagramUrl: 'https://instagram.com/cassianomonteiro_',

  // Contatos Isabella (Unhas)
  isabellaWhatsapp: '5565999225844',
  isabellaWhatsappLabel: '(65) 9 9922-5844',
  isabellaInstagram: '@isabellamorandinails',
  isabellaInstagramUrl: 'https://instagram.com/isabellamorandinails',

  // Localização e Horários
  address: 'Lucas do Rio Verde - MT',
  mapsUrl: 'https://maps.app.goo.gl/MjawqW4HePjDFeKVA',
  hours: 'Terça a sábado · 09:00 - 18:00',

  // Vídeo & Mídias
  videoUrl: '/videos/duo-espaco.mp4',
  posterImage: '', // Vazio por padrão para exibir o próprio 1º frame do vídeo (sem imagem fake)
  logoImage: '/images/duo-espaco-logo.jpg',
  heroImage: '/images/cassiano-e-isabella.jpg',
  megaHairImage: '/images/mega-hair.jpg',
  unhasImage: '/images/unhas-nail-spa.jpg',

  // Textos
  heroTitle: 'Sua beleza merece uma experiência extraordinária.',
  heroSubtitle: 'A união do cuidado e transformação capilar por Cassiano com a alta precisão e elegância em unhas de Isabella Morandi.',
  aboutTitle: 'Mais do que um espaço de beleza, um encontro de histórias, sonhos e dedicação.',
  aboutText1: 'Toda grande história começa com um sonho. A nossa nasceu da paixão pela beleza, do desejo de transformar a autoestima das pessoas e da vontade de construir um espaço onde cada cliente se sentisse especial, acolhido e valorizado.',
  aboutText2: 'O Duo Espaço representa a união de duas trajetórias, duas personalidades e duas paixões que se complementam.',
};

export function useSiteConfig() {
  return useQuery({
    queryKey: ['configuracoes'],
    queryFn: async () => {
      // 1. Tentar carregar do Supabase (prioridade máxima para sincronizar entre todos os aparelhos)
      let remoteData: Record<string, string> = {};
      try {
        const { data, error } = await supabase.from('configuracoes').select('*');
        if (!error && data && data.length > 0) {
          remoteData = data.reduce((acc, item) => ({ ...acc, [item.id]: item.valor }), {} as Record<string, string>);
        }
      } catch (e) {
        console.warn('Supabase offline ou sem tabelas, usando fallback local', e);
      }

      // 2. Tentar carregar do localStorage como fallback
      let localData: Record<string, string> = {};
      try {
        const stored = localStorage.getItem('duo_configuracoes');
        if (stored) {
          localData = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Erro ao ler localStorage', e);
      }

      // Sincroniza o cache local com os dados frescos da nuvem
      if (Object.keys(remoteData).length > 0) {
        try {
          localStorage.setItem('duo_configuracoes', JSON.stringify({ ...localData, ...remoteData }));
        } catch (e) {}
      }

      return {
        ...DEFAULT_CONFIG,
        ...localData,
        ...remoteData,
      };
    },
    staleTime: 1000 * 5, // 5 segundos para refletir rápido entre dispositivos
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function saveSiteConfigLocally(updates: Record<string, string>) {
  try {
    const stored = localStorage.getItem('duo_configuracoes');
    const curr = stored ? JSON.parse(stored) : {};
    const safeUpdates: Record<string, string> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (typeof v === 'string' && v.startsWith('data:') && v.length > 50000) {
        continue;
      }
      safeUpdates[k] = v;
    }
    const merged = { ...curr, ...safeUpdates };
    localStorage.setItem('duo_configuracoes', JSON.stringify(merged));
  } catch (e) {
    console.error('Erro ao salvar no localStorage', e);
  }
}

export function useServices() {
  return useQuery({
    queryKey: ['servicos'],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem('duo_servicos');
        let localServices = stored ? JSON.parse(stored) : null;

        const { data, error } = await supabase.from('servicos').select('*').order('ordem');
        if (!error && data && data.length > 0) {
          return data;
        }
        if (localServices && localServices.length > 0) {
          return localServices;
        }
      } catch (e) {
        console.warn('Erro ao buscar serviços no Supabase', e);
      }
      return null;
    },
    staleTime: 1000 * 30,
  });
}

export function saveServicesLocally(services: any[]) {
  try {
    localStorage.setItem('duo_servicos', JSON.stringify(services));
  } catch (e) {
    console.error('Erro ao salvar serviços no localStorage', e);
  }
}

export function useGallery() {
  return useQuery({
    queryKey: ['galeria'],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem('duo_galeria');
        const localGallery = stored ? JSON.parse(stored) : null;

        const { data, error } = await supabase.from('galeria').select('*').order('ordem');
        if (!error && data && data.length > 0) {
          try {
            localStorage.setItem('duo_galeria', JSON.stringify(data));
          } catch (e) {}
          return data;
        }

        // Tentar fallback em configuracoes (galeria_json)
        try {
          const { data: confData } = await supabase.from('configuracoes').select('valor').eq('id', 'galeria_json').maybeSingle();
          if (confData?.valor) {
            const parsed = JSON.parse(confData.valor);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem('duo_galeria', JSON.stringify(parsed));
              return parsed;
            }
          }
        } catch (e) {}

        if (localGallery && localGallery.length > 0) {
          return localGallery;
        }
      } catch (e) {
        console.warn('Erro ao buscar galeria no Supabase', e);
      }
      return null;
    },
    staleTime: 1000 * 5,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function saveGalleryLocally(gallery: any[]) {
  try {
    localStorage.setItem('duo_galeria', JSON.stringify(gallery));
  } catch (e) {
    console.error('Erro ao salvar galeria no localStorage', e);
  }
}

export function useCombos() {
  return useQuery({
    queryKey: ['combos_promo'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from('combos_promo').select('*').order('ordem');
        if (!error && data) return data;
      } catch (e) {
        // fallback
      }
      return [];
    }
  });
}
