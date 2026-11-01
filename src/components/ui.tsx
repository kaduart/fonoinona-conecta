import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Texto } from '@/components/texto';
import type { NivelResultado } from '@/domain/triagem';
import { cores, fonte, raio, sombra, toque } from '@/theme/tokens';

/** Estado vazio do app: ícone num selo, título, texto e (opcional) uma ação. Mesmo desenho em todas as telas. */
export function Vazio({ icone, titulo, texto, children }: { icone: ReactNode; titulo: string; texto: string; children?: ReactNode }) {
  return (
    <View style={[s.card, s.vazio]}>
      <View style={s.vazioSelo}>{icone}</View>
      <Texto variante="rotulo" style={{ textAlign: 'center' }}>
        {titulo}
      </Texto>
      <Texto style={{ textAlign: 'center' }}>{texto}</Texto>
      {children}
    </View>
  );
}

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
      style={({ pressed }) => [s.botao, inativo && s.botaoInativo, pressed && toque]}
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

export function Campo({ rotulo, icone, onFocus, onBlur, ...props }: TextInputProps & { rotulo: string; icone?: ReactNode }) {
  const [foco, setFoco] = useState(false);
  return (
    <View style={[s.campo, foco && s.campoFoco]}>
      {icone ? <View style={s.campoIcone}>{icone}</View> : null}
      <View style={{ flex: 1 }}>
        <Texto variante="legenda">{rotulo}</Texto>
        <TextInput
          placeholderTextColor={cores.texto3}
          {...props}
          onFocus={(e) => {
            setFoco(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFoco(false);
            onBlur?.(e);
          }}
          style={s.campoInput}
          accessibilityLabel={rotulo}
        />
      </View>
    </View>
  );
}

/**
 * Opção liga/desliga num card. Um único controle acessível (o card todo): a chave e a caixa são só desenho,
 * para o leitor de tela não anunciar dois controles. `tipo="caixa"` para aceites (consentimento).
 */
export function Interruptor({
  valor,
  onChange,
  titulo,
  descricao,
  tipo = 'chave',
}: {
  valor: boolean;
  onChange: (v: boolean) => void;
  titulo: string;
  descricao?: string;
  tipo?: 'chave' | 'caixa';
}) {
  return (
    <Pressable
      onPress={() => onChange(!valor)}
      style={[s.interruptor, valor && tipo === 'caixa' && s.interruptorAtivo]}
      accessibilityRole={tipo === 'caixa' ? 'checkbox' : 'switch'}
      accessibilityState={{ checked: valor }}
      accessibilityLabel={descricao ? `${titulo}. ${descricao}` : titulo}
    >
      {tipo === 'caixa' ? (
        <View style={[s.caixa, valor && s.caixaAtiva]}>{valor ? <Texto style={{ color: '#fff', fontSize: 14, lineHeight: 16, fontFamily: fonte.extra }}>✓</Texto> : null}</View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Texto variante="rotulo">{titulo}</Texto>
        {descricao ? <Texto variante="legenda" style={{ color: cores.texto2, marginTop: 3 }}>{descricao}</Texto> : null}
      </View>
      {tipo === 'chave' ? (
        <View style={[s.trilhoChave, valor && { backgroundColor: cores.marca }]}>
          <View style={[s.bolinhaChave, valor && { transform: [{ translateX: 20 }] }]} />
        </View>
      ) : null}
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
  caixa: { width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: '#B8C6C5', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  caixaAtiva: { backgroundColor: cores.marca, borderColor: cores.marca },
  trilhoChave: { width: 48, height: 28, borderRadius: 14, backgroundColor: '#C9D6D5', padding: 3, justifyContent: 'center' },
  bolinhaChave: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', boxShadow: '0px 1px 3px rgba(0,0,0,0.18)' },
  vazio: { padding: 22, gap: 8, alignItems: 'center' },
  vazioSelo: { width: 52, height: 52, borderRadius: 26, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  card: { backgroundColor: cores.superficie, borderRadius: 24, boxShadow: sombra.card, borderWidth: 1, borderColor: 'rgba(31, 44, 45, 0.05)' },
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
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  campoIcone: { width: 36, height: 36, borderRadius: raio.sm, backgroundColor: cores.marcaSuave, alignItems: 'center', justifyContent: 'center' },
  campoInput: { fontFamily: fonte.semi, fontSize: 16, color: cores.texto, paddingVertical: 2, outlineWidth: 0, outlineStyle: 'none' } as never,
  campoFoco: { borderColor: cores.marca },
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
