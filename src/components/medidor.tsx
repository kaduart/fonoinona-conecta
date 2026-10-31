import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

import type { NivelResultado } from '@/domain/triagem';
import { cores } from '@/theme/tokens';

const POSICAO: Record<NivelResultado, number> = { avaliar: 0.15, observar: 0.5, esperado: 0.85 };
const COR: Record<NivelResultado, string> = { avaliar: cores.avaliar, observar: cores.observar, esperado: cores.esperado };

/** Arco fino com gradiente contínuo (avaliar → observar → esperado) e marcador com brilho. */
export function Medidor({ nivel }: { nivel: NivelResultado }) {
  const r = 120;
  const cx = 150;
  const cy = 150;
  const ang = Math.PI * (1 - POSICAO[nivel]);
  const x = cx + r * Math.cos(ang);
  const y = cy - r * Math.sin(ang);
  return (
    <View accessible accessibilityLabel={`Indicador na faixa ${nivel}`} style={{ alignItems: 'center' }}>
      <Svg width={300} height={170} viewBox="0 0 300 170">
        <Defs>
          <LinearGradient id="arco" x1="30" y1="0" x2="270" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={cores.avaliar} />
            <Stop offset="0.45" stopColor={cores.observar} />
            <Stop offset="1" stopColor={cores.esperado} />
          </LinearGradient>
          <RadialGradient id="brilho">
            <Stop offset="0" stopColor={COR[nivel]} stopOpacity={0.45} />
            <Stop offset="1" stopColor={COR[nivel]} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path d="M30 150 A120 120 0 0 1 270 150" stroke={cores.linha} strokeWidth={10} strokeLinecap="round" fill="none" />
        <Path d="M30 150 A120 120 0 0 1 270 150" stroke="url(#arco)" strokeWidth={6} strokeLinecap="round" fill="none" />
        <Circle cx={x} cy={y} r={26} fill="url(#brilho)" />
        <Circle cx={x} cy={y} r={11} fill="#fff" stroke={COR[nivel]} strokeWidth={4} />
        <Circle cx={x} cy={y} r={3.5} fill={COR[nivel]} />
      </Svg>
    </View>
  );
}
