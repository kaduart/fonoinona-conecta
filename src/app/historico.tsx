import { Redirect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';

import { BarraInferior, Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Card, Chip } from '@/components/ui';
import { MISSOES, ROTULO_COMO_FOI } from '@/content/missoes';
import { FAIXAS, ROTULO_AREA } from '@/content/perguntas';
import { TEXTOS_RESULTADO } from '@/content/resultados';
import { formatarDataCurta, proximaTriagem } from '@/domain/acompanhamento';
import { diasSeguidos } from '@/domain/missoes';
import type { NivelResultado } from '@/domain/triagem';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import type { TriagemSalva } from '@/storage/repositorio';
import { cores, fonte, raio } from '@/theme/tokens';

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
      <Path d={d} stroke={cores.marca} strokeWidth={3} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      {pontos.map((p, i) => {
        const data = new Date(p.criadaEm);
        return (
          <G key={p.id}>
            <Circle cx={x(i)} cy={y(p.resultado.nivel)} r={6} fill="#fff" stroke={COR[p.resultado.nivel]} strokeWidth={3} />
            <SvgText x={x(i)} y={126} fontSize={10} fontFamily={fonte.media} fill={cores.texto3} textAnchor="middle">
              {MESES[data.getMonth()]}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

function Numero({ valor, rotulo, cor }: { valor: number; rotulo: string; cor: string }) {
  return (
    <Card style={{ flex: 1, padding: 14, gap: 2, borderRadius: raio.lg }}>
      <Texto style={{ fontFamily: fonte.extra, fontSize: 24, color: cor }}>{valor}</Texto>
      <Texto variante="legenda">{rotulo}</Texto>
    </Card>
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
  const seguidos = diasSeguidos(conclusoes, new Date());
  const missoesDiferentes = new Set(conclusoes.map((c) => c.missaoId)).size;
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
        <Card style={{ padding: 18, gap: 8 }}>
          <Texto variante="rotulo">Nenhuma triagem ainda</Texto>
          <Texto>Faça a primeira para acompanhar a evolução de {nome}.</Texto>
        </Card>
      )}

      {areas.length ? (
        <Card style={{ padding: 16, gap: 12 }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            Por habilidade
          </Texto>
          {areas.map((a) => (
            <View key={a.area} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: cores.texto }}>{a.rotulo}</Texto>
                <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: TOM_AREA[a.nivel].texto }}>{TOM_AREA[a.nivel].rotulo}</Texto>
              </View>
              <View style={s.barra}>
                <View style={[s.barraCheia, { width: `${Math.max(8, a.pontuacao)}%`, backgroundColor: TOM_AREA[a.nivel].cor }]} />
              </View>
            </View>
          ))}
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Numero valor={conclusoes.length} rotulo={conclusoes.length === 1 ? 'missão feita' : 'missões feitas'} cor={cores.marca} />
        <Numero valor={seguidos} rotulo={seguidos === 1 ? 'dia seguido' : 'dias seguidos'} cor={cores.terra} />
        <Numero valor={missoesDiferentes} rotulo={missoesDiferentes === 1 ? 'missão diferente' : 'missões diferentes'} cor="#C98A12" />
      </View>

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
      <Botao titulo="Fazer nova triagem" onPress={() => router.push('/triagem')} />

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
  marco: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#D3DEDD', backgroundColor: '#fff', marginTop: 16 },
  trilho: { flex: 1, width: 2, backgroundColor: cores.fundo2, marginTop: 4, marginBottom: -14 },
  proxima: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: raio.lg, backgroundColor: cores.marcaSuave, boxShadow: 'none' },
  barra: { height: 9, borderRadius: 5, backgroundColor: cores.fundo2, overflow: 'hidden' },
  barraCheia: { height: '100%', borderRadius: 5 },
  conclusao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
});
