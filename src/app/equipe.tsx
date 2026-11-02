import { Redirect, useRouter } from 'expo-router';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { BarraInferior, Icone, irPara, ItemLista } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, Card, SetaDireita } from '@/components/ui';
import { CabecaFalante } from '@/components/animacao';
import { FAIXAS } from '@/content/perguntas';
import { RESPONSAVEL_TECNICA } from '@/content/resultados';
import { formatarDataCurta, proximaTriagem } from '@/domain/acompanhamento';
import { linkWhatsAppGeral } from '@/domain/contato';
import { formatarIdade, idadeDe } from '@/domain/idade';
import { faixaPara } from '@/domain/triagem';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { cores, fonte, raio, sombra, toque } from '@/theme/tokens';

const INICIAIS = RESPONSAVEL_TECNICA.nome
  .split(' ')
  .filter((p) => p.length > 2)
  .map((p) => p[0])
  .slice(0, 2)
  .join('');

export default function Equipe() {
  const router = useRouter();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);

  if (!criancaAtual) return <Redirect href="/" />;

  const nome = criancaAtual.apelido;
  const meses = idadeDe(criancaAtual);
  const proxima = proximaTriagem(criancaAtual, dados?.triagens[0] ?? null);
  const faixa = faixaPara(meses) ?? FAIXAS[FAIXAS.length - 1];
  const perguntas = faixa.perguntas.length;
  const selo = { primeira: 'Primeira triagem', nova_faixa: 'Nova faixa de idade liberada', observar: 'Hora de rever', avaliar: 'Triagem disponível' }[proxima.motivo];

  return (
    <Tela rodape={<BarraInferior />}>
      <Texto variante="titulo" style={{ color: cores.texto, marginTop: 4 }}>
        Sua equipe Fono Inova
      </Texto>
      <Texto style={{ marginTop: -8 }}>Quem cuida do conteúdo do app e como falar com a clínica.</Texto>

      <Card style={s.rt}>
        <View style={s.iniciais}>
          <Texto style={{ fontFamily: fonte.extra, color: cores.marca, fontSize: 18 }}>{INICIAIS}</Texto>
        </View>
        <View style={{ flex: 1 }}>
          <Texto variante="legenda">Responsável técnica</Texto>
          <Texto variante="rotulo" style={{ fontSize: 14.5 }}>
            {RESPONSAVEL_TECNICA.nome}
          </Texto>
          <Texto variante="legenda">Fonoaudióloga · {RESPONSAVEL_TECNICA.registro}</Texto>
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          registrarEvento({ tipo: 'whatsapp_aberto', origem: 'geral' });
          Linking.openURL(linkWhatsAppGeral('geral', formatarIdade(meses))).catch((e) => console.error('[equipe] WhatsApp', e));
        }}
        style={({ pressed }) => [s.whats, pressed && toque]}
      >
        <View style={s.whatsIcone}>
          <Icone nome="chat" cor="#fff" tamanho={20} />
        </View>
        <View style={{ flex: 1 }}>
          <Texto style={{ fontFamily: fonte.negrito, fontSize: 14.5, color: '#fff' }}>Conversar com a equipe</Texto>
          <Texto style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}>Resposta no WhatsApp em horário comercial</Texto>
        </View>
        <SetaDireita />
      </Pressable>

      <View style={s.heroi}>
        <View style={{ paddingTop: 12, paddingBottom: 34 }}>
          <CabecaFalante tamanho={230} />
        </View>
        <View style={s.heroiCartao}>
          {proxima.disponivel ? (
            <>
              <View style={s.selo}>
                <Texto style={{ fontFamily: fonte.semi, fontSize: 12, color: cores.solTexto }}>{selo}</Texto>
              </View>
              <Texto style={s.heroiTitulo}>
                Vamos ver como {nome} está {meses < 24 ? `com ${formatarIdade(meses)}` : `aos ${formatarIdade(meses)}`}?
              </Texto>
              <Texto variante="legenda" style={{ fontSize: 12.5 }}>
                {perguntas} perguntas · 3 minutos · fica só no seu celular
              </Texto>
              <View style={{ marginTop: 6 }}>
                <Botao titulo="Iniciar triagem" icone={null} onPress={() => router.push('/triagem')} />
              </View>
            </>
          ) : (
            <>
              <Texto style={s.heroiTitulo}>Próxima triagem em {formatarDataCurta(proxima.data)}</Texto>
              <Texto variante="legenda" style={{ fontSize: 12.5 }}>
                Enquanto isso, as missões da trilha ajudam {nome} a avançar.
              </Texto>
              <Botao variante="texto" titulo="Ver a evolução" onPress={() => irPara(router, '/historico')} />
            </>
          )}
        </View>
      </View>

      <Card style={{ paddingVertical: 4 }}>
        <ItemLista icone="pessoa" titulo="Crianças e privacidade" descricao="Trocar, adicionar ou apagar dados" onPress={() => router.push('/perfil')} />
        <View style={{ height: 1, backgroundColor: cores.linha, marginHorizontal: 16 }} />
        <ItemLista icone="info" titulo="Sobre o app" descricao="De onde vêm as perguntas e termos" onPress={() => router.push('/sobre')} />
      </Card>

      <Texto variante="legenda" style={{ textAlign: 'center', paddingHorizontal: 10 }}>
        A triagem orienta e não substitui uma avaliação profissional.
      </Texto>
    </Tela>
  );
}

const s = StyleSheet.create({
  heroi: { borderRadius: raio.xxl, backgroundColor: cores.ilustracao, overflow: 'hidden', boxShadow: sombra.card },
  heroiCartao: { marginTop: -30, marginHorizontal: 10, marginBottom: 10, borderRadius: 22, backgroundColor: cores.superficie, padding: 16, gap: 6 },
  heroiTitulo: { fontFamily: fonte.extra, fontSize: 18, lineHeight: 23, letterSpacing: -0.3, color: cores.texto },
  selo: { alignSelf: 'flex-start', height: 26, paddingHorizontal: 11, borderRadius: raio.pill, backgroundColor: cores.solFundo, justifyContent: 'center' },
  rt: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: raio.lg },
  iniciais: { width: 56, height: 56, borderRadius: 19, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
  whats: { borderRadius: 22, backgroundColor: cores.marca, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, boxShadow: sombra.botao },
  whatsIcone: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
});
