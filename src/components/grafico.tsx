import { useEffect } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Path, type PathProps } from 'react-native-svg';

const PathAnimado = Animated.createAnimatedComponent(Path);
const SUAVE = Easing.out(Easing.cubic);

/** Barra que "enche" até o valor (0–100). Sem lib nova: Reanimated; respeita "reduzir movimento". */
export function Preenchimento({ pct, cor, atraso = 0, style }: { pct: number; cor: string; atraso?: number; style?: StyleProp<ViewStyle> }) {
  const reduzir = useReducedMotion();
  const v = useSharedValue(reduzir ? pct : 0);
  useEffect(() => {
    v.value = reduzir ? pct : withDelay(atraso, withTiming(pct, { duration: 750, easing: SUAVE }));
  }, [pct, atraso, reduzir, v]);
  const estilo = useAnimatedStyle(() => ({ width: `${v.value}%` }));
  return <Animated.View style={[{ height: '100%', borderRadius: 5, backgroundColor: cor }, style, estilo]} />;
}

/** Comprimento de uma linha poligonal (para desenhar o traço aos poucos). */
export function comprimento(pontos: { x: number; y: number }[]): number {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) total += Math.hypot(pontos[i].x - pontos[i - 1].x, pontos[i].y - pontos[i - 1].y);
  return total;
}

/** Linha de SVG que se desenha da esquerda para a direita. */
export function LinhaDesenhada({ d, tamanho, duracao = 900, atraso = 150, ...props }: PathProps & { d: string; tamanho: number; duracao?: number; atraso?: number }) {
  const reduzir = useReducedMotion();
  const p = useSharedValue(reduzir ? 1 : 0);
  useEffect(() => {
    p.value = reduzir ? 1 : withDelay(atraso, withTiming(1, { duration: duracao, easing: SUAVE }));
  }, [d, reduzir, atraso, duracao, p]);
  const animadas = useAnimatedProps(() => ({ strokeDashoffset: tamanho * (1 - p.value) }));
  // +1 evita um pontinho no fim do traço em alguns navegadores
  return <PathAnimado d={d} strokeDasharray={[tamanho + 1, tamanho + 1]} animatedProps={animadas} {...props} />;
}
