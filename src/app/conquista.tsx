import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { ConfeteAoRedor } from '@/components/animacao';
import { Medalha } from '@/components/medalha';
import { irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao } from '@/components/ui';
import { temaDaFase } from '@/content/fases';
import { idadeDe } from '@/domain/idade';
import { fasesDaTrilha, missoesParaIdade, montarTrilha } from '@/domain/missoes';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { cores, fonte, raio } from '@/theme/tokens';

const PALCO = 280;

/** Tela de medalha: aparece quando a conclusão fecha as 4 missões de uma fase. */
export default function Conquista() {
  const router = useRouter();
  const { fase: faseParam, desbloqueou } = useLocalSearchParams<{ fase: string; desbloqueou?: string }>();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  const reduzir = useReducedMotion();
  const [largura, setLargura] = useState(0);

  const escala = useSharedValue(reduzir ? 1 : 0.2);
  const giro = useSharedValue(reduzir ? 0 : -200);
  const brilho = useSharedValue(0);
  useEffect(() => {
    if (reduzir) return;
    escala.value = withDelay(150, withSpring(1, { damping: 8, stiffness: 110 }));
    giro.value = withDelay(150, withSpring(0, { damping: 9, stiffness: 70 }));
    brilho.value = withDelay(700, withRepeat(withSequence(withTiming(1, { duration: 1100 }), withTiming(0.35, { duration: 1100 })), -1, true));
  }, [reduzir, escala, giro, brilho]);
  const estiloMedalha = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }, { rotateY: `${giro.value}deg` }] }));
  const estiloBrilho = useAnimatedStyle(() => ({ opacity: reduzir ? 0.7 : brilho.value, transform: [{ scale: 0.9 + brilho.value * 0.15 }] }));

  if (!criancaAtual) return <Redirect href="/" />;

  const nome = criancaAtual.apelido;
  const ultima = dados?.triagens[0] ?? null;
  const trilha = montarTrilha(missoesParaIdade(idadeDe(criancaAtual), ultima?.resultado.areaFoco), dados?.conclusoes ?? []);
  const fases = fasesDaTrilha(trilha);
  const numero = Number(faseParam) || 1;
  const fase = fases[numero - 1];
  if (!fase) return <Redirect href="/trilha" />;
  const proxima = fases[numero];
  const conquistadas = fases.filter((f) => f.completa).length;

  function seguir() {
    irPara(router, desbloqueou ? { pathname: '/trilha', params: { desbloqueou } } : '/trilha');
  }
  function conhecerProxima() {
    if (proxima) irPara(router, { pathname: '/fase/[numero]', params: { numero: String(proxima.numero) } });
  }

  return (
    <Tela
      rodape={
        proxima ? (
          <View style={{ gap: 2 }}>
            <Botao titulo={`Conhecer a fase ${proxima.numero}`} onPress={conhecerProxima} />
            <Botao variante="texto" titulo="Ver a trilha" onPress={seguir} />
          </View>
        ) : (
          <Botao titulo="Ver a trilha" onPress={seguir} />
        )
      }
    >
      <View style={s.palco} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        <Animated.View style={[s.halo, estiloBrilho]} />
        <Animated.View style={estiloMedalha} accessibilityRole="image" accessibilityLabel={`Medalha ${fase.medalha.nome}`}>
          <Medalha tom={fase.medalha.tom} tamanho={170} />
        </Animated.View>
        <ConfeteAoRedor largura={largura} altura={PALCO} />
      </View>

      <Animated.View entering={reduzir ? undefined : FadeInUp.delay(650).duration(450)} style={{ alignItems: 'center', gap: 6 }}>
        <View style={s.selo}>
          <Texto style={{ fontFamily: fonte.negrito, fontSize: 12, color: cores.marca, letterSpacing: 0.6 }}>FASE {fase.numero} COMPLETA</Texto>
        </View>
        <Texto variante="titulo" style={{ textAlign: 'center' }}>
          Medalha {fase.medalha.nome}!
        </Texto>
        <Texto style={{ textAlign: 'center' }}>
          {nome} completou as {fase.itens.length} missões da fase {fase.numero}, {temaDaFase(fase.numero).titulo.toLowerCase()}. Cada brincadeira juntos conta muito.
        </Texto>
      </Animated.View>

      <Animated.View entering={reduzir ? undefined : FadeInUp.delay(900).duration(450)} style={s.colecao}>
        <Texto variante="rotulo" style={{ fontSize: 13.5, textAlign: 'center' }}>
          Coleção de {nome} · {conquistadas} de {fases.length}
        </Texto>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          {fases.map((f) => (
            <View key={f.numero} style={{ alignItems: 'center', gap: 2, opacity: f.completa ? 1 : 0.8 }}>
              <Medalha tom={f.medalha.tom} trancada={!f.completa} tamanho={46} />
              <Texto variante="legenda" style={{ fontSize: 11 }}>Fase {f.numero}</Texto>
            </View>
          ))}
        </View>
        {proxima ? (
          <Texto variante="legenda" style={{ textAlign: 'center' }}>
            Próxima: fase {proxima.numero}, {temaDaFase(proxima.numero).titulo.toLowerCase()} (medalha {proxima.medalha.nome}).
          </Texto>
        ) : null}
      </Animated.View>
    </Tela>
  );
}

const s = StyleSheet.create({
  palco: { height: PALCO, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(242,184,75,0.28)', boxShadow: '0px 0px 60px rgba(242,184,75,0.55)' },
  selo: { paddingHorizontal: 12, height: 26, borderRadius: raio.pill, backgroundColor: cores.marcaSuave, justifyContent: 'center' },
  colecao: { gap: 12, padding: 16, borderRadius: raio.xl, backgroundColor: cores.superficie, marginTop: 4 },
});
