// Temas das fases da trilha (cada fase = 4 missões, uma medalha) e os recursos sugeridos para cada uma.
// RASCUNHO para revisão da RT Lorrany Siqueira Marques (CRFa 5-13633): objetivos e materiais.
// Regras: o caseiro vem sempre primeiro e é suficiente; o kit é conveniência, nunca condição.
// Nada de promessa de resultado nem termos clínicos ("tratamento", "diagnóstico").

export type RecursoCaseiro = { titulo: string; materiais: string; comoFazer: string };

export type TemaFase = {
  /** nome curto da fase */
  titulo: string;
  /** o que a fase trabalha, em linguagem de pai */
  objetivo: string;
  recursos: RecursoCaseiro[];
  kit: { nome: string; descricao: string };
};

export const TEMAS_FASE: TemaFase[] = [
  {
    titulo: 'Base sensorial',
    objetivo: 'Explorar texturas, sons e o olhar junto com você. É a base para a criança prestar atenção no mundo e nas pessoas.',
    recursos: [
      { titulo: 'Caixa de texturas', materiais: 'Caixa de sapato, retalhos de tecido, esponja, papel-alumínio', comoFazer: 'Cole um material em cada lado da caixa e deixe a criança tocar enquanto você nomeia: "macio", "áspero".' },
      { titulo: 'Potes de som', materiais: 'Potes com tampa bem fechada, arroz, feijão, colher', comoFazer: 'Encha e feche bem os potes (passe fita na tampa). Chacoalhe um de cada vez e espere a criança procurar o som.' },
    ],
    kit: { nome: 'Kit Sensorial FonoInova', descricao: 'Caixa de texturas e chocalhos seguros para a idade, prontos para usar.' },
  },
  {
    titulo: 'Atenção e coordenação',
    objetivo: 'Usar as mãos com mais precisão (a "pinça" dos dedos) e manter a atenção numa brincadeira por mais tempo.',
    recursos: [
      { titulo: 'Painel de tampinhas', materiais: 'Papelão, tampinhas de garrafa grandes, cola quente (só o adulto usa)', comoFazer: 'Cole bocais de garrafa no papelão e deixe a criança rosquear as tampinhas. Sempre com um adulto por perto.' },
      { titulo: 'Alinhavo de papelão', materiais: 'Papelão, furador, cadarço com ponta firme', comoFazer: 'Faça furos num desenho simples e mostre como passar o cadarço de um furo para o outro.' },
    ],
    kit: { nome: 'Kit Coordenação FonoInova', descricao: 'Painel com velcro, encaixes e alinhavo, em tamanhos seguros para a idade.' },
  },
  {
    titulo: 'Linguagem e comunicação',
    objetivo: 'Nomear coisas, pedir, apontar e responder. A criança começa a usar a fala e os gestos para conseguir o que quer.',
    recursos: [
      { titulo: 'Cartões da casa', materiais: 'Fotos impressas ou recortes de revista, papelão, fita larga', comoFazer: 'Monte cartões com objetos do dia a dia (copo, bola, sapato). Peça para a criança achar o objeto de verdade na casa.' },
      { titulo: 'Caixa de surpresas', materiais: 'Caixa ou sacola, brinquedos conhecidos', comoFazer: 'Tire um objeto de cada vez com suspense e espere a criança tentar falar ou apontar antes de você nomear.' },
    ],
    kit: { nome: 'Kit Comunicação FonoInova', descricao: 'Cartões de pareamento figura e objeto, com sugestões de brincadeira.' },
  },
  {
    titulo: 'Ritmo, sons e sopro',
    objetivo: 'Brincar com rimas, músicas e sopro. Isso fortalece a boca e ajuda a perceber os sons das palavras.',
    recursos: [
      { titulo: 'Futebol de sopro', materiais: 'Canudo, bolinha de papel, fita para marcar o gol', comoFazer: 'Sopre a bolinha pelo canudo até o gol. Revezem e comemorem cada gol.' },
      { titulo: 'Banda da cozinha', materiais: 'Panela, colher de pau, garrafa com arroz bem fechada', comoFazer: 'Toquem juntos no ritmo de uma música conhecida. Pare de repente e veja se a criança para também.' },
    ],
    kit: { nome: 'Kit Ritmo e Sopro FonoInova', descricao: 'Instrumentos de sopro e ritmo pensados para a idade.' },
  },
  {
    titulo: 'Histórias e conversa',
    objetivo: 'Contar o que aconteceu, inventar histórias e manter uma conversa com começo, meio e fim.',
    recursos: [
      { titulo: 'Livro da família', materiais: 'Fotos da família, folhas, grampeador', comoFazer: 'Monte um livrinho com fotos de um passeio e peça para a criança contar o que aconteceu em cada página.' },
      { titulo: 'Fantoche de meia', materiais: 'Meia velha, botões ou caneta de tecido', comoFazer: 'Faça um fantoche e deixe que ele "converse" com a criança. Faça perguntas abertas: "e depois, o que aconteceu?".' },
    ],
    kit: { nome: 'Kit Histórias FonoInova', descricao: 'Fantoches e cartões de sequência para contar histórias juntos.' },
  },
];

/** Aviso fixo de segurança nos recursos. */
export const AVISO_RECURSOS = 'Brinque sempre junto. Peças pequenas, grãos e cordões só com um adulto do lado, e nunca para menores de 3 anos sem supervisão próxima.';

/** Tema da fase N (1, 2, ...). Fases além da lista repetem o último tema. */
export function temaDaFase(numero: number): TemaFase {
  return TEMAS_FASE[Math.min(Math.max(numero, 1), TEMAS_FASE.length) - 1];
}
