import { formatarDataCurta, proximaMudancaDeFaixa, proximaTriagem } from '@/domain/acompanhamento';

const hoje = new Date(2026, 9, 31);
const pedro = { nascimento: '2025-03-12', semanasGestacao: null }; // 1 ano e 7 meses, faixa f18-23m

describe('proximaTriagem', () => {
  it('primeira triagem fica disponível na hora', () => {
    expect(proximaTriagem(pedro, null, hoje)).toMatchObject({ disponivel: true, motivo: 'primeira' });
  });

  it('libera quando a criança muda de faixa', () => {
    const ultima = { criadaEm: '2026-06-01T10:00:00Z', faixaId: 'f12-17m', resultado: { nivel: 'esperado' as const } };
    expect(proximaTriagem(pedro, ultima, hoje)).toMatchObject({ disponivel: true, motivo: 'nova_faixa' });
  });

  it('"Vale observar" sugere refazer em 30 dias', () => {
    const ultima = { criadaEm: new Date(2026, 9, 20).toISOString(), faixaId: 'f18-23m', resultado: { nivel: 'observar' as const } };
    const p = proximaTriagem(pedro, ultima, hoje);
    expect(p.disponivel).toBe(false);
    expect(formatarDataCurta(p.data)).toBe('19 de nov');
  });

  it('"Esperado" sugere quando entrar na próxima faixa (2 anos)', () => {
    const ultima = { criadaEm: new Date(2026, 9, 30).toISOString(), faixaId: 'f18-23m', resultado: { nivel: 'esperado' as const } };
    const p = proximaTriagem(pedro, ultima, hoje);
    expect(p.disponivel).toBe(false);
    expect(formatarDataCurta(p.data)).toBe('12 de mar');
  });
});

describe('proximaMudancaDeFaixa', () => {
  it('acha o aniversário de 2 anos', () => {
    expect(proximaMudancaDeFaixa(pedro, hoje)?.getFullYear()).toBe(2027);
  });
});
