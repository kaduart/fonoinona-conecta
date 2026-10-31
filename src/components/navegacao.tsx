import { usePathname, useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Texto } from '@/components/texto';
import { cores, fonte, raio, sombra } from '@/theme/tokens';

type NomeIcone = 'casa' | 'grafico' | 'pessoa' | 'seta' | 'cadeado' | 'check' | 'mais' | 'escudo' | 'info' | 'relogio' | 'chat' | 'lixo' | 'livro' | 'estrela' | 'fogo' | 'equipe' | 'play' | 'cronometro' | 'baixo';

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
  equipe: (
    <>
      <Circle cx={9} cy={8} r={3.5} />
      <Path d="M3 20c1-3.5 3.2-5 6-5s5 1.5 6 5M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.6.6 2.6 2.2 3 5" />
    </>
  ),
  play: <Path d="M8 5.5v13l11-6.5z" />,
  cronometro: (
    <>
      <Circle cx={12} cy={13} r={8} />
      <Path d="M12 9v4l2.5 2M9 2h6" />
    </>
  ),
  baixo: <Path d="M6 9l6 6 6-6" />,
};

export function Icone({ nome, cor = cores.texto, tamanho = 20, espessura = 2, cheio }: { nome: NomeIcone; cor?: string; tamanho?: number; espessura?: number; cheio?: boolean }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 24 24" fill={cheio ? cor : 'none'} stroke={cor} strokeWidth={espessura} strokeLinecap="round" strokeLinejoin="round">
      {TRACOS[nome]}
    </Svg>
  );
}

/** Vai para uma tela principal limpando a pilha, para o "voltar" não acumular telas. */
export function irPara(router: ReturnType<typeof useRouter>, href: Href) {
  if (router.canDismiss()) router.dismissAll();
  router.replace(href);
}

const CORES_AVATAR = [cores.marca, cores.terra, '#5B7FD6', '#B5679E', '#2E9C87'];

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
  { href: '/trilha', rota: '/trilha', titulo: 'Trilha', icone: 'estrela' },
  { href: '/historico', rota: '/historico', titulo: 'Evolução', icone: 'grafico' },
  { href: '/equipe', rota: '/equipe', titulo: 'Equipe', icone: 'equipe' },
];

/** Marca da clínica + nome do app, no topo das telas principais. */
export function Marca() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }} accessibilityLabel="Fono Inova Conecta">
      <Image source={require('../../assets/images/marca.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
      <View>
        <Texto style={{ fontFamily: fonte.extra, fontSize: 14, lineHeight: 16, color: cores.marcaEscura }}>Fono Inova</Texto>
        <Texto style={{ fontFamily: fonte.semi, fontSize: 11, lineHeight: 13, color: cores.texto3, letterSpacing: 0.6 }}>CONECTA</Texto>
      </View>
    </View>
  );
}

/** Pílula com a criança atual; leva ao perfil para trocar ou adicionar. */
export function SeletorCrianca({ nome, idade, indice = 0 }: { nome: string; idade: string; indice?: number }) {
  const router = useRouter();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${nome}, ${idade}. Trocar criança`} onPress={() => router.push('/perfil')} style={({ pressed }) => [s.seletor, pressed && { opacity: 0.8 }]}>
      <Avatar nome={nome} indice={indice} tamanho={30} />
      <Texto style={{ fontFamily: fonte.semi, fontSize: 13, color: cores.texto }} numberOfLines={1}>
        {nome} · {idade}
      </Texto>
      <Icone nome="baixo" cor={cores.texto2} tamanho={14} espessura={2.4} />
    </Pressable>
  );
}

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
  barra: { flexDirection: 'row', backgroundColor: cores.superficie, borderRadius: 26, paddingVertical: 10, boxShadow: sombra.elevada },
  seletor: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, paddingLeft: 5, paddingRight: 12, borderRadius: raio.pill, backgroundColor: cores.superficie, boxShadow: sombra.card, maxWidth: 210 },
  aba: { flex: 1, alignItems: 'center', gap: 3 },
  abaIcone: { width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
});
