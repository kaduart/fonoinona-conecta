import { Redirect, useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Interruptor } from '@/components/ui';
import { MISSOES } from '@/content/missoes';
import {
  AREAS_DIARIO,
  datasParaAnotar,
  dataLocal,
  EMOJI_CONTEXTO,
  EMOJI_HUMOR,
  GATILHOS_NOTA,
  inserirGatilho,
  marcasDeAtividade,
  NOTA_MAX,
  normalizarRegistro,
  ROTULO_CONTEXTO,
  ROTULO_HUMOR,
  rotuloAreaDiario,
  rotuloDia,
  sugerirMissao,
  type ContextoDiario,
  type HumorDiario,
  type RegistroDiario,
} from '@/domain/diario';
import type { Area } from '@/content/perguntas';
import { idadeDe } from '@/domain/idade';
import { META_SEMANAL, missoesParaIdade, montarTrilha, semana } from '@/domain/missoes';
import { tocar } from '@/servicos/sons';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { novoId, repositorio } from '@/storage/repositorio';
import { cores, fonte, raio } from '@/theme/tokens';

const CONTEXTOS: ContextoDiario[] = ['casa', 'escola', 'terapia'];
const HUMORES: HumorDiario[] = ['bom', 'normal', 'dificil'];
const ROTULO_HUMOR_CURTO: Record<HumorDiario, string> = { bom: 'Bom dia', normal: 'Normal', dificil: 'Difícil' };

/** Anotar o dia (ou editar um registro): 20 segundos, quase tudo em toques. */
export default function DiarioAnotar() {
  const router = useRouter();
  const { id, missaoId, depois } = useLocalSearchParams<{ id?: string; missaoId?: string; depois?: string }>();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  const [hoje] = useState(() => new Date());
  const [novo] = useState(novoId);
  const [carregado, setCarregado] = useState(!id);
  const [data, setData] = useState(dataLocal(hoje));
  const [contexto, setContexto] = useState<ContextoDiario>('casa');
  const [humor, setHumor] = useState<HumorDiario | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [nota, setNota] = useState('');
  const [conquista, setConquista] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const existente = id ? dados?.diario.find((r) => r.id === id) : undefined;
  useEffect(() => {
    if (!existente || carregado) return;
    setData(existente.data);
    setContexto(existente.contexto);
    setHumor(existente.humor);
    setAreas(existente.areas);
    setNota(existente.nota);
    setConquista(existente.conquista);
    setCarregado(true);
  }, [existente, carregado]);

  if (!criancaAtual) return <Redirect href="/" />;
  if (id && dados && !existente) return <Redirect href="/diario" />;

  const nome = criancaAtual.apelido;
  const missao = (existente?.missaoId ?? missaoId) ? MISSOES.find((m) => m.id === (existente?.missaoId ?? missaoId)) : undefined;
  const agoraIso = new Date().toISOString();
  const registro: RegistroDiario = {
    id: existente?.id ?? novo,
    criancaId: criancaAtual.id,
    data,
    contexto,
    humor,
    areas,
    conquista,
    nota,
    ...(missao ? { missaoId: missao.id } : {}),
    criadoEm: existente?.criadoEm ?? agoraIso,
    editadoEm: agoraIso,
  };
  // datas oferecidas: a janela de 7 dias, mais a do registro antigo se ele for mais velho
  const datas = existente && !datasParaAnotar(hoje).includes(existente.data) ? [existente.data, ...datasParaAnotar(hoje)] : datasParaAnotar(hoje);
  const valido = normalizarRegistro(registro, hoje);
  const podeSalvar = valido.ok || (!!existente && existente.data === data && !valido.ok && valido.erro === 'data');

  function sair(salvo?: RegistroDiario) {
    if (depois) return irPara(router, depois as Href);
    const params: Record<string, string> = {};
    if (salvo?.conquista && !existente?.conquista) params.conquista = salvo.id;
    // dia difícil anotado agora (não vindo de uma missão): sugere uma brincadeira liberada da área marcada
    if (salvo && !existente && !salvo.missaoId && criancaAtual) {
      const ultima = dados?.triagens[0] ?? null;
      const trilha = montarTrilha(missoesParaIdade(idadeDe(criancaAtual), ultima?.resultado.areaFoco), dados?.conclusoes ?? []);
      const sugerida = sugerirMissao(salvo, trilha);
      if (sugerida) params.sugestao = sugerida.id;
    }
    irPara(router, Object.keys(params).length ? { pathname: '/diario', params } : '/diario');
  }

  async function salvar() {
    // registro antigo (fora da janela) pode ser editado sem mudar a data
    const r = valido.ok ? valido.registro : { ...registro, nota: registro.nota.trim() };
    if (!valido.ok && valido.erro !== 'data') {
      setErro(valido.erro === 'vazio' ? 'Marque como foi o dia, uma área ou escreva algo.' : `A nota passa de ${NOTA_MAX} caracteres.`);
      return;
    }
    setSalvando(true);
    try {
      await repositorio.salvarRegistroDiario(r);
      if (!existente) {
        registrarEvento({ tipo: 'diario_registro', contexto: r.contexto });
        // meta da semana batida com este registro
        const antes = [...(dados?.conclusoes ?? []), ...marcasDeAtividade(dados?.diario ?? [])];
        const depois = [...antes, ...marcasDeAtividade([r])];
        const n = (l: { em: string }[]) => semana(l, hoje).filter((d) => d.feito).length;
        if (!r.conquista && n(antes) < META_SEMANAL && n(depois) >= META_SEMANAL) void tocar('completo');
      }
      sair(r);
    } catch (e) {
      console.error('[diario-anotar] falha ao salvar', e);
      setErro('Não deu para salvar agora. Tente de novo.');
      setSalvando(false);
    }
  }

  async function apagar() {
    if (!existente) return;
    if (!confirmarApagar) return setConfirmarApagar(true);
    try {
      await repositorio.removerRegistroDiario(existente.id);
      irPara(router, '/diario');
    } catch (e) {
      console.error('[diario-anotar] falha ao apagar', e);
      setErro('Não deu para apagar agora. Tente de novo.');
    }
  }

  function alternarArea(a: Area) {
    setAreas((atual) => (atual.includes(a) ? atual.filter((x) => x !== a) : [...atual, a]));
  }

  return (
    <Tela
      topo={
        <>
          <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : sair())} />
          <Texto variante="rotulo" style={{ flex: 1 }}>
            {existente ? 'Editar anotação' : 'Diário'}
          </Texto>
          {depois ? <Botao variante="texto" titulo="Pular" onPress={() => sair()} /> : null}
        </>
      }
      rodape={
        <View style={{ gap: 6 }}>
          {erro ? (
            <Texto variante="legenda" style={{ color: cores.avaliarTexto, textAlign: 'center' }}>
              {erro}
            </Texto>
          ) : !podeSalvar && carregado ? (
            <Texto variante="legenda" style={{ textAlign: 'center' }}>
              Marque como foi o dia, uma área ou escreva algo para salvar.
            </Texto>
          ) : null}
          <Botao titulo={existente ? 'Salvar alterações' : 'Salvar no Diário'} onPress={salvar} desabilitado={!podeSalvar || !carregado} carregando={salvando} />
        </View>
      }
    >
      <View style={{ gap: 4 }}>
        <Texto variante="subtitulo">Como foi o dia de {nome}?</Texto>
        {missao ? <Texto variante="legenda">Depois da missão {missao.titulo}</Texto> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }}>
        <View style={{ width: 12 }} />
        {datas.map((d) => (
          <Pressable key={d} accessibilityRole="button" accessibilityState={{ selected: data === d }} onPress={() => setData(d)} style={[s.pilula, data === d && s.pilulaAtiva]}>
            <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: data === d ? '#fff' : cores.texto2 }}>{rotuloDia(d, hoje).split(' · ')[0]}</Texto>
          </Pressable>
        ))}
        <View style={{ width: 12 }} />
      </ScrollView>

      <Pergunta titulo="Onde foi?">
        <View style={s.linha} accessibilityRole="radiogroup">
          {CONTEXTOS.map((c) => (
            <Opcao key={c} ativa={contexto === c} emoji={EMOJI_CONTEXTO[c]} rotulo={ROTULO_CONTEXTO[c]} onPress={() => setContexto(c)} />
          ))}
        </View>
      </Pergunta>

      <Pergunta titulo="Como foi?">
        <View style={s.linha} accessibilityRole="radiogroup">
          {HUMORES.map((h) => (
            <Opcao key={h} ativa={humor === h} emoji={EMOJI_HUMOR[h]} rotulo={ROTULO_HUMOR_CURTO[h]} acessivel={ROTULO_HUMOR[h]} onPress={() => setHumor(humor === h ? null : h)} />
          ))}
        </View>
        {humor === 'dificil' ? <Texto variante="legenda">Dia difícil acontece. Anotar já ajuda a enxergar o caminho.</Texto> : null}
      </Pergunta>

      <Pergunta titulo="O que você reparou?" opcional>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {AREAS_DIARIO.map((a) => {
            const ativa = areas.includes(a);
            return (
              <Pressable key={a} accessibilityRole="checkbox" accessibilityState={{ checked: ativa }} onPress={() => alternarArea(a)} style={[s.area, ativa && s.areaAtiva]}>
                <Texto style={{ fontFamily: fonte.semi, fontSize: 13.5, color: ativa ? cores.marca : cores.texto2 }}>{rotuloAreaDiario(a)}</Texto>
              </Pressable>
            );
          })}
        </View>
      </Pergunta>

      <Pergunta titulo="Quer contar mais?" opcional>
        <TextInput
          value={nota}
          onChangeText={(t) => {
            setNota(t);
            setErro(null);
          }}
          multiline
          maxLength={NOTA_MAX}
          placeholder={'Ex.: pediu água apontando para o copo'}
          placeholderTextColor={cores.texto3}
          accessibilityLabel="Anotação"
          style={s.nota}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ marginHorizontal: -20 }}>
          <View style={{ width: 12 }} />
          {GATILHOS_NOTA.map((g) => (
            <Pressable
              key={g.texto}
              accessibilityRole="button"
              accessibilityLabel={`Escrever: ${g.texto}`}
              onPress={() => {
                setNota((n) => inserirGatilho(n, g.texto));
                setAreas((atual) => (atual.includes(g.area) ? atual : [...atual, g.area]));
                setErro(null);
              }}
              style={s.gatilho}
            >
              <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: cores.texto2 }}>
                {g.emoji} {g.texto}
              </Texto>
            </Pressable>
          ))}
          <View style={{ width: 12 }} />
        </ScrollView>
        <Texto variante="legenda" style={{ textAlign: 'right' }}>
          {nota.length}/{NOTA_MAX}
        </Texto>
      </Pergunta>

      <Interruptor valor={conquista} onChange={setConquista} titulo="⭐ É uma conquista!" descricao="Ganha estrela e destaque no Diário, e você pode compartilhar com a família." />

      <Texto variante="legenda" style={{ textAlign: 'center' }}>
        Fica só no seu celular, protegido. Só sai daqui se você enviar.
      </Texto>

      {existente ? (
        <Pressable accessibilityRole="button" onPress={apagar} style={s.apagar} hitSlop={8}>
          <Texto style={{ fontFamily: fonte.semi, fontSize: 14, color: cores.avaliarTexto }}>{confirmarApagar ? 'Toque de novo para apagar' : 'Apagar anotação'}</Texto>
        </Pressable>
      ) : null}
    </Tela>
  );
}

function Pergunta({ titulo, opcional, children }: { titulo: string; opcional?: boolean; children: ReactNode }) {
  return (
    <View style={{ gap: 9 }}>
      <Texto variante="rotulo">
        {titulo}
        {opcional ? <Texto variante="legenda"> opcional</Texto> : null}
      </Texto>
      {children}
    </View>
  );
}

function Opcao({ ativa, emoji, rotulo, acessivel, onPress }: { ativa: boolean; emoji: string; rotulo: string; acessivel?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="radio" accessibilityLabel={acessivel ?? rotulo} accessibilityState={{ checked: ativa }} onPress={onPress} style={[s.opcao, ativa && s.opcaoAtiva]}>
      <Texto style={{ fontSize: 21 }}>{emoji}</Texto>
      <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: ativa ? cores.marca : cores.texto2 }}>{rotulo}</Texto>
    </Pressable>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 8 },
  opcao: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 11, borderRadius: raio.md, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.superficie },
  opcaoAtiva: { borderColor: cores.marca, backgroundColor: cores.marcaSuave },
  area: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: raio.pill, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.superficie },
  areaAtiva: { borderColor: cores.marca, backgroundColor: cores.marcaSuave },
  nota: { minHeight: 84, borderRadius: raio.md, borderWidth: 1.5, borderColor: cores.linha, backgroundColor: cores.superficie, padding: 12, fontFamily: fonte.regular, fontSize: 15, color: cores.texto, textAlignVertical: 'top' },
  pilula: { paddingHorizontal: 13, height: 36, borderRadius: raio.pill, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.linha, justifyContent: 'center' },
  pilulaAtiva: { backgroundColor: cores.marca, borderColor: cores.marca },
  gatilho: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: raio.pill, borderWidth: 1, borderStyle: 'dashed', borderColor: cores.linha, backgroundColor: cores.fundo },
  apagar: { alignSelf: 'center', paddingVertical: 10 },
});
