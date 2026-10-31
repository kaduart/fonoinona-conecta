import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { Texto } from '@/components/texto';
import type { NivelResultado } from '@/domain/triagem';
import { cores, fonte } from '@/theme/tokens';

const POSICAO: Record<NivelResultado, number> = { avaliar: 0.18, observar: 0.42, esperado: 0.86 };
const COR: Record<NivelResultado, string> = { avaliar: cores.avaliar, observar: cores.observar, esperado: cores.esperado };

const L = 290;
const A = 160;
const R = 125;
const CX = L / 2;
const CY = 145;
const ARCO = `M${CX - R} ${CY} A${R} ${R} 0 0 1 ${CX + R} ${CY}`;

/**
 * Arco ultrafino com gradiente contínuo e marcador que pulsa no ponto do resultado.
 * O centro mostra quantas habilidades estão no esperado ("4 de 6").
 */
export function Medidor({ nivel, noEsperado, total, escuro = false }: { nivel: NivelResultado; noEsperado: number; total: number; escuro?: boolean }) {
  const ang = Math.PI * (1 - POSICAO[nivel]);
  const x = CX + R * Math.cos(ang);
  const y = CY - R * Math.sin(ang);
  const reduzir = useReducedMotion();
  const pulso = useSharedValue(0);

  useEffect(() => {
    if (reduzir) return;
    pulso.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulso, reduzir]);

  const halo = useAnimatedStyle(() => ({
    opacity: 0.45 * (1 - pulso.value),
    transform: [{ scale: 0.6 + pulso.value * 1.1 }],
  }));

  return (
    <View
      accessible
      accessibilityLabel={`${noEsperado} de ${total} habilidades dentro do esperado`}
      style={{ width: L, height: A, alignSelf: 'center' }}
    >
      <Svg width={L} height={A} viewBox={`0 -8 ${L} ${A}`} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="arco" x1={CX - R} y1="0" x2={CX + R} y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FF8A7A" />
            <Stop offset="0.45" stopColor="#F2B84B" />
            <Stop offset="0.75" stopColor="#7FD3B0" />
            <Stop offset="1" stopColor="#18B88F" />
          </LinearGradient>
        </Defs>
        <Path d={ARCO} stroke={escuro ? 'rgba(255,255,255,0.10)' : '#EDF3F2'} strokeWidth={escuro ? 3 : 5} strokeLinecap="round" fill="none" />
        <Path d={ARCO} stroke="url(#arco)" strokeWidth={escuro ? 16 : 14} strokeLinecap="round" fill="none" opacity={escuro ? 0.16 : 0.1} />
        <Path d={ARCO} stroke="url(#arco)" strokeWidth={escuro ? 3.5 : 5} strokeLinecap="round" fill="none" />
        <Circle cx={x} cy={y} r={17} fill={COR[nivel]} opacity={0.2} />
      </Svg>
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: x - 24, top: y + 8 - 24, width: 48, height: 48, borderRadius: 24, backgroundColor: COR[nivel] }, halo]}
      />
      <View
        style={{
          position: 'absolute',
          left: x - 10,
          top: y + 8 - 10,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: '#fff',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: escuro ? `0px 0px 14px ${COR[nivel]}` : '0px 3px 6px rgba(154, 106, 11, 0.35)',
        }}
      >
        <View style={{ width: 11, height: 11, borderRadius: 6, backgroundColor: COR[nivel] }} />
      </View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 78, alignItems: 'center' }}>
        <Texto style={{ fontFamily: fonte.extra, fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: escuro ? '#fff' : cores.texto }}>
          {noEsperado} de {total}
        </Texto>
        <Texto variante="legenda" style={escuro ? { color: 'rgba(255,255,255,0.62)' } : undefined}>habilidades no esperado</Texto>
      </View>
    </View>
  );
}
