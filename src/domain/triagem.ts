import { ALERTAS, FAIXAS, ROTULO_AREA, type Area, type Faixa } from '@/content/perguntas';

export type Resposta = 'sim' | 'as_vezes' | 'ainda_nao';
export type NivelResultado = 'esperado' | 'observar' | 'avaliar';

export type ResultadoArea = { area: Area; rotulo: string; nivel: NivelResultado; pontuacao: number };

export type Resultado = {
  nivel: NivelResultado;
  /** áreas da pior para a melhor */
  areas: ResultadoArea[];
  /** área que mais precisa de estímulo, se houver */
  areaFoco: Area | null;
  alertaMarcado: boolean;
};

/** Cortes da regra. Valores iniciais conservadores; a RT define os finais. */
export const REGRA = {
  aindaNaoParaAvaliar: 2,
  aindaNaoParaObservar: 1,
  asVezesParaObservar: 2,
} as const;

const ORDEM: Record<NivelResultado, number> = { avaliar: 0, observar: 1, esperado: 2 };
const NIVEL_RESPOSTA: Record<Resposta, NivelResultado> = { sim: 'esperado', as_vezes: 'observar', ainda_nao: 'avaliar' };
const PONTOS: Record<Resposta, number> = { sim: 100, as_vezes: 55, ainda_nao: 15 };

export function faixaPara(meses: number): Faixa | null {
  return FAIXAS.find((f) => meses >= f.minMeses && meses < f.maxMeses) ?? null;
}

export function pior(a: NivelResultado, b: NivelResultado): NivelResultado {
  return ORDEM[a] <= ORDEM[b] ? a : b;
}

/**
 * Calcula o resultado da triagem.
 * @param respostas respostas das 6 perguntas da faixa, por id
 * @param alertas respostas sim/não das perguntas de alerta, por id
 */
export function avaliar(faixa: Faixa, respostas: Record<string, Resposta>, alertas: Record<string, boolean>): Resultado {
  const faltando = faixa.perguntas.filter((p) => !respostas[p.id]);
  if (faltando.length > 0) {
    throw new Error(`Triagem incompleta: faltam ${faltando.map((p) => p.id).join(', ')}`);
  }

  const valores = faixa.perguntas.map((p) => respostas[p.id]);
  const aindaNao = valores.filter((v) => v === 'ainda_nao').length;
  const asVezes = valores.filter((v) => v === 'as_vezes').length;
  const alertaMarcado = ALERTAS.some((a) => alertas[a.id] === true);

  let nivel: NivelResultado = 'esperado';
  if (alertaMarcado || aindaNao >= REGRA.aindaNaoParaAvaliar) nivel = 'avaliar';
  else if (aindaNao >= REGRA.aindaNaoParaObservar || asVezes >= REGRA.asVezesParaObservar) nivel = 'observar';

  const porArea = new Map<Area, { nivel: NivelResultado; soma: number; n: number }>();
  for (const p of faixa.perguntas) {
    const r = respostas[p.id];
    const atual = porArea.get(p.area);
    porArea.set(p.area, {
      nivel: atual ? pior(atual.nivel, NIVEL_RESPOSTA[r]) : NIVEL_RESPOSTA[r],
      soma: (atual?.soma ?? 0) + PONTOS[r],
      n: (atual?.n ?? 0) + 1,
    });
  }
  const areas: ResultadoArea[] = [...porArea.entries()]
    .map(([area, v]) => ({ area, rotulo: ROTULO_AREA[area], nivel: v.nivel, pontuacao: Math.round(v.soma / v.n) }))
    .sort((a, b) => ORDEM[a.nivel] - ORDEM[b.nivel] || a.pontuacao - b.pontuacao);

  const areaFoco = areas[0] && areas[0].nivel !== 'esperado' ? areas[0].area : null;
  return { nivel, areas, areaFoco, alertaMarcado };
}

/** Quantas habilidades (perguntas da faixa) estão no esperado. As perguntas de alerta não entram: são sim/não sobre sinais, não habilidades. */
export function contarHabilidades(respostas: Record<string, Resposta>): { noEsperado: number; total: number } {
  const valores = Object.values(respostas);
  return { noEsperado: valores.filter((v) => v === 'sim').length, total: valores.length };
}

/** Troca {nome} pelo apelido da criança. */
export function personalizar(texto: string, vars: Record<string, string>): string {
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? `{${k}}`);
}
