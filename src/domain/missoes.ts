import type { Area } from '@/content/perguntas';
import { LIMITE_DIFICIL, MISSOES, type ComoFoi, type Missao } from '@/content/missoes';

export type Conclusao = {
  id: string;
  criancaId: string;
  missaoId: string;
  como: ComoFoi;
  /** ISO */
  em: string;
};

export type ItemTrilha = { missao: Missao; liberada: boolean; feitas: number };

/** Missões da idade, com a área de foco da triagem primeiro e depois a ordem base. */
export function missoesParaIdade(meses: number, areaFoco?: Area | null, catalogo: Missao[] = MISSOES): Missao[] {
  const daIdade = catalogo.filter((m) => m.idadeMinMeses <= meses);
  const peso = (m: Missao) => (areaFoco && m.areas.includes(areaFoco) ? 0 : 1);
  return [...daIdade].sort((a, b) => peso(a) - peso(b) || a.ordem - b.ordem);
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
export function diasSeguidos(conclusoes: Conclusao[], hoje: Date): number {
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

/** Quais dos últimos 7 dias (do mais antigo para hoje) tiveram missão. */
export function semana(conclusoes: Conclusao[], hoje: Date): { dia: Date; feito: boolean }[] {
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
