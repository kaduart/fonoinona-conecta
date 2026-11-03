import type { ImageSourcePropType } from 'react-native';

import { brilho, composicao, ondas, pilula, type LottieJson } from './lottieCena';

// As 3 cenas do app: ilustrações flat 2D + line art criadas pela clínica, recortadas
// sem título/logo e com fundo transparente (PNG 1500x1000). Por cima, uma camada Lottie
// transparente no mesmo quadro mexe só o que é "ar" da cena: brilhos, balões, sopros e ondas de som.

const VERDE = '#1F7A6B';
const SALVIA = '#CFE0D8';
const CREME = '#EADFC8';
const PAPEL = '#F7F5F0';

export type NomeCena = 'leitura' | 'brincar' | 'espelho';

export type Cena = {
  imagem: ImageSourcePropType;
  /** camada Lottie transparente, no mesmo quadro da arte */
  animacao?: LottieJson;
  /** largura / altura */
  proporcao: number;
  /** descrição para leitor de tela */
  rotulo: string;
};

const PROPORCAO = 1500 / 1000;

export const CENAS: Record<NomeCena, Cena> = {
  // Leitura compartilhada: o filho aponta o cachorrinho do livro; brilhos no desenho e balões saindo do dedo.
  leitura: {
    imagem: require('../../../assets/images/ilustracoes/leitura.png'),
    proporcao: PROPORCAO,
    rotulo: 'Mãe e filho lendo juntos; o filho aponta o cachorrinho do livro',
    animacao: composicao('leitura', [
      brilho(842, 590, 2.4, VERDE, 0),
      brilho(985, 600, 1.8, SALVIA, 2.1),
      brilho(1060, 450, 1.6, CREME, 4.2),
      pilula(935, 345, 110, 50, PAPEL, { sobe: 40 }),
      pilula(1010, 270, 80, 40, SALVIA, { fase: 0.5, sobe: 34 }),
    ]),
  },
  // Pai e filho com a vaquinha: o "muuu" sai em ondas da vaca e brilhos piscam em volta.
  brincar: {
    imagem: require('../../../assets/images/ilustracoes/brincar.png'),
    proporcao: PROPORCAO,
    rotulo: 'Pai mostra uma vaquinha de brinquedo e o filho aponta, sorrindo',
    animacao: composicao('brincar', [
      ...ondas(866, 456, -40, VERDE, { escala: 2.2 }),
      brilho(975, 330, 2.2, VERDE, 0.8),
      brilho(1340, 470, 1.8, CREME, 2.9),
      brilho(600, 410, 1.6, SALVIA, 4.6),
    ]),
  },
  // Treino miofuncional no espelho: ondas saem da boca da mãe, sopros saem do biquinho da filha
  // e o espelho brilha.
  espelho: {
    imagem: require('../../../assets/images/ilustracoes/espelho.png'),
    proporcao: PROPORCAO,
    rotulo: 'Mãe e filha fazendo biquinho diante do espelho',
    animacao: composicao('espelho', [
      ...ondas(724, 286, 0, VERDE, { escala: 2.2 }),
      pilula(955, 520, 38, 38, PAPEL, { sobe: 24, anda: 110 }),
      pilula(955, 556, 28, 28, SALVIA, { fase: 0.45, sobe: 16, anda: 90 }),
      brilho(1318, 236, 2.4, VERDE, 0),
      brilho(1170, 330, 1.8, SALVIA, 3.1),
    ]),
  },
};
