import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { repositorio } from '@/storage/repositorio';

// Sons curtos de comemoração (criados para o app, sem direitos de terceiros) + vibração leve.
// Respeitam a chave de silêncio do iPhone e a opção "Sons do app" no Perfil.

export type Som = 'missao' | 'desbloqueio' | 'medalha' | 'conquista' | 'completo' | 'revelacao';

const ARQUIVOS: Record<Som, number> = {
  missao: require('../../assets/sons/missao.wav'),
  desbloqueio: require('../../assets/sons/desbloqueio.wav'),
  medalha: require('../../assets/sons/medalha.wav'),
  conquista: require('../../assets/sons/conquista.wav'),
  completo: require('../../assets/sons/completo.wav'),
  revelacao: require('../../assets/sons/revelacao.wav'),
};

const VIBRACAO: Partial<Record<Som, () => Promise<void>>> = {
  missao: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  medalha: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  completo: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  conquista: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  desbloqueio: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
};

let ligado: boolean | null = null;
let modoPronto: Promise<void> | null = null;
const players = new Map<Som, AudioPlayer>();

export async function sonsLigados(): Promise<boolean> {
  if (ligado === null) ligado = await repositorio.lerSons().catch(() => true);
  return ligado;
}

export async function definirSons(v: boolean) {
  ligado = v;
  await repositorio.salvarSons(v);
}

function prepararModo() {
  // false: se o iPhone estiver no silencioso, não toca; mistura com música que esteja tocando
  modoPronto ??= setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch((e) => console.warn('[sons] modo', e));
  return modoPronto;
}

/** Vibração bem leve de seleção (marcar resposta, trocar aba). Só no celular e só com "Sons do app" ligado. */
export function toqueLeve(): void {
  if (Platform.OS === 'web') return;
  sonsLigados()
    .then((ok) => (ok ? Haptics.selectionAsync() : undefined))
    .catch(() => undefined);
}

/** Toca um som de comemoração (e vibra). Nunca lança erro: som é enfeite. */
export async function tocar(som: Som): Promise<void> {
  try {
    if (!(await sonsLigados())) return;
    if (Platform.OS !== 'web') VIBRACAO[som]?.().catch(() => undefined);
    await prepararModo();
    let p = players.get(som);
    if (!p) {
      p = createAudioPlayer(ARQUIVOS[som]);
      p.volume = 0.6;
      players.set(som, p);
    } else await p.seekTo(0);
    p.play();
  } catch (e) {
    console.warn('[sons] tocar', som, e);
  }
}

/** Toca uma vez ao abrir a tela, quando `quando` for verdadeiro (atraso em ms para casar com a animação). */
export function useSomAoAbrir(som: Som | null, quando = true, atraso = 0) {
  useEffect(() => {
    if (!som || !quando) return;
    const t = setTimeout(() => void tocar(som), atraso);
    return () => clearTimeout(t);
  }, [som, quando, atraso]);
}
