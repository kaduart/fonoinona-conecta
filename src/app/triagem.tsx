import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Card, Chip, Segmentos, SetaDireita } from '@/components/ui';
import { ALERTAS, ROTULO_AREA, VERSAO_CONTEUDO } from '@/content/perguntas';
import { formatarIdade, idadeParaTriagem } from '@/domain/idade';
import { avaliar, faixaPara, personalizar, type Resposta } from '@/domain/triagem';
import { useApp } from '@/state/app';
import { novoId, repositorio } from '@/storage/repositorio';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

type Opcao = { valor: string; titulo: string; descricao: string; cor: string; fundo: string; icone: React.ReactNode };

const OPCOES_FAIXA: Opcao[] = [
  { valor: 'sim', titulo: 'Sim', descricao: 'Acontece com frequência', cor: cores.marca, fundo: cores.esperadoFundo, icone: <Path d="M5 12l5 5 9-10" /> },
  {
    valor: 'as_vezes',
    titulo: 'Às vezes',
    descricao: 'Está começando a acontecer',
    cor: '#F2A33A',
    fundo: cores.observarFundo,
    icone: (
      <>
        <Circle cx={12} cy={12} r={9} />
        <Path d="M12 3a9 9 0 0 1 0 18z" fill="#F2A33A" stroke="none" />
      </>
    ),
  },
  {
    valor: 'ainda_nao',
    titulo: 'Ainda não',
    descricao: 'Não percebi até agora',
    cor: '#7B8798',
    fundo: cores.neutroFundo,
    icone: (
      <>
        <Circle cx={12} cy={12} r={9} />
        <Path d="M12 7v5l3 2" />
      </>
    ),
  },
];

const OPCOES_ALERTA: Opcao[] = [
  { valor: 'nao', titulo: 'Não', descricao: '', cor: cores.marca, fundo: cores.esperadoFundo, icone: <Path d="M5 12l5 5 9-10" /> },
  { valor: 'sim', titulo: 'Sim', descricao: '', cor: cores.avaliarTexto, fundo: cores.avaliarFundo, icone: <Path d="M12 7v6M12 17h.01" /> },
];

function OpcaoCard({ opcao, marcada, onPress }: { opcao: Opcao; marcada: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: marcada }}
      onPress={onPress}
      style={[s.opcao, marcada && s.opcaoMarcada]}
    >
      <View style={[s.opcaoIcone, { backgroundColor: opcao.fundo }]}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={opcao.cor} strokeWidth={2.2} strokeLinecap="round">
          {opcao.icone}
        </Svg>
      </View>
      <View style={{ flex: 1 }}>
        <Texto style={{ fontFamily: fonte.negrito, fontSize: 16, color: cores.texto }}>{opcao.titulo}</Texto>
        {opcao.descricao ? <Texto variante="legenda">{opcao.descricao}</Texto> : null}
      </View>
      <View style={[s.radio, marcada && s.radioMarcado]}>
        {marcada ? (
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round">
            <Path d="M5 12l5 5 9-10" />
          </Svg>
        ) : null}
      </View>
    </Pressable>
  );
}

export default function Triagem() {
  const router = useRouter();
  const { criancaAtual } = useApp();
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});
  const [alertas, setAlertas] = useState<Record<string, boolean>>({});
  const [salvando, setSalvando] = useState(false);

  const contexto = useMemo(() => {
    if (!criancaAtual) return null;
    const [a, m, d] = criancaAtual.nascimento.split('-').map(Number);
    const meses = idadeParaTriagem(new Date(a, m - 1, d), new Date(), criancaAtual.semanasGestacao);
    const faixa = faixaPara(meses);
    return faixa ? { meses, faixa, perguntas: [...faixa.perguntas, ...ALERTAS] } : null;
  }, [criancaAtual]);

  if (!criancaAtual || !contexto) {
    return (
      <Tela rodape={<Botao titulo="Cadastrar criança" onPress={() => router.replace('/boas-vindas')} />}>
        <Texto variante="subtitulo">A triagem é para crianças de 0 a 6 anos.</Texto>
      </Tela>
    );
  }

  const { meses, faixa, perguntas } = contexto;
  const total = perguntas.length;
  const pergunta = perguntas[indice];
  const ehAlerta = indice >= faixa.perguntas.length;
  const nome = criancaAtual.apelido;
  const marcada = ehAlerta
    ? alertas[pergunta.id] === undefined
      ? null
      : alertas[pergunta.id]
        ? 'sim'
        : 'nao'
    : (respostas[pergunta.id] ?? null);

  function escolher(valor: string) {
    if (ehAlerta) setAlertas((a) => ({ ...a, [pergunta.id]: valor === 'sim' }));
    else setRespostas((r) => ({ ...r, [pergunta.id]: valor as Resposta }));
  }

  async function avancar() {
    if (indice < total - 1) return setIndice(indice + 1);
    setSalvando(true);
    try {
      const resultado = avaliar(faixa, respostas, alertas);
      const id = novoId();
      await repositorio.salvarTriagem({
        id,
        criancaId: criancaAtual!.id,
        versaoConteudo: VERSAO_CONTEUDO,
        faixaId: faixa.id,
        idadeMeses: meses,
        respostas,
        alertas,
        resultado,
        criadaEm: new Date().toISOString(),
      });
      router.replace({ pathname: '/resultado', params: { id } });
    } catch (e) {
      console.error('[triagem] falha ao concluir', e);
      setSalvando(false);
    }
  }

  return (
    <Tela
      topo={
        <>
          <BotaoVoltar onPress={() => (indice > 0 ? setIndice(indice - 1) : router.canGoBack() ? router.back() : null)} />
          <Segmentos total={total} atual={indice + 1} />
          <Texto variante="legenda" style={{ fontFamily: fonte.semi }}>
            {indice + 1} de {total}
          </Texto>
        </>
      }
      rodape={
        <Botao
          titulo={indice === total - 1 ? 'Ver resultado' : 'Continuar'}
          onPress={avancar}
          desabilitado={marcada === null}
          carregando={salvando}
          icone={<SetaDireita />}
        />
      }
    >
      <View style={s.crianca}>
        <View style={s.avatar}>
          <Texto style={{ color: '#fff', fontFamily: fonte.extra, fontSize: 13 }}>{nome.charAt(0).toUpperCase()}</Texto>
        </View>
        <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: cores.texto }}>
          {nome} · {formatarIdade(meses)}
        </Texto>
      </View>
      <Card elevado style={{ padding: 22, gap: 12, borderRadius: raio.xxl }}>
        <Chip texto={ehAlerta ? 'Para todas as idades' : `${ROTULO_AREA[pergunta.area]} · ${faixa.rotulo}`} />
        <Texto style={{ fontFamily: fonte.extra, fontSize: 23, lineHeight: 29, letterSpacing: -0.5, color: cores.texto }}>
          {personalizar(pergunta.texto, { nome })}
        </Texto>
        <Texto variante="legenda" style={{ fontSize: 13.5 }}>
          Pense no que você observou nas últimas duas semanas.
        </Texto>
      </Card>
      <View accessibilityRole="radiogroup" style={{ gap: 12 }}>
        {(ehAlerta ? OPCOES_ALERTA : OPCOES_FAIXA).map((o) => (
          <OpcaoCard key={o.valor} opcao={o} marcada={marcada === o.valor} onPress={() => escolher(o.valor)} />
        ))}
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  crianca: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: raio.pill,
    boxShadow: sombra.card,
  },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: cores.marca, alignItems: 'center', justifyContent: 'center' },
  opcao: {
    minHeight: 76,
    borderRadius: 22,
    backgroundColor: cores.superficie,
    boxShadow: sombra.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  opcaoMarcada: { borderColor: cores.marca, boxShadow: '0px 14px 30px rgba(31, 122, 107, 0.16)' },
  opcaoIcone: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: '#DDE2E9', alignItems: 'center', justifyContent: 'center' },
  radioMarcado: { backgroundColor: cores.marca, borderColor: cores.marca },
});
