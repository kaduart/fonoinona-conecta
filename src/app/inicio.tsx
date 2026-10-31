import { Redirect, useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Avatar, BarraInferior, Icone, irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Card, Chip } from '@/components/ui';
import { ROTULO_AREA } from '@/content/perguntas';
import { formatarDataCurta, proximaTriagem } from '@/domain/acompanhamento';
import { linkWhatsAppGeral } from '@/domain/contato';
import { formatarIdade, idadeDe } from '@/domain/idade';
import { areasComDificuldade, diasSeguidos, missaoDoDia, missoesParaIdade, montarTrilha, semana } from '@/domain/missoes';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

const LETRA_DIA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function saudacao(h: number) {
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Inicio() {
  const router = useRouter();
  const { criancaAtual, criancas } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);

  if (!criancaAtual) return <Redirect href="/" />;

  const hoje = new Date();
  const nome = criancaAtual.apelido;
  const meses = idadeDe(criancaAtual, hoje);
  const ultima = dados?.triagens[0] ?? null;
  const conclusoes = dados?.conclusoes ?? [];
  const missoes = missoesParaIdade(meses, ultima?.resultado.areaFoco);
  const trilha = montarTrilha(missoes, conclusoes);
  const doDia = missaoDoDia(trilha, conclusoes);
  const seguidos = diasSeguidos(conclusoes, hoje);
  const dias = semana(conclusoes, hoje);
  const dificeis = areasComDificuldade(conclusoes);
  const proxima = proximaTriagem(criancaAtual, ultima, hoje);
  const feitasNaTrilha = trilha.filter((t) => t.feitas > 0).length;
  const indice = criancas.findIndex((c) => c.id === criancaAtual.id);

  return (
    <Tela rodape={<BarraInferior />}>
      <View style={s.cabecalho}>
        <Pressable accessibilityRole="button" accessibilityLabel="Trocar criança" onPress={() => irPara(router, '/perfil')}>
          <Avatar nome={nome} indice={indice} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Texto variante="legenda">{saudacao(hoje.getHours())}</Texto>
          <Texto variante="rotulo" style={{ fontFamily: fonte.extra, fontSize: 17 }}>
            Família de {nome}
          </Texto>
        </View>
        <Chip texto={formatarIdade(meses)} tom="neutro" />
      </View>

      <Card style={s.sequencia}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={s.fogo}>
            <Icone nome="fogo" cor="#fff" tamanho={18} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto variante="rotulo">{seguidos === 1 ? '1 dia seguido' : `${seguidos} dias seguidos`}</Texto>
            <Texto variante="legenda">
              {feitasNaTrilha} de {trilha.length} missões da trilha
            </Texto>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityLabel={`${dias.filter((d) => d.feito).length} dias com missão nesta semana`}>
          {dias.map((d, i) => (
            <View key={i} style={[s.diaBolinha, d.feito && { backgroundColor: cores.marca }]}>
              <Texto style={{ fontSize: 11, fontFamily: fonte.negrito, color: d.feito ? '#fff' : cores.texto3 }}>{LETRA_DIA[d.dia.getDay()]}</Texto>
            </View>
          ))}
        </View>
      </Card>

      {doDia ? (
        <View style={s.destaque}>
          <View pointerEvents="none" style={s.destaqueCirculo} />
          <View style={s.destaqueChip}>
            <Texto style={{ color: '#fff', fontFamily: fonte.semi, fontSize: 12 }}>Missão do dia · {doDia.duracao}</Texto>
          </View>
          <Texto style={s.destaqueTitulo}>{doDia.titulo}</Texto>
          <Texto style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Para estimular {doDia.rotuloArea.toLowerCase()}</Texto>
          <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/missao/[id]', params: { id: doDia.id } })} style={({ pressed }) => [s.destaqueBotao, pressed && { opacity: 0.9 }]}>
            <Texto style={{ fontFamily: fonte.negrito, color: cores.marca, fontSize: 15 }}>Começar missão</Texto>
            <Icone nome="seta" cor={cores.marca} tamanho={16} espessura={2.4} />
          </Pressable>
        </View>
      ) : null}

      {dificeis.length ? (
        <Card style={{ padding: 16, gap: 10, borderWidth: 1, borderColor: cores.observarFundo }}>
          <Texto variante="rotulo">Algumas missões estão difíceis</Texto>
          <Texto>
            As missões de {dificeis.map((a) => ROTULO_AREA[a].toLowerCase()).join(' e ')} têm sido difíceis para {nome}. Vale conversar com a nossa equipe.
          </Texto>
          <Botao
            variante="texto"
            titulo="Conversar com a equipe"
            onPress={() => Linking.openURL(linkWhatsAppGeral('missoes', formatarIdade(meses))).catch((e) => console.error('[inicio] WhatsApp', e))}
          />
        </Card>
      ) : null}

      <Card style={s.triagemCard}>
        <View style={s.triagemIcone}>
          <Icone nome="relogio" cor={cores.marca} tamanho={18} />
        </View>
        <View style={{ flex: 1 }}>
          {proxima.disponivel ? (
            <>
              <Texto variante="rotulo">{proxima.motivo === 'primeira' ? 'Faça a primeira triagem' : 'Nova triagem disponível'}</Texto>
              <Texto variante="legenda">{proxima.motivo === 'nova_faixa' ? `${nome} entrou numa nova faixa de idade.` : 'Leva uns 3 minutos.'}</Texto>
            </>
          ) : (
            <>
              <Texto variante="rotulo">Próxima triagem em {formatarDataCurta(proxima.data)}</Texto>
              <Texto variante="legenda">{proxima.motivo === 'observar' ? 'Para ver a evolução depois das missões.' : `Quando ${nome} mudar de faixa.`}</Texto>
            </>
          )}
        </View>
        {proxima.disponivel ? <Botao variante="texto" titulo="Fazer" onPress={() => router.push('/triagem')} /> : null}
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
        <Texto variante="subtitulo" style={{ fontSize: 19 }}>
          Sua trilha
        </Texto>
        {ultima?.resultado.areaFoco ? <Texto variante="legenda">Foco: {ROTULO_AREA[ultima.resultado.areaFoco].toLowerCase()}</Texto> : null}
      </View>

      <View style={{ gap: 10 }}>
        {trilha.map(({ missao, liberada, feitas }, i) => (
          <Pressable
            key={missao.id}
            accessibilityRole="button"
            accessibilityState={{ disabled: !liberada }}
            accessibilityLabel={`${missao.titulo}${liberada ? '' : ', bloqueada'}${feitas ? ', concluída' : ''}`}
            disabled={!liberada}
            onPress={() => router.push({ pathname: '/missao/[id]', params: { id: missao.id } })}
            style={({ pressed }) => [s.missao, !liberada && s.missaoTrancada, pressed && { opacity: 0.8 }]}
          >
            <View style={[s.missaoNumero, feitas > 0 && { backgroundColor: cores.marca }, !liberada && { backgroundColor: '#EEF1F5' }]}>
              {feitas > 0 ? (
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
                {feitas > 1 ? ` · feita ${feitas}x` : ''}
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
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  sequencia: { padding: 14, gap: 12, borderRadius: raio.lg },
  fogo: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F08A4B', alignItems: 'center', justifyContent: 'center' },
  diaBolinha: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF1F5', alignItems: 'center', justifyContent: 'center' },
  destaque: { backgroundColor: cores.marca, borderRadius: raio.xxl, padding: 22, gap: 8, overflow: 'hidden', boxShadow: '0px 20px 40px rgba(31, 122, 107, 0.25)' },
  destaqueCirculo: { position: 'absolute', right: -50, top: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.08)' },
  destaqueChip: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: raio.pill, paddingHorizontal: 12, height: 28, justifyContent: 'center' },
  destaqueTitulo: { color: '#fff', fontFamily: fonte.extra, fontSize: 26, lineHeight: 30, letterSpacing: -0.5, marginTop: 4 },
  destaqueBotao: { marginTop: 10, height: 50, borderRadius: raio.md, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  triagemCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: raio.lg },
  triagemIcone: { width: 38, height: 38, borderRadius: 12, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
  missao: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: raio.lg, backgroundColor: cores.superficie, boxShadow: sombra.card },
  missaoTrancada: { backgroundColor: 'rgba(255,255,255,0.55)', boxShadow: 'none', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' } as never,
  missaoNumero: { width: 42, height: 42, borderRadius: 14, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
});
