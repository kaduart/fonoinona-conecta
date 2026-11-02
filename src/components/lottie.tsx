import LottieView from 'lottie-react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { ARQUIVOS_LOTTIE as ARQUIVOS, type NomeLottie } from '@/components/lottieArquivos';

/**
 * Lottie no celular (lottie-react-native, nativo). No navegador entra lottie.web.tsx (lottie-web light, ~45 KB gzip).
 * Com "reduzir movimento" ligado, mostra o quadro final parado.
 */
export type PropsLottie = {
  /** animação registrada em lottieArquivos.ts */
  nome?: NomeLottie;
  /** ou a animação montada em código (ex.: as cenas de src/components/animacoes) */
  dados?: object;
  /** lado do quadrado; sem ele, ocupa 100% do pai */
  tamanho?: number;
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Lottie({ nome, dados, tamanho, loop = true, style }: PropsLottie) {
  const reduzir = useReducedMotion();
  const fonte = dados ?? (nome ? ARQUIVOS[nome] : null);
  if (!fonte) return null;
  return (
    <LottieView
      source={fonte}
      autoPlay={!reduzir}
      loop={loop && !reduzir}
      progress={reduzir ? 1 : undefined}
      style={[tamanho ? { width: tamanho, height: tamanho } : { width: '100%', height: '100%' }, style]}
      resizeMode="contain"
    />
  );
}
