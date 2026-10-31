import type { NivelResultado } from '@/domain/triagem';

export const RESPONSAVEL_TECNICA = {
  nome: 'Lorrany Siqueira Marques',
  registro: 'CRFa 5-13633',
};

export const AVISO_RESULTADO =
  'Esta triagem é uma orientação baseada em marcos do desenvolvimento e não substitui a avaliação de um profissional.';

type TextoResultado = { rotulo: string; titulo: string; texto: string };

/** {nome}, {faixa} e {area} são preenchidos pelo app. */
export const TEXTOS_RESULTADO: Record<NivelResultado, TextoResultado> = {
  esperado: {
    rotulo: 'Esperado',
    titulo: '{nome} está no caminho certo.',
    texto:
      'Pelas suas respostas, o desenvolvimento da comunicação de {nome} está dentro do esperado para {faixa}. Continuar brincando e conversando todos os dias é o que mantém esse ritmo.',
  },
  observar: {
    rotulo: 'Vale observar',
    titulo: 'Alguns pontos merecem um olhar especial.',
    texto:
      'Cada criança tem seu ritmo, e algumas habilidades de {nome} em {area} ainda estão se formando. Isso não é um diagnóstico. Em 30 dias, refaça a triagem para ver a evolução.',
  },
  avaliar: {
    rotulo: 'Avaliação recomendada',
    titulo: 'Vale conversar com uma fonoaudióloga.',
    texto:
      'Algumas respostas indicam que {nome} pode se beneficiar de uma avaliação com um profissional. Isso não é um diagnóstico, e quanto antes olharmos com calma, mais leve costuma ser o caminho.',
  },
};

export const AVISO_PEDIATRA = 'Converse também com o pediatra de {nome}.';

/**
 * Chamada da tela de resultado (manchete + apoio). {nome} e {areas} são preenchidos pelo app.
 * Texto persuasivo pedido pelo Kadu em 31/10; aguarda revisão da RT.
 */
export const CHAMADA_RESULTADO: Record<NivelResultado, { titulo: string; texto: string }> = {
  esperado: {
    titulo: '{nome} está se desenvolvendo muito bem.',
    texto: 'As habilidades de comunicação estão dentro do esperado para a idade. Continuar brincando e conversando todos os dias é o que mantém esse ritmo.',
  },
  observar: {
    titulo: 'Identificamos oportunidades de evolução para {nome}.',
    texto:
      'Algumas habilidades de {areas} estão numa fase importante do desenvolvimento. O estímulo especializado agora faz toda a diferença para o futuro de {nome}.',
  },
  avaliar: {
    titulo: 'Vale olhar com carinho o desenvolvimento de {nome}.',
    texto:
      'Algumas habilidades de {areas} merecem a atenção de uma fonoaudióloga. Quanto antes olharmos juntos, mais leve costuma ser o caminho.',
  },
};

export const CTA_RESULTADO = {
  titulo: 'Agendar avaliação para {nome}',
  apoio: 'Fale com a fono pelo WhatsApp, sem compromisso',
};

/** Horário em que a equipe responde no WhatsApp (seg–sex 8h–18h). Ajustar com a clínica. */
export function equipeOnline(agora: Date = new Date()) {
  const dia = agora.getDay();
  const h = agora.getHours();
  return dia >= 1 && dia <= 5 && h >= 8 && h < 18;
}

/** Descrição curta de cada habilidade, para os cards do resultado. */
export const DESCRICAO_AREA: Record<string, string> = {
  fala: 'Palavras e frases',
  compreensao: 'Entender pedidos',
  interacao: 'Troca com as pessoas',
  audicao: 'Reação aos sons',
  motricidade_oral: 'Sopro e lábios',
  alimentacao: 'Mastigar e engolir',
  imitacao: 'Copiar gestos e sons',
  gestos: 'Apontar e mostrar',
  brincar: 'Faz de conta',
  narrativa: 'Contar o que viveu',
  inteligibilidade: 'Ser entendido',
  consciencia_fonologica: 'Rimas e sílabas',
};

/** Dica prática imediata por habilidade ("Dica da Fono"). Aguarda revisão da RT. */
export const DICA_AREA: Record<string, string> = {
  fala: 'Narre o que vocês fazem juntos e espere a criança completar a frase.',
  compreensao: 'Dê pedidos curtos com gesto: "pega a bola e me dá".',
  interacao: 'Brinque de esconde-esconde com o rosto e espere o olhar dela.',
  audicao: 'Brinque de achar de onde vem o som de um chocalho escondido.',
  motricidade_oral: 'Soprar bolhas e encher as bochechas no espelho ajuda muito.',
  alimentacao: 'Ofereça alimentos de texturas diferentes, sempre sentada e com calma.',
  imitacao: 'Faça caretas e sons de bichos no espelho e convide a imitar.',
  gestos: 'Aponte e nomeie as coisas no passeio: "olha o cachorro!".',
  brincar: 'Brinque de faz de conta 10 min por dia, narrando o que acontece.',
  narrativa: 'Na hora de dormir, peça para contar 3 coisas que aconteceram no dia.',
  inteligibilidade: 'Repita a palavra do jeito certo, sem corrigir: "é, o carro!".',
  consciencia_fonologica: 'Brinque de rimas: "gato, pato, sapato… o que mais rima?".',
};
