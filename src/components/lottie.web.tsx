import lottie from 'lottie-web/build/player/lottie_light';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ARQUIVOS_LOTTIE } from '@/components/lottieArquivos';
import type { PropsLottie } from '@/components/lottie';

/**
 * Lottie no navegador: lottie-web na versão light (só SVG, sem expressões), leve e sem baixar nada de CDN.
 * Mesmo contrato do componente do celular.
 */
export function Lottie({ nome, dados, tamanho, loop = true, style }: PropsLottie) {
  const reduzir = useReducedMotion();
  const caixa = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fonte = dados ?? (nome ? ARQUIVOS_LOTTIE[nome] : null);
    if (!caixa.current || !fonte) return;
    const anim = lottie.loadAnimation({
      container: caixa.current,
      renderer: 'svg',
      loop: loop && !reduzir,
      autoplay: !reduzir,
      // cópia: o lottie-web altera o objeto que recebe
      animationData: JSON.parse(JSON.stringify(fonte)),
    });
    if (reduzir) anim.addEventListener('DOMLoaded', () => anim.goToAndStop(anim.totalFrames - 1, true));
    return () => anim.destroy();
  }, [nome, dados, loop, reduzir]);

  return (
    <View style={[tamanho ? { width: tamanho, height: tamanho } : { width: '100%', height: '100%' }, style]} pointerEvents="none">
      <div ref={caixa} style={{ width: '100%', height: '100%' }} />
    </View>
  );
}
