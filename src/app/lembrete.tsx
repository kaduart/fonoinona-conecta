import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { BotaoVoltar, Card, Interruptor } from '@/components/ui';
import { desligarLembrete, HORARIOS_LEMBRETE, lembreteDisponivel, ligarLembrete, rotuloHorario, TEXTO_LEMBRETE } from '@/servicos/lembrete';
import { LEMBRETE_PADRAO, repositorio, type Lembrete } from '@/storage/repositorio';
import { cores, fonte, raio } from '@/theme/tokens';

/** Lembrete diário opcional para anotar o Diário. Começa desligado. */
export default function TelaLembrete() {
  const router = useRouter();
  const [lembrete, setLembrete] = useState<Lembrete | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useFocusEffect(
    useCallback(() => {
      repositorio
        .lerLembrete()
        .then(setLembrete)
        .catch(() => setLembrete(LEMBRETE_PADRAO));
    }, []),
  );

  async function aplicar(ativo: boolean, hora: number) {
    setOcupado(true);
    setAviso(null);
    try {
      if (ativo) {
        const ok = await ligarLembrete(hora);
        if (!ok) setAviso('O celular não permitiu notificações. Você pode liberar nos Ajustes do aparelho.');
      } else await desligarLembrete();
      setLembrete(await repositorio.lerLembrete());
    } catch (e) {
      console.error('[lembrete] falha', e);
      setAviso('Não deu para ajustar o lembrete agora. Tente de novo.');
    } finally {
      setOcupado(false);
    }
  }

  const l = lembrete ?? LEMBRETE_PADRAO;
  return (
    <Tela
      topo={
        <>
          <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/diario'))} />
          <Texto variante="rotulo">Diário</Texto>
        </>
      }
    >
      <View style={{ gap: 4 }}>
        <Texto variante="subtitulo">Lembrete diário</Texto>
        <Texto>Um aviso por dia, no horário que você escolher, para anotar como foi o dia. Você desliga quando quiser.</Texto>
      </View>

      {lembreteDisponivel() ? (
        <>
          <Interruptor valor={l.ativo} onChange={(v) => !ocupado && aplicar(v, l.hora)} titulo="Lembrar todo dia" descricao={l.ativo ? `Ligado às ${rotuloHorario(l)}` : 'Desligado'} />
          <View style={{ gap: 9, opacity: l.ativo ? 1 : 0.5 }}>
            <Texto variante="rotulo">Horário</Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup">
              {HORARIOS_LEMBRETE.map((h) => {
                const ativa = l.hora === h;
                return (
                  <Pressable key={h} accessibilityRole="radio" accessibilityState={{ checked: ativa, disabled: !l.ativo }} disabled={!l.ativo || ocupado} onPress={() => aplicar(true, h)} style={[s.pilula, ativa && s.pilulaAtiva]}>
                    <Texto style={{ fontFamily: fonte.semi, fontSize: 14, color: ativa ? '#fff' : cores.texto2 }}>{h}h</Texto>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </>
      ) : (
        <Card style={{ padding: 16 }}>
          <Texto>O lembrete funciona no app instalado no celular (Android ou iPhone). Nesta versão de teste no navegador ele não aparece.</Texto>
        </Card>
      )}

      {aviso ? (
        <Texto variante="legenda" style={{ color: cores.avaliarTexto }}>
          {aviso}
        </Texto>
      ) : null}

      <Card style={{ padding: 16, gap: 8 }}>
        <Texto variante="legenda" style={{ fontFamily: fonte.negrito, letterSpacing: 0.5 }}>
          COMO O AVISO APARECE
        </Texto>
        <View style={s.notificacao}>
          <View style={s.notificacaoIcone}>
            <Icone nome="lapis" cor="#fff" tamanho={16} />
          </View>
          <View style={{ flex: 1 }}>
            <Texto style={{ fontFamily: fonte.negrito, fontSize: 14, color: cores.texto }}>{TEXTO_LEMBRETE.title}</Texto>
            <Texto style={{ fontSize: 13.5 }}>{TEXTO_LEMBRETE.body}</Texto>
          </View>
        </View>
        <Texto variante="legenda">Sem o nome da criança, porque o aviso aparece com o celular bloqueado.</Texto>
      </Card>
    </Tela>
  );
}

const s = StyleSheet.create({
  pilula: { paddingHorizontal: 16, height: 40, borderRadius: raio.pill, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.linha, justifyContent: 'center' },
  pilulaAtiva: { backgroundColor: cores.marca, borderColor: cores.marca },
  notificacao: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: raio.md, backgroundColor: cores.fundo2 },
  notificacaoIcone: { width: 32, height: 32, borderRadius: 9, backgroundColor: cores.marca, alignItems: 'center', justifyContent: 'center' },
});
