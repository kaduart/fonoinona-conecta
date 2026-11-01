import lottie from 'lottie-web/build/player/lottie_light';
import { useEffect, useRef } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ARQUIVOS_LOTTIE, type NomeLottie } from '@/components/lottieArquivos';

/**
 * Lottie no navegador: lottie-web na versão light (só SVG, sem expressões), leve e sem baixar nada de CDN.
 * Mesmo contrato do componente do celular.
 */
export function Lottie({ nome, tamanho, loop = true, style }: { nome: NomeLottie; tamanho: number; loop?: boolean; style?: StyleProp<ViewStyle> }) {
  const reduzir = useReducedMotion();
  const caixa = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!caixa.current) return;
    const anim = lottie.loadAnimation({
      container: caixa.current,
      renderer: 'svg',
      loop: loop && !reduzir,
      autoplay: !reduzir,
      // cópia: o lottie-web altera o objeto que recebe
      animationData: JSON.parse(JSON.stringify(ARQUIVOS_LOTTIE[nome])),
    });
    if (reduzir) anim.addEventListener('DOMLoaded', () => anim.goToAndStop(anim.totalFrames - 1, true));
    return () => anim.destroy();
  }, [nome, loop, reduzir]);

  return (
    <View style={[{ width: tamanho, height: tamanho }, style]} pointerEvents="none">
      <div ref={caixa} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
