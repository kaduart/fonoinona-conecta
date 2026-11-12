// Fila local de eventos anônimos. Funções puras: quem grava e envia é o cliente.

/** instalado = PWA aberto da tela inicial; navegador = aba comum; nativo = app de loja */
export type ModoUso = 'instalado' | 'navegador' | 'nativo';
export type Plataforma = 'android' | 'ios' | 'desktop' | 'outro';

export type EventoApp =
  | { id: string; em: string; tipo: 'app_aberto'; modo?: ModoUso; plataforma?: Plataforma }
  /** o navegador ofereceu instalar (beforeinstallprompt, só Chrome/Android) */
  | { id: string; em: string; tipo: 'instalacao_oferecida'; plataforma?: Plataforma }
  /** a família instalou o PWA (appinstalled) */
  | { id: string; em: string; tipo: 'app_instalado'; plataforma?: Plataforma }
  | { id: string; em: string; tipo: 'triagem_concluida'; faixaId: string }
  | { id: string; em: string; tipo: 'missao_concluida'; missaoId: string; como: 'facil' | 'com_ajuda' | 'dificil' }
  | { id: string; em: string; tipo: 'whatsapp_aberto'; origem: 'resultado' | 'missoes' | 'geral' | 'diario' }
  /** só o contexto: nunca a nota, as áreas ou o humor */
  | { id: string; em: string; tipo: 'diario_registro'; contexto: 'casa' | 'escola' | 'terapia' }
  /** a família abriu o WhatsApp para indicar o app a outra família */
  | { id: string; em: string; tipo: 'app_indicado' }
  /** interesse no kit da fase (lista de espera anônima) */
  | { id: string; em: string; tipo: 'kit_interesse'; fase: number };

export type Fila = { eventos: EventoApp[]; tentativas: number; proximaTentativaEm: number };

export const FILA_VAZIA: Fila = { eventos: [], tentativas: 0, proximaTentativaEm: 0 };
export const TAM_LOTE = 50;
/** Teto da fila: sem internet por muito tempo, descarta os mais antigos. */
export const MAX_FILA = 500;

export function enfileirar(fila: Fila, evento: EventoApp): Fila {
  if (fila.eventos.some((e) => e.id === evento.id)) return fila;
  return { ...fila, eventos: [...fila.eventos, evento].slice(-MAX_FILA) };
}

export function proximoLote(fila: Fila, agora: number): EventoApp[] {
  if (agora < fila.proximaTentativaEm) return [];
  return fila.eventos.slice(0, TAM_LOTE);
}

export function confirmar(fila: Fila, enviados: string[]): Fila {
  const ok = new Set(enviados);
  return { eventos: fila.eventos.filter((e) => !ok.has(e.id)), tentativas: 0, proximaTentativaEm: 0 };
}

/** Teto do backoff. Curto de propósito: a API (Render grátis) dorme e um teto de 1 h travava a fila para sempre. */
export const ATRASO_MAX_MS = 5 * 60_000;

/** Backoff exponencial: 30 s, 1 min, 2 min, 4 min… até 5 min. */
export function atrasoMs(tentativas: number): number {
  return Math.min(30_000 * 2 ** tentativas, ATRASO_MAX_MS);
}

/** Zera a espera (usado ao abrir o app: a família está aqui, vale tentar já). */
export function liberar(fila: Fila): Fila {
  return { ...fila, tentativas: 0, proximaTentativaEm: 0 };
}

export function falhou(fila: Fila, agora: number): Fila {
  return { ...fila, tentativas: fila.tentativas + 1, proximaTentativaEm: agora + atrasoMs(fila.tentativas) };
}
