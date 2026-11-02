import type { ImageSourcePropType } from 'react-native';

import type { LottieJson } from './lottieCena';

// As 3 cenas do app: ilustrações flat 2D + line art criadas pela clínica (Gemini),
// recortadas sem título/logo e com fundo transparente. Cada uma pode receber uma
// camada Lottie por cima (só elementos de fundo que se mexem); por ora vão paradas.

export type NomeCena = 'leitura' | 'brincar' | 'movimento';

export type Cena = {
  imagem: ImageSourcePropType;
  /** camada Lottie transparente opcional, alinhada à arte */
  animacao?: LottieJson;
  /** largura / altura */
  proporcao: number;
  /** descrição para leitor de tela */
  rotulo: string;
};

const PROPORCAO = 1500 / 1000;

export const CENAS: Record<NomeCena, Cena> = {
  leitura: {
    imagem: require('../../../assets/images/ilustracoes/leitura.png'),
    proporcao: PROPORCAO,
    rotulo: 'Mãe e filho lendo um livro juntos no banco',
  },
  brincar: {
    imagem: require('../../../assets/images/ilustracoes/brincar.png'),
    proporcao: PROPORCAO,
    rotulo: 'Duas crianças brincando de empilhar blocos no tapete',
  },
  movimento: {
    imagem: require('../../../assets/images/ilustracoes/movimento.png'),
    proporcao: PROPORCAO,
    rotulo: 'Criança se equilibrando sobre blocos',
  },
};
