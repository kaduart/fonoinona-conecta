import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Card } from '@/components/ui';
import { contarBackup, lerBackup, montarBackup, nomeArquivoBackup, type ErroBackup } from '@/domain/backup';
import { useApp } from '@/state/app';
import { repositorio } from '@/storage/repositorio';
import { cores, raio } from '@/theme/tokens';

const ERROS: Record<ErroBackup, string> = {
  json: 'Esse arquivo não abriu. Confira se é a cópia gerada pelo Conecta.',
  formato: 'Esse arquivo não é uma cópia do Conecta.',
  versao: 'Essa cópia veio de uma versão mais nova do app. Atualize o app e tente de novo.',
  conteudo: 'A cópia está incompleta ou foi alterada. Nada foi importado.',
};

/** Cópia dos dados: exportar para guardar ou levar a outro celular, e restaurar. */
export default function MeusDados() {
  const router = useRouter();
  const { recarregar } = useApp();
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<'exportar' | 'importar' | null>(null);
  const noCelular = Platform.OS !== 'web';

  async function exportar() {
    setOcupado('exportar');
    setMsg(null);
    try {
      const agora = new Date();
      const arquivo = new File(Paths.cache, nomeArquivoBackup(agora));
      arquivo.create({ overwrite: true });
      await arquivo.write(JSON.stringify(montarBackup(await repositorio.exportar(), agora)));
      if (!(await Sharing.isAvailableAsync())) throw new Error('compartilhamento indisponível');
      await Sharing.shareAsync(arquivo.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'Guardar cópia do Conecta' });
      setMsg({ tipo: 'ok', texto: 'Cópia pronta. Guarde em um lugar seguro, como o seu Drive ou iCloud.' });
    } catch (e) {
      console.error('[meus-dados] exportar', e);
      setMsg({ tipo: 'erro', texto: 'Não deu para gerar a cópia agora. Tente de novo.' });
    } finally {
      setOcupado(null);
    }
  }

  async function importar() {
    setOcupado('importar');
    setMsg(null);
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
      if (r.canceled || !r.assets?.[0]) return;
      const lido = lerBackup(await new File(r.assets[0].uri).text());
      if (!lido.ok) return setMsg({ tipo: 'erro', texto: ERROS[lido.erro] });
      await repositorio.importar(lido.backup);
      await recarregar();
      const n = contarBackup(lido.backup);
      setMsg({ tipo: 'ok', texto: `Cópia restaurada: ${n.criancas} ${n.criancas === 1 ? 'criança' : 'crianças'}, ${n.triagens} triagens, ${n.missoes} missões e ${n.diario} anotações. O que já estava no celular foi mantido.` });
    } catch (e) {
      console.error('[meus-dados] importar', e);
      setMsg({ tipo: 'erro', texto: 'Não deu para restaurar agora. Tente de novo.' });
    } finally {
      setOcupado(null);
    }
  }

  return (
    <Tela
      topo={
        <>
          <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/perfil'))} />
          <Texto variante="rotulo">Perfil</Texto>
        </>
      }
    >
      <View style={{ gap: 4 }}>
        <Texto variante="subtitulo">Cópia dos dados</Texto>
        <Texto>Tudo do Conecta fica só neste celular. Faça uma cópia para não perder nada se trocar de aparelho.</Texto>
      </View>

      {noCelular ? (
        <>
          <Card style={{ padding: 16, gap: 10 }}>
            <Texto variante="rotulo">Fazer uma cópia</Texto>
            <Texto style={{ fontSize: 14 }}>Gera um arquivo com as crianças, triagens, missões e o Diário. Você escolhe onde guardar.</Texto>
            <Botao titulo="Gerar cópia" onPress={exportar} carregando={ocupado === 'exportar'} desabilitado={!!ocupado} />
          </Card>
          <Card style={{ padding: 16, gap: 10 }}>
            <Texto variante="rotulo">Restaurar uma cópia</Texto>
            <Texto style={{ fontSize: 14 }}>Escolha o arquivo da cópia. O que já está neste celular continua; só entra o que faltava.</Texto>
            <Botao variante="texto" titulo={ocupado === 'importar' ? 'Restaurando…' : 'Escolher arquivo da cópia'} onPress={() => !ocupado && importar()} />
          </Card>
        </>
      ) : (
        <Card style={{ padding: 16 }}>
          <Texto>A cópia funciona no app instalado no celular. Nesta versão de teste no navegador ela não aparece.</Texto>
        </Card>
      )}

      {msg ? (
        <View style={[s.msg, msg.tipo === 'erro' && { backgroundColor: cores.avaliarFundo }]}>
          <Texto style={{ fontSize: 14, color: msg.tipo === 'erro' ? cores.avaliarTexto : cores.marca }}>{msg.texto}</Texto>
        </View>
      ) : null}

      <View style={s.aviso}>
        <Texto variante="legenda" style={{ color: cores.observarTexto }}>
          A cópia não é protegida por senha e tem dados da criança. Guarde só em lugar seu e não mande em grupos.
        </Texto>
      </View>
    </Tela>
  );
}

const s = StyleSheet.create({
  msg: { padding: 14, borderRadius: raio.md, backgroundColor: cores.marcaSuave },
  aviso: { padding: 12, borderRadius: raio.md, backgroundColor: cores.observarFundo },
});
