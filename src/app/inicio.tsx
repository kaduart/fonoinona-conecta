import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { BarraInferior, Icone, irPara, Marca, SeletorCrianca } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Numero } from '@/components/numero';
import { Texto } from '@/components/texto';
import { Botao, Card, Chip } from '@/components/ui';
import { TEXTOS_RESULTADO } from '@/content/resultados';
import { contarHabilidades } from '@/domain/triagem';
import { CenaAnimada } from '@/components/animacoes/CenaAnimada';
import { CardRenovacao } from '@/components/CardRenovacao';
import { TherapyTrail } from '@/components/TherapyTrail';
import { feitasNaSemana, progressoCiclo } from '@/domain/casa';
import { cenaDaArea } from '@/content/ilustracoes';
import { ROTULO_AREA } from '@/content/perguntas';
import { formatarDataCurta, proximaTriagem } from '@/domain/acompanhamento';
import { codigoContato, linkWhatsApp, linkWhatsAppGeral } from '@/domain/contato';
import { formatarIdade, idadeDe } from '@/domain/idade';
import { marcasDeAtividade } from '@/domain/diario';
import { areasComDificuldade, diasSeguidos, META_SEMANAL, missaoDoDia, missoesParaIdade, montarTrilha, semana } from '@/domain/missoes';
import { agendarAvisoTriagem } from '@/servicos/lembrete';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { cores, fonte, raio, sombra, toque, vidro, tema } from '@/theme/tokens';

const LETRA_DIA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

function saudacao(h: number) {
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

function diasAte(data: Date, hoje: Date) {
  return Math.max(1, Math.ceil((data.getTime() - hoje.getTime()) / 86_400_000));
}

export default function Inicio() {
  const router = useRouter();
  const { criancaAtual, criancas } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);

  // agenda (ou cancela) o aviso do dia em que a próxima triagem libera; só se a família já liberou notificações
  const ultimaId = dados?.triagens[0]?.id;
  useEffect(() => {
    if (!criancaAtual || !dados) return;
    const p = proximaTriagem(criancaAtual, dados.triagens[0] ?? null);
    void agendarAvisoTriagem(criancaAtual.id, p.data, p.disponivel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [criancaAtual?.id, ultimaId, !!dados]);

  if (!criancaAtual) return <Redirect href="/" />;

  const hoje = new Date();
  const nome = criancaAtual.apelido;
  const meses = idadeDe(criancaAtual, hoje);
  const ultima = dados?.triagens[0] ?? null;
  const conclusoes = dados?.conclusoes ?? [];
  const trilha = montarTrilha(missoesParaIdade(meses, ultima?.resultado.areaFoco), conclusoes);
  const doDia = missaoDoDia(trilha, conclusoes);
  // a sequência conta missão OU Diário: constância também em dia sem brincadeira prática
  const atividade = [...conclusoes, ...marcasDeAtividade(dados?.diario ?? [])];
  const seguidos = diasSeguidos(atividade, hoje);
  const dias = semana(atividade, hoje);
  const feitosNaSemana = dias.filter((d) => d.feito).length;
  const metaBatida = feitosNaSemana >= META_SEMANAL;
  const dificeis = areasComDificuldade(conclusoes);
  const proxima = proximaTriagem(criancaAtual, ultima, hoje);
  const { noEsperado, total } = ultima ? contarHabilidades(ultima.respostas) : { noEsperado: 0, total: 0 };
  const emDesenvolvimento = ultima?.resultado.areas.filter((a) => a.nivel !== 'esperado').map((a) => a.rotulo.toLowerCase()) ?? [];
  function falarComEquipe() {
    if (!ultima) return;
    registrarEvento({ tipo: 'whatsapp_aberto', origem: 'resultado' });
    const url = linkWhatsApp(ultima.resultado.nivel, formatarIdade(ultima.idadeMeses), codigoContato(ultima.id));
    Linking.openURL(url).catch((e) => console.error('[inicio] WhatsApp', e));
  }
  const indice = criancas.findIndex((c) => c.id === criancaAtual.id);
  const ciclo = dados?.ciclo ?? null;
  const pCiclo = ciclo ? progressoCiclo(ciclo) : null;
  const atividadesCasa = dados?.atividades ?? [];
  const casaFeitas = atividadesCasa.reduce((n, a) => n + Math.min(feitasNaSemana(a.id, dados?.diario ?? [], hoje), a.vezesSemana), 0);
  const casaMeta = atividadesCasa.reduce((n, a) => n + a.vezesSemana, 0);

  return (
    <Tela rodape={<BarraInferior />}>
      <View style={s.cabecalho}>
        <Marca />
        <SeletorCrianca nome={nome} idade={formatarIdade(meses)} indice={indice} />
      </View>

      <View>
        <Texto style={{ fontFamily: fonte.media, fontSize: 14, color: cores.texto2 }}>
          {saudacao(hoje.getHours())}, família de {nome} ☀️
        </Texto>
        <Texto style={s.manchete}>Hoje é dia de brincar e conversar juntos.</Texto>
      </View>

      {/* gatilho de 80%: salta no topo quando faltam até 20% das sessões do ciclo */}
      {pCiclo?.estagio === 'quase' ? <CardRenovacao restantes={pCiclo.restantes} /> : null}

      {doDia ? (
        <View style={s.heroi}>
          <CenaAnimada cena={cenaDaArea(doDia.areas[0])} fundo={false} style={{ marginTop: 18 }} />
          <View style={[s.selo, { left: 14 }]}>
            <Icone nome="estrela" cor={cores.marca} tamanho={12} cheio />
            <Texto style={{ fontFamily: fonte.semi, fontSize: 12, color: cores.marca }}>Missão do dia</Texto>
          </View>
          {seguidos > 0 ? (
            <View style={[s.selo, { right: 14, backgroundColor: vidro(0.9) }]}>
              <Texto style={{ fontFamily: fonte.negrito, fontSize: 12, color: cores.terraTexto }}>🔥 {seguidos === 1 ? '1 dia' : `${seguidos} dias`}</Texto>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Começar missão ${doDia.titulo}`}
            onPress={() => router.push({ pathname: '/missao/[id]', params: { id: doDia.id } })}
            style={({ pressed }) => [s.heroiCartao, pressed && toque]}
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

      {ultima ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver resultado completo da última triagem"
          onPress={() => router.push({ pathname: '/resultado', params: { id: ultima.id } })}
          style={({ pressed }) => [s.resultado, pressed && toque]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Texto variante="legenda" numberOfLines={1} style={{ flexShrink: 1 }}>
              Triagem · {formatarDataCurta(new Date(ultima.criadaEm))}
            </Texto>
            <Chip texto={TEXTOS_RESULTADO[ultima.resultado.nivel].rotulo} tom={ultima.resultado.nivel} />
          </View>
          <Texto style={{ fontFamily: fonte.extra, fontSize: 17, lineHeight: 22, color: cores.texto }}>
            {noEsperado} de {total} habilidades no esperado
          </Texto>
          {emDesenvolvimento.length ? (
            <Texto style={{ fontSize: 13.5, lineHeight: 19 }}>
              Ainda em desenvolvimento: {emDesenvolvimento.length === 1 ? emDesenvolvimento[0] : `${emDesenvolvimento.slice(0, -1).join(', ')} e ${emDesenvolvimento[emDesenvolvimento.length - 1]}`}.
            </Texto>
          ) : (
            <Texto style={{ fontSize: 13.5, lineHeight: 19 }}>Tudo no esperado para a idade. As missões ajudam {nome} a seguir assim.</Texto>
          )}
          {ultima.resultado.areaFoco ? (
            <View style={s.foco}>
              <Icone nome="estrela" cor={cores.marca} tamanho={13} cheio />
              <Texto style={{ flex: 1, fontSize: 13, lineHeight: 18, color: cores.texto }}>
                As missões de {nome} agora dão foco em <Texto style={{ fontFamily: fonte.negrito, fontSize: 13, color: cores.texto }}>{ROTULO_AREA[ultima.resultado.areaFoco].toLowerCase()}</Texto>.
              </Texto>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Texto style={{ fontFamily: fonte.negrito, fontSize: 14, color: cores.marca }}>Ver resultado completo</Texto>
            <Icone nome="seta" cor={cores.marca} tamanho={14} espessura={2.6} />
          </View>
          {ultima.resultado.nivel === 'avaliar' ? (
            <Botao titulo="Conversar com a equipe" onPress={falarComEquipe} />
          ) : ultima.resultado.nivel === 'observar' ? (
            <Pressable accessibilityRole="link" onPress={falarComEquipe} hitSlop={8}>
              <Texto variante="legenda" style={{ marginTop: 2 }}>
                Ficou com dúvida? <Texto variante="legenda" style={{ fontFamily: fonte.negrito, color: cores.marca, textDecorationLine: 'underline' }}>Fale com a equipe</Texto>
              </Texto>
            </Pressable>
          ) : null}
        </Pressable>
      ) : null}

      <Card style={{ padding: 20, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            Sua semana
          </Texto>
          <View style={[s.chama, seguidos === 0 && { backgroundColor: cores.fundo2 }]} accessibilityLabel={`${seguidos} dias seguidos`}>
            <Texto style={{ fontFamily: fonte.negrito, fontSize: 12, color: seguidos ? cores.terraTexto : cores.texto3 }}>
              {seguidos ? '🔥 ' : ''}
              {seguidos === 1 ? '1 dia seguido' : `${seguidos} dias seguidos`}
            </Texto>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityLabel={`${feitosNaSemana} dias com missão ou Diário nesta semana`}>
          {dias.map((d, i) => {
            const ehHoje = i === dias.length - 1;
            return (
              <View key={i} style={{ alignItems: 'center', gap: 4 }}>
                <View style={[s.dia, d.feito && { backgroundColor: cores.marca }, ehHoje && !d.feito && s.diaHoje]}>
                  {d.feito ? (
                    <Icone nome="check" cor="#fff" tamanho={15} espessura={2.8} />
                  ) : ehHoje ? (
                    <Texto style={{ fontFamily: fonte.negrito, fontSize: 12, color: cores.marca }}>hoje</Texto>
                  ) : null}
                </View>
                <Texto variante="legenda" style={ehHoje && { color: cores.marca, fontFamily: fonte.negrito }}>
                  {LETRA_DIA[d.dia.getDay()]}
                </Texto>
              </View>
            );
          })}
        </View>
        <View style={s.meta}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: cores.texto }}>
              {metaBatida ? 'Meta da semana batida! 🎉' : `Meta: ${META_SEMANAL} dias na semana`}
            </Texto>
            <View style={{ flexDirection: 'row' }} accessible accessibilityLabel={`${Math.min(feitosNaSemana, META_SEMANAL)} de ${META_SEMANAL}`}>
              <Numero valor={Math.min(feitosNaSemana, META_SEMANAL)} style={{ fontFamily: fonte.negrito, fontSize: 12.5, lineHeight: 18, color: metaBatida ? cores.marca : cores.texto2 }} />
              <Texto variante="legenda" style={{ fontFamily: fonte.negrito, color: metaBatida ? cores.marca : cores.texto2 }}>
                /{META_SEMANAL}
              </Texto>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {Array.from({ length: META_SEMANAL }, (_, i) => (
              <View key={i} style={[s.metaPasso, i < feitosNaSemana && { backgroundColor: cores.marca }]} />
            ))}
          </View>
          {!metaBatida ? (
            <Texto variante="legenda">
              {META_SEMANAL - feitosNaSemana === 1 ? 'Falta 1 dia' : `Faltam ${META_SEMANAL - feitosNaSemana} dias`} para fechar a semana com {nome}.
            </Texto>
          ) : null}
        </View>
      </Card>

      <Pressable accessibilityRole="button" accessibilityLabel="Abrir o ciclo de sessões" onPress={() => router.push('/ciclo')} style={({ pressed }) => [s.resultado, pressed && toque]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            Ciclo de sessões{ciclo ? ` · fase ${ciclo.fase}` : ''}
          </Texto>
          {pCiclo ? (
            <Texto style={{ fontFamily: fonte.negrito, fontSize: 13, color: cores.marca }}>
              {pCiclo.feitas}/{pCiclo.total}
            </Texto>
          ) : null}
        </View>
        {pCiclo ? (
          <TherapyTrail total={pCiclo.total} feitas={pCiclo.feitas} compacto />
        ) : (
          <Texto variante="legenda">Marque cada sessão na clínica e acompanhe a trilha do pacote.</Texto>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Texto style={{ fontFamily: fonte.negrito, fontSize: 14, color: cores.marca }}>{pCiclo ? (pCiclo.estagio === 'completo' ? 'Ver fase concluída' : 'Marcar sessão') : 'Começar a trilha'}</Texto>
          <Icone nome="seta" cor={cores.marca} tamanho={14} espessura={2.6} />
        </View>
      </Pressable>

      <Pressable accessibilityRole="button" accessibilityLabel="Abrir as atividades de casa" onPress={() => router.push('/casa')} style={({ pressed }) => [s.triagem, pressed && toque]}>
        <View style={[s.triagemIcone, { backgroundColor: cores.marcaSuave }]}>
          <Icone nome="casa" cor={cores.marca} tamanho={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Texto variante="rotulo" style={{ fontSize: 14 }}>
            Para fazer em casa
          </Texto>
          <Texto variante="legenda">{atividadesCasa.length ? `${casaFeitas} de ${casaMeta} nesta semana` : 'Anote o que a terapeuta pediu e marque “Fizemos!”'}</Texto>
        </View>
        <Icone nome="seta" cor={cores.texto3} tamanho={16} espessura={2.4} />
      </Pressable>

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
        style={({ pressed }) => [s.triagem, pressed && toque]}
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
  manchete: { fontFamily: fonte.extra, fontSize: 25, lineHeight: 30, letterSpacing: -0.6, color: cores.texto, marginTop: 2 },
  heroi: { borderRadius: raio.xxl, backgroundColor: cores.ilustracao, overflow: 'hidden', boxShadow: sombra.card },
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
    boxShadow: '0px 10px 24px rgba(44, 62, 63, 0.08)',
  },
  play: { width: 52, height: 52, borderRadius: 18, backgroundColor: cores.marca, alignItems: 'center', justifyContent: 'center', boxShadow: sombra.botao },
  chama: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 26, paddingHorizontal: 10, borderRadius: raio.pill, backgroundColor: tema('#FCE9E3', '#3A231C') },
  meta: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: cores.linha },
  metaPasso: { flex: 1, height: 8, borderRadius: 4, backgroundColor: cores.fundo2 },
  dia: { width: 36, height: 36, borderRadius: 12, backgroundColor: cores.fundo2, alignItems: 'center', justifyContent: 'center' },
  diaHoje: { backgroundColor: 'transparent', borderWidth: 2, borderStyle: 'dashed', borderColor: cores.marca },
  resultado: { gap: 8, padding: 16, borderRadius: raio.lg, backgroundColor: cores.superficie, boxShadow: sombra.card },
  foco: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, backgroundColor: cores.marcaSuave },
  triagem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: raio.lg, backgroundColor: cores.superficie, boxShadow: sombra.card },
  triagemIcone: { width: 40, height: 40, borderRadius: 13, backgroundColor: cores.solFundo, alignItems: 'center', justifyContent: 'center' },
});
