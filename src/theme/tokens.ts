export const cores = {
  fundo: '#F8FBFB',
  /** trilhos de barras e casas vazias */
  fundo2: '#EDF3F2',
  /** fundo das ilustrações 3D (igual ao delas) */
  ilustracao: '#F6F9FA',
  superficie: '#FFFFFF',
  /** grafite clínico: títulos e textos fortes */
  texto: '#1F2C2D',
  texto2: '#5B6B6C',
  texto3: '#97A5A6',
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
  observarTexto: '#B86E00',
  avaliar: '#FF7A6B',
  avaliarFundo: '#FFECE8',
  avaliarTexto: '#C2412D',
  neutroFundo: '#EDF3F2',
  terra: '#E07A5F',
  sol: '#F2B84B',
  solFundo: '#FDF3DC',
  solTexto: '#9A6A0B',
} as const;

export const raio = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, pill: 999 } as const;

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const sombra = {
  card: '0px 12px 30px rgba(44, 62, 63, 0.04)',
  elevada: '0px 18px 40px rgba(44, 62, 63, 0.08)',
  botao: '0px 12px 24px rgba(31, 122, 107, 0.28)',
} as const;

export const fonte = {
  regular: 'Inter_400Regular',
  media: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  negrito: 'Inter_700Bold',
  extra: 'Inter_800ExtraBold',
} as const;
