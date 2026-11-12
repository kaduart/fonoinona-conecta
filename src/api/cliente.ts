import Constants from 'expo-constants';

import { atrasoMs, confirmar, enfileirar, falhou, liberar, proximoLote, type EventoApp } from '@/api/fila';
import { novoId, repositorio } from '@/storage/repositorio';

// Comunicação com a API da clínica. Sem EXPO_PUBLIC_API_URL tudo vira no-op e o app funciona 100% offline.
// Só sai do aparelho: eventos anônimos de uso e o código CONECTA-XXXX. Nunca respostas, resultado, nome ou nascimento.

const base = () => (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');
const VERSAO_APP = Constants.expoConfig?.version ?? '0.0.0';
const TIMEOUT_MS = 8_000;
/** Eventos esperam mais: a API no Render grátis leva 30–60 s para acordar e, com 8 s, nenhum envio chegava. */
const TIMEOUT_EVENTOS_MS = 60_000;

export const apiAtiva = () => base().length > 0;

export async function chamar(caminho: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), timeoutMs);
  try {
    return await fetch(`${base()}${caminho}`, { ...init, signal: controle.signal, headers: { 'Content-Type': 'application/json', ...init.headers } });
  } finally {
    clearTimeout(timer);
  }
}

type SemId<T> = T extends unknown ? Omit<T, 'id' | 'em'> : never;

let enviando: Promise<void> | null = null;
let reenvio: ReturnType<typeof setTimeout> | null = null;

/** Com o app aberto, tenta de novo sozinho depois do backoff (antes só tentava no próximo evento). */
function agendarReenvio(tentativas: number) {
  if (reenvio) return;
  reenvio = setTimeout(() => {
    reenvio = null;
    void sincronizar();
  }, atrasoMs(Math.max(tentativas - 1, 0)) + 1_000);
  (reenvio as { unref?: () => void }).unref?.();
}

/** Zera a espera da fila. Chamado ao abrir o app. Nunca lança. */
export async function liberarFila(): Promise<void> {
  try {
    await repositorio.salvarFila(liberar(await repositorio.lerFila()));
  } catch (e) {
    console.warn('[api] não liberou a fila', e);
  }
}

/** Envia o que estiver na fila. Uma execução por vez; falha agenda nova tentativa com backoff. */
export function sincronizar(): Promise<void> {
  if (!apiAtiva()) return Promise.resolve();
  enviando ??= (async () => {
    try {
      // repete enquanto houver fila: eventos que chegaram durante um envio também saem agora
      for (;;) {
        const lote = proximoLote(await repositorio.lerFila(), Date.now());
        if (!lote.length) return;
        try {
          const r = await chamar(
            '/v1/eventos',
            { method: 'POST', body: JSON.stringify({ instalacaoId: await repositorio.instalacaoId(), versaoApp: VERSAO_APP, eventos: lote }) },
            TIMEOUT_EVENTOS_MS,
          );
          // 400 = lote fora do contrato: descarta para não travar a fila para sempre
          if (r.ok || r.status === 400) {
            if (!r.ok) console.warn('[api] lote recusado pela API e descartado');
            await repositorio.salvarFila(confirmar(await repositorio.lerFila(), lote.map((e) => e.id)));
          } else {
            throw new Error(`HTTP ${r.status}`);
          }
        } catch (e) {
          console.warn('[api] envio de eventos falhou, nova tentativa depois', String(e));
          const fila = falhou(await repositorio.lerFila(), Date.now());
          await repositorio.salvarFila(fila);
          agendarReenvio(fila.tentativas);
          return;
        }
      }
    } finally {
      enviando = null;
    }
  })();
  return enviando;
}

/** Registra um evento de uso (só com o termo aceito) e tenta enviar. Nunca lança. true = entrou na fila. */
export async function registrarEvento(evento: SemId<EventoApp>): Promise<boolean> {
  if (!apiAtiva()) return false;
  try {
    if (!(await repositorio.lerConsentimento())) return false;
    const completo = { ...evento, id: `ev-${novoId()}`, em: new Date().toISOString() } as EventoApp;
    await repositorio.salvarFila(enfileirar(await repositorio.lerFila(), completo));
    sincronizar();
    return true;
  } catch (e) {
    console.warn('[api] não registrou o evento', e);
    return false;
  }
}

/** Avisa a clínica que este código abriu o WhatsApp. Idempotente no servidor; 3 tentativas com espera. */
export async function registrarLead(codigo: string, origem: 'resultado' | 'missoes' | 'geral', faixaId?: string): Promise<void> {
  if (!apiAtiva()) return;
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    try {
      const r = await chamar('/v1/leads', { method: 'POST', body: JSON.stringify({ codigo, origem, faixaId }) });
      if (r.ok || r.status === 400) return;
    } catch {
      // rede: tenta de novo
    }
    await new Promise((ok) => setTimeout(ok, 1_000 * 2 ** tentativa));
  }
  console.warn('[api] lead não registrado; o código segue na mensagem do WhatsApp');
}

/** Baixa o conteúdo novo, se houver (ETag), e guarda no aparelho. */
export async function atualizarConteudo(): Promise<boolean> {
  if (!apiAtiva()) return false;
  try {
    const atual = await repositorio.lerConteudoRemoto();
    const r = await chamar('/v1/conteudo', { headers: atual ? { 'If-None-Match': `"${atual.versao}"` } : {} });
    if (r.status === 304 || !r.ok) return false;
    await repositorio.salvarConteudoRemoto(await r.json());
    return true;
  } catch (e) {
    console.warn('[api] não atualizou o conteúdo', String(e));
    return false;
  }
}
