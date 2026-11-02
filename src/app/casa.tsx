import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { useAviso } from '@/components/aviso';
import { ConfeteAoRedor } from '@/components/animacao';
import { Icone } from '@/components/navegacao';
import { Numero } from '@/components/numero';
import { Tela } from '@/components/tela';
import { Texto } from '@/components/texto';
import { Botao, BotaoVoltar, Campo, Card } from '@/components/ui';
import {
  EXEMPLOS_ATIVIDADE,
  feitaHoje,
  feitasNaSemana,
  novaAtividade,
  registroFizemos,
  TITULO_ATIVIDADE_MAX,
  VEZES_SEMANA,
  type AtividadeCasa,
} from '@/domain/casa';
import type { RegistroDiario } from '@/domain/diario';
import { marcar, tocar } from '@/servicos/sons';
import { useApp } from '@/state/app';
import { useDadosCrianca } from '@/state/dados';
import { repositorio } from '@/storage/repositorio';
import { cores, fonte, raio, sombra, toque } from '@/theme/tokens';

/** Atividades de casa que a terapeuta passou. "Fizemos!" grava no Diário (cifrado, só no celular). */
export default function TelaCasa() {
  const router = useRouter();
  const { criancaAtual } = useApp();
  const dados = useDadosCrianca(criancaAtual?.id);
  const { mostrar } = useAviso();
  const [adicionando, setAdicionando] = useState(false);

  if (!criancaAtual) return <Redirect href="/" />;
  const nome = criancaAtual.apelido;
  const atividades = dados?.atividades ?? [];
  const registros = dados?.diario ?? [];

  async function adicionar(titulo: string, vezes: number) {
    const r = novaAtividade(criancaAtual!.id, titulo, vezes, new Date());
    if (!r.ok) return false;
    await repositorio.salvarAtividade(r.atividade);
    dados?.recarregar();
    setAdicionando(false);
    return true;
  }

  async function remover(a: AtividadeCasa) {
    await repositorio.removerAtividade(a.id);
    dados?.recarregar();
    mostrar('Atividade tirada da lista. O que já foi feito segue no Diário.');
  }

  return (
    <Tela topo={<BotaoVoltar onPress={() => (router.canGoBack() ? router.back() : router.replace('/diario'))} />}>
      <View style={{ gap: 2 }}>
        <Texto variante="titulo">Para fazer em casa</Texto>
        <Texto>O que a terapeuta pediu para praticar com {nome} na semana. Tocou em “Fizemos!”, fica anotado no Diário.</Texto>
      </View>

      {atividades.map((a) => (
        <Animated.View key={a.id} entering={FadeIn.duration(220)} layout={LinearTransition.duration(220)}>
          <CartaoAtividade atividade={a} registros={registros} onFeito={() => dados?.recarregar()} onRemover={() => remover(a)} />
        </Animated.View>
      ))}

      {dados && !atividades.length && !adicionando ? (
        <Card style={{ padding: 20, gap: 10 }}>
          <Texto variante="rotulo">Nenhuma atividade ainda</Texto>
          <Texto>Anote aqui a atividade que a terapeuta passou na última sessão. Toque num exemplo para começar mais rápido.</Texto>
        </Card>
      ) : null}

      {adicionando ? (
        <FormAtividade onSalvar={adicionar} onCancelar={() => setAdicionando(false)} />
      ) : (
        <Pressable accessibilityRole="button" onPress={() => setAdicionando(true)} style={({ pressed }) => [s.adicionar, pressed && toque]}>
          <Icone nome="mais" cor={cores.marca} tamanho={18} espessura={2.6} />
          <Texto style={{ fontFamily: fonte.negrito, color: cores.marca }}>Adicionar o que a terapeuta pediu</Texto>
        </Pressable>
      )}

      <Texto variante="legenda" style={{ textAlign: 'center' }}>
        Fica só no seu celular. A clínica não recebe nada daqui.
      </Texto>
    </Tela>
  );
}

function CartaoAtividade({ atividade: a, registros, onFeito, onRemover }: { atividade: AtividadeCasa; registros: RegistroDiario[]; onFeito: () => void; onRemover: () => void }) {
  const hoje = new Date();
  const feitas = feitasNaSemana(a.id, registros, hoje);
  const jaHoje = feitaHoje(a.id, registros, hoje);
  const [comemorar, setComemorar] = useState(false);
  const [largura, setLargura] = useState(0);
  const escala = useSharedValue(1);
  const estiloBotao = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  useEffect(() => {
    if (!comemorar) return;
    const t = setTimeout(() => setComemorar(false), 1800);
    return () => clearTimeout(t);
  }, [comemorar]);

  async function fizemos() {
    if (jaHoje) return;
    marcar();
    escala.value = withSequence(withSpring(1.08, { damping: 6 }), withSpring(1, { damping: 10 }));
    try {
      // idempotente: o id do registro é fixo por atividade e dia
      await repositorio.salvarRegistroDiario(registroFizemos(a, new Date()));
      setComemorar(true);
      void tocar('conquista');
      onFeito();
    } catch (e) {
      console.error('[casa] não salvou o Fizemos', e);
    }
  }

  const meta = Math.max(1, a.vezesSemana);
  const bateu = feitas >= meta;

  return (
    <View style={s.cartao} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={s.icone}>
          <Icone nome="casa" cor={cores.marca} tamanho={20} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Texto style={{ fontFamily: fonte.extra, fontSize: 16, lineHeight: 21, color: cores.texto }}>{a.titulo}</Texto>
          <Texto variante="legenda">{a.vezesSemana === 1 ? '1 vez por semana' : `${a.vezesSemana} vezes por semana`}</Texto>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Tirar ${a.titulo} da lista`} onPress={onRemover} hitSlop={10}>
          <Icone nome="lixo" cor={cores.texto3} tamanho={17} />
        </Pressable>
      </View>

      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: cores.texto }}>{bateu ? 'Meta da semana feita! 🎉' : 'Nos últimos 7 dias'}</Texto>
          <View style={{ flexDirection: 'row' }} accessible accessibilityLabel={`${Math.min(feitas, meta)} de ${meta} nesta semana`}>
            <Numero valor={Math.min(feitas, meta)} style={{ fontFamily: fonte.negrito, fontSize: 13, lineHeight: 18, color: bateu ? cores.marca : cores.texto2 }} />
            <Texto variante="legenda" style={{ fontFamily: fonte.negrito, color: bateu ? cores.marca : cores.texto2 }}>
              /{meta}
            </Texto>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {Array.from({ length: meta }, (_, i) => (
            <View key={i} style={[s.passo, i < feitas && { backgroundColor: cores.marca }]} />
          ))}
        </View>
      </View>

      {jaHoje ? (
        <View style={s.feito}>
          <Icone nome="check" cor={cores.marca} tamanho={17} espessura={2.8} />
          <Texto style={{ fontFamily: fonte.semi, color: cores.texto }}>Feito hoje. Muito bem!</Texto>
        </View>
      ) : (
        <Animated.View style={estiloBotao}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Fizemos: ${a.titulo}`} onPress={fizemos} style={({ pressed }) => [s.fizemos, pressed && toque]}>
            <Icone nome="check" cor="#fff" tamanho={18} espessura={2.8} />
            <Texto style={{ fontFamily: fonte.extra, fontSize: 16, color: '#fff' }}>Fizemos!</Texto>
          </Pressable>
        </Animated.View>
      )}

      {comemorar ? (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <ConfeteAoRedor largura={largura} altura={200} />
        </View>
      ) : null}
    </View>
  );
}

function FormAtividade({ onSalvar, onCancelar }: { onSalvar: (titulo: string, vezes: number) => Promise<boolean>; onCancelar: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [vezes, setVezes] = useState(3);
  const [salvando, setSalvando] = useState(false);
  const valido = novaAtividade('x', titulo, vezes, new Date()).ok;

  async function salvar() {
    setSalvando(true);
    try {
      await onSalvar(titulo, vezes);
    } catch (e) {
      console.error('[casa] não salvou a atividade', e);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Card style={{ padding: 18, gap: 14 }}>
      <Campo rotulo="O que a terapeuta pediu?" value={titulo} onChangeText={setTitulo} maxLength={TITULO_ATIVIDADE_MAX} placeholder="Ex.: ler uma história apontando as figuras" autoFocus />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {EXEMPLOS_ATIVIDADE.map((ex) => (
          <Pressable key={ex} accessibilityRole="button" onPress={() => setTitulo(ex)} style={({ pressed }) => [s.exemplo, pressed && toque]}>
            <Texto style={{ fontFamily: fonte.semi, fontSize: 12.5, color: cores.texto2 }}>{ex}</Texto>
          </Pressable>
        ))}
      </View>
      <View style={{ gap: 8 }}>
        <Texto variante="rotulo" style={{ fontSize: 14 }}>
          Quantas vezes por semana?
        </Texto>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {VEZES_SEMANA.map((v) => (
            <Pressable
              key={v}
              accessibilityRole="radio"
              accessibilityState={{ checked: vezes === v }}
              onPress={() => setVezes(v)}
              style={[s.vez, vezes === v && s.vezAtiva]}
            >
              <Texto style={{ fontFamily: fonte.negrito, color: vezes === v ? '#fff' : cores.texto2 }}>{v}</Texto>
            </Pressable>
          ))}
        </View>
      </View>
      <Botao titulo="Salvar atividade" desabilitado={!valido} carregando={salvando} onPress={salvar} />
      <Botao variante="texto" titulo="Cancelar" onPress={onCancelar} />
    </Card>
  );
}

const s = StyleSheet.create({
  cartao: { gap: 14, padding: 16, borderRadius: raio.xl, backgroundColor: cores.superficie, boxShadow: sombra.card },
  icone: { width: 40, height: 40, borderRadius: 13, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
  passo: { flex: 1, height: 8, borderRadius: 4, backgroundColor: cores.fundo2 },
  fizemos: { height: 52, borderRadius: raio.lg, backgroundColor: cores.marca, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: sombra.botao },
  feito: { height: 52, borderRadius: raio.lg, backgroundColor: cores.marcaSuave, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  adicionar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: raio.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: cores.marca },
  exemplo: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: raio.pill, backgroundColor: cores.fundo2 },
  vez: { width: 38, height: 38, borderRadius: 12, backgroundColor: cores.fundo2, alignItems: 'center', justifyContent: 'center' },
  vezAtiva: { backgroundColor: cores.marca },
});
