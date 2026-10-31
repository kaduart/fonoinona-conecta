export const cores = {
  fundo: '#F8F9FA',
  superficie: '#FFFFFF',
  texto: '#0B1324',
  texto2: '#4B5567',
  texto3: '#98A2B3',
  linha: '#EEF1F5',
  marca: '#1F7A6B',
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
  neutroFundo: '#F2F4F7',
} as const;

export const raio = { sm: 12, md: 16, lg: 20, xl: 24, xxl: 28, pill: 999 } as const;

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const sombra = {
  card: '0px 12px 32px rgba(0, 0, 0, 0.04), 0px 2px 6px rgba(0, 0, 0, 0.03)',
  elevada: '0px 20px 48px rgba(11, 19, 36, 0.08), 0px 4px 12px rgba(11, 19, 36, 0.04)',
  botao: '0px 12px 24px rgba(31, 122, 107, 0.28)',
} as const;

export const fonte = {
  regular: 'Inter_400Regular',
  media: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  negrito: 'Inter_700Bold',
  extra: 'Inter_800ExtraBold',
} as const;
