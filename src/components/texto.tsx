import { Text, type TextProps, type TextStyle } from 'react-native';

import { cores, fonte } from '@/theme/tokens';

type Variante = 'titulo' | 'subtitulo' | 'corpo' | 'legenda' | 'rotulo' | 'sobretitulo';

const estilos: Record<Variante, TextStyle> = {
  titulo: { fontFamily: fonte.extra, fontSize: 28, lineHeight: 33, letterSpacing: -0.6, color: cores.texto },
  subtitulo: { fontFamily: fonte.extra, fontSize: 22, lineHeight: 28, letterSpacing: -0.4, color: cores.texto },
  corpo: { fontFamily: fonte.regular, fontSize: 15, lineHeight: 22, color: cores.texto2 },
  legenda: { fontFamily: fonte.regular, fontSize: 12.5, lineHeight: 18, color: cores.texto3 },
  rotulo: { fontFamily: fonte.semi, fontSize: 15, lineHeight: 20, color: cores.texto },
  sobretitulo: { fontFamily: fonte.negrito, fontSize: 12, letterSpacing: 1, color: cores.marca },
};

export function Texto({ variante = 'corpo', style, ...props }: TextProps & { variante?: Variante }) {
  return <Text {...props} style={[estilos[variante], style]} />;
}
