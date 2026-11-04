import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { registrarEvento } from '@/api/cliente';
import type { ModoUso, Plataforma } from '@/api/fila';

// Mede quantas famílias instalam o app (PWA na tela inicial) e de onde usam.
// Só sinais técnicos grossos: modo (instalado/navegador), plataforma (android/ios/desktop). Nada de aparelho, IP ou pessoa.
// O navegador pode avisar a instalação antes do termo ser aceito: a marca fica no aparelho e só é enviada depois do aceite.

const CHAVE = 'conecta:pwa-instalacao:v1';

type Marca = 'oferecida' | 'instalada';
type Estado = Partial<Record<Marca, { em: string; enviada: boolean }>>;

type JanelaWeb = {
  matchMedia?: (q: string) => { matches: boolean };
  navigator?: { userAgent?: string; maxTouchPoints?: number; standalone?: boolean };
  addEventListener?: (tipo: string, f: () => void) => void;
};
const janela = (): JanelaWeb | undefined => (Platform.OS === 'web' && typeof window !== 'undefined' ? (window as unknown as JanelaWeb) : undefined);

export function plataformaAtual(): Plataforma {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  const nav = janela()?.navigator;
  const ua = nav?.userAgent ?? '';
  if (/android/i.test(ua)) return 'android';
  // iPad novo se apresenta como Mac: diferencia pelo toque
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && (nav?.maxTouchPoints ?? 0) > 1)) return 'ios';
  if (/mobile/i.test(ua)) return 'outro';
  return ua ? 'desktop' : 'outro';
}

export function modoAtual(): ModoUso {
  const w = janela();
  if (!w) return 'nativo';
  const instalado =
    w.navigator?.standalone === true ||
    ['standalone', 'fullscreen', 'minimal-ui'].some((m) => w.matchMedia?.(`(display-mode: ${m})`).matches);
  return instalado ? 'instalado' : 'navegador';
}

async function lerEstado(): Promise<Estado> {
  try {
    return JSON.parse((await AsyncStorage.getItem(CHAVE)) ?? '{}') as Estado;
  } catch {
    return {};
  }
}

// Tudo que lê e grava o estado passa por esta fila: os dois avisos do navegador podem chegar juntos
// e um envio pode estar em curso; assim ninguém sobrescreve a marca do outro.
let fila: Promise<unknown> = Promise.resolve();
function emOrdem<T>(f: () => Promise<T>): Promise<T> {
  const vez = fila.then(f);
  fila = vez.catch(() => undefined);
  return vez;
}

/** Anota no aparelho que o navegador ofereceu/instalou. Idempotente: guarda só a primeira vez. */
export async function marcarInstalacao(marca: Marca): Promise<void> {
  await emOrdem(async () => {
    const estado = await lerEstado();
    if (estado[marca]) return;
    estado[marca] = { em: new Date().toISOString(), enviada: false };
    await AsyncStorage.setItem(CHAVE, JSON.stringify(estado));
  });
  await enviarPendentes();
}

/** Envia as marcas ainda não enviadas (só depois do termo aceito). Nunca lança. */
export function enviarPendentes(): Promise<void> {
  return emOrdem(async () => {
    const estado = await lerEstado();
    const tipos = { oferecida: 'instalacao_oferecida', instalada: 'app_instalado' } as const;
    let mudou = false;
    for (const marca of ['oferecida', 'instalada'] as const) {
      const m = estado[marca];
      if (!m || m.enviada) continue;
      if (await registrarEvento({ tipo: tipos[marca], plataforma: plataformaAtual() })) {
        m.enviada = true;
        mudou = true;
      }
    }
    if (mudou) await AsyncStorage.setItem(CHAVE, JSON.stringify(estado));
  }).catch((e) => console.warn('[instalacao] envio das marcas', e));
}

/** Registra a abertura com o modo e a plataforma, e envia o que estava pendente. Nunca lança. */
export async function registrarAbertura(): Promise<void> {
  await registrarEvento({ tipo: 'app_aberto', modo: modoAtual(), plataforma: plataformaAtual() });
  await enviarPendentes();
}

let monitorando = false;

/** Escuta os avisos de instalação do navegador. Chamar o quanto antes (o aviso pode vir logo no carregamento). */
export function monitorarInstalacao(): void {
  const w = janela();
  if (!w?.addEventListener || monitorando) return;
  monitorando = true;
  // Não chama preventDefault: o navegador continua mostrando o próprio convite de instalar.
  w.addEventListener('beforeinstallprompt', () => void marcarInstalacao('oferecida'));
  w.addEventListener('appinstalled', () => void marcarInstalacao('instalada'));
}
