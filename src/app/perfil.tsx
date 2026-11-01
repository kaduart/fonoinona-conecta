import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Icone, ItemLista, irPara } from '@/components/navegacao';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Card, Chip, Interruptor } from '@/components/ui';
import { TEXTOS_RESULTADO } from '@/content/resultados';
import { formatarIdade, idadeDe } from '@/domain/idade';
import { definirSons, sonsLigados, tocar } from '@/servicos/sons';
import { useApp } from '@/state/app';
import { repositorio, type TriagemSalva } from '@/storage/repositorio';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

type Confirmacao = 'crianca' | 'tudo' | null;

function haQuanto(iso: string, hoje: Date): string {
  const dias = Math.floor((hoje.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  return meses === 1 ? 'há 1 mês' : `há ${meses} meses`;
}

export default function Perfil() {
  const router = useRouter();
  const { criancas, criancaAtual, selecionar, recarregar } = useApp();
  const [triagens, setTriagens] = useState<TriagemSalva[]>([]);
  const [confirmar, setConfirmar] = useState<Confirmacao>(null);
  const [apagando, setApagando] = useState(false);
  const [sons, setSons] = useState(true);
  useFocusEffect(
    useCallback(() => {
      sonsLigados().then(setSons).catch(() => undefined);
    }, []),
  );
  async function alternarSons(v: boolean) {
    setSons(v);
    await definirSons(v);
    if (v) void tocar('missao');
  }

  useFocusEffect(
    useCallback(() => {
      repositorio.listarTriagens().then(setTriagens).catch((e) => console.error('[perfil] triagens', e));
    }, []),
  );

  const hoje = new Date();
  const nomes = criancas.map((c) => c.apelido);
  const familia = nomes.length > 1 ? `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}` : (nomes[0] ?? '');

  async function apagar() {
    setApagando(true);
    try {
      if (confirmar === 'tudo') await repositorio.apagarTudo();
      else if (criancaAtual) await repositorio.removerCrianca(criancaAtual.id);
      await recarregar();
      irPara(router, '/');
    } catch (e) {
      console.error('[perfil] falha ao apagar', e);
    } finally {
      setApagando(false);
      setConfirmar(null);
    }
  }

  return (
    <Tela
      topo={
        <>
          <BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : irPara(router, '/inicio'))} />
          <View>
            <Texto variante="rotulo" style={{ fontSize: 17 }}>
              Crianças e privacidade
            </Texto>
            <Texto variante="legenda">Família de {familia}</Texto>
          </View>
        </>
      }
    >

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Texto variante="rotulo">Crianças</Texto>
        {criancas.length > 1 ? <Texto variante="legenda">Toque para trocar</Texto> : null}
      </View>

      <View style={{ gap: 10 }}>
        {criancas.map((c, i) => {
          const ativa = c.id === criancaAtual?.id;
          const ultima = triagens.find((t) => t.criancaId === c.id);
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityState={{ selected: ativa }}
              onPress={() => selecionar(c.id)}
              style={[s.crianca, ativa && s.criancaAtiva]}
            >
              <Avatar nome={c.apelido} indice={i} />
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Texto variante="rotulo">{c.apelido}</Texto>
                  {ativa ? <Chip texto="Ativo" /> : null}
                </View>
                <Texto variante="legenda">
                  {formatarIdade(idadeDe(c, hoje))} · {ultima ? `triagem ${haQuanto(ultima.criadaEm, hoje)}` : 'sem triagem'}
                </Texto>
              </View>
              {ultima ? <Chip texto={TEXTOS_RESULTADO[ultima.resultado.nivel].rotulo} tom={ultima.resultado.nivel} /> : null}
            </Pressable>
          );
        })}
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/boas-vindas', params: { nova: '1' } })} style={s.adicionar}>
          <Icone nome="mais" cor={cores.marca} tamanho={18} />
          <Texto style={{ fontFamily: fonte.semi, color: cores.marca, fontSize: 15 }}>Adicionar outra criança</Texto>
        </Pressable>
      </View>

      <Card style={{ paddingVertical: 4 }}>
        <ItemLista icone="grafico" titulo="Evolução" descricao={`Triagens e missões de ${criancaAtual?.apelido ?? ''}`} onPress={() => irPara(router, '/historico')} />
        <View style={s.divisor} />
        <ItemLista icone="lapis" titulo="Lembrete do Diário" descricao="Um aviso por dia para anotar" onPress={() => router.push('/lembrete')} />
        <View style={s.divisor} />
        <ItemLista icone="livro" titulo="Cópia dos dados" descricao="Para trocar de celular sem perder nada" onPress={() => router.push('/meus-dados')} />
        <View style={s.divisor} />
        <ItemLista icone="escudo" titulo="Privacidade e dados" descricao="Tudo fica no seu celular" onPress={() => setConfirmar(confirmar ? null : 'crianca')} />
        <View style={s.divisor} />
        <ItemLista icone="info" titulo="Sobre o app" descricao="Responsável técnica e fontes" onPress={() => router.push('/sobre')} />
      </Card>

      <Interruptor valor={sons} onChange={alternarSons} titulo="Sons do app" descricao="Sons curtos e vibração nas conquistas. No iPhone, seguem a chave de silêncio." />

      {confirmar ? (
        <Card style={{ padding: 16, gap: 12 }}>
          <Texto variante="rotulo">Seus dados</Texto>
          <Texto>
            As respostas e missões ficam só neste celular. Nada é enviado para a clínica sem o seu toque no WhatsApp. Você pode apagar quando quiser, e não dá para desfazer.
          </Texto>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: confirmar === 'crianca' }} onPress={() => setConfirmar('crianca')} style={[s.opcao, confirmar === 'crianca' && s.opcaoAtiva]}>
              <Texto style={[s.opcaoTexto, confirmar === 'crianca' && { color: '#fff' }]}>Só de {criancaAtual?.apelido}</Texto>
            </Pressable>
            <Pressable accessibilityRole="radio" accessibilityState={{ checked: confirmar === 'tudo' }} onPress={() => setConfirmar('tudo')} style={[s.opcao, confirmar === 'tudo' && s.opcaoAtiva]}>
              <Texto style={[s.opcaoTexto, confirmar === 'tudo' && { color: '#fff' }]}>Tudo do app</Texto>
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" onPress={apagar} disabled={apagando} style={s.apagar}>
            <Icone nome="lixo" cor={cores.avaliarTexto} tamanho={18} />
            <Texto style={{ fontFamily: fonte.negrito, color: cores.avaliarTexto, fontSize: 15 }}>{apagando ? 'Apagando…' : 'Apagar definitivamente'}</Texto>
          </Pressable>
          <Botao variante="texto" titulo="Cancelar" onPress={() => setConfirmar(null)} />
        </Card>
      ) : null}
    </Tela>
  );
}

const s = StyleSheet.create({
  crianca: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: raio.lg, backgroundColor: cores.superficie, boxShadow: sombra.card, borderWidth: 1.5, borderColor: 'transparent' },
  criancaAtiva: { borderColor: cores.marca },
  adicionar: { height: 54, borderRadius: raio.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#BFDCD5', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  divisor: { height: 1, backgroundColor: cores.linha, marginLeft: 68 },
  opcao: { flex: 1, height: 42, borderRadius: raio.md, backgroundColor: cores.neutroFundo, alignItems: 'center', justifyContent: 'center' },
  opcaoAtiva: { backgroundColor: cores.texto },
  opcaoTexto: { fontFamily: fonte.semi, fontSize: 13.5, color: cores.texto2 },
  apagar: { height: 50, borderRadius: raio.md, backgroundColor: cores.avaliarFundo, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
