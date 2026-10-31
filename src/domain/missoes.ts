import type { Area } from '@/content/perguntas';
import { FRASE_AREA, LIMITE_DIFICIL, MISSOES, type ComoFoi, type Missao } from '@/content/missoes';

export type Conclusao = {
  id: string;
  criancaId: string;
  missaoId: string;
  como: ComoFoi;
  /** ISO */
  em: string;
};

export type ItemTrilha = { missao: Missao; liberada: boolean; feitas: number };

/**
 * Missões da idade, com a área de foco da triagem primeiro.
 * A partir de 3 anos, as missões feitas para a idade (de 2 anos para cima) vêm antes das de bebê.
 */
export function missoesParaIdade(meses: number, areaFoco?: Area | null, catalogo: Missao[] = MISSOES): Missao[] {
  const daIdade = catalogo.filter((m) => m.idadeMinMeses <= meses && (m.idadeMaxMeses === undefined || meses <= m.idadeMaxMeses));
  const peso = (m: Missao) => (areaFoco && m.areas.includes(areaFoco) ? 0 : 1);
  const daFase = (m: Missao) => (meses >= 36 && m.idadeMinMeses < 24 ? 1 : 0);
  return [...daIdade].sort((a, b) => peso(a) - peso(b) || daFase(a) - daFase(b) || a.ordem - b.ordem);
}

/** Trilha sequencial: cada missão abre quando a anterior foi concluída pelo menos uma vez. */
export function montarTrilha(missoes: Missao[], conclusoes: Conclusao[]): ItemTrilha[] {
  const feitas = new Map<string, number>();
  for (const c of conclusoes) feitas.set(c.missaoId, (feitas.get(c.missaoId) ?? 0) + 1);
  return missoes.map((missao, i) => ({
    missao,
    feitas: feitas.get(missao.id) ?? 0,
    liberada: i === 0 || (feitas.get(missoes[i - 1].id) ?? 0) > 0,
  }));
}

/** Missão do dia: a primeira liberada que ainda não foi feita; se todas já foram, a feita há mais tempo. */
export function missaoDoDia(trilha: ItemTrilha[], conclusoes: Conclusao[]): Missao | null {
  const pendente = trilha.find((t) => t.liberada && t.feitas === 0);
  if (pendente) return pendente.missao;
  if (!trilha.length) return null;
  const ultima = new Map<string, string>();
  for (const c of conclusoes) if ((ultima.get(c.missaoId) ?? '') < c.em) ultima.set(c.missaoId, c.em);
  return [...trilha].sort((a, b) => (ultima.get(a.missao.id) ?? '').localeCompare(ultima.get(b.missao.id) ?? ''))[0].missao;
}

function diaLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Dias seguidos com pelo menos uma missão, terminando hoje ou ontem. */
/** Dias seguidos com atividade. Aceita conclusões de missão e marcas do Diário (qualquer coisa com `em`). */
export function diasSeguidos(conclusoes: { em: string }[], hoje: Date): number {
  const dias = new Set(conclusoes.map((c) => diaLocal(new Date(c.em))));
  const cursor = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  if (!dias.has(diaLocal(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (dias.has(diaLocal(cursor))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

/** Quais dos últimos 7 dias (do mais antigo para hoje) tiveram missão ou Diário. */
export function semana(conclusoes: { em: string }[], hoje: Date): { dia: Date; feito: boolean }[] {
  const dias = new Set(conclusoes.map((c) => diaLocal(new Date(c.em))));
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (6 - i));
    return { dia, feito: dias.has(diaLocal(dia)) };
  });
}

/** Áreas em que a família marcou "Difícil" ao menos LIMITE_DIFICIL vezes: sugerir conversar com a equipe. */
export function areasComDificuldade(conclusoes: Conclusao[], catalogo: Missao[] = MISSOES, limite = LIMITE_DIFICIL): Area[] {
  const porId = new Map(catalogo.map((m) => [m.id, m]));
  const conta = new Map<Area, number>();
  for (const c of conclusoes) {
    if (c.como !== 'dificil') continue;
    for (const a of porId.get(c.missaoId)?.areas ?? []) conta.set(a, (conta.get(a) ?? 0) + 1);
  }
  return [...conta].filter(([, n]) => n >= limite).map(([a]) => a);
}

/**
 * Ponte de propósito: o feedback da missão concluída e o próximo passo da trilha.
 * `conclusoes` já deve incluir a missão que acabou de ser feita.
 */
export function ponteProposito(
  feita: Missao,
  nome: string,
  missoes: Missao[],
  conclusoes: Conclusao[],
): { feedback: string; proxima: Missao | null; motivo: string | null } {
  const feedback = `Muito bem! Hoje ${nome} exercitou ${FRASE_AREA[feita.areas[0]]}.`;
  const trilha = montarTrilha(missoes, conclusoes);
  const pendente = trilha.find((t) => t.liberada && t.feitas === 0 && t.missao.id !== feita.id);
  if (!pendente) return { feedback, proxima: null, motivo: null };
  const proxima = pendente.missao;
  const motivo =
    proxima.areas[0] === feita.areas[0]
      ? `Próximo passo: ${proxima.titulo}, para continuar com ${FRASE_AREA[proxima.areas[0]]}.`
      : `Próximo passo: ${proxima.titulo}, para levar essa evolução para ${FRASE_AREA[proxima.areas[0]]}.`;
  return { feedback, proxima, motivo };
}

// ---------------- Gamificação ----------------

/** Quantas missões formam uma fase da trilha. */
export const MISSOES_POR_FASE = 4;
/** Meta de dias com missão por semana, mostrada no Início. */
export const META_SEMANAL = 3;

export type Medalha = { nome: string; tom: 'bronze' | 'prata' | 'ouro' | 'esmeralda' | 'diamante' };

const MEDALHAS: Medalha[] = [
  { nome: 'Primeiros Passos', tom: 'bronze' },
  { nome: 'Pequeno Explorador', tom: 'prata' },
  { nome: 'Grande Comunicador', tom: 'ouro' },
  { nome: 'Mestre das Palavras', tom: 'esmeralda' },
  { nome: 'Estrela Fono Inova', tom: 'diamante' },
];

export type Fase = { numero: number; medalha: Medalha; itens: ItemTrilha[]; feitas: number; completa: boolean };

/** Divide a trilha em fases de 4 missões; cada fase completa vale uma medalha. */
export function fasesDaTrilha(trilha: ItemTrilha[]): Fase[] {
  const fases: Fase[] = [];
  for (let i = 0; i < trilha.length; i += MISSOES_POR_FASE) {
    const itens = trilha.slice(i, i + MISSOES_POR_FASE);
    const numero = fases.length + 1;
    const feitas = itens.filter((t) => t.feitas > 0).length;
    fases.push({ numero, medalha: MEDALHAS[Math.min(numero, MEDALHAS.length) - 1], itens, feitas, completa: feitas === itens.length });
  }
  return fases;
}

/** A fase que acabou de ser completada por esta conclusão (antes incompleta, agora completa), ou null. */
export function faseConquistada(antes: ItemTrilha[], depois: ItemTrilha[]): Fase | null {
  const a = fasesDaTrilha(antes);
  return fasesDaTrilha(depois).find((f, i) => f.completa && !a[i]?.completa) ?? null;
}

/** Missão que esta conclusão acabou de liberar na trilha (a primeira que estava trancada e abriu). */
export function missaoDesbloqueada(antes: ItemTrilha[], depois: ItemTrilha[]): Missao | null {
  const trancadas = new Set(antes.filter((t) => !t.liberada).map((t) => t.missao.id));
  return depois.find((t) => t.liberada && trancadas.has(t.missao.id))?.missao ?? null;
}
