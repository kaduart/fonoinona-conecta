import type { ImageSourcePropType } from 'react-native';

import type { Area } from '@/content/perguntas';

/**
 * Ilustrações provisórias (recortadas da proposta visual). Serão trocadas pelo
 * conjunto final, no mesmo estilo, antes do lançamento.
 */
export const ILUSTRACOES = {
  brincar: require('../../assets/images/ilustracoes/pai.png'),
  imitar: require('../../assets/images/ilustracoes/mae-fazenda.png'),
  ler: require('../../assets/images/ilustracoes/mae-livro.png'),
} satisfies Record<string, ImageSourcePropType>;

const POR_AREA: Partial<Record<Area, keyof typeof ILUSTRACOES>> = {
  fala: 'imitar',
  imitacao: 'imitar',
  audicao: 'imitar',
  compreensao: 'ler',
  gestos: 'brincar',
  interacao: 'brincar',
};

export function ilustracaoDaArea(area: Area | undefined): ImageSourcePropType {
  return ILUSTRACOES[(area && POR_AREA[area]) || 'brincar'];
}
