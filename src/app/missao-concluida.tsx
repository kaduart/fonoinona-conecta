import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { Icone, irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Card } from '@/components/ui';
import { MISSOES, ROTULO_COMO_FOI, type ComoFoi } from '@/content/missoes';
import { diasSeguidos, semana, type Conclusao } from '@/domain/missoes';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { novoId, repositorio } from '@/storage/repositorio';
import { cores, fonte, raio } from '@/theme/tokens';

const OPCOES: ComoFoi[] = ['facil', 'com_ajuda', 'dificil'];

export default function MissaoConcluida() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  const [como, setComo] = useState<ComoFoi | null>(null);
  const [salvando, setSalvando] = useState(false);
  // id gerado uma vez: tocar duas vezes não duplica a conclusão
  const [conclusaoId] = useState(novoId);
  const [agora] = useState(() => new Date());

  const missao = MISSOES.find((m) => m.id === id);
  if (!missao || !criancaAtual) return <Redirect href="/inicio" />;

  const nova: Conclusao = { id: conclusaoId, criancaId: criancaAtual.id, missaoId: missao.id, como: como ?? 'facil', em: agora.toISOString() };
  const todas = [nova, ...(dados?.conclusoes ?? []).filter((c) => c.id !== conclusaoId)];
  const naSemana = semana(todas, agora).filter((d) => d.feito).length;
  const seguidos = diasSeguidos(todas, agora);

  async function salvar() {
    if (!como) return;
    setSalvando(true);
    try {
      await repositorio.salvarConclusao({ ...nova, como });
      registrarEvento({ tipo: 'missao_concluida', missaoId: missao!.id, como });
      irPara(router, '/inicio');
    } catch (e) {
      console.error('[missao-concluida] falha ao salvar', e);
      setSalvando(false);
    }
  }

  return (
    <Tela rodape={<Botao titulo="Salvar e voltar ao início" onPress={salvar} desabilitado={!como} carregando={salvando} />}>
      <View style={s.medalhaFora}>
        <View style={s.medalhaMeio}>
          <View style={s.medalha}>
            <Icone nome="estrela" cor="#fff" tamanho={48} espessura={1.8} />
          </View>
        </View>
      </View>

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Texto variante="titulo" style={{ textAlign: 'center' }}>
          Missão cumprida!
        </Texto>
        <Texto style={{ textAlign: 'center' }}>
          Você e {criancaAtual.apelido} completaram {missao.titulo}.
        </Texto>
      </View>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {[
          [String(todas.length), todas.length === 1 ? 'missão' : 'missões'],
          [String(seguidos), seguidos === 1 ? 'dia seguido' : 'dias seguidos'],
          [String(naSemana), 'dias na semana'],
        ].map(([n, r]) => (
          <Card key={r} style={s.estatistica}>
            <Texto style={{ fontFamily: fonte.extra, fontSize: 24, color: cores.marca }}>{n}</Texto>
            <Texto variante="legenda">{r}</Texto>
          </Card>
        ))}
      </View>

      <View style={{ gap: 10, marginTop: 4 }}>
        <Texto variante="rotulo" style={{ textAlign: 'center' }}>
          Como foi para {criancaAtual.apelido}?
        </Texto>
        <View style={s.segmentado} accessibilityRole="radiogroup">
          {OPCOES.map((o) => (
            <Pressable key={o} accessibilityRole="radio" accessibilityState={{ checked: como === o }} onPress={() => setComo(o)} style={[s.segmento, como === o && s.segmentoAtivo]}>
              <Texto style={{ fontFamily: fonte.semi, fontSize: 14, color: como === o ? '#fff' : cores.texto2 }}>{ROTULO_COMO_FOI[o]}</Texto>
            </Pressable>
          ))}
        </View>
        <Texto variante="legenda" style={{ textAlign: 'center' }}>
          Isso ajuda a ajustar as próximas missões.
        </Texto>
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  medalhaFora: { alignSelf: 'center', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(43,181,154,0.08)', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  medalhaMeio: { width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(43,181,154,0.14)', alignItems: 'center', justifyContent: 'center' },
  medalha: { width: 104, height: 104, borderRadius: 52, backgroundColor: cores.marca, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 16px 32px rgba(31, 122, 107, 0.3)' },
  estatistica: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: raio.lg },
  segmentado: { flexDirection: 'row', backgroundColor: cores.superficie, borderRadius: raio.lg, padding: 5, gap: 4, boxShadow: '0px 12px 32px rgba(0,0,0,0.04)' },
  segmento: { flex: 1, height: 44, borderRadius: raio.md, alignItems: 'center', justifyContent: 'center' },
  segmentoAtivo: { backgroundColor: cores.marca },
});
