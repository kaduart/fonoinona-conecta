import { DIAS_REFAZER_OBSERVAR } from '@/content/missoes';
import { idadeDe } from '@/domain/idade';
import { faixaPara, type NivelResultado } from '@/domain/triagem';

export type ProximaTriagem = {
  /** quando a próxima triagem é sugerida */
  data: Date;
  /** já pode refazer agora */
  disponivel: boolean;
  motivo: 'primeira' | 'nova_faixa' | 'observar' | 'avaliar';
};

type CriancaBase = { nascimento: string; semanasGestacao: number | null };
type UltimaTriagem = { criadaEm: string; faixaId: string; resultado: { nivel: NivelResultado } };

const DIA = 24 * 60 * 60 * 1000;

/** Primeiro dia em que a criança entra numa faixa diferente da atual (até ~6 anos). */
export function proximaMudancaDeFaixa(c: CriancaBase, hoje: Date): Date | null {
  const atual = faixaPara(idadeDe(c, hoje))?.id;
  const d = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  for (let i = 0; i < 400; i += 1) {
    d.setDate(d.getDate() + 1);
    if (faixaPara(idadeDe(c, d))?.id !== atual) return new Date(d);
  }
  return null;
}

/**
 * Quando sugerir a próxima triagem:
 * - sem triagem ou mudou de faixa: agora;
 * - "Vale observar": 30 dias depois (a RT pode ajustar);
 * - "Avaliação recomendada": pode refazer quando quiser, mas o foco é falar com a equipe;
 * - "Esperado": quando entrar na próxima faixa.
 */
export function proximaTriagem(c: CriancaBase, ultima: UltimaTriagem | null, hoje: Date = new Date()): ProximaTriagem {
  if (!ultima) return { data: hoje, disponivel: true, motivo: 'primeira' };
  const faixaHoje = faixaPara(idadeDe(c, hoje))?.id;
  if (faixaHoje && faixaHoje !== ultima.faixaId) return { data: hoje, disponivel: true, motivo: 'nova_faixa' };
  if (ultima.resultado.nivel === 'observar') {
    const data = new Date(new Date(ultima.criadaEm).getTime() + DIAS_REFAZER_OBSERVAR * DIA);
    return { data, disponivel: data <= hoje, motivo: 'observar' };
  }
  if (ultima.resultado.nivel === 'avaliar') return { data: hoje, disponivel: true, motivo: 'avaliar' };
  const data = proximaMudancaDeFaixa(c, hoje) ?? new Date(hoje.getTime() + 180 * DIA);
  return { data, disponivel: false, motivo: 'nova_faixa' };
}

export function formatarDataCurta(d: Date): string {
  const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${d.getDate()} de ${meses[d.getMonth()]}`;
}
