import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icone } from '@/components/navegacao';
import { Texto } from '@/components/texto';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

/**
 * Aviso curto no topo (estilo Sonner), sem dependência nova: Reanimated, que o app já usa.
 * Use para confirmar uma ação ("Anotação salva") sem tirar a pessoa da tela.
 */
type Tipo = 'ok' | 'erro' | 'info';
type Aviso = { id: number; texto: string; tipo: Tipo };
type Ctx = { mostrar: (texto: string, tipo?: Tipo) => void };

const Contexto = createContext<Ctx>({ mostrar: () => {} });

export function useAviso() {
  return useContext(Contexto);
}

const DURACAO = 2800;

export function AvisoProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = useCallback((texto: string, tipo: Tipo = 'ok') => {
    seq.current += 1;
    setAviso({ id: seq.current, texto, tipo });
  }, []);

  useEffect(() => {
    if (!aviso) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAviso(null), DURACAO);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [aviso]);

  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      <Camada aviso={aviso} fechar={() => setAviso(null)} />
    </Contexto.Provider>
  );
}

function Camada({ aviso, fechar }: { aviso: Aviso | null; fechar: () => void }) {
  const { top } = useSafeAreaInsets();
  if (!aviso) return null;
  const paleta = {
    ok: { fundo: cores.texto, icone: cores.marcaClara, nome: 'check' as const },
    erro: { fundo: cores.avaliarTexto, icone: '#fff', nome: 'info' as const },
    info: { fundo: cores.marcaEscura, icone: '#fff', nome: 'info' as const },
  }[aviso.tipo];
  return (
    <View pointerEvents="box-none" style={[s.camada, { top: top + 8 }]}>
      <Animated.View key={aviso.id} entering={FadeInUp.springify().damping(18)} exiting={FadeOutUp.duration(180)}>
        <Pressable
          onPress={fechar}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          accessibilityLabel={aviso.texto}
          style={[s.aviso, { backgroundColor: paleta.fundo }]}
        >
          <Icone nome={paleta.nome} cor={paleta.icone} tamanho={18} espessura={2.6} />
          <Texto style={s.texto} numberOfLines={2}>
            {aviso.texto}
          </Texto>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  camada: { position: 'absolute', left: 16, right: 16, alignItems: 'center', zIndex: 1000 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: raio.pill,
    maxWidth: 480,
    boxShadow: sombra.elevada,
  },
  texto: { fontFamily: fonte.semi, fontSize: 14.5, lineHeight: 19, color: '#fff', flexShrink: 1 },
});
