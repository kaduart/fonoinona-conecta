import type { NomeCena } from '@/components/animacoes/cenas';
import type { Area } from '@/content/perguntas';

/**
 * Qual cena flat 2D (src/components/animacoes) ilustra cada área da missão.
 * Fala, imitação e motricidade oral: espelho. Compreensão e narrativa: leitura. O resto: brincar.
 */
const POR_AREA: Partial<Record<Area, NomeCena>> = {
  fala: 'espelho',
  imitacao: 'espelho',
  motricidade_oral: 'espelho',
  compreensao: 'leitura',
  narrativa: 'leitura',
  consciencia_fonologica: 'leitura',
};

export function cenaDaArea(area: Area | undefined): NomeCena {
  return (area && POR_AREA[area]) || 'brincar';
}
