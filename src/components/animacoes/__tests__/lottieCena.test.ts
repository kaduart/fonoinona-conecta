import { animado, composicao, folha, QUADROS } from '../lottieCena';

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
