import { Redirect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { BarraInferior, Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Chip } from '@/components/ui';
import { ROTULO_AREA } from '@/content/perguntas';
import { idadeDe } from '@/domain/idade';
import { missoesParaIdade, montarTrilha } from '@/domain/missoes';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

export default function Trilha() {
  const router = useRouter();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);

  if (!criancaAtual) return <Redirect href="/" />;

  const nome = criancaAtual.apelido;
  const ultima = dados?.triagens[0] ?? null;
  const missoes = missoesParaIdade(idadeDe(criancaAtual), ultima?.resultado.areaFoco);
  const trilha = montarTrilha(missoes, dados?.conclusoes ?? []);
  const feitas = trilha.filter((t) => t.feitas > 0).length;
  const progresso = trilha.length ? feitas / trilha.length : 0;

  return (
    <Tela rodape={<BarraInferior />}>
      <View style={{ gap: 4, marginTop: 4 }}>
        <Texto variante="titulo" style={{ color: cores.marcaEscura }}>
          Trilha de {nome}
        </Texto>
        <Texto>Cada missão concluída abre a próxima.</Texto>
      </View>

      <View style={s.progresso}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            {feitas} de {trilha.length} missões
          </Texto>
          {ultima?.resultado.areaFoco ? <Chip texto={`Foco: ${ROTULO_AREA[ultima.resultado.areaFoco].toLowerCase()}`} /> : null}
        </View>
        <View style={s.barra}>
          <View style={[s.barraCheia, { width: `${Math.round(progresso * 100)}%` }]} />
        </View>
      </View>

      <View style={{ gap: 10 }}>
        {trilha.map(({ missao, liberada, feitas: vezes }, i) => (
          <Pressable
            key={missao.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: !liberada }}
            accessibilityLabel={`${missao.titulo}${liberada ? '' : ', bloqueada'}${vezes ? ', concluída' : ''}`}
            disabled={!liberada}
            onPress={() => router.push({ pathname: '/missao/[id]', params: { id: missao.id } })}
            style={({ pressed }) => [s.missao, !liberada && s.missaoTrancada, pressed && { opacity: 0.8 }]}
          >
            <View style={[s.numero, vezes > 0 && { backgroundColor: cores.marca }, !liberada && { backgroundColor: cores.fundo2 }]}>
              {vezes > 0 ? (
                <Icone nome="check" cor="#fff" tamanho={18} espessura={2.6} />
              ) : liberada ? (
                <Texto style={{ fontFamily: fonte.extra, color: cores.marca, fontSize: 15 }}>{i + 1}</Texto>
              ) : (
                <Icone nome="cadeado" cor={cores.texto3} tamanho={17} />
              )}
            </View>
            <View style={{ flex: 1 }}>
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
        ))}
      </View>

      {missoes.length < 6 ? (
        <Texto variante="legenda" style={{ textAlign: 'center' }}>
          Novas missões aparecem conforme {nome} cresce.
        </Texto>
      ) : null}
    </Tela>
  );
}

const s = StyleSheet.create({
  progresso: { gap: 10, padding: 16, borderRadius: raio.xl, backgroundColor: cores.superficie, boxShadow: sombra.card },
  barra: { height: 9, borderRadius: 5, backgroundColor: cores.fundo2, overflow: 'hidden' },
  barraCheia: { height: '100%', borderRadius: 5, backgroundColor: cores.marca },
  missao: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: raio.lg, backgroundColor: cores.superficie, boxShadow: sombra.card },
  missaoTrancada: { backgroundColor: 'rgba(255,255,255,0.5)', boxShadow: 'none', borderWidth: 1, borderColor: cores.linha },
  numero: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
});
