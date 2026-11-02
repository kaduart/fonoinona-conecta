import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Lottie } from '@/components/lottie';
import { Texto } from '@/components/texto';
import { cores } from '@/theme/tokens';

import { CENAS, type NomeCena } from './cenas';

type Props = {
  cena: NomeCena;
  /** controla largura/altura pela tela que usa; a altura segue a proporção da arte */
  style?: StyleProp<ViewStyle>;
  /** títulos ficam fora do Lottie, em texto nativo (Figtree) */
  titulo?: string;
  legenda?: string;
  /** fundo off-white atrás da arte (padrão) ou transparente */
  fundo?: boolean;
};

/**
 * Ilustração flat 2D com microanimação de fundo.
 * O traço dos personagens é um PNG parado; por cima, a camada Lottie transparente mexe só
 * folhas, balões, brilhos e a onda de som, em loop de 3 s. Com "reduzir movimento", fica parado.
 */
export function CenaAnimada({ cena, style, titulo, legenda, fundo = true }: Props) {
  const c = CENAS[cena];
  return (
    <View style={style}>
      <Animated.View
        entering={FadeIn.duration(500)}
        style={[s.palco, { aspectRatio: c.proporcao }, fundo && { backgroundColor: cores.ilustracao }]}
        accessible
        accessibilityRole="image"
        accessibilityLabel={c.rotulo}
      >
        <Image source={c.imagem} style={s.arte} resizeMode="contain" accessibilityIgnoresInvertColors />
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Lottie dados={c.animacao} />
        </View>
      </Animated.View>
      {titulo || legenda ? (
        <View style={s.textos}>
          {titulo ? <Texto variante="rotulo">{titulo}</Texto> : null}
          {legenda ? <Texto variante="legenda">{legenda}</Texto> : null}
        </View>
      ) : null}
    </View>
  );
}

export const CenaLeitura = (p: Omit<Props, 'cena'>) => <CenaAnimada cena="leitura" {...p} />;
export const CenaBrincar = (p: Omit<Props, 'cena'>) => <CenaAnimada cena="brincar" {...p} />;
export const CenaEspelho = (p: Omit<Props, 'cena'>) => <CenaAnimada cena="espelho" {...p} />;

const s = StyleSheet.create({
  palco: { width: '100%', overflow: 'hidden' },
  arte: { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' },
  textos: { gap: 2, marginTop: 12 },
});
