import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cores } from '@/theme/tokens';

/** Fundo creme, conteúdo rolável e rodapé fixo para o botão principal. */
export function Tela({ children, rodape, topo }: { children: ReactNode; rodape?: ReactNode; topo?: ReactNode }) {
  return (
    <View style={s.fundo}>
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
  topo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 14 },
  conteudo: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, gap: 14, maxWidth: 520, width: '100%', alignSelf: 'center' },
  rodape: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, maxWidth: 520, width: '100%', alignSelf: 'center' },
});
