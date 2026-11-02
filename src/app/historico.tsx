import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { BarraInferior, ICONE_HUMOR, Icone, ItemLista } from '@/components/navegacao';
import { comprimento, LinhaDesenhada, Preenchimento } from '@/components/grafico';
import { Tela } from '@/components/tela';
import { Numero } from '@/components/numero';
import { Texto } from '@/components/texto';
import { Botao, Card, Chip, Vazio } from '@/components/ui';
import { MISSOES, ROTULO_COMO_FOI } from '@/content/missoes';
import { FAIXAS, ROTULO_AREA } from '@/content/perguntas';
import { TEXTOS_RESULTADO } from '@/content/resultados';
import { formatarDataCurta, proximaTriagem } from '@/domain/acompanhamento';
import { marcasDeAtividade, resumir, rotuloAreaDiario } from '@/domain/diario';
import { idadeDe } from '@/domain/idade';
import { diasSeguidos, fasesDaTrilha, missoesParaIdade, montarTrilha } from '@/domain/missoes';
import type { NivelResultado } from '@/domain/triagem';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import type { TriagemSalva } from '@/storage/repositorio';
import { cores, fonte, raio, tema } from '@/theme/tokens';

const ALTURA: Record<NivelResultado, number> = { avaliar: 0, observar: 1, esperado: 2 };
const COR: Record<NivelResultado, string> = { avaliar: cores.terra, observar: cores.sol, esperado: cores.esperado };
const ROTULO_EIXO: Record<NivelResultado, string> = { esperado: 'Esperado', observar: 'Observar', avaliar: 'Avaliar' };
const TOM_AREA: Record<NivelResultado, { rotulo: string; cor: string; texto: string }> = {
  esperado: { rotulo: 'Esperado', cor: cores.esperado, texto: cores.marca },
  observar: { rotulo: 'Estimular', cor: cores.sol, texto: cores.observarTexto },
  avaliar: { rotulo: 'Atenção', cor: cores.terra, texto: cores.avaliarTexto },
};
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function Grafico({ triagens }: { triagens: TriagemSalva[] }) {
  const pontos = [...triagens].reverse().slice(-6);
  const w = 300;
  const h = 130;
  const x0 = 58;
  const x = (i: number) => (pontos.length === 1 ? (x0 + w - 12) / 2 : x0 + (i * (w - 12 - x0)) / (pontos.length - 1));
  const y = (n: NivelResultado) => 100 - ALTURA[n] * 40;
  const d = pontos.map((p, i) => `${i ? 'L' : 'M'}${x(i)} ${y(p.resultado.nivel)}`).join(' ');
  return (
    <Svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} accessibilityLabel="Gráfico da evolução das triagens">
      {(['esperado', 'observar', 'avaliar'] as NivelResultado[]).map((n) => (
        <G key={n}>
          <Line x1={x0 - 6} x2={w} y1={y(n)} y2={y(n)} stroke={cores.linha} strokeWidth={1} />
          <SvgText x={0} y={y(n) + 4} fontSize={11} fontFamily={fonte.media} fill={cores.texto3}>
            {ROTULO_EIXO[n]}
          </SvgText>
        </G>
      ))}
      {pontos.length > 1 ? <Path d={`${d} L${x(pontos.length - 1)} 112 L${x(0)} 112 Z`} fill={cores.marca} fillOpacity={0.08} /> : null}
      <LinhaDesenhada d={d} tamanho={comprimento(pontos.map((p, i) => ({ x: x(i), y: y(p.resultado.nivel) })))} stroke={cores.marca} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {pontos.map((p, i) => {
        const data = new Date(p.criadaEm);
        return (
          <G key={p.id}>
            <Circle cx={x(i)} cy={y(p.resultado.nivel)} r={6} fill={cores.superficie} stroke={COR[p.resultado.nivel]} strokeWidth={3} />
            <SvgText x={x(i)} y={126} fontSize={10} fontFamily={fonte.media} fill={cores.texto3} textAnchor="middle">
              {MESES[data.getMonth()]}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

function Indicador({ valor, rotulo, cor }: { valor: number; rotulo: string; cor: string }) {
  return (
    <Card style={{ flex: 1, padding: 14, gap: 2, borderRadius: raio.lg }}>
      <Numero valor={valor} style={{ fontFamily: fonte.extra, fontSize: 24, color: cor }} />
      <Texto variante="legenda">{rotulo}</Texto>
    </Card>
  );
}

/** Barra empilhada com quantos dias foram bons, normais e difíceis (um humor por dia). */
function HumorDoMes({ humor }: { humor: { bom: number; normal: number; dificil: number } }) {
  const total = humor.bom + humor.normal + humor.dificil;
  if (!total) return null;
  const partes = [
    { chave: 'bom' as const, n: humor.bom, cor: cores.esperado, rotulo: humor.bom === 1 ? 'bom' : 'bons' },
    { chave: 'normal' as const, n: humor.normal, cor: tema('#C9D3D6', '#4A5B5C'), rotulo: humor.normal === 1 ? 'normal' : 'normais' },
    { chave: 'dificil' as const, n: humor.dificil, cor: cores.sol, rotulo: humor.dificil === 1 ? 'difícil' : 'difíceis' },
  ];
  return (
    <View style={{ gap: 8 }} accessibilityLabel={`${humor.bom} dias bons, ${humor.normal} normais e ${humor.dificil} difíceis`}>
      <View style={[s.barra, { flexDirection: 'row', gap: 2, backgroundColor: 'transparent' }]}>
        {partes.filter((p) => p.n).map((p) => (
          <View key={p.chave} style={{ flex: p.n, height: '100%', borderRadius: 5, backgroundColor: p.cor }} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 14 }}>
        {partes.map((p) => (
          <View key={p.chave} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Icone nome={ICONE_HUMOR[p.chave]} cor={cores.texto2} tamanho={15} />
            <Texto variante="legenda">
              {p.n} {p.rotulo}
            </Texto>
          </View>
        ))}
      </View>
    </View>
  );
}

export default function Historico() {
  const router = useRouter();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  if (!criancaAtual) return <Redirect href="/" />;

  const triagens = dados?.triagens ?? [];
  const conclusoes = dados?.conclusoes ?? [];
  const nome = criancaAtual.apelido;
  const proxima = proximaTriagem(criancaAtual, triagens[0] ?? null);
  const melhorou = triagens.length >= 2 && ALTURA[triagens[0].resultado.nivel] > ALTURA[triagens[1].resultado.nivel];

  const ultima = triagens[0];
  const medalhas = fasesDaTrilha(montarTrilha(missoesParaIdade(idadeDe(criancaAtual), ultima?.resultado.areaFoco), conclusoes)).filter((f) => f.completa).length;
  const diario = dados?.diario ?? [];
  const seguidos = diasSeguidos([...conclusoes, ...marcasDeAtividade(diario)], new Date());
  const mes = resumir(diario, 30, new Date());
  const areas = ultima ? [...ultima.resultado.areas].sort((a, b) => b.pontuacao - a.pontuacao) : [];

  return (
    <Tela rodape={<BarraInferior />}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <Texto variante="titulo" style={{ color: cores.texto }}>
          Evolução
        </Texto>
        {melhorou ? <Chip texto="↑ Melhorou" /> : null}
      </View>

      {ultima ? (
        <Card style={{ padding: 16, paddingBottom: 10, gap: 6 }}>
          <Texto variante="legenda">Última triagem · {formatarDataCurta(new Date(ultima.criadaEm))}</Texto>
          <Texto style={{ fontFamily: fonte.extra, fontSize: 19, lineHeight: 24, color: cores.texto }}>{TEXTOS_RESULTADO[ultima.resultado.nivel].rotulo}</Texto>
          <Grafico triagens={triagens} />
        </Card>
      ) : (
        <Vazio icone={<Icone nome="grafico" cor={cores.marca} tamanho={22} />} titulo="Nenhuma triagem ainda" texto={`Faça a primeira para acompanhar a evolução de ${nome}.`} />
      )}

      {areas.length ? (
        <Card style={{ padding: 16, gap: 12 }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            Por habilidade
          </Texto>
          {areas.map((a, i) => (
            <View key={a.area} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: cores.texto }}>{a.rotulo}</Texto>
                <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: TOM_AREA[a.nivel].texto }}>{TOM_AREA[a.nivel].rotulo}</Texto>
              </View>
              <View style={s.barra}>
                <Preenchimento pct={Math.max(8, a.pontuacao)} cor={TOM_AREA[a.nivel].cor} atraso={i * 70} />
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Indicador valor={conclusoes.length} rotulo={conclusoes.length === 1 ? 'missão feita' : 'missões feitas'} cor={cores.marca} />
        <Indicador valor={seguidos} rotulo={seguidos === 1 ? 'dia seguido' : 'dias seguidos'} cor={cores.terraTexto} />
        <Indicador valor={medalhas} rotulo={medalhas === 1 ? 'medalha' : 'medalhas'} cor="#B07A10" />
      </View>

      <Card style={{ paddingVertical: 4 }}>
        <ItemLista icone="estrela" cor={cores.solTexto} fundo={cores.solFundo} titulo="Linha do tempo de conquistas" descricao="Tudo o que vocês celebraram, pronto para mandar à família" onPress={() => router.push('/conquistas')} />
      </Card>

      <Card style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            Diário dos últimos 30 dias
          </Texto>
          <Botao variante="texto" titulo="Abrir" onPress={() => router.push('/diario')} />
        </View>
        {mes.diasAnotados ? (
          <>
            <Texto style={{ fontSize: 14 }}>
              <Texto style={{ fontFamily: fonte.negrito, color: cores.texto, fontSize: 14 }}>{mes.diasAnotados}</Texto> {mes.diasAnotados === 1 ? 'dia anotado' : 'dias anotados'}
              {mes.conquistas ? (
                <>
                  {' · '}
                  <Texto style={{ fontFamily: fonte.negrito, color: cores.solTexto, fontSize: 14 }}>⭐ {mes.conquistas}</Texto> {mes.conquistas === 1 ? 'conquista' : 'conquistas'}
                </>
              ) : null}
            </Texto>
            <HumorDoMes humor={mes.humor} />
            {mes.areasMaisMarcadas.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                <Texto variante="legenda">Mais observado:</Texto>
                {mes.areasMaisMarcadas.map((a) => (
                  <Chip key={a} texto={rotuloAreaDiario(a)} tom="neutro" />
                ))}
              </View>
            ) : null}
          </>
        ) : (
          <Texto style={{ fontSize: 14 }}>Anote o dia a dia de {nome} no Diário e o resumo do mês aparece aqui.</Texto>
        )}
      </Card>

      {triagens.length ? (
        <Texto variante="rotulo" style={{ fontSize: 16, marginTop: 6 }}>
          Triagens
        </Texto>
      ) : null}
      <View style={{ gap: 10 }}>
        {triagens.map((t, i) => {
          const faixa = FAIXAS.find((f) => f.id === t.faixaId);
          const areaFoco = t.resultado.areaFoco ? ROTULO_AREA[t.resultado.areaFoco] : null;
          return (
            <View key={t.id} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ alignItems: 'center', width: 18 }}>
                <View style={[s.marco, i === 0 && { backgroundColor: cores.marca, borderColor: cores.marca }]} />
                {i < triagens.length - 1 ? <View style={s.trilho} /> : null}
              </View>
              <Card style={{ flex: 1, padding: 14, gap: 4, borderRadius: raio.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <Texto variante="rotulo">
                    {formatarDataCurta(new Date(t.criadaEm))} {new Date(t.criadaEm).getFullYear()}
                  </Texto>
                  <Chip texto={TEXTOS_RESULTADO[t.resultado.nivel].rotulo} tom={t.resultado.nivel} />
                </View>
                <Texto variante="legenda">
                  Faixa {faixa?.rotulo}
                  {areaFoco && t.resultado.nivel !== 'esperado' ? ` · ${areaFoco}` : ''}
                </Texto>
                <Botao variante="texto" titulo="Ver resultado" onPress={() => router.push({ pathname: '/resultado', params: { id: t.id } })} />
              </Card>
            </View>
          );
        })}
      </View>

      {ultima ? (
        <Card style={s.proxima}>
        <Icone nome="relogio" cor={cores.marca} tamanho={18} />
        <Texto style={{ flex: 1, fontSize: 13.5 }}>
          {proxima.disponivel ? (
            <Texto style={{ fontFamily: fonte.semi, color: cores.texto, fontSize: 13.5 }}>Uma nova triagem já está disponível.</Texto>
          ) : (
            <>
              Próxima triagem em <Texto style={{ fontFamily: fonte.semi, color: cores.texto, fontSize: 13.5 }}>{formatarDataCurta(proxima.data)}</Texto>.
            </>
          )}
        </Texto>
      </Card>
      ) : null}
      <Botao titulo={ultima ? 'Fazer nova triagem' : 'Fazer a primeira triagem'} onPress={() => router.push('/triagem')} />

      <View style={{ gap: 10, marginTop: 8 }}>
        <Texto variante="rotulo" style={{ fontSize: 16 }}>
          Missões feitas ({conclusoes.length})
        </Texto>
        {conclusoes.length === 0 ? <Texto>As missões concluídas aparecem aqui.</Texto> : null}
        {conclusoes.slice(0, 10).map((c) => (
          <View key={c.id} style={s.conclusao}>
            <Icone nome="check" cor={cores.marca} tamanho={16} espessura={2.6} />
            <Texto style={{ flex: 1, color: cores.texto, fontSize: 14 }}>{MISSOES.find((m) => m.id === c.missaoId)?.titulo ?? 'Missão'}</Texto>
            <Texto variante="legenda">
              {formatarDataCurta(new Date(c.em))} · {ROTULO_COMO_FOI[c.como]}
            </Texto>
          </View>
        ))}
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  marco: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: tema('#D3DEDD', '#3A4849'), backgroundColor: cores.superficie, marginTop: 16 },
  trilho: { flex: 1, width: 2, backgroundColor: cores.fundo2, marginTop: 4, marginBottom: -14 },
  proxima: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: raio.lg, backgroundColor: cores.marcaSuave, boxShadow: 'none' },
  barra: { height: 9, borderRadius: 5, backgroundColor: cores.fundo2, overflow: 'hidden' },
  conclusao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
});
