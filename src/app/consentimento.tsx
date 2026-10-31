import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Card, Interruptor, SetaDireita } from '@/components/ui';
import { useApp } from '@/state/app';
import { novoId, repositorio } from '@/storage/repositorio';
import { cores } from '@/theme/tokens';

export const VERSAO_TERMO = '2026-10-rascunho';

const ITENS = [
  {
    titulo: 'Fica no seu celular',
    texto: 'As respostas não saem do aparelho.',
    cor: cores.marca,
    fundo: cores.marcaSuave,
    icone: (c: string) => (
      <>
        <Rect x={7} y={2} width={10} height={20} rx={3} stroke={c} strokeWidth={2} fill="none" />
        <Path d="M11 18h2" stroke={c} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
  {
    titulo: 'Você decide o que compartilhar',
    texto: 'Nada vai para a clínica sem o seu toque.',
    cor: cores.marca,
    fundo: cores.marcaSuave,
    icone: (c: string) => <Path d="M12 4v10M8 10l4 4 4-4M5 18h14" stroke={c} strokeWidth={2} strokeLinecap="round" fill="none" />,
  },
  {
    titulo: 'Orientação, não diagnóstico',
    texto: 'Na dúvida, procure um especialista.',
    cor: '#F08A4B',
    fundo: '#FFF3E6',
    icone: (c: string) => (
      <>
        <Circle cx={12} cy={12} r={9} stroke={c} strokeWidth={2} fill="none" />
        <Path d="M12 8v5M12 16h.01" stroke={c} strokeWidth={2} strokeLinecap="round" />
      </>
    ),
  },
];

export default function ConsentimentoTela() {
  const router = useRouter();
  const { recarregar, selecionar } = useApp();
  const params = useLocalSearchParams<{ apelido?: string; nascimento?: string; semanas?: string }>();
  const [aceito, setAceito] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function concordar() {
    setSalvando(true);
    try {
      const agora = new Date().toISOString();
      await repositorio.salvarConsentimento({ versaoTermo: VERSAO_TERMO, aceitoEm: agora });
      if (params.apelido && params.nascimento) {
        const id = novoId();
        await repositorio.salvarCrianca({
          id,
          apelido: params.apelido,
          nascimento: params.nascimento,
          semanasGestacao: params.semanas ? Number(params.semanas) : null,
          criadaEm: agora,
        });
        selecionar(id);
      }
      await recarregar();
      router.replace('/triagem');
    } catch (e) {
      console.error('[consentimento] falha ao salvar', e);
      setSalvando(false);
    }
  }

  return (
    <Tela
      topo={<BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/boas-vindas'))} />}
      rodape={<Botao titulo="Concordo e continuar" onPress={concordar} desabilitado={!aceito} carregando={salvando} icone={<SetaDireita />} />}
    >
      <View style={{ gap: 10 }}>
        <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: cores.marca, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" />
            <Path d="M9 12l2 2 4-4" />
          </Svg>
        </View>
        <Texto variante="subtitulo">Seus dados, protegidos.</Texto>
        <Texto>Antes de começar, veja como cuidamos das informações do seu filho.</Texto>
      </View>
      <Card style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
        {ITENS.map((it, i) => (
          <View key={it.titulo} style={{ flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: i < ITENS.length - 1 ? 1 : 0, borderColor: cores.linha }}>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: it.fundo, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                {it.icone(it.cor)}
              </Svg>
            </View>
            <View style={{ flex: 1 }}>
              <Texto variante="rotulo">{it.titulo}</Texto>
              <Texto variante="legenda" style={{ color: cores.texto2, marginTop: 2 }}>
                {it.texto}
              </Texto>
            </View>
          </View>
        ))}
      </Card>
      <Interruptor valor={aceito} onChange={setAceito} titulo="Sou o responsável legal" descricao="e autorizo o uso das respostas para gerar orientações." />
      <Botao variante="texto" titulo="Ler a política de privacidade" onPress={() => {}} />
    </Tela>
  );
}
