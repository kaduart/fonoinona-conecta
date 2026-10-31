// Banco de perguntas da triagem por faixa etária.
// Fonte: marcos do CDC "Learn the Signs. Act Early" (2022), adaptados; itens "fono" são sugestões da equipe.
// Rascunho revisado pela RT Lorrany Siqueira Marques (CRFa 5-13633). Ajustes dela entram aqui, sem mexer nas telas.

export const VERSAO_CONTEUDO = '2026.10-r2';

export type Area =
  | 'fala'
  | 'compreensao'
  | 'interacao'
  | 'audicao'
  | 'motricidade_oral'
  | 'alimentacao'
  | 'imitacao'
  | 'gestos'
  | 'brincar'
  | 'narrativa'
  | 'inteligibilidade'
  | 'consciencia_fonologica';

export const ROTULO_AREA: Record<Area, string> = {
  fala: 'Fala',
  compreensao: 'Compreensão',
  interacao: 'Interação',
  audicao: 'Audição',
  motricidade_oral: 'Motricidade oral',
  alimentacao: 'Alimentação',
  imitacao: 'Imitação',
  gestos: 'Gestos',
  brincar: 'Brincar',
  narrativa: 'Narrativa',
  inteligibilidade: 'Clareza da fala',
  consciencia_fonologica: 'Rimas e sons',
};

export type Pergunta = {
  id: string;
  /** {nome} é trocado pelo apelido da criança */
  texto: string;
  area: Area;
  base: 'cdc' | 'fono';
};

export type Faixa = {
  id: string;
  rotulo: string;
  /** inclusivo */
  minMeses: number;
  /** exclusivo */
  maxMeses: number;
  perguntas: Pergunta[];
};

export const FAIXAS: Faixa[] = [
  {
    id: 'f0-5m',
    rotulo: '0 a 5 meses',
    minMeses: 0,
    maxMeses: 6,
    perguntas: [
      { id: 'f0-1', texto: '{nome} se acalma ou fica atento quando ouve a sua voz?', area: 'audicao', base: 'cdc' },
      { id: 'f0-2', texto: '{nome} se assusta, pisca ou para quando ouve um barulho alto?', area: 'audicao', base: 'fono' },
      { id: 'f0-3', texto: '{nome} sorri quando você conversa ou sorri para ele(a)?', area: 'interacao', base: 'cdc' },
      { id: 'f0-4', texto: '{nome} olha para o seu rosto quando você fala com ele(a)?', area: 'interacao', base: 'cdc' },
      { id: 'f0-5', texto: '{nome} faz sons além do choro, como "aaa" e "ooo"?', area: 'fala', base: 'cdc' },
      { id: 'f0-6', texto: '{nome} mama ou toma a mamadeira sem engasgar com frequência?', area: 'alimentacao', base: 'fono' },
      { id: 'f0-7', texto: 'Quando você conversa com {nome}, ele(a) faz sons de volta, como se respondesse?', area: 'fala', base: 'cdc' },
      { id: 'f0-8', texto: '{nome} leva as mãos à boca e chupa os dedinhos?', area: 'motricidade_oral', base: 'cdc' },
    ],
  },
  {
    id: 'f6-11m',
    rotulo: '6 a 11 meses',
    minMeses: 6,
    maxMeses: 12,
    perguntas: [
      { id: 'f6-1', texto: '{nome} vira a cabeça para procurar de onde vem um som ou a sua voz?', area: 'audicao', base: 'cdc' },
      { id: 'f6-2', texto: 'Quando você faz um som, {nome} responde com outro som, como numa conversa?', area: 'fala', base: 'cdc' },
      { id: 'f6-3', texto: '{nome} dá risada quando vocês brincam?', area: 'interacao', base: 'cdc' },
      { id: 'f6-4', texto: '{nome} faz "brrr" ou sopra com os lábios?', area: 'motricidade_oral', base: 'cdc' },
      { id: 'f6-5', texto: '{nome} reconhece as pessoas da família e estranha quem não conhece?', area: 'interacao', base: 'cdc' },
      { id: 'f6-6', texto: '{nome} aceita papinhas e comidas amassadas na colher?', area: 'alimentacao', base: 'fono' },
      { id: 'f6-7', texto: '{nome} balbucia juntando sílabas, como "mamama" ou "bababa"?', area: 'fala', base: 'cdc' },
      { id: 'f6-8', texto: '{nome} levanta os braços para pedir colo?', area: 'gestos', base: 'cdc' },
    ],
  },
  {
    id: 'f12-17m',
    rotulo: '12 a 17 meses',
    minMeses: 12,
    maxMeses: 18,
    perguntas: [
      { id: 'f12-1', texto: 'Quando você chama {nome} pelo nome, ele(a) olha para você?', area: 'interacao', base: 'cdc' },
      { id: 'f12-2', texto: '{nome} chama "mamã", "papá" ou outro nome especial para alguém da família?', area: 'fala', base: 'cdc' },
      { id: 'f12-3', texto: '{nome} dá tchau com a mão?', area: 'gestos', base: 'cdc' },
      { id: 'f12-4', texto: '{nome} para, mesmo que só por um instante, quando ouve "não"?', area: 'compreensao', base: 'cdc' },
      { id: 'f12-5', texto: '{nome} brinca de "cadê? achou!" ou bate palminhas junto com você?', area: 'imitacao', base: 'cdc' },
      { id: 'f12-6', texto: '{nome} procura de onde vem um barulho inesperado, como a campainha?', area: 'audicao', base: 'fono' },
      { id: 'f12-7', texto: '{nome} fala 1 ou 2 palavras além de "mamã" e "papá", como "bola" ou "au-au"?', area: 'fala', base: 'cdc' },
      { id: 'f12-8', texto: '{nome} entrega um objeto quando você estende a mão e pede "me dá"?', area: 'compreensao', base: 'cdc' },
    ],
  },
  {
    id: 'f18-23m',
    rotulo: '18 a 23 meses',
    minMeses: 18,
    maxMeses: 24,
    perguntas: [
      { id: 'f18-1', texto: '{nome} fala pelo menos 3 palavras além de "mamã" e "papá"?', area: 'fala', base: 'cdc' },
      { id: 'f18-2', texto: '{nome} aponta para mostrar algo que quer ou que achou interessante?', area: 'gestos', base: 'cdc' },
      { id: 'f18-3', texto: '{nome} entende um pedido simples sem gesto, como "me dá o sapato"?', area: 'compreensao', base: 'cdc' },
      { id: 'f18-4', texto: '{nome} olha para onde você aponta quando diz "olha!"?', area: 'interacao', base: 'cdc' },
      { id: 'f18-5', texto: '{nome} imita você em tarefas, como varrer ou falar ao telefone?', area: 'imitacao', base: 'cdc' },
      { id: 'f18-6', texto: '{nome} bebe em copo sem tampa e tenta comer de colher?', area: 'alimentacao', base: 'cdc' },
      { id: 'f18-7', texto: '{nome} tenta repetir palavras novas que ouve você falar?', area: 'imitacao', base: 'fono' },
      { id: 'f18-8', texto: '{nome} brinca com brinquedos do jeito certo, como empurrar um carrinho?', area: 'brincar', base: 'cdc' },
    ],
  },
  {
    id: 'f2a',
    rotulo: '2 anos',
    minMeses: 24,
    maxMeses: 36,
    perguntas: [
      { id: 'f24-1', texto: '{nome} junta 2 palavras, como "mais leite" ou "papai foi"?', area: 'fala', base: 'cdc' },
      { id: 'f24-2', texto: '{nome} aponta pelo menos 2 partes do corpo quando você pede?', area: 'compreensao', base: 'cdc' },
      { id: 'f24-3', texto: 'Num livro, {nome} aponta a figura quando você pergunta "cadê o cachorro?"', area: 'compreensao', base: 'cdc' },
      { id: 'f24-4', texto: '{nome} percebe quando alguém está triste ou chorando?', area: 'interacao', base: 'cdc' },
      { id: 'f24-5', texto: '{nome} brinca de faz de conta, como dar comida para a boneca?', area: 'brincar', base: 'cdc' },
      { id: 'f24-6', texto: '{nome} mastiga alimentos em pedaços, como carne e frutas?', area: 'alimentacao', base: 'fono' },
      { id: 'f24-7', texto: '{nome} fala muitas palavras diferentes (umas 50 ou mais)?', area: 'fala', base: 'fono' },
      { id: 'f24-8', texto: '{nome} usa gestos como mandar beijo ou balançar a cabeça para dizer "sim"?', area: 'gestos', base: 'cdc' },
    ],
  },
  {
    id: 'f3a',
    rotulo: '3 anos',
    minMeses: 36,
    maxMeses: 48,
    perguntas: [
      { id: 'f36-1', texto: '{nome} conversa com você, com pelo menos 2 trocas de fala seguidas?', area: 'fala', base: 'cdc' },
      { id: 'f36-2', texto: '{nome} faz perguntas com "quem", "onde", "o quê" ou "por quê"?', area: 'fala', base: 'cdc' },
      { id: 'f36-3', texto: '{nome} diz o próprio nome quando alguém pergunta?', area: 'fala', base: 'cdc' },
      { id: 'f36-4', texto: 'Pessoas de fora da família entendem a maior parte do que {nome} fala?', area: 'inteligibilidade', base: 'cdc' },
      { id: 'f36-5', texto: '{nome} se aproxima de outras crianças e entra na brincadeira?', area: 'interacao', base: 'cdc' },
      { id: 'f36-6', texto: '{nome} bebe de canudinho e fecha bem os lábios ao mastigar?', area: 'motricidade_oral', base: 'fono' },
      { id: 'f36-7', texto: '{nome} entende "em cima", "embaixo" e "dentro" quando você pede algo?', area: 'compreensao', base: 'fono' },
      { id: 'f36-8', texto: '{nome} brinca de faz de conta com uma sequência, como cozinhar e servir os bonecos?', area: 'brincar', base: 'cdc' },
    ],
  },
  {
    id: 'f4a',
    rotulo: '4 anos',
    minMeses: 48,
    maxMeses: 60,
    perguntas: [
      { id: 'f48-1', texto: '{nome} fala frases com 4 palavras ou mais?', area: 'fala', base: 'cdc' },
      { id: 'f48-2', texto: '{nome} conta algo que aconteceu no dia, como "brinquei de bola na escola"?', area: 'narrativa', base: 'cdc' },
      { id: 'f48-3', texto: '{nome} responde perguntas simples, como "para que serve um casaco?"', area: 'compreensao', base: 'cdc' },
      { id: 'f48-4', texto: '{nome} canta ou fala trechos de músicas, histórias ou rimas?', area: 'fala', base: 'cdc' },
      { id: 'f48-5', texto: '{nome} brinca de ser outra pessoa, como mãe, médico ou professora?', area: 'brincar', base: 'cdc' },
      { id: 'f48-6', texto: '{nome} consegue soprar uma vela ou fazer bolhas de sabão?', area: 'motricidade_oral', base: 'fono' },
      { id: 'f48-7', texto: '{nome} diz o nome de algumas cores?', area: 'compreensao', base: 'cdc' },
      { id: 'f48-8', texto: '{nome} usa palavras de tempo, como "ontem", "amanhã" ou "depois"?', area: 'fala', base: 'fono' },
    ],
  },
  {
    id: 'f5a',
    rotulo: '5 a 6 anos',
    minMeses: 60,
    maxMeses: 84,
    perguntas: [
      { id: 'f60-1', texto: '{nome} conta uma história, ouvida ou inventada, com pelo menos 2 acontecimentos?', area: 'narrativa', base: 'cdc' },
      { id: 'f60-2', texto: 'Depois de ouvir uma história, {nome} responde perguntas simples sobre ela?', area: 'compreensao', base: 'cdc' },
      { id: 'f60-3', texto: '{nome} mantém uma conversa com mais de 3 trocas de fala?', area: 'fala', base: 'cdc' },
      { id: 'f60-4', texto: '{nome} percebe rimas simples, como "bola" e "cola"?', area: 'consciencia_fonologica', base: 'cdc' },
      { id: 'f60-5', texto: 'Pessoas desconhecidas entendem quase tudo o que {nome} fala?', area: 'inteligibilidade', base: 'fono' },
      { id: 'f60-6', texto: '{nome} espera a vez e segue as regras em brincadeiras?', area: 'interacao', base: 'cdc' },
      { id: 'f60-7', texto: '{nome} usa frases com "porque" ou "quando" para explicar as coisas?', area: 'fala', base: 'fono' },
      { id: 'f60-8', texto: '{nome} reconhece algumas letras ou o próprio nome escrito?', area: 'consciencia_fonologica', base: 'cdc' },
    ],
  },
];

/** Perguntas de alerta, iguais para todas as idades. "Sim" leva direto a "avaliar". */
export const ALERTAS: Pergunta[] = [
  { id: 'a1', texto: '{nome} parou de fazer algo que já fazia, como falar palavras, olhar nos olhos ou dar tchau?', area: 'interacao', base: 'fono' },
  { id: 'a2', texto: 'Você ou alguém próximo desconfia que {nome} não escuta bem?', area: 'audicao', base: 'fono' },
];
