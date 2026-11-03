import { animado, composicao, folha, ondas, QUADROS } from '../lottieCena';

describe('microanimações em código', () => {
  it('fecha o loop: primeiro e último quadro iguais', () => {
    const a = animado((t) => 3 * Math.sin(2 * Math.PI * t));
    expect(a.k[0].s[0]).toBeCloseTo(a.k[a.k.length - 1].s[0], 3);
    expect(a.k[a.k.length - 1].t).toBe(QUADROS);
  });

  it('folha balança em volta do ângulo, sem passar da amplitude', () => {
    const c = folha(100, 200, -60, 1, '#CFE0D8') as unknown as { ks: { r: { k: { s: number[] }[] } } };
    const angulos = c.ks.r.k.map((q) => q.s[0]);
    expect(Math.max(...angulos)).toBeLessThanOrEqual(-60 + 2.6 + 1e-6);
    expect(Math.min(...angulos)).toBeGreaterThanOrEqual(-60 - 2.6 - 1e-6);
  });

  it('composição numera as camadas e cabe em poucos KB', () => {
    const json = composicao('teste', [folha(0, 0, 0, 1, '#1F7A6B'), folha(10, 10, 0, 1, '#1F7A6B')]);
    expect((json.layers as { ind: number }[]).map((l) => l.ind)).toEqual([1, 2]);
    expect(JSON.stringify(json).length).toBeLessThan(10_000);
  });
});

describe('ondas de som', () => {
  it('cria 3 arcos que somem e voltam no mesmo ponto do ciclo', () => {
    const camadas = ondas(100, 100, 0, '#1F7A6B') as unknown as { ks: { o: { k: { s: number[] }[] } } }[];
    expect(camadas).toHaveLength(3);
    for (const c of camadas) {
      const op = c.ks.o.k.map((q) => q.s[0]);
      expect(op[0]).toBeCloseTo(op[op.length - 1], 3);
      expect(Math.min(...op)).toBe(0);
    }
  });
});
