import { Redirect, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { Medalha } from '@/components/medalha';
import { Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Card } from '@/components/ui';
import { AVISO_RECURSOS, temaDaFase } from '@/content/fases';
import { idadeDe } from '@/domain/idade';
import { fasesDaTrilha, missoesParaIdade, montarTrilha } from '@/domain/missoes';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { repositorio } from '@/storage/repositorio';
import { cores, fonte, raio, tema } from '@/theme/tokens';

/** Abertura de uma fase: o que ela trabalha, como montar os recursos em casa e o kit (em breve) como conveniência. */
export default function Fase() {
  const router = useRouter();
  const { numero: param } = useLocalSearchParams<{ numero: string }>();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  const [avisar, setAvisar] = useState<boolean | null>(null);
  const numero = Number(param) || 1;

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      repositorio
        .listarKitInteresse()
        .then((l) => ativo && setAvisar(l.includes(numero)))
        .catch(() => ativo && setAvisar(false));
      return () => {
        ativo = false;
      };
    }, [numero]),
  );

  if (!criancaAtual) return <Redirect href="/" />;

  const ultima = dados?.triagens[0] ?? null;
  const fases = fasesDaTrilha(montarTrilha(missoesParaIdade(idadeDe(criancaAtual), ultima?.resultado.areaFoco), dados?.conclusoes ?? []));
  const fase = fases[numero - 1];
  if (dados && !fase) return <Redirect href="/trilha" />;
  const tema = temaDaFase(numero);

  async function pedirAviso() {
    setAvisar(true);
    try {
      await repositorio.marcarKitInteresse(numero);
      registrarEvento({ tipo: 'kit_interesse', fase: numero });
    } catch (e) {
      console.error('[fase] falha ao salvar interesse', e);
      setAvisar(false);
    }
  }

  return (
    <Tela
      topo={
        <>
          <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/trilha'))} />
          <Texto variante="rotulo">Trilha</Texto>
        </>
      }
      rodape={<Botao titulo="Ir para as missões" onPress={() => router.replace('/trilha')} />}
    >
      <View style={{ alignItems: 'center', gap: 8 }}>
        {fase ? <Medalha tom={fase.medalha.tom} trancada={!fase.completa} tamanho={86} /> : null}
        <View style={s.selo}>
          <Texto style={{ fontFamily: fonte.negrito, fontSize: 12, color: cores.marca, letterSpacing: 0.6 }}>FASE {numero}</Texto>
        </View>
        <Texto variante="titulo" style={{ textAlign: 'center' }}>
          {tema.titulo}
        </Texto>
        <Texto style={{ textAlign: 'center' }}>{tema.objetivo}</Texto>
      </View>

      <View style={{ gap: 10 }}>
        <Texto variante="sobretitulo">FAÇA EM CASA</Texto>
        {tema.recursos.map((r) => (
          <Card key={r.titulo} style={{ padding: 16, gap: 6 }}>
            <Texto variante="rotulo">{r.titulo}</Texto>
            <Texto variante="legenda" style={{ color: cores.texto2 }}>
              <Texto variante="legenda" style={{ fontFamily: fonte.negrito, color: cores.texto2 }}>
                Você vai usar:{' '}
              </Texto>
              {r.materiais}
            </Texto>
            <Texto style={{ fontSize: 14, lineHeight: 20 }}>{r.comoFazer}</Texto>
          </Card>
        ))}
        <View style={s.aviso}>
          <Icone nome="escudo" cor={cores.observarTexto} tamanho={16} />
          <Texto variante="legenda" style={{ flex: 1, color: cores.observarTexto }}>
            {AVISO_RECURSOS}
          </Texto>
        </View>
      </View>

      <View style={s.kit}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={s.kitIcone}>
            <Icone nome="presente" cor={cores.solTexto} tamanho={20} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto style={{ fontFamily: fonte.negrito, fontSize: 11, letterSpacing: 0.6, color: cores.solTexto }}>EM BREVE</Texto>
            <Texto variante="rotulo">{tema.kit.nome}</Texto>
          </View>
        </View>
        <Texto style={{ fontSize: 14, lineHeight: 20 }}>Prefere tudo pronto? {tema.kit.descricao} As missões funcionam do mesmo jeito com o que você monta em casa.</Texto>
        {avisar ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icone nome="check" cor={cores.marca} tamanho={16} espessura={2.6} />
            <Texto style={{ fontFamily: fonte.semi, fontSize: 14, color: cores.marca }}>Combinado! Avisamos aqui no app quando o kit sair.</Texto>
          </View>
        ) : avisar === false ? (
          <Botao variante="texto" titulo="Quero ser avisado quando sair" onPress={pedirAviso} />
        ) : null}
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  selo: { paddingHorizontal: 12, height: 26, borderRadius: raio.pill, backgroundColor: cores.marcaSuave, justifyContent: 'center' },
  aviso: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: raio.md, backgroundColor: cores.observarFundo },
  kit: { gap: 10, padding: 16, borderRadius: raio.xl, backgroundColor: cores.solFundo, borderWidth: 1.5, borderColor: tema('#F6DFA6', '#4A3A14') },
  kitIcone: { width: 40, height: 40, borderRadius: 14, backgroundColor: cores.superficie, alignItems: 'center', justifyContent: 'center' },
});
