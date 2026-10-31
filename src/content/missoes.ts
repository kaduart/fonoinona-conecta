// Trilha de missões para fazer em casa (rascunho para a RT, ver doc "Conteúdo da Fase 1").
// Material só do que toda casa tem; sempre com um adulto do lado.

import type { Area } from '@/content/perguntas';

export const VERSAO_MISSOES = '2026.10-r1';

export type Missao = {
  id: string;
  /** posição na trilha base (1 a 18) */
  ordem: number;
  titulo: string;
  /** rótulo mostrado no chip */
  rotuloArea: string;
  /** áreas da triagem que a missão estimula, usadas para priorizar */
  areas: Area[];
  idadeMinMeses: number;
  duracao: string;
  material: string;
  passos: string[];
  dica: string;
  /** o que os pais devem observar durante a brincadeira (rascunho para a RT) */
  observar?: string;
  seguranca?: string;
  quandoParar: string;
  /** versão mais simples para crianças abaixo de `ateMeses` */
  versaoMenores?: { ateMeses: number; texto: string };
};

const PARAR_PADRAO = 'Se a criança chorar, recusar ou ficar agitada, pare e tente outro dia.';

export const MISSOES: Missao[] = [
  {
    id: 'm01-caca-tesouros',
    ordem: 1,
    titulo: 'Caça aos Tesouros',
    rotuloArea: 'Sensorial e pinça',
    areas: ['brincar', 'fala'],
    idadeMinMeses: 12,
    duracao: '10 min',
    material: 'Uma bacia grande, 1 kg de arroz cru (ou feijão, ou macarrão parafuso) e 5 brinquedos da criança.',
    passos: [
      'Despeje o grão na bacia e esconda os brinquedos lá dentro.',
      'Convide a criança a colocar as mãos e sentir a textura.',
      'Peça que ela encontre os brinquedos, um de cada vez.',
      'A cada achado, pergunte o que é e de que cor é.',
    ],
    dica: 'Quando ela achar, pergunte: "O que você encontrou? É um carro ou uma bola? De que cor ele é?"',
    observar: 'Observe se ela procura com as duas mãos e se usa a ponta dos dedos para pegar. Se só olhar, coloque a mão dela no grão junto com a sua.',
    seguranca: 'Fique do lado o tempo todo: grãos não vão à boca, ao nariz nem ao ouvido.',
    quandoParar: PARAR_PADRAO,
    versaoMenores: { ateMeses: 36, texto: 'Até 3 anos, esconda só brinquedos grandes (maiores que a mão do adulto) e use macarrão parafuso no lugar de grãos pequenos.' },
  },
  {
    id: 'm02-bau-sons',
    ordem: 2,
    titulo: 'Baú dos Sons',
    rotuloArea: 'Audição',
    areas: ['audicao'],
    idadeMinMeses: 12,
    duracao: '10 min',
    material: '3 potes de plástico opacos com tampa, moedas, arroz e algodão, e fita adesiva.',
    passos: [
      'Encha um pote com moedas, outro com arroz e o terceiro com algodão.',
      'Feche bem e lacre as tampas com fita.',
      'Balance um pote de cada vez, longe dos olhos da criança.',
      'Pergunte qual faz o som mais forte, o mais fraco e qual não faz som.',
    ],
    dica: 'Trabalhe os opostos: "Esse som é alto ou baixo? É barulhento ou silencioso?"',
    observar: 'Observe se ela vira a cabeça para o lado do som. Se não reagir a nenhum pote, anote e comente com a equipe.',
    seguranca: 'Tampas sempre lacradas com fita. Para menores de 3 anos, use garrafas PET grandes com a tampa colada.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm03-caminho-texturas',
    ordem: 3,
    titulo: 'Caminho das Texturas',
    rotuloArea: 'Sensorial e equilíbrio',
    areas: ['brincar'],
    idadeMinMeses: 12,
    duracao: '10 min',
    material: 'Papelão ou jornal, algodão, plástico-bolha e uma toalha felpuda.',
    passos: [
      'Em cima de um tapete, prenda com fita o plástico-bolha, o algodão e a toalha, em sequência.',
      'Tire os sapatos da criança.',
      'Caminhem devagar por cada textura, de mãos dadas.',
      'Pare em cada uma e pergunte como é a sensação nos pés.',
    ],
    dica: 'Pergunte: "Está espetando, está macio ou está fazendo barulho?"',
    observar: 'Observe a reação em cada textura: alguma ela recusa ou tira o pé rápido? Respeite e passe para a próxima.',
    seguranca: 'Prenda bem os materiais para não escorregar e segure a mão da criança o tempo todo. Só para quem já anda.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm04-rasga-papel',
    ordem: 4,
    titulo: 'Rasga-Papel',
    rotuloArea: 'Motor fino',
    areas: ['brincar', 'gestos'],
    idadeMinMeses: 12,
    duracao: '10 min',
    material: 'Revistas velhas, jornal ou panfletos, e uma garrafa PET vazia.',
    passos: [
      'Sentem no chão e rasguem as folhas em tiras compridas.',
      'Amassem as tiras fazendo bolinhas.',
      'Desafio: colocar as bolinhas na garrafa usando o polegar e o indicador.',
    ],
    dica: 'Narre as ações: "Rasga, amassa, aperta, põe dentro!"',
    observar: 'Observe se ela consegue fazer a pinça (polegar e indicador). Se pegar com a mão toda, mostre o movimento devagar.',
    seguranca: 'Bolinhas de papel podem ir à boca: supervisão constante.',
    quandoParar: PARAR_PADRAO,
    versaoMenores: { ateMeses: 36, texto: 'Até 3 anos, só rasgar e amassar bolas grandes de papel. A garrafa fica para depois dos 3.' },
  },
  {
    id: 'm05-espelho-caretas',
    ordem: 5,
    titulo: 'Espelho das Caretas',
    rotuloArea: 'Fala e imitação',
    areas: ['motricidade_oral', 'imitacao'],
    idadeMinMeses: 6,
    duracao: '10 min',
    material: 'Um espelho onde caibam o adulto e a criança lado a lado.',
    passos: [
      'Sentem juntos de frente para o espelho.',
      'Façam um beijo estalado e encham as bochechas como um balão.',
      'Mostre caras de feliz, bravo e assustado.',
      'Espere a imitação e comemore cada tentativa.',
    ],
    dica: 'Junte som e movimento: "O balão estourou! Pof! Faz igual!"',
    observar: 'Observe se ela olha para o seu rosto no espelho e tenta copiar algum movimento, mesmo que diferente.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm06-conversa-bebe',
    ordem: 6,
    titulo: 'Conversa de Bebê',
    rotuloArea: 'Fala',
    areas: ['fala', 'interacao'],
    idadeMinMeses: 0,
    duracao: '5 min',
    material: 'Nenhum.',
    passos: [
      'Fique cara a cara, a uns 30 cm do bebê.',
      'Espere ele fazer um som.',
      'Repita o mesmo som, sorrindo.',
      'Faça uma pausa e espere a "resposta" dele.',
    ],
    dica: 'A pausa é o segredo. É nela que o bebê aprende que conversa tem a vez de cada um.',
    observar: 'Observe se o bebê olha para o seu rosto e responde com som ou sorriso na pausa.',
    quandoParar: 'Se ele virar o rosto ou chorar, é sinal de cansaço.',
  },
  {
    id: 'm07-cade-achou',
    ordem: 7,
    titulo: 'Cadê? Achou!',
    rotuloArea: 'Interação',
    areas: ['interacao'],
    idadeMinMeses: 6,
    duracao: '5 min',
    material: 'Um pano leve ou uma fralda de pano.',
    passos: [
      'Cubra o seu rosto e pergunte "Cadê a mamãe?".',
      'Descubra e diga "Achou!" com festa.',
      'Depois, esconda um brinquedo debaixo do pano e deixe a criança procurar.',
    ],
    dica: 'Use sempre as mesmas palavras. A repetição ajuda a criança a antecipar e, depois, a falar junto.',
    observar: 'Observe se ela antecipa o "Achou!", rindo ou se mexendo antes de você descobrir o rosto.',
    seguranca: 'Nunca cubra o rosto do bebê.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm08-caixa-surpresas',
    ordem: 8,
    titulo: 'Caixa de Surpresas',
    rotuloArea: 'Vocabulário',
    areas: ['fala', 'compreensao'],
    idadeMinMeses: 12,
    duracao: '10 min',
    material: 'Uma caixa ou sacola e 5 objetos grandes da casa (colher de pau, meia, copo plástico, escova, bola).',
    passos: [
      'Coloque os objetos na caixa.',
      'Tire um de cada vez, com suspense.',
      'Diga o nome e para que serve: "Copo! Copo é de beber água".',
      'Na segunda rodada, pergunte "O que será?" e espere.',
    ],
    dica: 'Fale frases um pouco maiores que as da criança. Se ela diz "bola", você diz "bola grande!".',
    observar: 'Observe se ela mantém o olhar na caixa e tenta falar, apontar ou gesticular quando você pergunta "O que será?".',
    seguranca: 'Só objetos maiores que um rolo de papel higiênico, sem peças soltas.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm09-fazenda-sons',
    ordem: 9,
    titulo: 'Fazenda dos Sons',
    rotuloArea: 'Fala',
    areas: ['fala', 'imitacao'],
    idadeMinMeses: 12,
    duracao: '10 min',
    material: 'Bichinhos de brinquedo ou figuras de um livro.',
    passos: [
      'Mostre um bicho e faça o som dele: "A vaca faz muuu".',
      'Repita com 3 ou 4 bichos.',
      'Pergunte "Como faz o cachorro?" e espere.',
      'Comemore qualquer tentativa.',
    ],
    dica: 'Sons de bichos são mais fáceis que palavras e costumam ser as primeiras "falas" da criança.',
    observar: 'Observe se ela tenta imitar algum som de bicho, mesmo que só a vogal ("uuu").',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm10-banho-falante',
    ordem: 10,
    titulo: 'Banho Falante',
    rotuloArea: 'Compreensão',
    areas: ['compreensao'],
    idadeMinMeses: 12,
    duracao: 'Durante o banho',
    material: 'O banho de sempre.',
    passos: [
      'Diga a parte do corpo enquanto lava: "Agora o pé!".',
      'Depois peça: "Me mostra a barriga".',
      'Troquem de papel: a criança manda e você lava.',
    ],
    dica: 'Narrar a rotina é a forma mais simples de dar um banho de palavras.',
    observar: 'Observe se ela aponta a parte do corpo certa sem você mostrar antes.',
    seguranca: 'Nunca deixe a criança sozinha na água, nem por um segundo.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm11-musica-gestos',
    ordem: 11,
    titulo: 'Música com Gestos',
    rotuloArea: 'Imitação e ritmo',
    areas: ['imitacao', 'gestos'],
    idadeMinMeses: 12,
    duracao: '5 min',
    material: 'Nenhum.',
    passos: [
      'Cante uma música com gestos que vocês conheçam ("Cabeça, ombro, joelho e pé" ou "Parabéns" com palmas).',
      'Faça os gestos devagar.',
      'Pare antes da última palavra de cada frase e espere a criança completar.',
    ],
    dica: 'A pausa no fim da frase convida a criança a falar.',
    observar: 'Observe se ela completa a palavra ou o gesto quando você faz a pausa.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm12-barquinho-sopro',
    ordem: 12,
    titulo: 'Barquinho do Sopro',
    rotuloArea: 'Motricidade oral',
    areas: ['motricidade_oral'],
    idadeMinMeses: 24,
    duracao: '10 min',
    material: 'Uma bacia rasa com pouca água e um barquinho de papel ou uma tampinha grande.',
    passos: [
      'Coloque o barquinho na água.',
      'Mostre como soprar com bico, devagar e forte.',
      'Façam uma corrida de um lado ao outro da bacia.',
    ],
    dica: 'Brinque com "sopro fraquinho" e "sopro de vento forte" para trabalhar o controle.',
    observar: 'Observe se ela faz bico e sopra pela boca. Se soprar pelo nariz, brinque de apagar uma vela de mentira.',
    seguranca: 'Água rasa e um adulto do lado o tempo todo. Pare se a criança ficar tonta.',
    quandoParar: PARAR_PADRAO,
    versaoMenores: { ateMeses: 30, texto: 'Para os menores: você sopra bolhas de sabão e a criança tenta estourar.' },
  },
  {
    id: 'm13-mercadinho',
    ordem: 13,
    titulo: 'Mercadinho de Casa',
    rotuloArea: 'Compreensão',
    areas: ['compreensao'],
    idadeMinMeses: 24,
    duracao: '10 min',
    material: 'Embalagens vazias e limpas (caixa de leite, pote de iogurte, saquinho de arroz) e uma sacola.',
    passos: [
      'Monte uma "prateleira".',
      'Peça dois itens: "Me traz o leite e o arroz".',
      'Depois, a criança é a vendedora e você pede.',
      'Aumente para 3 itens quando ficar fácil.',
    ],
    dica: 'Se ela trouxer só um item, repita o pedido mostrando dois dedos.',
    observar: 'Observe se ela traz os dois itens pedidos ou só um. Isso mostra quanto ela guarda de um pedido.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm14-detetive-sons',
    ordem: 14,
    titulo: 'Detetive dos Sons',
    rotuloArea: 'Audição',
    areas: ['audicao'],
    idadeMinMeses: 24,
    duracao: '10 min',
    material: 'Sons da própria casa (torneira, porta, liquidificador, palmas).',
    passos: [
      'Peça para a criança fechar os olhos.',
      'Faça um som.',
      'Ela abre os olhos e aponta ou diz o que era.',
      'Depois é a vez dela fazer o som para você adivinhar.',
    ],
    dica: 'Se ela não reage a sons de outro cômodo, anote e comente com a equipe.',
    observar: 'Observe se ela reconhece os sons de olhos fechados. Se errar sempre, anote e comente com a equipe.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm15-massinha',
    ordem: 15,
    titulo: 'Massinha Caseira',
    rotuloArea: 'Motor fino e vocabulário',
    areas: ['brincar', 'fala'],
    idadeMinMeses: 36,
    duracao: '10 min',
    material: '2 xícaras de farinha, meia xícara de sal, 1 colher de óleo, água aos poucos e corante alimentício (opcional).',
    passos: [
      'Misturem juntos, nomeando cada ingrediente.',
      'Façam cobrinhas, bolinhas e um "bolo".',
      'Use palavras de tamanho e forma: grande, pequeno, comprido, redondo.',
    ],
    dica: 'Peça escolhas: "Você quer a bolinha grande ou a pequena?" Assim ela precisa responder com palavras.',
    observar: 'Observe se ela usa palavras de tamanho e forma sozinha ("grande", "redonda") ou só repete as suas.',
    seguranca: 'A massinha tem sal e não é para comer. Lavem as mãos no final.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm16-telefone-copinho',
    ordem: 16,
    titulo: 'Telefone de Copinho',
    rotuloArea: 'Escuta e turnos',
    areas: ['audicao', 'interacao'],
    idadeMinMeses: 36,
    duracao: '10 min',
    material: '2 copos de papel ou plástico e 2 metros de barbante.',
    passos: [
      'Um adulto fura o fundo dos copos e amarra o barbante.',
      'Estiquem o fio.',
      'Um fala e o outro escuta.',
      'Brinquem de recado: "Diga para o papai que é hora do lanche".',
    ],
    dica: 'Combine: quem fala, fala; quem escuta, espera. É assim que se treina a vez de cada um.',
    observar: 'Observe se ela espera a vez de falar e se o recado chega parecido com o que você disse.',
    seguranca: 'O barbante nunca fica perto do pescoço. Guarde após a brincadeira.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm17-historia-3-cenas',
    ordem: 17,
    titulo: 'História em 3 Cenas',
    rotuloArea: 'Narrativa',
    areas: ['narrativa'],
    idadeMinMeses: 36,
    duracao: '10 min',
    material: '3 fotos do celular de um mesmo dia (acordar, almoçar, brincar) ou 3 desenhos simples.',
    passos: [
      'Mostre as cenas fora de ordem.',
      'Peça para a criança colocar na ordem.',
      'Peça que conte: "Primeiro… depois… no final…".',
    ],
    dica: 'Palavras de tempo como "primeiro", "depois" e "no final" organizam a fala e o pensamento.',
    observar: 'Observe se ela usa "primeiro", "depois" e "no final" ou se só nomeia as cenas.',
    quandoParar: PARAR_PADRAO,
  },
  {
    id: 'm18-rima',
    ordem: 18,
    titulo: 'Rima ou Não Rima?',
    rotuloArea: 'Consciência fonológica',
    areas: ['consciencia_fonologica'],
    idadeMinMeses: 48,
    duracao: '5 min',
    material: 'Nenhum.',
    passos: [
      'Fale duas palavras: "bola / cola".',
      'A criança diz se combinam no final.',
      'Misture pares que rimam e que não rimam ("gato / mesa").',
      'Desafio: ela inventa uma rima para "pão".',
    ],
    dica: 'Brincar com os sons das palavras é a base da alfabetização.',
    observar: 'Observe se ela percebe a rima pelo final da palavra. Se errar, repita o par mais devagar, caprichando no final.',
    quandoParar: PARAR_PADRAO,
  },
];

/** Como cada área aparece na frase de feedback da missão concluída ("Hoje Pedro exercitou a escuta"). */
export const FRASE_AREA: Record<Area, string> = {
  fala: 'a fala',
  compreensao: 'a compreensão',
  interacao: 'a troca com as pessoas',
  audicao: 'a escuta',
  motricidade_oral: 'os músculos da boca',
  alimentacao: 'a mastigação',
  imitacao: 'a imitação',
  gestos: 'os gestos',
  brincar: 'o tato e o brincar',
  narrativa: 'o jeito de contar histórias',
  inteligibilidade: 'a fala clara',
  consciencia_fonologica: 'os sons das palavras',
};

export type ComoFoi = 'facil' | 'com_ajuda' | 'dificil';

export const ROTULO_COMO_FOI: Record<ComoFoi, string> = { facil: 'Fácil', com_ajuda: 'Com ajuda', dificil: 'Difícil' };

/** Quantos "Difícil" na mesma área levam à sugestão de falar com a equipe (a RT pode ajustar). */
export const LIMITE_DIFICIL = 3;

/** Dias até sugerir refazer a triagem depois de um resultado "Vale observar". */
export const DIAS_REFAZER_OBSERVAR = 30;
