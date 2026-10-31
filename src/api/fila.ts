// Fila local de eventos anônimos. Funções puras: quem grava e envia é o cliente.

export type EventoApp =
  | { id: string; em: string; tipo: 'app_aberto' }
  | { id: string; em: string; tipo: 'triagem_concluida'; faixaId: string }
  | { id: string; em: string; tipo: 'missao_concluida'; missaoId: string; como: 'facil' | 'com_ajuda' | 'dificil' }
  | { id: string; em: string; tipo: 'whatsapp_aberto'; origem: 'resultado' | 'missoes' | 'geral' };

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

/** Backoff exponencial: 30 s, 1 min, 2 min… até 1 h. */
export function atrasoMs(tentativas: number): number {
  return Math.min(30_000 * 2 ** tentativas, 60 * 60_000);
}

export function falhou(fila: Fila, agora: number): Fila {
  return { ...fila, tentativas: fila.tentativas + 1, proximaTentativaEm: agora + atrasoMs(fila.tentativas) };
}
