import type { RegistroDiario } from '@/domain/diario';
import { dataLocal } from '@/domain/diario';

// Evolução lúdica, camada 1: tudo informado pela família e guardado só no aparelho (cifrado).
// - Ciclo de sessões: a família diz o tamanho do pacote (4, 8 ou 12) e marca "Fomos à sessão".
// - Atividades de casa: o que a terapeuta pediu para praticar; "Fizemos!" vira um registro no Diário.
// Quando houver vínculo com a clínica (src/api/vinculo.ts), o ciclo e as atividades virão de lá.

// ─── Ciclo de sessões ─────────────────────────────────────────────────────────

export const TAMANHOS_CICLO = [4, 8, 12] as const;
export type TamanhoCiclo = (typeof TAMANHOS_CICLO)[number];

export type Ciclo = {
  id: string;
  criancaId: string;
  /** quantas sessões o ciclo tem */
  total: number;
  /** dias (yyyy-mm-dd, local) em que a família marcou que foi à sessão, em ordem */
  sessoes: string[];
  /** 1, 2, 3…: cada ciclo completo vira uma fase */
  fase: number;
  /** ISO */
  iniciadoEm: string;
};

export type EstagioCiclo = 'andando' | 'quase' | 'completo';

export function novoCiclo(criancaId: string, total: number, agora: Date, fase = 1, id = `ciclo-${agora.getTime().toString(36)}`): Ciclo {
  return { id, criancaId, total: Math.max(1, Math.round(total)), sessoes: [], fase, iniciadoEm: agora.toISOString() };
}

/** Marca a sessão de um dia. Idempotente: o mesmo dia não conta duas vezes, e o ciclo não passa do total. */
export function marcarSessao(c: Ciclo, data: string): Ciclo {
  if (c.sessoes.includes(data) || c.sessoes.length >= c.total) return c;
  return { ...c, sessoes: [...c.sessoes, data].sort() };
}

export function desmarcarSessao(c: Ciclo, data: string): Ciclo {
  return c.sessoes.includes(data) ? { ...c, sessoes: c.sessoes.filter((d) => d !== data) } : c;
}

/** Faltando até 20% (com piso de 1), o ciclo está "quase": 10 de 12, 7 de 8, 3 de 4. */
export function limiteRenovacao(total: number): number {
  return Math.max(1, Math.floor(total * 0.2));
}

export function progressoCiclo(c: Ciclo): { feitas: number; total: number; restantes: number; estagio: EstagioCiclo } {
  const feitas = Math.min(c.sessoes.length, c.total);
  const restantes = c.total - feitas;
  const estagio: EstagioCiclo = restantes === 0 ? 'completo' : restantes <= limiteRenovacao(c.total) ? 'quase' : 'andando';
  return { feitas, total: c.total, restantes, estagio };
}

export type NoTrilha = { indice: number; estado: 'feito' | 'proximo' | 'futuro'; data?: string; ultimo: boolean };

/** Um nó por sessão: as feitas, a próxima e as que faltam. */
export function nosDaTrilha(c: Ciclo): NoTrilha[] {
  const feitas = Math.min(c.sessoes.length, c.total);
  return Array.from({ length: c.total }, (_, i) => ({
    indice: i,
    estado: i < feitas ? 'feito' : i === feitas ? 'proximo' : 'futuro',
    data: c.sessoes[i],
    ultimo: i === c.total - 1,
  }));
}

/** Código fixo do card de renovação: a recepção reconhece de onde veio, sem dado da criança. */
export const CODIGO_RENOVACAO = 'CONECTA-RENOVA';

/** Mensagem do card "Ciclo quase completo" (texto aprovado pelo Kadu em 01/11/2026). */
export const TEXTO_RENOVACAO = `Olá! Meu filho está concluindo o ciclo de sessões do Conecta (Código: ${CODIGO_RENOVACAO}). Gostaria de confirmar os próximos agendamentos.`;

// ─── Atividades de casa ───────────────────────────────────────────────────────

export type AtividadeCasa = {
  id: string;
  criancaId: string;
  titulo: string;
  /** quantas vezes por semana a terapeuta pediu */
  vezesSemana: number;
  /** ISO */
  criadaEm: string;
};

export const TITULO_ATIVIDADE_MAX = 80;
export const VEZES_SEMANA = [1, 2, 3, 4, 5, 6, 7] as const;

/** Exemplos para a família começar. A atividade de verdade é a que a terapeuta passou. */
export const EXEMPLOS_ATIVIDADE = ['Leitura dialogada', 'Brincadeira de imitação', 'Nomear objetos no banho'];

export function novaAtividade(
  criancaId: string,
  titulo: string,
  vezesSemana: number,
  agora: Date,
  id = `ativ-${agora.getTime().toString(36)}`,
): { ok: true; atividade: AtividadeCasa } | { ok: false; erro: 'titulo' | 'vezes' } {
  const t = titulo.trim().replace(/\s+/g, ' ');
  if (!t || t.length > TITULO_ATIVIDADE_MAX) return { ok: false, erro: 'titulo' };
  if (!Number.isInteger(vezesSemana) || vezesSemana < 1 || vezesSemana > 7) return { ok: false, erro: 'vezes' };
  return { ok: true, atividade: { id, criancaId, titulo: t, vezesSemana, criadaEm: agora.toISOString() } };
}

/** Id fixo por atividade e dia: tocar "Fizemos!" duas vezes no mesmo dia não duplica. */
export function idFizemos(atividadeId: string, data: string): string {
  return `fiz-${atividadeId}-${data}`;
}

/** O registro do Diário que nasce do "Fizemos!". A família pode abrir depois e acrescentar como foi. */
export function registroFizemos(a: AtividadeCasa, hoje: Date): RegistroDiario {
  const data = dataLocal(hoje);
  const agora = hoje.toISOString();
  return {
    id: idFizemos(a.id, data),
    criancaId: a.criancaId,
    data,
    contexto: 'casa',
    humor: null,
    areas: [],
    conquista: false,
    nota: '',
    atividadeId: a.id,
    atividadeTitulo: a.titulo,
    criadoEm: agora,
    editadoEm: agora,
  };
}

function seteDias(hoje: Date): { desde: string; ate: string } {
  const h = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return { desde: dataLocal(new Date(h.getFullYear(), h.getMonth(), h.getDate() - 6)), ate: dataLocal(h) };
}

/** Quantos dias, nos últimos 7 (com hoje), a atividade foi feita. */
export function feitasNaSemana(atividadeId: string, registros: RegistroDiario[], hoje: Date): number {
  const { desde, ate } = seteDias(hoje);
  return new Set(registros.filter((r) => r.atividadeId === atividadeId && r.data >= desde && r.data <= ate).map((r) => r.data)).size;
}

export function feitaHoje(atividadeId: string, registros: RegistroDiario[], hoje: Date): boolean {
  return registros.some((r) => r.id === idFizemos(atividadeId, dataLocal(hoje)));
}
