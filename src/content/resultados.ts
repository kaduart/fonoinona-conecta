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
