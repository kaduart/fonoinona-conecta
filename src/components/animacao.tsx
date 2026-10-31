import { useEffect, useState } from 'react';
import { Image, type ImageSourcePropType, type StyleProp, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type Sprite = { fonte: ImageSourcePropType; x: number; y: number; w: number; h: number };

/**
 * Peças de quebra-cabeça recortadas da ilustração da conquista, com a posição
 * original na arte de 1024x1024. A estrela fica numa imagem separada.
 */
const PECAS: Sprite[] = [
  { fonte: require('../../assets/images/ilustracoes/conquista/peca1.png'), x: 192, y: 116, w: 176, h: 170 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca2.png'), x: 753, y: 592, w: 161, h: 157 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca3.png'), x: 80, y: 390, w: 147, h: 150 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca4.png'), x: 810, y: 386, w: 141, h: 156 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca5.png'), x: 145, y: 651, w: 138, h: 149 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca6.png'), x: 713, y: 149, w: 122, h: 142 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca7.png'), x: 536, y: 68, w: 110, h: 121 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca8.png'), x: 705, y: 722, w: 106, h: 110 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca9.png'), x: 828, y: 277, w: 99, h: 86 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca10.png'), x: 115, y: 282, w: 93, h: 81 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca11.png'), x: 201, y: 538, w: 89, h: 71 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca12.png'), x: 638, y: 234, w: 48, h: 77 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca13.png'), x: 425, y: 163, w: 64, h: 61 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca14.png'), x: 725, y: 533, w: 60, h: 64 },
  { fonte: require('../../assets/images/ilustracoes/conquista/peca15.png'), x: 102, y: 585, w: 60, h: 56 },
];
const ESTRELA = { fonte: require('../../assets/images/ilustracoes/conquista/estrela.png'), x: 240, y: 190, w: 550, h: 750 };
const ARTE = 1024;
const CENTRO = { x: 512, y: 560 };

/** Flutua devagar para cima e para baixo, sem fim. */
function useFlutuar(amplitude: number, duracao: number, atraso = 0) {
  const reduzir = useReducedMotion();
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduzir) return;
    y.value = withDelay(
      atraso,
      withRepeat(withSequence(withTiming(-amplitude, { duration: duracao, easing: Easing.inOut(Easing.sin) }), withTiming(amplitude, { duration: duracao, easing: Easing.inOut(Easing.sin) })), -1, true),
    );
  }, [reduzir, y, amplitude, duracao, atraso]);
  return y;
}

function Peca({ peca, escala, indice }: { peca: (typeof PECAS)[number]; escala: number; indice: number }) {
  const reduzir = useReducedMotion();
  const p = useSharedValue(reduzir ? 1 : 0);
  const giro0 = (indice % 2 ? 1 : -1) * (90 + indice * 17);
  const flutua = useFlutuar(5 + (indice % 3) * 2, 1400 + indice * 90, 900 + indice * 40);
  useEffect(() => {
    if (reduzir) return;
    p.value = withDelay(250 + indice * 35, withSpring(1, { damping: 9, stiffness: 90, mass: 0.7 }));
  }, [p, reduzir, indice]);
  const dx = (CENTRO.x - (peca.x + peca.w / 2)) * escala;
  const dy = (CENTRO.y - (peca.y + peca.h / 2)) * escala;
  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 2),
    transform: [
      { translateX: dx * (1 - p.value) },
      { translateY: dy * (1 - p.value) + flutua.value },
      { scale: 0.2 + 0.8 * p.value },
      { rotate: `${giro0 * (1 - p.value)}deg` },
    ],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: peca.x * escala, top: peca.y * escala, width: peca.w * escala, height: peca.h * escala }, estilo]}>
      <Image source={peca.fonte} style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}

/** Estrela que entra quicando e solta as peças de quebra-cabeça, que ficam flutuando. */
export function CelebracaoConquista({ tamanho = 260 }: { tamanho?: number }) {
  const escala = tamanho / ARTE;
  const reduzir = useReducedMotion();
  const s = useSharedValue(reduzir ? 1 : 0.4);
  const giro = useSharedValue(0);
  const flutua = useFlutuar(4, 1800, 900);
  useEffect(() => {
    if (reduzir) return;
    s.value = withSpring(1, { damping: 7, stiffness: 120 });
    giro.value = withSequence(withTiming(-8, { duration: 160 }), withTiming(6, { duration: 160 }), withSpring(0, { damping: 6 }));
  }, [s, giro, reduzir]);
  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, s.value * 1.6),
    transform: [{ translateY: flutua.value }, { scale: s.value }, { rotate: `${giro.value}deg` }],
  }));
  return (
    <View style={{ width: tamanho, height: tamanho, alignSelf: 'center' }} accessibilityLabel="Estrela de conquista" accessibilityRole="image">
      <Animated.View style={[{ position: 'absolute', left: ESTRELA.x * escala, top: ESTRELA.y * escala, width: ESTRELA.w * escala, height: ESTRELA.h * escala }, estilo]}>
        <Image source={ESTRELA.fonte} style={{ width: '100%', height: '100%' }} />
      </Animated.View>
      {PECAS.map((peca, i) => (
        <Peca key={i} peca={peca} escala={escala} indice={i} />
      ))}
    </View>
  );
}

/** Ilustração que entra subindo e depois "respira" devagar. */
export function IlustracaoViva({ fonte, proporcao, style, rotulo, confete = true }: { fonte: ImageSourcePropType; proporcao: number; style?: StyleProp<ViewStyle>; rotulo?: string; confete?: boolean }) {
  const [largura, setLargura] = useState(0);
  const reduzir = useReducedMotion();
  const entrada = useSharedValue(reduzir ? 1 : 0);
  const respira = useSharedValue(0);
  useEffect(() => {
    if (reduzir) return;
    entrada.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    respira.value = withDelay(600, withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [entrada, respira, reduzir]);
  const estilo = useAnimatedStyle(() => ({
    opacity: entrada.value,
    transform: [{ translateY: 16 * (1 - entrada.value) - 4 * respira.value }, { scale: 0.97 + 0.03 * entrada.value + 0.012 * respira.value }],
  }));
  return (
    <View style={[{ width: '100%', aspectRatio: proporcao }, style]} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      <Animated.View style={[{ width: '100%', height: '100%' }, estilo]}>
        <Image source={fonte} style={{ width: '100%', height: '100%' }} resizeMode="contain" accessibilityLabel={rotulo} accessibilityIgnoresInvertColors />
      </Animated.View>
      {confete ? <ConfeteAoRedor largura={largura} altura={largura / proporcao} /> : null}
    </View>
  );
}

/** Cabeça de quebra-cabeça da logo, em peças, na arte de 720x720. */
const CABECA_ARTE = 720;
const CABECA_BASE = require('../../assets/images/ilustracoes/cabeca/base.png');
const CABECA_PECAS: Sprite[] = [
  { fonte: require('../../assets/images/ilustracoes/cabeca/peca1.png'), x: 118, y: 114, w: 227, h: 225 },
  { fonte: require('../../assets/images/ilustracoes/cabeca/peca2.png'), x: 298, y: 113, w: 167, h: 276 },
  { fonte: require('../../assets/images/ilustracoes/cabeca/peca3.png'), x: 249, y: 340, w: 232, h: 238 },
  { fonte: require('../../assets/images/ilustracoes/cabeca/peca4.png'), x: 128, y: 291, w: 167, h: 289 },
];
const CABECA_ONDAS: Sprite[] = [
  { fonte: require('../../assets/images/ilustracoes/cabeca/onda1.png'), x: 470, y: 391, w: 34, h: 71 },
  { fonte: require('../../assets/images/ilustracoes/cabeca/onda2.png'), x: 493, y: 369, w: 44, h: 114 },
  { fonte: require('../../assets/images/ilustracoes/cabeca/onda3.png'), x: 516, y: 346, w: 53, h: 159 },
];
const CABECA_BALAO: Sprite = { fonte: require('../../assets/images/ilustracoes/cabeca/balao.png'), x: 551, y: 267, w: 115, h: 119 };
const CABECA_CENTRO = { x: 300, y: 345 };

function caixa(s: Sprite, escala: number) {
  return { position: 'absolute' as const, left: s.x * escala, top: s.y * escala, width: s.w * escala, height: s.h * escala };
}

function PecaEncaixe({ peca, escala, indice }: { peca: Sprite; escala: number; indice: number }) {
  const reduzir = useReducedMotion();
  const p = useSharedValue(reduzir ? 1 : 0);
  useEffect(() => {
    if (reduzir) return;
    p.value = withDelay(200 + indice * 180, withSpring(1, { damping: 11, stiffness: 110 }));
  }, [p, reduzir, indice]);
  // cada peça vem de fora, na direção oposta ao centro da cabeça
  const vx = peca.x + peca.w / 2 - CABECA_CENTRO.x;
  const vy = peca.y + peca.h / 2 - CABECA_CENTRO.y;
  const dist = Math.hypot(vx, vy) || 1;
  const dx = (vx / dist) * 150 * escala;
  const dy = (vy / dist) * 150 * escala;
  const giro = indice % 2 ? 35 : -35;
  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.5),
    transform: [{ translateX: dx * (1 - p.value) }, { translateY: dy * (1 - p.value) }, { rotate: `${giro * (1 - p.value)}deg` }, { scale: 0.85 + 0.15 * p.value }],
  }));
  return (
    <Animated.View style={[caixa(peca, escala), estilo]}>
      <Image source={peca.fonte} style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}

function Onda({ onda, escala, indice }: { onda: Sprite; escala: number; indice: number }) {
  const reduzir = useReducedMotion();
  const p = useSharedValue(reduzir ? 1 : 0);
  useEffect(() => {
    if (reduzir) return;
    p.value = withDelay(
      1100 + indice * 180,
      withRepeat(withSequence(withTiming(1, { duration: 380, easing: Easing.out(Easing.quad) }), withTiming(0.35, { duration: 700 }), withDelay(500, withTiming(0.35, { duration: 0 }))), -1),
    );
  }, [p, reduzir, indice]);
  const estilo = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateX: 4 * escala * p.value }, { scale: 0.9 + 0.1 * p.value }] }));
  return (
    <Animated.View style={[caixa(onda, escala), estilo]}>
      <Image source={onda.fonte} style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}

/** A cabeça da logo se monta peça por peça; depois o balão aparece e as ondas de som pulsam. */
export function CabecaFalante({ tamanho = 240 }: { tamanho?: number }) {
  const escala = tamanho / CABECA_ARTE;
  const reduzir = useReducedMotion();
  const balao = useSharedValue(reduzir ? 1 : 0);
  const flutua = useFlutuar(3, 1900, 1400);
  const balanca = useFlutuar(5, 1300, 1600);
  useEffect(() => {
    if (reduzir) return;
    balao.value = withDelay(1000, withSpring(1, { damping: 6, stiffness: 140 }));
  }, [balao, reduzir]);
  const estiloTudo = useAnimatedStyle(() => ({ transform: [{ translateY: flutua.value }] }));
  const estiloBalao = useAnimatedStyle(() => ({ opacity: Math.min(1, balao.value * 2), transform: [{ translateY: balanca.value }, { scale: balao.value }, { rotate: `${(1 - balao.value) * -25}deg` }] }));
  return (
    <Animated.View style={[{ width: tamanho, height: tamanho, alignSelf: 'center' }, estiloTudo]} accessibilityRole="image" accessibilityLabel="Cabeça de quebra-cabeça falando, símbolo da Fono Inova">
      <Image source={CABECA_BASE} style={{ width: '100%', height: '100%' }} />
      {CABECA_PECAS.map((p, i) => (
        <PecaEncaixe key={i} peca={p} escala={escala} indice={i} />
      ))}
      {CABECA_ONDAS.map((o, i) => (
        <Onda key={i} onda={o} escala={escala} indice={i} />
      ))}
      <Animated.View style={[caixa(CABECA_BALAO, escala), estiloBalao]}>
        <Image source={CABECA_BALAO.fonte} style={{ width: '100%', height: '100%' }} />
      </Animated.View>
    </Animated.View>
  );
}

/** Peças soltas de quebra-cabeça que pulam para perto da ilustração e ficam flutuando. */
const CONFETE_POS: { peca: number; x: number; y: number; t: number }[] = [
  { peca: 0, x: 0.03, y: 0.06, t: 0.11 },
  { peca: 3, x: 0.86, y: 0.04, t: 0.1 },
  { peca: 1, x: 0.9, y: 0.62, t: 0.09 },
  { peca: 6, x: 0.02, y: 0.66, t: 0.08 },
];

function Confete({ largura, altura, indice }: { largura: number; altura: number; indice: number }) {
  const c = CONFETE_POS[indice];
  const peca = PECAS[c.peca];
  const reduzir = useReducedMotion();
  const p = useSharedValue(reduzir ? 1 : 0);
  const flutua = useFlutuar(6, 1500 + indice * 230, 900 + indice * 120);
  const gira = useSharedValue(0);
  useEffect(() => {
    if (reduzir) return;
    p.value = withDelay(500 + indice * 140, withSpring(1, { damping: 8, stiffness: 120 }));
    gira.value = withDelay(900, withRepeat(withTiming(1, { duration: 3200 + indice * 400, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [p, gira, reduzir, indice]);
  const lado = largura * c.t;
  const estilo = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: flutua.value }, { scale: p.value }, { rotate: `${(indice % 2 ? 1 : -1) * (12 * gira.value - 6)}deg` }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: largura * c.x, top: altura * c.y, width: lado, height: (lado * peca.h) / peca.w }, estilo]}>
      <Image source={peca.fonte} style={{ width: '100%', height: '100%' }} />
    </Animated.View>
  );
}

export function ConfeteAoRedor({ largura, altura }: { largura: number; altura: number }) {
  if (!largura) return null;
  return (
    <>
      {CONFETE_POS.map((_, i) => (
        <Confete key={i} largura={largura} altura={altura} indice={i} />
      ))}
    </>
  );
}
