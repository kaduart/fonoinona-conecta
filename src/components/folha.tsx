import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone } from '@/components/navegacao';
import { Texto } from '@/components/texto';
import { Botao } from '@/components/ui';
import { cores, fonte, raio, toque, fixas, tema } from '@/theme/tokens';

/**
 * Folha que sobe de baixo (estilo Vaul), feita com Modal + Reanimated: fecha tocando fora ou no voltar do Android.
 * Fica perto do polegar, que é onde a família segura o celular.
 */
export function Folha({ aberta, onFechar, children, rotulo }: { aberta: boolean; onFechar: () => void; children: ReactNode; rotulo?: string }) {
  const { bottom } = useSafeAreaInsets();
  return (
    <Modal visible={aberta} transparent animationType="none" onRequestClose={onFechar} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(160)} style={s.fundo}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} accessibilityRole="button" accessibilityLabel="Fechar" />
      </Animated.View>
      <View pointerEvents="box-none" style={s.base}>
        <Animated.View
          entering={SlideInDown.springify().damping(22).stiffness(220)}
          style={[s.folha, { paddingBottom: Math.max(bottom, 12) + 8 }]}
          accessibilityViewIsModal
          accessibilityLabel={rotulo}
        >
          <View style={s.alca} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Confirmação no estilo do app (substitui o "toque de novo" e os alertas do sistema). */
export function Confirmacao({
  aberta,
  titulo,
  texto,
  acao,
  onConfirmar,
  onFechar,
  carregando,
  perigo = true,
  children,
}: {
  aberta: boolean;
  titulo: string;
  texto?: string;
  acao: string;
  onConfirmar: () => void;
  onFechar: () => void;
  carregando?: boolean;
  perigo?: boolean;
  children?: ReactNode;
}) {
  return (
    <Folha aberta={aberta} onFechar={onFechar} rotulo={titulo}>
      <View style={{ gap: 10 }}>
        {perigo ? (
          <View style={s.selo}>
            <Icone nome="lixo" cor={cores.avaliarTexto} tamanho={20} />
          </View>
        ) : null}
        <Texto variante="subtitulo">{titulo}</Texto>
        {texto ? <Texto>{texto}</Texto> : null}
      </View>
      {children}
      <View style={{ gap: 6 }}>
        {perigo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !!carregando }}
            disabled={carregando}
            onPress={onConfirmar}
            style={({ pressed }) => [s.perigo, pressed && toque]}
          >
            <Texto style={{ fontFamily: fonte.negrito, color: '#fff', fontSize: 16 }}>{carregando ? 'Apagando…' : acao}</Texto>
          </Pressable>
        ) : (
          <Botao titulo={acao} onPress={onConfirmar} carregando={carregando} />
        )}
        <Botao variante="texto" titulo="Cancelar" onPress={onFechar} />
      </View>
    </Folha>
  );
}

const s = StyleSheet.create({
  fundo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20, 35, 36, 0.42)' },
  base: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  folha: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: cores.superficie,
    borderTopLeftRadius: raio.xxl,
    borderTopRightRadius: raio.xxl,
    paddingHorizontal: 20,
    paddingTop: 10,
    gap: 16,
    boxShadow: tema('0px -12px 40px rgba(44, 62, 63, 0.14)', '0px -12px 40px rgba(0, 0, 0, 0.5)'),
  },
  alca: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: cores.linha, marginBottom: 4 },
  selo: { width: 44, height: 44, borderRadius: 22, backgroundColor: cores.avaliarFundo, alignItems: 'center', justifyContent: 'center' },
  perigo: { height: 54, borderRadius: raio.lg, backgroundColor: fixas.perigo, alignItems: 'center', justifyContent: 'center' },
});
