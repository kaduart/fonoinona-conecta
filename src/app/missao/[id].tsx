import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Card, Chip } from '@/components/ui';
import { MISSOES } from '@/content/missoes';
import { idadeDe } from '@/domain/idade';
import { useApp } from '@/state/app';
import { cores, fonte, raio } from '@/theme/tokens';

export default function MissaoTela() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { criancaAtual } = useApp();
  const missao = MISSOES.find((m) => m.id === id);

  if (!missao || !criancaAtual) return <Redirect href="/inicio" />;

  const meses = idadeDe(criancaAtual);
  const menores = missao.versaoMenores && meses < missao.versaoMenores.ateMeses ? missao.versaoMenores.texto : null;

  return (
    <Tela
      topo={<BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/inicio'))} />}
      rodape={
        <Botao
          titulo="Concluir missão"
          icone={<Icone nome="check" cor="#fff" tamanho={18} espessura={2.6} />}
          onPress={() => router.push({ pathname: '/missao-concluida', params: { id: missao.id } })}
        />
      }
    >
      <View style={s.ilustracao}>
        <View style={s.ilustracaoAnel}>
          <Icone nome="estrela" cor={cores.marca} tamanho={44} espessura={1.6} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Chip texto={missao.rotuloArea} />
        <Chip texto={missao.duracao} tom="neutro" />
      </View>
      <Texto variante="titulo">{missao.titulo}</Texto>

      {menores ? (
        <Card style={[s.aviso, { backgroundColor: cores.marcaSuave }]}>
          <Texto style={{ fontFamily: fonte.semi, color: cores.marca, fontSize: 14, lineHeight: 20 }}>Para a idade de {criancaAtual.apelido}: {menores}</Texto>
        </Card>
      ) : null}

      <Card style={{ padding: 18, gap: 6 }}>
        <Texto variante="sobretitulo">MATERIAL</Texto>
        <Texto style={{ color: cores.texto }}>{missao.material}</Texto>
      </Card>

      <View style={{ gap: 12 }}>
        <Texto variante="rotulo" style={{ fontSize: 16 }}>
          Passo a passo
        </Texto>
        {missao.passos.map((p, i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <View style={s.passoNumero}>
              <Texto style={{ color: '#fff', fontFamily: fonte.negrito, fontSize: 13 }}>{i + 1}</Texto>
            </View>
            <Texto style={{ flex: 1, color: cores.texto, fontSize: 15 }}>{p}</Texto>
          </View>
        ))}
      </View>

      <Card style={[s.aviso, { backgroundColor: cores.marcaSuave, boxShadow: 'none' }]}>
        <Texto style={{ color: cores.texto, fontSize: 14, lineHeight: 20 }}>
          <Texto style={{ fontFamily: fonte.negrito, color: cores.marca, fontSize: 14 }}>Dica Inova: </Texto>
          {missao.dica}
        </Texto>
      </Card>

      {missao.seguranca ? (
        <Card style={[s.aviso, { backgroundColor: cores.observarFundo, boxShadow: 'none' }]}>
          <Texto style={{ color: cores.texto, fontSize: 14, lineHeight: 20 }}>
            <Texto style={{ fontFamily: fonte.negrito, color: cores.observarTexto, fontSize: 14 }}>Segurança: </Texto>
            {missao.seguranca}
          </Texto>
        </Card>
      ) : null}

      <Texto variante="legenda" style={{ fontSize: 13 }}>
        <Texto variante="legenda" style={{ fontFamily: fonte.negrito, fontSize: 13 }}>
          Quando parar:{' '}
        </Texto>
        {missao.quandoParar}
      </Texto>
    </Tela>
  );
}

const s = StyleSheet.create({
  ilustracao: { alignItems: 'center', paddingVertical: 8 },
  ilustracaoAnel: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#fff', borderWidth: 10, borderColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
  passoNumero: { width: 26, height: 26, borderRadius: 8, backgroundColor: cores.marca, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  aviso: { padding: 14, borderRadius: raio.md },
});
