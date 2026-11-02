import { Redirect, useRouter } from 'expo-router';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Medalha } from '@/components/medalha';
import { Icone, irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Vazio } from '@/components/ui';
import { MISSOES } from '@/content/missoes';
import { formatarDataCurta } from '@/domain/acompanhamento';
import { ROTULO_CONTEXTO, rotuloAreaDiario } from '@/domain/diario';
import { idadeDe } from '@/domain/idade';
import { agruparPorMes, montarLinhaDoTempo, textoLinhaDoTempo, type Marco } from '@/domain/linhaDoTempo';
import { fasesDaTrilha, missoesParaIdade, montarTrilha } from '@/domain/missoes';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { cores, fonte, raio, sombra, toque } from '@/theme/tokens';

const tituloMissao = (id: string) => MISSOES.find((m) => m.id === id)?.titulo ?? 'Missão';

/** Linha do tempo de conquistas: o que a família já celebrou, num lugar só e pronto para mandar à família. */
export default function Conquistas() {
  const router = useRouter();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  if (!criancaAtual) return <Redirect href="/" />;

  const nome = criancaAtual.apelido;
  const ultima = dados?.triagens[0] ?? null;
  const conclusoes = dados?.conclusoes ?? [];
  const fases = fasesDaTrilha(montarTrilha(missoesParaIdade(idadeDe(criancaAtual), ultima?.resultado.areaFoco), conclusoes));
  const marcos = montarLinhaDoTempo(dados?.diario ?? [], conclusoes, fases);
  const grupos = agruparPorMes(marcos);
  const nConquistas = marcos.filter((m) => m.tipo === 'conquista').length;
  const nMedalhas = marcos.filter((m) => m.tipo === 'medalha').length;

  async function compartilhar() {
    try {
      await Share.share({ message: textoLinhaDoTempo(nome, marcos, tituloMissao) });
    } catch (e) {
      console.warn('[conquistas] compartilhar', e);
    }
  }

  let ordem = 0;
  return (
    <Tela
      topo={
        <>
          <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : irPara(router, '/historico'))} />
          <Texto variante="rotulo">Evolução</Texto>
        </>
      }
      rodape={marcos.length ? <Botao titulo="Compartilhar com a família" onPress={compartilhar} icone={<Icone nome="compartilhar" cor="#fff" tamanho={18} />} /> : undefined}
    >
      <View style={{ gap: 4 }}>
        <Texto variante="titulo">Conquistas de {nome}</Texto>
        <Texto>Cada passo que vocês celebraram, do mais novo ao primeiro.</Texto>
      </View>

      {marcos.length ? (
        <View style={s.resumo}>
          <Resumo valor={nConquistas} rotulo={nConquistas === 1 ? 'conquista' : 'conquistas'} />
          <View style={s.resumoDivisor} />
          <Resumo valor={nMedalhas} rotulo={nMedalhas === 1 ? 'medalha' : 'medalhas'} />
          <View style={s.resumoDivisor} />
          <Resumo valor={conclusoes.length} rotulo={conclusoes.length === 1 ? 'missão feita' : 'missões feitas'} />
        </View>
      ) : (
        <Vazio
          icone={<Icone nome="estrela" cor={cores.sol} tamanho={22} cheio />}
          titulo="A primeira conquista vem aí"
          texto={`Marque "É uma conquista!" ao anotar no Diário, ou complete as missões da Trilha. Tudo aparece aqui.`}
        >
          <Botao variante="texto" titulo="Anotar no Diário" onPress={() => router.push('/diario-anotar')} />
        </Vazio>
      )}

      {grupos.map((g) => (
        <View key={g.mes} style={{ gap: 10 }}>
          <Texto variante="sobretitulo" style={{ color: cores.texto3 }}>
            {g.mes.toUpperCase()}
          </Texto>
          {g.marcos.map((m, i) => (
            <Animated.View key={m.id} entering={FadeInDown.delay(Math.min(ordem++, 8) * 50).duration(280)}>
              <ItemMarco marco={m} ultimo={i === g.marcos.length - 1} onPress={() => abrir(m)} />
            </Animated.View>
          ))}
        </View>
      ))}
    </Tela>
  );

  function abrir(m: Marco) {
    if (m.tipo === 'conquista') router.push({ pathname: '/diario-anotar', params: { id: m.registro.id } });
    else if (m.tipo === 'medalha') router.push({ pathname: '/fase/[numero]', params: { numero: String(m.fase.numero) } });
    else router.push({ pathname: '/missao/[id]', params: { id: m.missaoId } });
  }
}

function Resumo({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 1 }}>
      <Texto style={{ fontFamily: fonte.extra, fontSize: 22, color: cores.texto }}>{valor}</Texto>
      <Texto variante="legenda">{rotulo}</Texto>
    </View>
  );
}

function ItemMarco({ marco: m, ultimo, onPress }: { marco: Marco; ultimo: boolean; onPress: () => void }) {
  const data = formatarDataCurta(new Date(m.em));
  return (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <View style={{ alignItems: 'center', width: 44 }}>
        <View style={[s.selo, m.tipo === 'conquista' ? { backgroundColor: cores.solFundo } : m.tipo === 'medalha' ? { backgroundColor: 'transparent' } : { backgroundColor: cores.marcaSuave }]}>
          {m.tipo === 'conquista' ? <Icone nome="estrela" cor={cores.sol} tamanho={20} cheio /> : m.tipo === 'medalha' ? <Medalha tom={m.fase.medalha.tom} tamanho={44} /> : <Icone nome="check" cor={cores.marca} tamanho={20} espessura={2.6} />}
        </View>
        {!ultimo ? <View style={s.trilho} /> : null}
      </View>
      <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.cartao, m.tipo === 'conquista' && s.cartaoConquista, pressed && toque]}>
        <Texto variante="legenda" style={{ fontFamily: fonte.semi }}>
          {data}
        </Texto>
        {m.tipo === 'conquista' ? (
          <>
            <Texto variante="rotulo">{m.registro.nota.trim() || 'Uma conquista no dia a dia'}</Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
              <View style={s.chip}>
                <Texto style={s.chipTexto}>{ROTULO_CONTEXTO[m.registro.contexto]}</Texto>
              </View>
              {m.registro.areas.map((a) => (
                <View key={a} style={s.chip}>
                  <Texto style={s.chipTexto}>{rotuloAreaDiario(a)}</Texto>
                </View>
              ))}
            </View>
          </>
        ) : m.tipo === 'medalha' ? (
          <>
            <Texto variante="rotulo">Medalha {m.fase.medalha.nome}</Texto>
            <Texto variante="legenda">Completou as {m.fase.itens.length} missões da fase {m.fase.numero}.</Texto>
          </>
        ) : (
          <>
            <Texto variante="rotulo">Primeira missão feita</Texto>
            <Texto variante="legenda">{tituloMissao(m.missaoId)}. Onde tudo começou.</Texto>
          </>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  resumo: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderRadius: raio.xl, backgroundColor: cores.superficie, boxShadow: sombra.card },
  resumoDivisor: { width: 1, height: 28, backgroundColor: cores.linha },
  selo: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  trilho: { flex: 1, width: 2, borderRadius: 1, backgroundColor: cores.linha, marginTop: 6, marginBottom: -16 },
  cartao: { flex: 1, gap: 3, padding: 14, borderRadius: raio.lg, backgroundColor: cores.superficie, boxShadow: sombra.card, marginBottom: 2 },
  cartaoConquista: { borderWidth: 1, borderColor: cores.solFundo },
  chip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: raio.pill, backgroundColor: cores.fundo2 },
  chipTexto: { fontFamily: fonte.semi, fontSize: 12, color: cores.texto2 },
});
