import type { NomeCena } from '@/components/animacoes/cenas';
import type { Area } from '@/content/perguntas';

/**
 * Qual cena flat 2D (src/components/animacoes) ilustra cada área da missão.
 * Linguagem e escuta: leitura (mãe e filho lendo). Gestos e imitação: movimento.
 * O resto (brincar, interação, alimentação...): brincar (duas crianças com blocos).
 */
const POR_AREA: Partial<Record<Area, NomeCena>> = {
  fala: 'leitura',
  compreensao: 'leitura',
  narrativa: 'leitura',
  consciencia_fonologica: 'leitura',
  inteligibilidade: 'leitura',
  audicao: 'leitura',
  gestos: 'movimento',
  imitacao: 'movimento',
};

export function cenaDaArea(area: Area | undefined): NomeCena {
  return (area && POR_AREA[area]) || 'brincar';
}
