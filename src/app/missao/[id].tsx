import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Card, Chip } from '@/components/ui';
import { IlustracaoViva } from '@/components/animacao';
import { chaveDaArea, ilustracaoDaArea, PROPORCAO, videoDaArea } from '@/content/ilustracoes';
import { MISSOES } from '@/content/missoes';
import { formatarIdade, idadeDe } from '@/domain/idade';
import { useApp } from '@/state/app';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

/** "10 min" → 600 segundos; sem número, 10 minutos. */
function segundosDe(duracao: string) {
  const n = Number.parseInt(duracao, 10);
  return (Number.isFinite(n) && n > 0 ? n : 10) * 60;
}

function relogio(seg: number) {
  return `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;
}

/** Cronômetro regressivo: toque para começar ou pausar. */
function Cronometro({ total }: { total: number }) {
  const [resta, setResta] = useState(total);
  const [rodando, setRodando] = useState(false);

  useEffect(() => {
    if (!rodando) return;
    const t = setInterval(() => setResta((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(t);
  }, [rodando]);

  useEffect(() => {
    if (resta === 0) setRodando(false);
  }, [resta]);

  const acabou = resta === 0;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={acabou ? 'Tempo esgotado. Toque para reiniciar' : rodando ? `Pausar cronômetro, ${relogio(resta)}` : `Iniciar cronômetro, ${relogio(resta)}`}
      onPress={() => {
        if (acabou) setResta(total);
        setRodando((r) => !r && !acabou);
      }}
      style={[s.flutuante, { paddingHorizontal: 14, gap: 6 }, rodando && { backgroundColor: cores.marca }]}
    >
      <Icone nome="cronometro" cor={rodando ? '#fff' : cores.marca} tamanho={16} espessura={2.2} />
      <Texto style={{ fontFamily: fonte.negrito, fontSize: 13, color: rodando ? '#fff' : cores.marca, fontVariant: ['tabular-nums'] }}>{acabou ? 'Pronto!' : relogio(resta)}</Texto>
    </Pressable>
  );
}

export default function MissaoTela() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { criancaAtual } = useApp();
  const missao = MISSOES.find((m) => m.id === id);
  const [feitos, setFeitos] = useState<Set<number>>(new Set());

  if (!missao || !criancaAtual) return <Redirect href="/inicio" />;

  const meses = idadeDe(criancaAtual);
  const menores = missao.versaoMenores && meses < missao.versaoMenores.ateMeses ? missao.versaoMenores.texto : null;
  const alternar = (i: number) =>
    setFeitos((atual) => {
      const novo = new Set(atual);
      if (novo.has(i)) novo.delete(i);
      else novo.add(i);
      return novo;
    });

  return (
    <Tela
      rodape={
        <View style={{ gap: 8 }}>
          <Botao
            titulo="Concluir missão"
            icone={<Icone nome="check" cor="#fff" tamanho={18} espessura={2.6} />}
            onPress={() => router.push({ pathname: '/missao-concluida', params: { id: missao.id } })}
          />
          <Texto variante="legenda" style={{ textAlign: 'center' }}>
            Sempre com um adulto do lado. {missao.quandoParar}
          </Texto>
        </View>
      }
    >
      <View style={s.capa}>
        <IlustracaoViva fonte={ilustracaoDaArea(missao.areas[0])} proporcao={PROPORCAO[chaveDaArea(missao.areas[0])]} video={videoDaArea(missao.areas[0])} style={{ marginTop: 40 }} />
        <View style={[s.capaTopo]}>
          <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))} />
          <Cronometro total={segundosDe(missao.duracao)} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
        <Chip texto={missao.rotuloArea} />
        <Chip texto={`A partir de ${formatarIdade(missao.idadeMinMeses)}`} tom="neutro" />
      </View>
      <Texto variante="titulo" style={{ color: cores.texto, fontSize: 26, lineHeight: 31 }}>
        {missao.titulo}
      </Texto>

      {menores ? (
        <Card style={[s.aviso, { backgroundColor: cores.marcaSuave, boxShadow: 'none' }]}>
          <Texto style={{ fontFamily: fonte.semi, color: cores.marca, fontSize: 14, lineHeight: 20 }}>Para a idade de {criancaAtual.apelido}: {menores}</Texto>
        </Card>
      ) : null}

      <Card style={s.material}>
        <View style={s.materialIcone}>
          <Icone nome="livro" cor={cores.terra} tamanho={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Texto variante="legenda" style={{ fontFamily: fonte.semi }}>
            Você vai precisar de
          </Texto>
          <Texto style={{ color: cores.texto, fontSize: 14, lineHeight: 20 }}>{missao.material}</Texto>
        </View>
      </Card>

      <Card style={{ paddingHorizontal: 20, paddingVertical: 6 }}>
        {missao.passos.map((p, i) => {
          const feito = feitos.has(i);
          const proximo = !feito && [...Array(i).keys()].every((j) => feitos.has(j));
          return (
            <Pressable
              key={i}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: feito }}
              onPress={() => alternar(i)}
              style={[s.passo, i < missao.passos.length - 1 && s.passoLinha]}
            >
              <View style={[s.caixa, feito && { backgroundColor: cores.marca, borderColor: cores.marca }, proximo && { borderColor: cores.marca }]}>
                {feito ? (
                  <Icone nome="check" cor="#fff" tamanho={14} espessura={3} />
                ) : (
                  <Texto style={{ fontFamily: fonte.extra, fontSize: 12, color: proximo ? cores.marca : cores.texto3 }}>{i + 1}</Texto>
                )}
              </View>
              <Texto style={[{ flex: 1, fontSize: 14.5, lineHeight: 21, color: cores.texto }, feito && { color: cores.texto3, textDecorationLine: 'line-through' }]}>{p}</Texto>
            </Pressable>
          );
        })}
      </Card>

      <View style={[s.aviso, { backgroundColor: cores.solFundo, flexDirection: 'row', gap: 10 }]}>
        <Texto style={{ fontSize: 18 }}>💡</Texto>
        <Texto style={{ flex: 1, color: cores.texto, fontSize: 13.5, lineHeight: 20 }}>
          <Texto style={{ fontFamily: fonte.negrito, color: cores.solTexto, fontSize: 13.5 }}>Dica Inova: </Texto>
          {missao.dica}
        </Texto>
      </View>

      {missao.seguranca ? (
        <View style={[s.aviso, { backgroundColor: cores.observarFundo }]}>
          <Texto style={{ color: cores.texto, fontSize: 13.5, lineHeight: 20 }}>
            <Texto style={{ fontFamily: fonte.negrito, color: cores.observarTexto, fontSize: 13.5 }}>Segurança: </Texto>
            {missao.seguranca}
          </Texto>
        </View>
      ) : null}
    </Tela>
  );
}

const s = StyleSheet.create({
  capa: { marginHorizontal: -20, marginTop: -8, borderBottomLeftRadius: raio.xxl, borderBottomRightRadius: raio.xxl, overflow: 'hidden', backgroundColor: cores.ilustracao },
  capaTopo: { position: 'absolute', top: 10, left: 18, right: 18, flexDirection: 'row', justifyContent: 'space-between' },
  flutuante: { height: 44, borderRadius: raio.md, backgroundColor: 'rgba(255,255,255,0.9)', flexDirection: 'row', alignItems: 'center', boxShadow: sombra.card },
  material: { padding: 20, flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: raio.lg },
  materialIcone: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FBE9E2', alignItems: 'center', justifyContent: 'center' },
  passo: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingVertical: 15 },
  passoLinha: { borderBottomWidth: 1, borderBottomColor: cores.linha },
  caixa: { width: 26, height: 26, borderRadius: 9, borderWidth: 2, borderColor: '#D3DEDD', alignItems: 'center', justifyContent: 'center', marginTop: -1 },
  aviso: { padding: 18, borderRadius: raio.lg },
});
