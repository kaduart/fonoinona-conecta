import type { NomeCena } from '@/components/animacoes/cenas';
import type { Area } from '@/content/perguntas';

/**
 * Qual cena flat 2D (src/components/animacoes) ilustra cada área da missão.
 * Fala, imitação e motricidade oral: espelho. Compreensão, narrativa e escuta: leitura.
 * O resto (brincar, interação, gestos...): brincar.
 */
const POR_AREA: Partial<Record<Area, NomeCena>> = {
  fala: 'espelho',
  imitacao: 'espelho',
  motricidade_oral: 'espelho',
  inteligibilidade: 'espelho',
  compreensao: 'leitura',
  narrativa: 'leitura',
  consciencia_fonologica: 'leitura',
  audicao: 'leitura',
};

export function cenaDaArea(area: Area | undefined): NomeCena {
  return (area && POR_AREA[area]) || 'brincar';
}
