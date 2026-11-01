import { Appearance } from 'react-native';

/**
 * Tema claro/escuro: segue o aparelho e é lido quando o app abre (os estilos são montados uma vez).
 * No navegador, trocar o tema do sistema recarrega a página (ver _layout).
 */
export const escuro = Appearance.getColorScheme() === 'dark';
/** Escolhe o valor do tema atual: tema(claro, escuro). */
export const tema = <T,>(claro: T, noEscuro: T): T => (escuro ? noEscuro : claro);

const claro = {
  fundo: '#F8FBFB',
  /** trilhos de barras e casas vazias */
  fundo2: '#EDF3F2',
  /** fundo das ilustrações 3D (igual ao delas) */
  ilustracao: '#F6F9FA',
  superficie: '#FFFFFF',
  /** grafite clínico: títulos e textos fortes */
  texto: '#1F2C2D',
  texto2: '#4A5B5C',
  texto3: '#667677',
  linha: '#E9EFEE',
  marca: '#1F7A6B',
  marcaEscura: '#14564B',
  marcaMedia: '#2E9C87',
  marcaClara: '#2BB59A',
  marcaSuave: '#E6F4F0',
  esperado: '#2BB59A',
  esperadoFundo: '#E3F4EF',
  esperadoTexto: '#1F7A6B',
  observar: '#FFC24B',
  observarFundo: '#FFF4E3',
  observarTexto: '#96590A',
  avaliar: '#FF7A6B',
  avaliarFundo: '#FFECE8',
  avaliarTexto: '#C2412D',
  neutroFundo: '#EDF3F2',
  terra: '#E07A5F',
  /** terra para texto (contraste AA sobre branco) */
  terraTexto: '#B5513A',
  sol: '#F2B84B',
  solFundo: '#FDF3DC',
  solTexto: '#8A5E08',
};

type Paleta = Record<keyof typeof claro, string>;

/** Escuro: grafite esverdeado (não preto puro), mesma marca, textos com contraste AA. */
const noEscuro: Paleta = {
  fundo: '#0E1516',
  fundo2: '#1E2A2B',
  // as ilustrações 3D têm fundo claro embutido: o quadro delas continua claro
  ilustracao: '#F6F9FA',
  superficie: '#162021',
  texto: '#E9F1F0',
  texto2: '#B3C2C1',
  texto3: '#8B9D9C',
  linha: '#243132',
  marca: '#2A9E88',
  marcaEscura: '#7FD3C1',
  marcaMedia: '#2E9C87',
  marcaClara: '#2BB59A',
  marcaSuave: '#17332E',
  esperado: '#2BB59A',
  esperadoFundo: '#163029',
  esperadoTexto: '#5FD0B5',
  observar: '#FFC24B',
  observarFundo: '#33280F',
  observarTexto: '#F2C46B',
  avaliar: '#FF7A6B',
  avaliarFundo: '#3A1E1A',
  avaliarTexto: '#FF9A8C',
  neutroFundo: '#1E2A2B',
  terra: '#E07A5F',
  terraTexto: '#F09A82',
  sol: '#F2B84B',
  solFundo: '#33290F',
  solTexto: '#F2C46B',
};

export const cores: Paleta = escuro ? noEscuro : claro;

/** Cores fixas que não mudam com o tema (fundos de botão com texto branco, etc.). */
export const fixas = { grafite: '#1F2C2D', marcaProfunda: '#14564B', perigo: '#C2412D' } as const;

export const raio = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, pill: 999 } as const;

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const sombra = escuro
  ? { card: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 10px 28px rgba(0, 0, 0, 0.28)', elevada: '0px 18px 40px rgba(0, 0, 0, 0.45)', botao: '0px 12px 24px rgba(0, 0, 0, 0.4)' }
  : {
      card: '0px 1px 2px rgba(44, 62, 63, 0.04), 0px 10px 28px rgba(44, 62, 63, 0.06)',
      elevada: '0px 18px 40px rgba(44, 62, 63, 0.08)',
      botao: '0px 12px 24px rgba(31, 122, 107, 0.28)',
    };

/** Contorno fino dos cards e superfícies. */
export const contorno = escuro ? 'rgba(255, 255, 255, 0.06)' : 'rgba(31, 44, 45, 0.05)';
/** Vidro: botões flutuantes e pílulas sobre o fundo. */
export const vidro = (alfa: number) => (escuro ? `rgba(22, 32, 33, ${Math.min(0.95, alfa + 0.05)})` : `rgba(255, 255, 255, ${alfa})`);

export const fonte = {
  regular: 'Figtree_400Regular',
  media: 'Figtree_500Medium',
  semi: 'Figtree_600SemiBold',
  negrito: 'Figtree_700Bold',
  extra: 'Figtree_800ExtraBold',
} as const;

/** Resposta ao toque igual em todo o app: leve afundada, sem sumir. */
export const toque = { opacity: 0.88, transform: [{ scale: 0.98 }] } as const;
