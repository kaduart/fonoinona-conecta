import type { ImageSourcePropType } from 'react-native';

import { brilho, composicao, folha, ondaDeSom, pilula, RECORTE, type LottieJson } from './lottieCena';

// As 3 cenas de fono do app, em flat 2D + line art. O PNG traz o traço parado
// (personagens e cenário); a camada Lottie traz só o que se mexe no fundo.

const VERDE = '#1F7A6B';
const SALVIA = '#CFE0D8';
const CREME = '#EADFC8';
const PAPEL = '#F7F5F0';

export type NomeCena = 'leitura' | 'brincar' | 'espelho';

export type Cena = {
  imagem: ImageSourcePropType;
  animacao: LottieJson;
  /** largura / altura */
  proporcao: number;
  /** descrição para leitor de tela */
  rotulo: string;
};

const PROPORCAO = RECORTE.largura / RECORTE.altura;

export const CENAS: Record<NomeCena, Cena> = {
  // Mãe e filho lendo: folhas com brisa e balões de fala que sobem e somem.
  leitura: {
    imagem: require('../../../assets/images/ilustracoes/leitura.png'),
    proporcao: PROPORCAO,
    rotulo: 'Mãe e filho lendo um livro juntos',
    animacao: composicao('leitura', [
      pilula(752, 318, 74, 34, PAPEL),
      pilula(806, 262, 56, 28, SALVIA, { fase: 0.5 }),
      folha(246, 500, -60, 1, SALVIA),
      folha(236, 560, -150, 0.9, SALVIA, { fase: 1.1 }),
      folha(228, 620, -35, 0.85, SALVIA, { fase: 2.2 }),
      folha(222, 680, -160, 0.8, SALVIA, { fase: 3.3 }),
      folha(980, 585, -120, 0.8, VERDE, { opacidade: 90, fase: 0.6 }),
      folha(994, 640, -30, 0.75, VERDE, { opacidade: 90, fase: 1.8 }),
      folha(1000, 700, -140, 0.7, VERDE, { opacidade: 90, fase: 2.9 }),
    ]),
  },
  // Pai e criança com blocos: estrelinhas piscando sobre o "tesouro" e folhas.
  brincar: {
    imagem: require('../../../assets/images/ilustracoes/brincar.png'),
    proporcao: PROPORCAO,
    rotulo: 'Pai e criança brincando de empilhar blocos',
    animacao: composicao('brincar', [
      brilho(624, 528, 1, VERDE, 0),
      brilho(578, 548, 0.6, SALVIA, 2.1),
      brilho(662, 470, 0.7, CREME, 4.2),
      folha(963, 500, -120, 1, SALVIA),
      folha(974, 565, -30, 0.9, SALVIA, { fase: 1.1 }),
      folha(984, 625, -145, 0.85, SALVIA, { fase: 2.2 }),
      folha(990, 690, -25, 0.8, SALVIA, { fase: 3.3 }),
      folha(230, 640, -60, 0.75, VERDE, { opacidade: 90, fase: 0.7 }),
      folha(218, 700, -150, 0.7, VERDE, { opacidade: 90, fase: 1.9 }),
    ]),
  },
  // Mãe e bebê diante do espelho: onda de som pontilhada da boca da mãe até o bebê.
  espelho: {
    imagem: require('../../../assets/images/ilustracoes/espelho.png'),
    proporcao: PROPORCAO,
    rotulo: 'Mãe e bebê fazendo sons diante do espelho',
    animacao: composicao('espelho', [
      ondaDeSom(
        [[520, 456], [620, 470], [704, 556]],
        [[0, 0], [-34, 30], [-28, -116]],
        [[36, -36], [34, -30], [0, 0]],
        VERDE,
      ),
      pilula(560, 512, 64, 30, PAPEL, { fase: 0.15, rotacao: -6, sobe: 16 }),
      pilula(770, 440, 50, 26, SALVIA, { fase: 0.65 }),
      folha(224, 548, -60, 1, SALVIA),
      folha(214, 610, -150, 0.9, SALVIA, { fase: 1.2 }),
      folha(206, 675, -35, 0.85, SALVIA, { fase: 2.4 }),
      folha(994, 615, -120, 0.75, VERDE, { opacidade: 90, fase: 0.5 }),
      folha(1004, 672, -30, 0.7, VERDE, { opacidade: 90, fase: 1.7 }),
    ]),
  },
};
