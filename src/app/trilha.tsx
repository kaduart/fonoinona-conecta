import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { BarraInferior, Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Medalha } from '@/components/medalha';
import { Chip } from '@/components/ui';
import { temaDaFase } from '@/content/fases';
import { ROTULO_AREA } from '@/content/perguntas';
import { idadeDe } from '@/domain/idade';
import { fasesDaTrilha, MISSOES_POR_FASE, missoesParaIdade, montarTrilha, type ItemTrilha } from '@/domain/missoes';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

export default function Trilha() {
  const router = useRouter();
  const { desbloqueou } = useLocalSearchParams<{ desbloqueou?: string }>();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);

  if (!criancaAtual) return <Redirect href="/" />;

  const nome = criancaAtual.apelido;
  const ultima = dados?.triagens[0] ?? null;
  const missoes = missoesParaIdade(idadeDe(criancaAtual), ultima?.resultado.areaFoco);
  const trilha = montarTrilha(missoes, dados?.conclusoes ?? []);
  const feitas = trilha.filter((t) => t.feitas > 0).length;
  const progresso = trilha.length ? feitas / trilha.length : 0;
  const fases = fasesDaTrilha(trilha);
  const medalhas = fases.filter((f) => f.completa).length;

  return (
    <Tela rodape={<BarraInferior />}>
      <View style={{ gap: 4, marginTop: 4 }}>
        <Texto variante="titulo" style={{ color: cores.texto }}>
          Trilha de {nome}
        </Texto>
        <Texto>Cada missão abre a próxima. A cada 4, uma medalha.</Texto>
      </View>

      <View style={s.progresso}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            {feitas} de {trilha.length} missões
          </Texto>
          <Texto variante="legenda">
            {medalhas} {medalhas === 1 ? 'medalha' : 'medalhas'}
          </Texto>
        </View>
        <View style={s.barra}>
          <View style={[s.barraCheia, { width: `${Math.round(progresso * 100)}%` }]} />
        </View>
        {ultima?.resultado.areaFoco ? <Chip texto={`Foco: ${ROTULO_AREA[ultima.resultado.areaFoco].toLowerCase()}`} /> : null}
      </View>

      <View style={{ gap: 22 }}>
        {fases.map((fase, f) => {
          const aberta = fase.itens.some((t) => t.liberada);
          const tema = temaDaFase(fase.numero);
          return (
            <View key={fase.numero} style={{ gap: 10 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Fase ${fase.numero}, ${tema.titulo}. Ver o objetivo e os recursos`}
                onPress={() => router.push({ pathname: '/fase/[numero]', params: { numero: String(fase.numero) } })}
                style={({ pressed }) => [s.fase, !aberta && { opacity: 0.6 }, pressed && { opacity: 0.75 }]}
              >
                <Medalha tom={fase.medalha.tom} trancada={!fase.completa} tamanho={38} />
                <View style={{ flex: 1 }}>
                  <Texto variante="legenda" style={{ fontFamily: fonte.negrito, letterSpacing: 0.5, color: fase.completa ? cores.marca : cores.texto2 }}>
                    FASE {fase.numero}
                    {fase.completa ? ' · CONQUISTADA' : ''}
                  </Texto>
                  <Texto variante="rotulo" style={{ fontSize: 14.5 }}>
                    {tema.titulo}
                  </Texto>
                  {aberta ? (
                    <Texto variante="legenda" style={{ color: cores.marca, fontFamily: fonte.semi }}>
                      Objetivo e recursos da fase ›
                    </Texto>
                  ) : null}
                </View>
                <Texto style={{ fontFamily: fonte.extra, fontSize: 14, color: fase.completa ? cores.marca : cores.texto3 }}>
                  {fase.feitas}/{fase.itens.length}
                </Texto>
              </Pressable>
              {fase.itens.map((item, i) => (
                <CartaoMissao
                  key={item.missao.id}
                  item={item}
                  numero={f * MISSOES_POR_FASE + i + 1}
                  recemAberta={item.missao.id === desbloqueou}
                  onPress={() => router.push({ pathname: '/missao/[id]', params: { id: item.missao.id } })}
                />
              ))}
            </View>
          );
        })}
      </View>

      {missoes.length < 6 ? (
        <Texto variante="legenda" style={{ textAlign: 'center' }}>
          Novas missões aparecem conforme {nome} cresce.
        </Texto>
      ) : null}
    </Tela>
  );
}

/** Brilho que pulsa em volta da missão que acabou de abrir, com o cadeado virando número. */
function BrilhoDesbloqueio({ ativo, children }: { ativo: boolean; children: ReactNode }) {
  const reduzir = useReducedMotion();
  const pulso = useSharedValue(0);
  const escala = useSharedValue(ativo && !reduzir ? 0.94 : 1);
  useEffect(() => {
    if (!ativo || reduzir) return;
    escala.value = withDelay(250, withSpring(1, { damping: 7, stiffness: 140 }));
    pulso.value = withDelay(250, withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0.25, { duration: 900 })), 4, true));
  }, [ativo, reduzir, pulso, escala]);
  const estilo = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
    boxShadow: ativo ? `0px 0px ${10 + pulso.value * 22}px rgba(242,184,75,${0.35 + pulso.value * 0.5})` : '0px 0px 0px rgba(0,0,0,0)',
    borderColor: ativo ? `rgba(242,184,75,${0.5 + pulso.value * 0.5})` : 'transparent',
  }));
  return <Animated.View style={[{ borderRadius: raio.lg + 3, borderWidth: 2.5, padding: 0 }, estilo]}>{children}</Animated.View>;
}

/** Cadeado que se abre e dá lugar ao número da missão. */
function NumeroDesbloqueado({ numero }: { numero: number }) {
  const reduzir = useReducedMotion();
  const t = useSharedValue(reduzir ? 1 : 0);
  useEffect(() => {
    if (reduzir) return;
    t.value = withDelay(500, withTiming(1, { duration: 500 }));
  }, [reduzir, t]);
  const cadeado = useAnimatedStyle(() => ({ opacity: 1 - t.value, transform: [{ translateY: -t.value * 10 }, { rotate: `${t.value * 25}deg` }, { scale: 1 + t.value * 0.3 }] }));
  const num = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.5 + t.value * 0.5 }] }));
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute' }, cadeado]}>
        <Icone nome="cadeado" cor={cores.sol} tamanho={18} />
      </Animated.View>
      <Animated.View style={num}>
        <Texto style={{ fontFamily: fonte.extra, color: cores.marca, fontSize: 15 }}>{numero}</Texto>
      </Animated.View>
    </View>
  );
}

function CartaoMissao({ item, numero, recemAberta, onPress }: { item: ItemTrilha; numero: number; recemAberta: boolean; onPress: () => void }) {
  const { missao, liberada, feitas: vezes } = item;
  const ativo = recemAberta && liberada && vezes === 0;
  return (
    <BrilhoDesbloqueio ativo={ativo}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !liberada }}
        accessibilityLabel={`${missao.titulo}${liberada ? '' : ', bloqueada'}${vezes ? ', concluída' : ''}${ativo ? ', acabou de abrir' : ''}`}
        disabled={!liberada}
        onPress={onPress}
        style={({ pressed }) => [s.missao, !liberada && s.missaoTrancada, pressed && { opacity: 0.8 }]}
      >
        <View style={[s.numero, vezes > 0 && { backgroundColor: cores.marca }, !liberada && { backgroundColor: cores.fundo2 }, ativo && { backgroundColor: cores.solFundo }]}>
          {vezes > 0 ? (
            <Icone nome="check" cor="#fff" tamanho={18} espessura={2.6} />
          ) : ativo ? (
            <NumeroDesbloqueado numero={numero} />
          ) : liberada ? (
            <Texto style={{ fontFamily: fonte.extra, color: cores.marca, fontSize: 15 }}>{numero}</Texto>
          ) : (
            <Icone nome="cadeado" cor={cores.texto3} tamanho={17} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          {ativo ? (
            <Texto style={{ fontFamily: fonte.negrito, fontSize: 11, letterSpacing: 0.5, color: '#C98A12' }}>NOVA MISSÃO LIBERADA</Texto>
          ) : null}
          <Texto variante="rotulo" style={!liberada && { color: cores.texto3 }}>
            {missao.titulo}
          </Texto>
          <Texto variante="legenda">
            {missao.rotuloArea} · {missao.duracao}
            {vezes > 1 ? ` · feita ${vezes}x` : ''}
          </Texto>
        </View>
        {liberada ? <Icone nome="seta" cor={cores.texto3} tamanho={16} /> : null}
      </Pressable>
    </BrilhoDesbloqueio>
  );
}

const s = StyleSheet.create({
  fase: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  progresso: { gap: 10, padding: 16, borderRadius: raio.xl, backgroundColor: cores.superficie, boxShadow: sombra.card },
  barra: { height: 9, borderRadius: 5, backgroundColor: cores.fundo2, overflow: 'hidden' },
  barraCheia: { height: '100%', borderRadius: 5, backgroundColor: cores.marca },
  missao: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: raio.lg, backgroundColor: cores.superficie, boxShadow: sombra.card },
  missaoTrancada: { backgroundColor: 'rgba(255,255,255,0.5)', boxShadow: 'none', borderWidth: 1, borderColor: cores.linha },
  numero: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
});
