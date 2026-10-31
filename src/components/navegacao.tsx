import { usePathname, useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Texto } from '@/components/texto';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

type NomeIcone = 'casa' | 'grafico' | 'pessoa' | 'seta' | 'cadeado' | 'check' | 'mais' | 'escudo' | 'info' | 'relogio' | 'chat' | 'lixo' | 'livro' | 'estrela' | 'fogo';

const TRACOS: Record<NomeIcone, ReactNode> = {
  casa: <Path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
  grafico: <Path d="M4 19h16M6 15l4-4 3 3 5-6" />,
  pessoa: (
    <>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </>
  ),
  seta: <Path d="M9 6l6 6-6 6" />,
  cadeado: (
    <>
      <Path d="M6 11h12v9H6z" />
      <Path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
    </>
  ),
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  mais: <Path d="M12 5v14M5 12h14" />,
  escudo: <Path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6z" />,
  info: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 11v5M12 8h.01" />
    </>
  ),
  relogio: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  chat: <Path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z" />,
  lixo: <Path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" />,
  livro: <Path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4zM9 20a4 4 0 0 1 0-8h10" />,
  estrela: <Path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />,
  fogo: <Path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z" />,
};

export function Icone({ nome, cor = cores.texto, tamanho = 20, espessura = 2 }: { nome: NomeIcone; cor?: string; tamanho?: number; espessura?: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round">
      {TRACOS[nome]}
    </Svg>
  );
}

/** Vai para uma tela principal limpando a pilha, para o "voltar" não acumular telas. */
export function irPara(router: ReturnType<typeof useRouter>, href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}

const CORES_AVATAR = [cores.marca, '#F08A4B', '#5B7FD6', '#B5679E', '#2E9C87'];

export function Avatar({ nome, indice = 0, tamanho = 44 }: { nome: string; indice?: number; tamanho?: number }) {
  return (
    <View style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.32, backgroundColor: CORES_AVATAR[indice % CORES_AVATAR.length], alignItems: 'center', justifyContent: 'center' }}>
      <Texto style={{ color: '#fff', fontFamily: fonte.extra, fontSize: tamanho * 0.4 }}>{nome.charAt(0).toUpperCase()}</Texto>
    </View>
  );
}

/** Linha de lista com ícone, título, descrição e seta. */
export function ItemLista({ icone, titulo, descricao, onPress, cor = cores.marca, fundo = cores.marcaSuave }: { icone: NomeIcone; titulo: string; descricao?: string; onPress: () => void; cor?: string; fundo?: string }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.item, pressed && { opacity: 0.7 }]}>
      <View style={[s.itemIcone, { backgroundColor: fundo }]}>
        <Icone nome={icone} cor={cor} tamanho={18} />
      </View>
      <View style={{ flex: 1 }}>
        <Texto variante="rotulo" style={{ fontSize: 14.5 }}>
          {titulo}
        </Texto>
        {descricao ? <Texto variante="legenda">{descricao}</Texto> : null}
      </View>
      <Icone nome="seta" cor={cores.texto3} tamanho={16} />
    </Pressable>
  );
}

const ABAS: { href: Href; rota: string; titulo: string; icone: NomeIcone }[] = [
  { href: '/inicio', rota: '/inicio', titulo: 'Início', icone: 'casa' },
  { href: '/historico', rota: '/historico', titulo: 'Evolução', icone: 'grafico' },
  { href: '/perfil', rota: '/perfil', titulo: 'Perfil', icone: 'pessoa' },
];

/** Barra inferior flutuante das telas principais (vai no `rodape` da Tela). */
export function BarraInferior() {
  const router = useRouter();
  const rota = usePathname();
  return (
    <View style={s.barraFora}>
      <View style={s.barra} accessibilityRole="tablist">
        {ABAS.map((a) => {
          const ativa = rota === a.rota;
          return (
            <Pressable
              key={a.rota}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              onPress={() => !ativa && irPara(router, a.href)}
              style={s.aba}
            >
              <View style={[s.abaIcone, ativa && { backgroundColor: cores.marca }]}>
                <Icone nome={a.icone} cor={ativa ? '#fff' : cores.texto3} tamanho={19} />
              </View>
              <Texto style={{ fontFamily: ativa ? fonte.negrito : fonte.media, fontSize: 11, color: ativa ? cores.marca : cores.texto3 }}>{a.titulo}</Texto>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  itemIcone: { width: 38, height: 38, borderRadius: raio.sm, alignItems: 'center', justifyContent: 'center' },
  barraFora: { marginHorizontal: -4 },
  barra: { flexDirection: 'row', backgroundColor: cores.superficie, borderRadius: raio.xl, paddingVertical: 8, boxShadow: sombra.elevada },
  aba: { flex: 1, alignItems: 'center', gap: 3 },
  abaIcone: { width: 44, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
