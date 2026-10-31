import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import type { Medalha as TipoMedalha } from '@/domain/missoes';

type Tom = TipoMedalha['tom'];

/** Paleta de cada metal: claro, médio, escuro e a cor da fita. */
const PALETA: Record<Tom | 'trancada', { claro: string; medio: string; escuro: string; fita: string; fita2: string }> = {
  bronze: { claro: '#F6C9A0', medio: '#D98E5A', escuro: '#9C5A2E', fita: '#E07A5F', fita2: '#B85A42' },
  prata: { claro: '#FFFFFF', medio: '#C9D3D6', escuro: '#7E8B90', fita: '#5B9BD5', fita2: '#3F79AE' },
  ouro: { claro: '#FFF1B8', medio: '#F2B84B', escuro: '#B07A12', fita: '#1F7A6B', fita2: '#155A4F' },
  esmeralda: { claro: '#C9F2E4', medio: '#3FB58F', escuro: '#1C6E57', fita: '#F2B84B', fita2: '#C98A12' },
  diamante: { claro: '#FFFFFF', medio: '#A8E1F2', escuro: '#4B9BB8', fita: '#9B7BD8', fita2: '#6F52AE' },
  trancada: { claro: '#F1F1EE', medio: '#DADBD6', escuro: '#B4B6B0', fita: '#D3D4CF', fita2: '#BDBEB8' },
};

const ESTRELA = 'M50 30 L55.9 42 L69 43.8 L59.5 53 L61.8 66 L50 59.8 L38.2 66 L40.5 53 L31 43.8 L44.1 42 Z';

/**
 * Medalha de fase no estilo 3D da marca: disco metálico com brilho, aro,
 * estrela em relevo e fita. Trancada fica cinza com cadeado.
 */
export function Medalha({ tom, tamanho = 64, trancada = false }: { tom: Tom; tamanho?: number; trancada?: boolean }) {
  const p = PALETA[trancada ? 'trancada' : tom];
  const id = `${trancada ? 'tr' : tom}`;
  return (
    <Svg width={tamanho} height={tamanho * 1.18} viewBox="0 0 100 118">
      <Defs>
        <RadialGradient id={`disco-${id}`} cx="38%" cy="32%" r="75%">
          <Stop offset="0" stopColor={p.claro} />
          <Stop offset="0.55" stopColor={p.medio} />
          <Stop offset="1" stopColor={p.escuro} />
        </RadialGradient>
        <LinearGradient id={`aro-${id}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={p.claro} />
          <Stop offset="1" stopColor={p.escuro} />
        </LinearGradient>
      </Defs>

      {/* fita */}
      <Path d="M30 70 L18 112 L32 104 L40 116 L50 80 Z" fill={p.fita2} />
      <Path d="M70 70 L82 112 L68 104 L60 116 L50 80 Z" fill={p.fita} />

      {/* sombra, aro e disco */}
      <Circle cx="50" cy="51" r="38" fill="rgba(0,0,0,0.12)" />
      <Circle cx="50" cy="48" r="38" fill={`url(#aro-${id})`} />
      <Circle cx="50" cy="48" r="31" fill={`url(#disco-${id})`} />
      <Circle cx="50" cy="48" r="31" fill="none" stroke={p.escuro} strokeOpacity={0.25} strokeWidth={1.5} />

      {trancada ? (
        <G>
          <Path d="M42 46 v-5 a8 8 0 0 1 16 0 v5" fill="none" stroke={p.escuro} strokeWidth={4} strokeLinecap="round" />
          <Path d="M38 46 h24 a2 2 0 0 1 2 2 v12 a2 2 0 0 1 -2 2 h-24 a2 2 0 0 1 -2 -2 v-12 a2 2 0 0 1 2 -2 z" fill={p.escuro} />
          <Circle cx="50" cy="53.5" r="2.6" fill={p.claro} />
        </G>
      ) : (
        <G>
          <Path d={ESTRELA} fill={p.escuro} opacity={0.35} transform="translate(0 2.5)" />
          <Path d={ESTRELA} fill={p.claro} stroke={p.escuro} strokeOpacity={0.35} strokeWidth={1} />
        </G>
      )}

      {/* brilho */}
      <Path d="M27 36 A26 26 0 0 1 48 20" stroke="#fff" strokeOpacity={trancada ? 0.5 : 0.75} strokeWidth={4} strokeLinecap="round" fill="none" />
    </Svg>
  );
}
