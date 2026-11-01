import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import { Icone } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar } from '@/components/ui';
import { codigoContato, linkWhatsAppTexto } from '@/domain/contato';
import { dataLocal, resumir, textoResumo } from '@/domain/diario';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { cores, fonte, raio } from '@/theme/tokens';

const PERIODOS = [7, 15, 30];

/** Resumo do Diário para a equipe: o responsável vê o texto inteiro antes e decide se as notas vão. */
export default function DiarioResumo() {
  const router = useRouter();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  const [dias, setDias] = useState(15);
  const [comNotas, setComNotas] = useState(false);
  const [hoje] = useState(() => new Date());

  if (!criancaAtual) return <Redirect href="/" />;

  const registros = dados?.diario ?? [];
  const desde = dataLocal(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (dias - 1)));
  const missoesNoPeriodo = (dados?.conclusoes ?? []).filter((c) => dataLocal(new Date(c.em)) >= desde).length;
  const resumo = resumir(registros, dias, hoje, missoesNoPeriodo);
  const notas = registros
    .filter((r) => r.data >= desde && r.nota.trim())
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((r) => ({ data: r.data, nota: r.nota }));
  // mesmo código da última triagem (a equipe liga as conversas); sem triagem, um código estável da criança
  const codigo = codigoContato(dados?.triagens[0]?.id ?? criancaAtual.id);
  const texto = textoResumo(resumo, codigo, comNotas ? notas : undefined);

  function enviar() {
    registrarEvento({ tipo: 'whatsapp_aberto', origem: 'diario' });
    Linking.openURL(linkWhatsAppTexto(texto)).catch((e) => console.error('[diario-resumo] WhatsApp', e));
  }

  return (
    <Tela
      topo={
        <>
          <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/diario'))} />
          <Texto variante="rotulo">Diário</Texto>
        </>
      }
      rodape={<Botao titulo="Enviar pelo WhatsApp" onPress={enviar} desabilitado={!resumo.diasAnotados} icone={<Icone nome="chat" cor="#fff" tamanho={18} />} />}
    >
      <View style={{ gap: 4 }}>
        <Texto variante="subtitulo">Enviar resumo para a clínica</Texto>
        <Texto>Você vê tudo antes. Nada sai do celular sem você enviar.</Texto>
      </View>

      <View style={{ gap: 9 }}>
        <Texto variante="rotulo">Período</Texto>
        <View style={{ flexDirection: 'row', gap: 8 }} accessibilityRole="radiogroup">
          {PERIODOS.map((p) => (
            <Pressable key={p} accessibilityRole="radio" accessibilityState={{ checked: dias === p }} onPress={() => setDias(p)} style={[s.pilula, dias === p && s.pilulaAtiva]}>
              <Texto style={{ fontFamily: fonte.semi, fontSize: 13.5, color: dias === p ? '#fff' : cores.texto2 }}>{p} dias</Texto>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ gap: 9 }}>
        <Texto variante="rotulo">Prévia da mensagem</Texto>
        {resumo.diasAnotados ? (
          <View style={s.mensagem}>
            <Texto style={{ fontSize: 14, lineHeight: 21, color: '#1D2B22' }}>{texto}</Texto>
          </View>
        ) : (
          <Texto>Nenhum dia anotado nesse período. Escolha um período maior ou anote o dia primeiro.</Texto>
        )}
      </View>

      {notas.length ? (
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: comNotas }} onPress={() => setComNotas(!comNotas)} style={s.check}>
          <View style={[s.caixa, comNotas && { backgroundColor: cores.marca, borderColor: cores.marca }]}>{comNotas ? <Icone nome="check" cor="#fff" tamanho={14} espessura={3} /> : null}</View>
          <Texto style={{ flex: 1, fontSize: 14 }}>Incluir também as minhas anotações escritas ({notas.length})</Texto>
        </Pressable>
      ) : null}

      <Texto variante="legenda">O resumo não leva o nome da criança. As anotações só entram se você marcar.</Texto>
    </Tela>
  );
}

const s = StyleSheet.create({
  pilula: { paddingHorizontal: 14, height: 38, borderRadius: raio.pill, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.linha, justifyContent: 'center' },
  pilulaAtiva: { backgroundColor: cores.marca, borderColor: cores.marca },
  mensagem: { padding: 14, borderRadius: 18, borderBottomRightRadius: 4, backgroundColor: '#E7F7EE' },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  caixa: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: cores.texto3, alignItems: 'center', justifyContent: 'center' },
});
