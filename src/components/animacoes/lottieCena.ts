// Construtor de microanimações Lottie feito em código: nada de JSON externo.
// Cada cena tem o desenho parado num PNG e, por cima, uma camada Lottie transparente
// só com os elementos de fundo que se mexem (folhas, balões, brilhos, onda de som).
// Todo movimento é uma função periódica de t (0..1), então o loop fecha sem salto.

export type LottieJson = Record<string, unknown>;

export const FPS = 60;
/** 3 s por ciclo, lento como Calm/Headspace */
export const QUADROS = 180;

/** Recorte da arte (viewBox do SVG original): a camada Lottie usa o mesmo quadro. */
export const RECORTE = { x: 90, y: 160, largura: 1020, altura: 640 } as const;

const LINHA = '#1D4F48';

type Valor = number | number[];
type Quadro = { t: number; s: number[]; i?: { x: number[]; y: number[] }; o?: { x: number[]; y: number[] } };

export function cor(hex: string, alfa = 1): number[] {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => Math.round((parseInt(h.slice(i, i + 2), 16) / 255) * 10000) / 10000).concat(alfa);
}

const fixo = (k: unknown) => ({ a: 0, k });

/** Amostra f(t) em `passos` pontos com interpolação linear. f(0) deve ser igual a f(1). */
export function animado(f: (t: number) => Valor, passos = 12) {
  const k: Quadro[] = [];
  for (let n = 0; n <= passos; n++) {
    const t = n / passos;
    const v = f(t);
    const s = (Array.isArray(v) ? v : [v]).map((x) => Math.round(x * 1000) / 1000);
    const q: Quadro = { t: Math.round(t * QUADROS * 100) / 100, s };
    if (n < passos) {
      const meio = s.map(() => 0.5);
      q.i = { x: meio, y: meio };
      q.o = { x: meio, y: meio };
    }
    k.push(q);
  }
  return { a: 1, k };
}

const TRANSFORMACAO = { ty: 'tr', p: fixo([0, 0]), a: fixo([0, 0]), s: fixo([100, 100]), r: fixo(0), o: fixo(100), sk: fixo(0), sa: fixo(0) };

function traco(largura = 2.5, c = LINHA, tracejado?: unknown[]) {
  return { ty: 'st', c: fixo(cor(c)), o: fixo(100), w: fixo(largura), lc: 2, lj: 2, ml: 4, ...(tracejado ? { d: tracejado } : {}) };
}
const preenchimento = (c: string, opacidade = 100) => ({ ty: 'fl', c: fixo(cor(c)), o: fixo(opacidade), r: 1 });
const caminho = (v: number[][], i: number[][], o: number[][], fechado = true) => ({ ty: 'sh', ks: fixo({ v, i, o, c: fechado }) });
const grupo = (...itens: unknown[]) => ({ ty: 'gr', it: [...itens, TRANSFORMACAO] });

type Ks = { o?: unknown; r?: unknown; p: unknown; s?: unknown };
function camada(nome: string, formas: unknown[], ks: Ks) {
  return {
    ddd: 0, ty: 4, nm: nome, sr: 1, ao: 0, ip: 0, op: QUADROS, st: 0, bm: 0,
    ks: { o: ks.o ?? fixo(100), r: ks.r ?? fixo(0), p: ks.p, a: fixo([0, 0, 0]), s: ks.s ?? fixo([100, 100, 100]) },
    shapes: formas,
  };
}
/** Coordenada da arte (SVG de 1200x900) para o quadro recortado. */
const pos = (x: number, y: number) => [x - RECORTE.x, y - RECORTE.y, 0];
const TAU = Math.PI * 2;

// ─── Elementos ────────────────────────────────────────────────────────────────

const FOLHA = caminho([[0, 0], [84, 0]], [[18, 26], [-28, -28]], [[18, -26], [-28, 28]]);
const NERVURA = caminho([[4, 0], [76, 0]], [[0, 0], [0, 0]], [[0, 0], [0, 0]], false);

/** Folha presa no caule pela base: balança ±amp graus, como brisa. */
export function folha(x: number, y: number, angulo: number, escala: number, c: string, o: { opacidade?: number; fase?: number; amp?: number } = {}) {
  const { opacidade = 100, fase = 0, amp = 2.6 } = o;
  return camada('folha', [grupo(NERVURA, traco()), grupo(FOLHA, traco(), preenchimento(c, opacidade))], {
    p: fixo(pos(x, y)),
    r: animado((t) => angulo + amp * Math.sin(TAU * t + fase)),
    s: fixo([escala * 100, escala * 100, 100]),
  });
}

/** Balão em pílula: aparece, sobe alguns pixels e some. `fase` (0..1) desloca no ciclo. */
export function pilula(x: number, y: number, w: number, h: number, c: string, o: { fase?: number; rotacao?: number; sobe?: number } = {}) {
  const { fase = 0, rotacao = 0, sobe = 22 } = o;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const u = (t: number) => (t + fase) % 1;
  return camada('balao', [grupo({ ty: 'rc', p: fixo([0, 0]), s: fixo([w, h]), r: fixo(h / 2), d: 1 }, traco(), preenchimento(c))], {
    p: animado((t) => pos(cx, cy + sobe / 2 - sobe * u(t)), 24),
    r: fixo(rotacao),
    o: animado((t) => 100 * Math.max(0, Math.min(1, u(t) / 0.3, (0.92 - u(t)) / 0.25)), 24),
  });
}

const ESTRELA = caminho(
  [[0, -16], [16, 0], [0, 16], [-16, 0]],
  [[-2, 11], [-11, -2], [2, -11], [11, 2]],
  [[2, 11], [-11, 2], [-2, -11], [11, -2]],
);

/** Estrela de 4 pontas piscando devagar (opacidade e um respiro de escala). */
export function brilho(x: number, y: number, escala: number, c: string, fase: number) {
  return camada('brilho', [grupo(ESTRELA, traco(), preenchimento(c))], {
    p: fixo(pos(x, y)),
    s: animado((t) => {
      const e = escala * (88 + 14 * Math.sin(TAU * t + fase));
      return [e, e, 100];
    }),
    o: animado((t) => 62 + 38 * Math.sin(TAU * t + fase), 16),
  });
}

/** Onda de som pontilhada: os pontos andam ao longo da curva. Deslocamento múltiplo de (traço + vão) fecha o loop. */
export function ondaDeSom(pontos: [number, number][], entrada: number[][], saida: number[][], c: string) {
  const v = pontos.map(([a, b]) => [a - RECORTE.x, b - RECORTE.y]);
  const tracejado = [
    { n: 'd', nm: 'traço', v: fixo(1) },
    { n: 'g', nm: 'vão', v: fixo(10) },
    { n: 'o', nm: 'deslocamento', v: { a: 1, k: [{ t: 0, s: [0], i: { x: [1], y: [1] }, o: { x: [0], y: [0] } }, { t: QUADROS, s: [-44] }] } },
  ];
  return camada('onda', [grupo(caminho(v, entrada, saida, false), traco(3, c, tracejado))], { p: fixo([0, 0, 0]) });
}

export function composicao(nome: string, camadas: Record<string, unknown>[]): LottieJson {
  return {
    v: '5.7.4', fr: FPS, ip: 0, op: QUADROS, w: RECORTE.largura, h: RECORTE.altura, nm: nome, ddd: 0, assets: [],
    layers: camadas.map((c, i) => ({ ...c, ind: i + 1 })),
  };
}
