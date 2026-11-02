import LottieView from 'lottie-react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ARQUIVOS_LOTTIE as ARQUIVOS, type NomeLottie } from '@/components/lottieArquivos';

/**
 * Lottie no celular (lottie-react-native, nativo). No navegador entra lottie.web.tsx (lottie-web light, ~45 KB gzip).
 * Com "reduzir movimento" ligado, mostra o quadro final parado.
 */
export function Lottie({ nome, tamanho, loop = true, style }: { nome: NomeLottie; tamanho: number; loop?: boolean; style?: StyleProp<ViewStyle> }) {
  const reduzir = useReducedMotion();
  return (
    <LottieView
      source={ARQUIVOS[nome]}
      autoPlay={!reduzir}
      loop={loop && !reduzir}
      progress={reduzir ? 1 : undefined}
      style={[{ width: tamanho, height: tamanho }, style]}
      resizeMode="contain"
    />
  );
}
