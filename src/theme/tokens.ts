export const cores = {
  fundo: '#FBF7EF',
  fundo2: '#F5EEDF',
  /** fundo das ilustrações (igual ao papel delas) */
  ilustracao: '#FCF8EF',
  superficie: '#FFFFFF',
  texto: '#1D2B27',
  texto2: '#5E6B66',
  texto3: '#9AA59F',
  linha: '#EFE8DA',
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
  neutroFundo: '#F5EEDF',
  terra: '#E07A5F',
  sol: '#F2B84B',
  solFundo: '#FDF3DC',
  solTexto: '#9A6A0B',
} as const;

export const raio = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, pill: 999 } as const;

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const sombra = {
  card: '0px 12px 32px rgba(60, 45, 20, 0.06), 0px 2px 6px rgba(60, 45, 20, 0.04)',
  elevada: '0px 18px 40px rgba(40, 40, 20, 0.10), 0px 4px 12px rgba(40, 40, 20, 0.04)',
  botao: '0px 12px 24px rgba(31, 122, 107, 0.28)',
} as const;

export const fonte = {
  regular: 'Inter_400Regular',
  media: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  negrito: 'Inter_700Bold',
  extra: 'Inter_800ExtraBold',
} as const;
