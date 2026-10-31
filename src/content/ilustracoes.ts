import type { ImageSourcePropType } from 'react-native';

import type { Area } from '@/content/perguntas';

/** Ilustrações 3D do app, no estilo e nas cores da logo (fundo #F6F9FA). */
export const ILUSTRACOES = {
  brincar: require('../../assets/images/ilustracoes/pai-vaca.png'),
  imitar: require('../../assets/images/ilustracoes/espelho.png'),
  ler: require('../../assets/images/ilustracoes/mae-livro.png'),
  falar: require('../../assets/images/ilustracoes/cabeca.png'),
} satisfies Record<string, ImageSourcePropType>;

/** Proporção (largura / altura) de cada ilustração. */
export const PROPORCAO: Record<keyof typeof ILUSTRACOES, number> = { brincar: 1168 / 880, imitar: 1168 / 880, ler: 1168 / 880, falar: 1 };

const POR_AREA: Partial<Record<Area, keyof typeof ILUSTRACOES>> = {
  fala: 'imitar',
  imitacao: 'imitar',
  motricidade_oral: 'imitar',
  compreensao: 'ler',
  narrativa: 'ler',
  consciencia_fonologica: 'ler',
};

export function chaveDaArea(area: Area | undefined): keyof typeof ILUSTRACOES {
  return (area && POR_AREA[area]) || 'brincar';
}

export function ilustracaoDaArea(area: Area | undefined): ImageSourcePropType {
  return ILUSTRACOES[chaveDaArea(area)];
}
