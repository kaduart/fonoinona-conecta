import { useRouter } from 'expo-router';
import { Image, Linking, StyleSheet, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Card } from '@/components/ui';
import { VERSAO_MISSOES } from '@/content/missoes';
import { VERSAO_CONTEUDO } from '@/content/perguntas';
import { AVISO_RESULTADO, RESPONSAVEL_TECNICA } from '@/content/resultados';
import { linkWhatsAppGeral } from '@/domain/contato';
import { cores, fonte, raio } from '@/theme/tokens';

const SECOES = [
  {
    titulo: 'De onde vêm as perguntas',
    texto: 'Dos marcos do desenvolvimento do CDC (2022), adaptados e revisados pela nossa fonoaudióloga responsável. As missões usam só materiais que toda casa tem.',
  },
  { titulo: 'Orientação, não diagnóstico', texto: AVISO_RESULTADO },
  {
    titulo: 'Privacidade',
    texto: 'As respostas ficam guardadas só no seu celular. Nada vai para a clínica sem você tocar em "Conversar com a equipe", e mesmo assim a mensagem leva apenas um código, sem dados de saúde.',
  },
  { titulo: 'Termos de uso', texto: 'Versão em revisão jurídica. Ficará disponível aqui antes do lançamento.' },
];

export default function Sobre() {
  const router = useRouter();
  const iniciais = RESPONSAVEL_TECNICA.nome
    .split(' ')
    .filter((p) => p.length > 2)
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <Tela
      topo={
        <>
          <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/equipe'))} />
          <Texto variante="rotulo" style={{ fontSize: 17 }}>
            Sobre o app
          </Texto>
        </>
      }
      rodape={
        <Botao
          titulo="Falar com a clínica"
          icone={<Icone nome="chat" cor="#fff" tamanho={20} />}
          onPress={() => {
            registrarEvento({ tipo: 'whatsapp_aberto', origem: 'geral' });
            Linking.openURL(linkWhatsAppGeral()).catch((e) => console.error('[sobre] WhatsApp', e));
          }}
        />
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Image source={require('../../assets/images/marca.png')} style={{ width: 56, height: 56 }} resizeMode="contain" />
        <View>
          <Texto variante="subtitulo">FonoInova Conecta</Texto>
          <Texto variante="legenda">Clínica Fono Inova · Anápolis, GO · v1.0</Texto>
        </View>
      </View>

      <Card style={{ padding: 18, gap: 12 }}>
        <Texto variante="sobretitulo">RESPONSÁVEL TÉCNICA</Texto>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={s.iniciais}>
            <Texto style={{ fontFamily: fonte.extra, color: cores.marca, fontSize: 16 }}>{iniciais}</Texto>
          </View>
          <View style={{ flex: 1 }}>
            <Texto variante="rotulo">{RESPONSAVEL_TECNICA.nome}</Texto>
            <Texto variante="legenda">Fonoaudióloga · {RESPONSAVEL_TECNICA.registro}</Texto>
          </View>
        </View>
        <Texto>Revisa e aprova as perguntas, os resultados e as missões do app.</Texto>
      </Card>

      <View style={{ paddingHorizontal: 4 }}>
        {SECOES.map((sec, i) => (
          <View key={sec.titulo} style={[{ gap: 6, paddingVertical: 16 }, i > 0 && { borderTopWidth: 1, borderTopColor: cores.linha }]}>
            <Texto variante="rotulo">{sec.titulo}</Texto>
            <Texto>{sec.texto}</Texto>
          </View>
        ))}
      </View>

      <Texto variante="legenda" style={{ textAlign: 'center' }}>
        Conteúdo {VERSAO_CONTEUDO} · Missões {VERSAO_MISSOES}
      </Texto>
    </Tela>
  );
}

const s = StyleSheet.create({
  iniciais: { width: 48, height: 48, borderRadius: 14, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
});
