import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { CelebracaoConquista } from '@/components/animacao';
import { Icone, irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Card, Interruptor } from '@/components/ui';
import { MISSOES, ROTULO_COMO_FOI, type ComoFoi } from '@/content/missoes';
import { marcasDeAtividade } from '@/domain/diario';
import { diasSeguidos, faseConquistada, META_SEMANAL, missaoDesbloqueada, missoesParaIdade, montarTrilha, ponteProposito, semana, type Conclusao } from '@/domain/missoes';
import { idadeDe } from '@/domain/idade';
import { tocar, useSomAoAbrir } from '@/servicos/sons';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { novoId, repositorio } from '@/storage/repositorio';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

const OPCOES: ComoFoi[] = ['facil', 'com_ajuda', 'dificil'];

export default function MissaoConcluida() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  const [como, setComo] = useState<ComoFoi | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [anotar, setAnotar] = useState(false);
  // id gerado uma vez: tocar duas vezes não duplica a conclusão
  const [conclusaoId] = useState(novoId);
  const [agora] = useState(() => new Date());

  useSomAoAbrir('missao', true, 250);

  const missao = MISSOES.find((m) => m.id === id);
  if (!missao || !criancaAtual) return <Redirect href="/inicio" />;

  const nova: Conclusao = { id: conclusaoId, criancaId: criancaAtual.id, missaoId: missao.id, como: como ?? 'facil', em: agora.toISOString() };
  const todas = [nova, ...(dados?.conclusoes ?? []).filter((c) => c.id !== conclusaoId)];
  const atividade = [...todas, ...marcasDeAtividade(dados?.diario ?? [])];
  const naSemana = semana(atividade, agora).filter((d) => d.feito).length;
  const seguidos = diasSeguidos(atividade, agora);
  const ultima = dados?.triagens[0] ?? null;
  const missoesIdade = missoesParaIdade(idadeDe(criancaAtual), ultima?.resultado.areaFoco);
  const ponte = ponteProposito(missao, criancaAtual.apelido, missoesIdade, todas);

  async function salvar() {
    if (!como) return;
    setSalvando(true);
    try {
      await repositorio.salvarConclusao({ ...nova, como });
      registrarEvento({ tipo: 'missao_concluida', missaoId: missao!.id, como });
      const antes = montarTrilha(missoesIdade, dados?.conclusoes ?? []);
      const depois = montarTrilha(missoesIdade, [{ ...nova, como }, ...(dados?.conclusoes ?? [])]);
      const fase = faseConquistada(antes, depois);
      // meta da semana batida agora (sem medalha, que já tem a sua fanfarra)
      const atividadeAntes = [...(dados?.conclusoes ?? []), ...marcasDeAtividade(dados?.diario ?? [])];
      const antesNaSemana = semana(atividadeAntes, agora).filter((d) => d.feito).length;
      if (!fase && antesNaSemana < META_SEMANAL && naSemana >= META_SEMANAL) void tocar('completo');
      const aberta = missaoDesbloqueada(antes, depois);
      const params = aberta ? { desbloqueou: aberta.id } : {};
      if (anotar) {
        // o Diário abre já com a missão; ao salvar, segue para onde a missão levaria
        const destino = fase ? `/conquista?fase=${fase.numero}${aberta ? `&desbloqueou=${aberta.id}` : ''}` : aberta ? `/trilha?desbloqueou=${aberta.id}` : '/inicio';
        irPara(router, { pathname: '/diario-anotar', params: { missaoId: missao!.id, depois: destino } });
      } else if (fase) {
        irPara(router, { pathname: '/conquista', params: { fase: String(fase.numero), ...params } });
      } else if (aberta) irPara(router, { pathname: '/trilha', params });
      else irPara(router, '/inicio');
    } catch (e) {
      console.error('[missao-concluida] falha ao salvar', e);
      setSalvando(false);
    }
  }

  return (
    <Tela rodape={<Botao titulo="Salvar e continuar" onPress={salvar} desabilitado={!como} carregando={salvando} />}>
      <CelebracaoConquista tamanho={250} />

      <View style={{ alignItems: 'center', gap: 6 }}>
        <Texto variante="titulo" style={{ textAlign: 'center' }}>
          Missão cumprida!
        </Texto>
        <Texto style={{ textAlign: 'center' }}>
          Você e {criancaAtual.apelido} completaram {missao.titulo}.
        </Texto>
      </View>

      <View style={s.ponte}>
        <Texto style={{ fontFamily: fonte.extra, fontSize: 15, lineHeight: 21, color: cores.texto }}>🎉 {ponte.feedback}</Texto>
        {ponte.motivo ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={s.ponteSeta}>
              <Icone nome="seta" cor="#fff" tamanho={14} espessura={2.6} />
            </View>
            <Texto style={{ flex: 1, fontSize: 13.5, lineHeight: 19, color: cores.texto2 }}>{ponte.motivo}</Texto>
          </View>
        ) : null}
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
        <View style={s.opcoes} accessibilityRole="radiogroup">
          {OPCOES.map((o) => (
            <Pressable key={o} accessibilityRole="radio" accessibilityState={{ checked: como === o }} onPress={() => setComo(o)} style={[s.opcao, como === o && s.opcaoAtiva]}>
              <Texto style={{ fontFamily: fonte.semi, fontSize: 14, color: como === o ? '#fff' : cores.texto }}>{ROTULO_COMO_FOI[o]}</Texto>
            </Pressable>
          ))}
        </View>
        <Texto variante="legenda" style={{ textAlign: 'center' }}>
          Isso ajuda a ajustar as próximas missões.
        </Texto>
      </View>

      <Interruptor valor={anotar} onChange={setAnotar} titulo="Anotar no Diário" descricao="Conte em 20 segundos o que você reparou durante a brincadeira." />
    </Tela>
  );
}

const s = StyleSheet.create({
  ponte: { gap: 10, padding: 16, borderRadius: raio.lg, backgroundColor: cores.marcaSuave, borderWidth: 1, borderColor: 'rgba(31,122,107,0.15)' },
  ponteSeta: { width: 26, height: 26, borderRadius: 13, backgroundColor: cores.marca, alignItems: 'center', justifyContent: 'center' },
  estatistica: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: raio.lg },
  opcoes: { flexDirection: 'row', gap: 10 },
  opcao: { flex: 1, height: 52, borderRadius: raio.pill, backgroundColor: cores.superficie, borderWidth: 1.5, borderColor: cores.linha, alignItems: 'center', justifyContent: 'center', boxShadow: sombra.card },
  opcaoAtiva: { backgroundColor: cores.marca, borderColor: cores.marca },
});
