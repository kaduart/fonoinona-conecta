import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores } from '@/theme/tokens';

/** Fundo off-white com manchas suaves, conteúdo rolável e rodapé fixo para o botão principal. */
export function Tela({ children, rodape, topo }: { children: ReactNode; rodape?: ReactNode; topo?: ReactNode }) {
  return (
    <View style={s.fundo}>
      <View pointerEvents="none" style={[s.mancha, { backgroundColor: '#D8EFE8', top: -80, right: -120 }]} />
      <View pointerEvents="none" style={[s.mancha, { backgroundColor: '#E3F2EE', top: 320, left: -160, width: 300, height: 300 }]} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {topo ? <View style={s.topo}>{topo}</View> : null}
          <ScrollView contentContainerStyle={s.conteudo} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {rodape ? <View style={s.rodape}>{rodape}</View> : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  fundo: { flex: 1, backgroundColor: cores.fundo, overflow: 'hidden' },
  mancha: { position: 'absolute', width: 340, height: 340, borderRadius: 200, opacity: 0.7, filter: 'blur(40px)' } as never,
  topo: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 14 },
  conteudo: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, gap: 16, maxWidth: 520, width: '100%', alignSelf: 'center' },
  rodape: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, maxWidth: 520, width: '100%', alignSelf: 'center' },
});
