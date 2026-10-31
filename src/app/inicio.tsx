import { Redirect, useRouter } from 'expo-router';
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { BarraInferior, Icone, irPara, Marca, SeletorCrianca } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Card } from '@/components/ui';
import { ilustracaoDaArea } from '@/content/ilustracoes';
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

/** Idade curta para a pílula: "8 meses", "2 anos". */
function idadeCurta(meses: number) {
  if (meses < 24) return meses === 1 ? '1 mês' : `${meses} meses`;
  return `${Math.floor(meses / 12)} anos`;
}

function diasAte(data: Date, hoje: Date) {
  return Math.max(1, Math.ceil((data.getTime() - hoje.getTime()) / 86_400_000));
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
  const trilha = montarTrilha(missoesParaIdade(meses, ultima?.resultado.areaFoco), conclusoes);
  const doDia = missaoDoDia(trilha, conclusoes);
  const seguidos = diasSeguidos(conclusoes, hoje);
  const dias = semana(conclusoes, hoje);
  const feitosNaSemana = dias.filter((d) => d.feito).length;
  const dificeis = areasComDificuldade(conclusoes);
  const proxima = proximaTriagem(criancaAtual, ultima, hoje);
  const indice = criancas.findIndex((c) => c.id === criancaAtual.id);

  return (
    <Tela rodape={<BarraInferior />}>
      <View style={s.cabecalho}>
        <Marca />
        <SeletorCrianca nome={nome} idade={idadeCurta(meses)} indice={indice} />
      </View>

      <View>
        <Texto style={{ fontFamily: fonte.media, fontSize: 14, color: cores.texto2 }}>
          {saudacao(hoje.getHours())}, família de {nome} ☀️
        </Texto>
        <Texto style={s.manchete}>Hoje é dia de brincar e conversar juntos.</Texto>
      </View>

      {doDia ? (
        <View style={s.heroi}>
          <Image source={ilustracaoDaArea(doDia.areas[0])} style={s.heroiImagem} resizeMode="cover" accessibilityIgnoresInvertColors />
          <View style={[s.selo, { left: 14 }]}>
            <Icone nome="estrela" cor={cores.marca} tamanho={12} cheio />
            <Texto style={{ fontFamily: fonte.semi, fontSize: 11.5, color: cores.marca }}>Missão do dia</Texto>
          </View>
          {seguidos > 0 ? (
            <View style={[s.selo, { right: 14, backgroundColor: 'rgba(255,255,255,0.9)' }]}>
              <Texto style={{ fontFamily: fonte.negrito, fontSize: 12, color: cores.terra }}>🔥 {seguidos === 1 ? '1 dia' : `${seguidos} dias`}</Texto>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Começar missão ${doDia.titulo}`}
            onPress={() => router.push({ pathname: '/missao/[id]', params: { id: doDia.id } })}
            style={({ pressed }) => [s.heroiCartao, pressed && { opacity: 0.92 }]}
          >
            <View style={{ flex: 1 }}>
              <Texto style={{ fontFamily: fonte.extra, fontSize: 18, letterSpacing: -0.3, color: cores.texto }}>{doDia.titulo}</Texto>
              <Texto variante="legenda" style={{ marginTop: 2 }}>
                {doDia.rotuloArea} · {doDia.duracao} · {doDia.passos.length} passos
              </Texto>
            </View>
            <View style={s.play}>
              <Icone nome="play" cor="#fff" tamanho={22} espessura={0} cheio />
            </View>
          </Pressable>
        </View>
      ) : null}

      <Card style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            Sua semana
          </Texto>
          <Texto variante="legenda">{feitosNaSemana} de 7 dias</Texto>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityLabel={`${feitosNaSemana} dias com missão nesta semana`}>
          {dias.map((d, i) => {
            const ehHoje = i === dias.length - 1;
            return (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[s.dia, d.feito && { backgroundColor: cores.marca }, ehHoje && !d.feito && s.diaHoje]}>
                  {d.feito ? (
                    <Icone nome="check" cor="#fff" tamanho={15} espessura={2.8} />
                  ) : ehHoje ? (
                    <Texto style={{ fontFamily: fonte.negrito, fontSize: 10.5, color: cores.marca }}>hoje</Texto>
                  ) : null}
                </View>
                <Texto variante="legenda" style={ehHoje && { color: cores.marca, fontFamily: fonte.negrito }}>
                  {LETRA_DIA[d.dia.getDay()]}
                </Texto>
              </View>
            );
          })}
        </View>
      </Card>

      {dificeis.length ? (
        <Card style={{ padding: 16, gap: 8, borderWidth: 1, borderColor: cores.observarFundo }}>
          <Texto variante="rotulo">Algumas missões estão difíceis</Texto>
          <Texto>
            As missões de {dificeis.map((a) => ROTULO_AREA[a].toLowerCase()).join(' e ')} têm sido difíceis para {nome}. Vale conversar com a nossa equipe.
          </Texto>
          <Botao
            variante="texto"
            titulo="Conversar com a equipe"
            onPress={() => {
              registrarEvento({ tipo: 'whatsapp_aberto', origem: 'missoes' });
              Linking.openURL(linkWhatsAppGeral('missoes', formatarIdade(meses))).catch((e) => console.error('[inicio] WhatsApp', e));
            }}
          />
        </Card>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => (proxima.disponivel ? router.push('/triagem') : irPara(router, '/historico'))}
        style={({ pressed }) => [s.triagem, pressed && { opacity: 0.85 }]}
      >
        <View style={s.triagemIcone}>
          <Icone nome="relogio" cor="#C98A12" tamanho={20} />
        </View>
        <View style={{ flex: 1 }}>
          {proxima.disponivel ? (
            <>
              <Texto variante="rotulo" style={{ fontSize: 14 }}>
                {proxima.motivo === 'primeira' ? 'Faça a primeira triagem' : 'Nova triagem disponível'}
              </Texto>
              <Texto variante="legenda">{proxima.motivo === 'nova_faixa' ? `${nome} entrou numa nova faixa de idade.` : 'Leva uns 3 minutos.'}</Texto>
            </>
          ) : (
            <>
              <Texto variante="rotulo" style={{ fontSize: 14 }}>
                Nova triagem em {diasAte(proxima.data, hoje)} dias
              </Texto>
              <Texto variante="legenda">{proxima.motivo === 'observar' ? `Em ${formatarDataCurta(proxima.data)}, para ver a evolução.` : `Em ${formatarDataCurta(proxima.data)}, quando ${nome} mudar de faixa.`}</Texto>
            </>
          )}
        </View>
        <Icone nome="seta" cor={cores.texto3} tamanho={16} espessura={2.4} />
      </Pressable>
    </Tela>
  );
}

const s = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 4 },
  manchete: { fontFamily: fonte.extra, fontSize: 25, lineHeight: 30, letterSpacing: -0.6, color: cores.marcaEscura, marginTop: 2 },
  heroi: { borderRadius: raio.xxl, backgroundColor: cores.ilustracao, overflow: 'hidden', boxShadow: sombra.card },
  heroiImagem: { width: '100%', aspectRatio: 418 / 325 },
  selo: { position: 'absolute', top: 14, flexDirection: 'row', alignItems: 'center', gap: 6, height: 26, paddingHorizontal: 11, borderRadius: raio.pill, backgroundColor: cores.marcaSuave },
  heroiCartao: {
    marginTop: -34,
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 22,
    backgroundColor: cores.superficie,
    padding: 14,
    paddingLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0px 10px 24px rgba(60, 45, 20, 0.08)',
  },
  play: { width: 52, height: 52, borderRadius: 18, backgroundColor: cores.marca, alignItems: 'center', justifyContent: 'center', boxShadow: sombra.botao },
  dia: { width: 36, height: 36, borderRadius: 12, backgroundColor: cores.fundo2, alignItems: 'center', justifyContent: 'center' },
  diaHoje: { backgroundColor: 'transparent', borderWidth: 2, borderStyle: 'dashed', borderColor: cores.marca },
  triagem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: raio.lg, backgroundColor: cores.superficie, boxShadow: sombra.card },
  triagemIcone: { width: 40, height: 40, borderRadius: 13, backgroundColor: cores.solFundo, alignItems: 'center', justifyContent: 'center' },
});
