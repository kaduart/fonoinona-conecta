import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Texto } from '@/components/texto';
import type { NivelResultado } from '@/domain/triagem';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

export function Card({ children, style, elevado }: { children: ReactNode; style?: StyleProp<ViewStyle>; elevado?: boolean }) {
  return <View style={[s.card, elevado && { boxShadow: sombra.elevada }, style]}>{children}</View>;
}

export function Botao({
  titulo,
  onPress,
  desabilitado,
  carregando,
  icone,
  variante = 'primario',
}: {
  titulo: string;
  onPress: () => void;
  desabilitado?: boolean;
  carregando?: boolean;
  icone?: ReactNode;
  variante?: 'primario' | 'texto';
}) {
  if (variante === 'texto') {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} style={s.botaoTexto} hitSlop={8}>
        <Texto style={{ fontFamily: fonte.semi, color: cores.marca, fontSize: 15 }}>{titulo}</Texto>
      </Pressable>
    );
  }
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inativo }}
      disabled={inativo}
      onPress={onPress}
      style={({ pressed }) => [s.botao, inativo && s.botaoInativo, pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] }]}
    >
      {carregando ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icone}
          <Texto style={s.botaoTitulo}>{titulo}</Texto>
        </>
      )}
    </Pressable>
  );
}

export function SetaDireita({ cor = '#fff' }: { cor?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  );
}

export function BotaoVoltar({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Voltar" onPress={onPress} style={s.voltar} hitSlop={8}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={cores.texto} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M15 18l-6-6 6-6" />
      </Svg>
    </Pressable>
  );
}

export function Chip({ texto, tom = 'marca' }: { texto: string; tom?: 'marca' | NivelResultado | 'neutro' }) {
  const paleta = {
    marca: [cores.marcaSuave, cores.marca],
    neutro: [cores.neutroFundo, cores.texto2],
    esperado: [cores.esperadoFundo, cores.esperadoTexto],
    observar: [cores.observarFundo, cores.observarTexto],
    avaliar: [cores.avaliarFundo, cores.avaliarTexto],
  }[tom];
  return (
    <View style={[s.chip, { backgroundColor: paleta[0] }]}>
      <Texto style={{ fontFamily: fonte.semi, fontSize: 12, color: paleta[1] }}>{texto}</Texto>
    </View>
  );
}

export function Campo({ rotulo, icone, ...props }: TextInputProps & { rotulo: string; icone?: ReactNode }) {
  return (
    <View style={s.campo}>
      {icone ? <View style={s.campoIcone}>{icone}</View> : null}
      <View style={{ flex: 1 }}>
        <Texto variante="legenda">{rotulo}</Texto>
        <TextInput placeholderTextColor={cores.texto3} {...props} style={s.campoInput} accessibilityLabel={rotulo} />
      </View>
    </View>
  );
}

export function Interruptor({ valor, onChange, titulo, descricao }: { valor: boolean; onChange: (v: boolean) => void; titulo: string; descricao?: string }) {
  return (
    <Pressable onPress={() => onChange(!valor)} style={[s.interruptor, valor && s.interruptorAtivo]} accessibilityRole="switch" accessibilityState={{ checked: valor }}>
      <View style={{ flex: 1 }}>
        <Texto variante="rotulo">{titulo}</Texto>
        {descricao ? <Texto variante="legenda" style={{ color: cores.texto2, marginTop: 3 }}>{descricao}</Texto> : null}
      </View>
      <Switch value={valor} onValueChange={onChange} trackColor={{ true: cores.marca, false: '#D3DEDD' }} thumbColor="#fff" />
    </Pressable>
  );
}

export function Segmentos({ total, atual }: { total: number; atual: number }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 4 }} accessibilityLabel={`Pergunta ${atual} de ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i < atual ? cores.marca : cores.fundo2 }} />
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: cores.superficie, borderRadius: 24, boxShadow: sombra.card },
  botao: {
    height: 58,
    borderRadius: raio.lg,
    backgroundColor: cores.marca,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    boxShadow: sombra.botao,
  },
  botaoInativo: { opacity: 0.45, boxShadow: 'none' },
  botaoTitulo: { fontFamily: fonte.negrito, fontSize: 17, color: '#fff' },
  botaoTexto: { height: 44, alignItems: 'center', justifyContent: 'center' },
  voltar: {
    width: 44,
    height: 44,
    borderRadius: raio.md,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: sombra.card,
  },
  chip: { alignSelf: 'flex-start', height: 28, paddingHorizontal: 12, borderRadius: raio.pill, justifyContent: 'center' },
  campo: {
    minHeight: 64,
    borderRadius: raio.lg,
    backgroundColor: cores.superficie,
    boxShadow: sombra.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  campoIcone: { width: 36, height: 36, borderRadius: raio.sm, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
  campoInput: { fontFamily: fonte.semi, fontSize: 16, color: cores.texto, paddingVertical: 2, outlineWidth: 0 } as never,
  interruptor: {
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: cores.superficie,
    borderWidth: 1.5,
    borderColor: 'transparent',
    boxShadow: sombra.card,
  },
  interruptorAtivo: { borderColor: cores.marca },
});
