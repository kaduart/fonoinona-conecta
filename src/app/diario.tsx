import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { ConfeteAoRedor } from '@/components/animacao';
import { BarraInferior, ICONE_CONTEXTO, Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Card } from '@/components/ui';
import { MISSOES } from '@/content/missoes';
import {
  agruparPorDia,
  filtrar,
  marcasDeAtividade,
  ROTULO_CONTEXTO,
  ROTULO_HUMOR,
  rotuloAreaDiario,
  rotuloDia,
  textoConquista,
  type FiltroDiario,
  type RegistroDiario,
} from '@/domain/diario';
import { diasSeguidos, semana } from '@/domain/missoes';
import { useSomAoAbrir } from '@/servicos/sons';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

const LETRA_DIA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const FILTROS: { id: FiltroDiario; rotulo: string }[] = [
  { id: 'todos', rotulo: 'Todos' },
  { id: 'casa', rotulo: 'Casa' },
  { id: 'escola', rotulo: 'Escola' },
  { id: 'terapia', rotulo: 'Terapia' },
  { id: 'conquistas', rotulo: 'Conquistas' },
];

export default function Diario() {
  const router = useRouter();
  const { conquista, sugestao } = useLocalSearchParams<{ conquista?: string; sugestao?: string }>();
  const [sugestaoFechada, setSugestaoFechada] = useState(false);
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  const [filtro, setFiltro] = useState<FiltroDiario>('todos');
  const [largura, setLargura] = useState(0);

  useSomAoAbrir('conquista', !!conquista, 150);

  if (!criancaAtual) return <Redirect href="/" />;

  const hoje = new Date();
  const nome = criancaAtual.apelido;
  const registros = dados?.diario ?? [];
  const atividade = [...(dados?.conclusoes ?? []), ...marcasDeAtividade(registros)];
  const dias = semana(atividade, hoje);
  const ativosNaSemana = dias.filter((d) => d.feito).length;
  const seguidos = diasSeguidos(atividade, hoje);
  const grupos = agruparPorDia(filtrar(registros, filtro));
  const missaoSugerida = !sugestaoFechada && sugestao ? MISSOES.find((m) => m.id === sugestao) : undefined;

  const fab = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Anotar o dia"
      onPress={() => router.push('/diario-anotar')}
      style={({ pressed }) => [s.fab, pressed && { transform: [{ scale: 0.95 }] }]}
    >
      <Icone nome="mais" cor="#fff" tamanho={28} espessura={2.6} />
    </Pressable>
  );

  return (
    <Tela
      rodape={
        <View>
          {fab}
          <BarraInferior />
        </View>
      }
    >
      <View style={s.topo} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto variante="titulo">Diário de {nome}</Texto>
          <Texto>Casa, escola e terapia num só lugar.</Texto>
        </View>
        {registros.length ? (
          <Pressable accessibilityRole="button" onPress={() => router.push('/diario-resumo')} style={({ pressed }) => [s.resumo, pressed && { opacity: 0.8 }]}>
            <Icone nome="chat" cor={cores.marca} tamanho={15} />
            <Texto style={{ fontFamily: fonte.negrito, fontSize: 12.5, color: cores.marca }}>Enviar resumo</Texto>
          </Pressable>
        ) : null}
      </View>

      <Card style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            Sequência desta semana 🔥
          </Texto>
          <Texto style={{ fontFamily: fonte.negrito, fontSize: 12.5, color: seguidos ? cores.terraTexto : cores.texto3 }}>
            {seguidos === 1 ? '1 dia seguido' : `${seguidos} dias seguidos`}
          </Texto>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityLabel={`${ativosNaSemana} dias com missão ou Diário nesta semana`}>
          {dias.map((d, i) => {
            const ehHoje = i === dias.length - 1;
            return (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[s.dia, d.feito && { backgroundColor: cores.marca }, ehHoje && !d.feito && s.diaHoje]}>
                  {d.feito ? <Icone nome="check" cor="#fff" tamanho={15} espessura={2.8} /> : null}
                </View>
                <Texto variante="legenda" style={ehHoje && { color: cores.marca, fontFamily: fonte.negrito }}>
                  {LETRA_DIA[d.dia.getDay()]}
                </Texto>
              </View>
            );
          })}
        </View>
        <Texto variante="legenda">Vale missão feita ou dia anotado no Diário.</Texto>
      </Card>

      {missaoSugerida ? (
        <Card style={{ padding: 16, gap: 10, borderWidth: 1.5, borderColor: cores.marcaSuave }}>
          <Texto variante="legenda">Anotado. Uma brincadeira que pode ajudar:</Texto>
          <Texto variante="rotulo">🎯 {missaoSugerida.titulo}</Texto>
          <Texto variante="legenda">
            {missaoSugerida.duracao} · {missaoSugerida.rotuloArea}
          </Texto>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Botao titulo="Ver a missão" onPress={() => router.push({ pathname: '/missao/[id]', params: { id: missaoSugerida.id } })} />
            </View>
            <Botao variante="texto" titulo="Agora não" onPress={() => setSugestaoFechada(true)} />
          </View>
        </Card>
      ) : null}

      {registros.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }} contentInset={{ left: 20, right: 20 }}>
          <View style={{ width: 12 }} />
          {FILTROS.map((f) => (
            <Pressable
              key={f.id}
              accessibilityRole="button"
              accessibilityState={{ selected: filtro === f.id }}
              onPress={() => setFiltro(f.id)}
              style={[s.filtro, filtro === f.id && s.filtroAtivo]}
            >
              <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: filtro === f.id ? '#fff' : cores.texto2 }}>{f.rotulo}</Texto>
            </Pressable>
          ))}
          <View style={{ width: 12 }} />
        </ScrollView>
      ) : null}

      {!registros.length && dados ? (
        <Card style={{ padding: 20, alignItems: 'center', gap: 10 }}>
          <View style={s.ilustracao}>
            <Image source={require('../../assets/images/ilustracoes/mae-livro.png')} style={{ width: 200, height: 160 }} resizeMode="contain" accessibilityIgnoresInvertColors />
          </View>
          <Texto variante="rotulo" style={{ textAlign: 'center' }}>
            Sua cápsula do tempo
          </Texto>
          <Texto style={{ textAlign: 'center' }}>
            O desenvolvimento é feito de pequenas grandes conquistas. Anote o primeiro registro de {nome} hoje e comece a construir a memória da sua evolução.
          </Texto>
          <Texto variante="legenda" style={{ textAlign: 'center' }}>
            Leva 20 segundos e fica só no seu celular.
          </Texto>
        </Card>
      ) : null}

      {registros.length && !grupos.length ? <Texto style={{ textAlign: 'center', marginTop: 8 }}>Nada anotado neste filtro ainda.</Texto> : null}

      {grupos.map((g) => (
        <View key={g.data} style={{ gap: 10 }}>
          <Texto variante="legenda" style={s.data}>
            {rotuloDia(g.data, hoje).toUpperCase()}
          </Texto>
          {g.registros.map((r) => (
            <CartaoRegistro key={r.id} registro={r} destaque={r.id === conquista} onPress={() => router.push({ pathname: '/diario-anotar', params: { id: r.id } })} />
          ))}
        </View>
      ))}

      {dados ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/lembrete')} style={({ pressed }) => [s.lembrete, pressed && { opacity: 0.8 }]}>
          <Icone nome="relogio" cor={cores.marca} tamanho={18} />
          <Texto style={{ flex: 1, fontSize: 14 }}>Quer um lembrete para anotar todo dia?</Texto>
          <Icone nome="seta" cor={cores.texto3} tamanho={16} />
        </Pressable>
      ) : null}

      {/* espaço para o botão flutuante não cobrir o último registro */}
      <View style={{ height: 56 }} />

      {conquista ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <ConfeteAoRedor largura={largura} altura={320} />
        </View>
      ) : null}
    </Tela>
  );
}

function CartaoRegistro({ registro: r, destaque, onPress }: { registro: RegistroDiario; destaque: boolean; onPress: () => void }) {
  const missao = r.missaoId ? MISSOES.find((m) => m.id === r.missaoId) : undefined;
  async function compartilhar() {
    try {
      await Share.share({ message: textoConquista(r) });
    } catch (e) {
      console.warn('[diario] compartilhar', e);
    }
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${r.conquista ? 'Conquista. ' : ''}${ROTULO_CONTEXTO[r.contexto]}${r.humor ? `, ${ROTULO_HUMOR[r.humor]}` : ''}. ${r.nota}. Toque para editar`}
      onPress={onPress}
      style={({ pressed }) => [s.registro, r.conquista && s.registroConquista, destaque && s.registroDestaque, pressed && { opacity: 0.9 }]}
    >
      <View style={[s.icone, r.conquista && { backgroundColor: cores.solFundo }]}>
        {r.conquista ? <Icone nome="estrela" cor={cores.sol} tamanho={21} cheio /> : <Icone nome={ICONE_CONTEXTO[r.contexto]} cor={cores.marca} tamanho={21} />}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Texto variante="rotulo">{r.conquista ? 'Conquista!' : ROTULO_CONTEXTO[r.contexto]}</Texto>
          {r.humor ? (
            <View style={[s.humor, r.humor === 'dificil' ? { backgroundColor: cores.observarFundo } : r.humor === 'normal' ? { backgroundColor: cores.neutroFundo } : null]}>
              <Texto style={{ fontFamily: fonte.negrito, fontSize: 12, color: r.humor === 'dificil' ? cores.observarTexto : r.humor === 'normal' ? cores.texto2 : cores.marca }}>{ROTULO_HUMOR[r.humor]}</Texto>
            </View>
          ) : null}
        </View>
        {r.nota ? (
          <Texto numberOfLines={3} style={{ fontSize: 14, lineHeight: 20 }}>
            {r.nota}
          </Texto>
        ) : null}
        {missao ? <Texto variante="legenda">Missão: {missao.titulo}</Texto> : null}
        {r.areas.length || r.conquista ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
            {r.conquista ? (
              <View style={s.chip}>
                <Texto style={s.chipTexto}>
                  {ROTULO_CONTEXTO[r.contexto]}
                </Texto>
              </View>
            ) : null}
            {r.areas.map((a) => (
              <View key={a} style={s.chip}>
                <Texto style={s.chipTexto}>{rotuloAreaDiario(a)}</Texto>
              </View>
            ))}
          </View>
        ) : null}
        {r.conquista ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Compartilhar conquista com a família" onPress={compartilhar} hitSlop={8} style={s.compartilhar}>
            <Icone nome="compartilhar" cor={cores.solTexto} tamanho={14} />
            <Texto style={{ fontFamily: fonte.negrito, fontSize: 12.5, color: cores.solTexto }}>Compartilhar com a família</Texto>
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  ilustracao: { alignSelf: 'stretch', alignItems: 'center', borderRadius: raio.lg, backgroundColor: cores.ilustracao, paddingVertical: 6 },
  lembrete: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: raio.lg, backgroundColor: cores.marcaSuave, marginTop: 6 },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4 },
  resumo: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 8, borderRadius: raio.sm, backgroundColor: cores.marcaSuave, marginTop: 6 },
  dia: { width: 34, height: 34, borderRadius: 17, backgroundColor: cores.fundo2, alignItems: 'center', justifyContent: 'center' },
  diaHoje: { backgroundColor: cores.superficie, borderWidth: 2, borderColor: cores.marca },
  filtro: { paddingHorizontal: 13, height: 36, borderRadius: raio.pill, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.linha, justifyContent: 'center' },
  filtroAtivo: { backgroundColor: cores.marca, borderColor: cores.marca },
  data: { fontFamily: fonte.negrito, letterSpacing: 0.6, color: cores.texto3, marginTop: 4 },
  registro: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: raio.xl, backgroundColor: cores.superficie, boxShadow: sombra.card },
  registroConquista: { borderWidth: 1.5, borderColor: '#F6DFA6' },
  registroDestaque: { boxShadow: '0px 0px 24px rgba(242,184,75,0.45)' },
  icone: { width: 40, height: 40, borderRadius: 14, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
  humor: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: raio.pill, backgroundColor: cores.marcaSuave },
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: raio.pill, backgroundColor: cores.fundo2 },
  chipTexto: { fontFamily: fonte.semi, fontSize: 12, color: cores.texto2 },
  compartilhar: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: raio.pill, backgroundColor: cores.solFundo },
  fab: {
    position: 'absolute',
    right: 8,
    top: -76,
    zIndex: 2,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: cores.marca,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: sombra.botao,
  },
});
