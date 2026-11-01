import type { RegistroDiario } from '@/domain/diario';
import type { Conclusao, Fase } from '@/domain/missoes';

/**
 * Linha do tempo de conquistas: junta, numa ordem só, o que a família já celebrou.
 * Não grava nada: é montada a partir do que o app já tem (Diário, missões e medalhas).
 */
export type Marco =
  | { tipo: 'conquista'; id: string; em: string; registro: RegistroDiario }
  | { tipo: 'medalha'; id: string; em: string; fase: Fase }
  | { tipo: 'primeira_missao'; id: string; em: string; missaoId: string };

/** Quando cada fase completa ganhou a medalha: o dia em que a última missão dela foi feita pela primeira vez. */
export function dataDaMedalha(fase: Fase, conclusoes: Conclusao[]): string | null {
  if (!fase.completa) return null;
  let ultima: string | null = null;
  for (const item of fase.itens) {
    const primeira = conclusoes
      .filter((c) => c.missaoId === item.missao.id)
      .map((c) => c.em)
      .sort()[0];
    if (!primeira) return null;
    if (!ultima || primeira > ultima) ultima = primeira;
  }
  return ultima;
}

/** Marcos do mais novo para o mais antigo. */
export function montarLinhaDoTempo(diario: RegistroDiario[], conclusoes: Conclusao[], fases: Fase[]): Marco[] {
  const marcos: Marco[] = [];
  for (const r of diario) {
    // a data do dia anotado vale mais que a hora em que foi digitado
    if (r.conquista) marcos.push({ tipo: 'conquista', id: `c-${r.id}`, em: `${r.data}T12:00:00`, registro: r });
  }
  for (const f of fases) {
    const em = dataDaMedalha(f, conclusoes);
    if (em) marcos.push({ tipo: 'medalha', id: `m-${f.numero}`, em, fase: f });
  }
  const primeira = [...conclusoes].sort((a, b) => a.em.localeCompare(b.em))[0];
  if (primeira) marcos.push({ tipo: 'primeira_missao', id: `p-${primeira.id}`, em: primeira.em, missaoId: primeira.missaoId });
  return marcos.sort((a, b) => b.em.localeCompare(a.em));
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Agrupa por mês ("novembro de 2026"), mantendo a ordem. */
export function agruparPorMes(marcos: Marco[]): { mes: string; marcos: Marco[] }[] {
  const grupos: { mes: string; marcos: Marco[] }[] = [];
  for (const m of marcos) {
    const d = new Date(m.em);
    const mes = `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
    const g = grupos.at(-1);
    if (g && g.mes === mes) g.marcos.push(m);
    else grupos.push({ mes, marcos: [m] });
  }
  return grupos;
}

/** Texto para mandar à família (sem dado de saúde: só as conquistas que a própria família anotou). */
export function textoLinhaDoTempo(nome: string, marcos: Marco[], tituloMissao: (id: string) => string): string {
  const linhas = marcos.slice(0, 8).map((m) => {
    if (m.tipo === 'conquista') return `⭐ ${m.registro.nota.trim() || 'Uma conquista no dia a dia'}`;
    if (m.tipo === 'medalha') return `🏅 Medalha ${m.fase.medalha.nome}`;
    return `🎯 Primeira missão: ${tituloMissao(m.missaoId)}`;
  });
  return `Conquistas de ${nome} 💚\n\n${linhas.join('\n')}\n\nRegistrado no app FonoInova Conecta.`;
}
