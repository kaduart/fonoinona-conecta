import AsyncStorage from '@react-native-async-storage/async-storage';

import { repositorio } from '@/storage/repositorio';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

const mockChave = crypto.getRandomValues(new Uint8Array(32));
jest.mock('@/storage/chave', () => ({
  chaveDoAparelho: async () => mockChave,
  descartarChave: jest.fn(async () => undefined),
  novoNonce: () => globalThis.crypto.getRandomValues(new Uint8Array(24)),
}));

const pedro = { id: 'k1', apelido: 'Pedrinho', nascimento: '2025-03-12', semanasGestacao: null, criadaEm: '2026-10-31T10:00:00Z' };

beforeEach(() => AsyncStorage.clear());

describe('repositorio cifrado', () => {
  it('grava cifrado e lê de volta', async () => {
    await repositorio.salvarCrianca(pedro);
    const bruto = await AsyncStorage.getItem('conecta:criancas:v1');
    expect(bruto?.startsWith('enc1:')).toBe(true);
    expect(bruto).not.toContain('Pedrinho');
    expect(await repositorio.listarCriancas()).toEqual([pedro]);
  });

  it('migra dados antigos em texto puro', async () => {
    await AsyncStorage.setItem('conecta:criancas:v1', JSON.stringify([pedro]));
    expect(await repositorio.listarCriancas()).toEqual([pedro]);
    expect((await AsyncStorage.getItem('conecta:criancas:v1'))?.startsWith('enc1:')).toBe(true);
  });

  it('salvar conclusão é idempotente pelo id', async () => {
    const c = { id: 'c1', criancaId: 'k1', missaoId: 'm06-conversa-bebe', como: 'facil' as const, em: '2026-10-31T10:00:00Z' };
    await repositorio.salvarConclusao(c);
    await repositorio.salvarConclusao(c);
    expect(await repositorio.listarConclusoes('k1')).toHaveLength(1);
  });

  it('remover criança apaga as triagens e missões dela', async () => {
    await repositorio.salvarCrianca(pedro);
    await repositorio.salvarConclusao({ id: 'c1', criancaId: 'k1', missaoId: 'x', como: 'facil', em: '2026-10-31T10:00:00Z' });
    await repositorio.removerCrianca('k1');
    expect(await repositorio.listarCriancas()).toEqual([]);
    expect(await repositorio.listarConclusoes('k1')).toEqual([]);
  });

  it('Diário: grava cifrado, edita pelo id, apaga e some junto com a criança', async () => {
    const r = { id: 'd1', criancaId: 'k1', data: '2026-10-31', contexto: 'casa' as const, humor: 'bom' as const, areas: ['fala' as const], conquista: true, nota: 'Falou água', criadoEm: '2026-10-31T10:00:00Z', editadoEm: '2026-10-31T10:00:00Z' };
    await repositorio.salvarRegistroDiario(r);
    await repositorio.salvarRegistroDiario({ ...r, nota: 'Falou água sozinha' });
    expect(await AsyncStorage.getItem('conecta:diario:v1')).not.toContain('água');
    expect(await repositorio.listarDiario('k1')).toEqual([{ ...r, nota: 'Falou água sozinha' }]);
    expect(await repositorio.listarDiario('k2')).toEqual([]);
    await repositorio.salvarRegistroDiario({ ...r, id: 'd2' });
    await repositorio.removerRegistroDiario('d1');
    expect((await repositorio.listarDiario('k1')).map((x) => x.id)).toEqual(['d2']);
    await repositorio.removerCrianca('k1');
    expect(await repositorio.listarDiario('k1')).toEqual([]);
  });

  it('exportar e importar a cópia: soma sem duplicar', async () => {
    await repositorio.salvarCrianca(pedro);
    const copia = await repositorio.exportar();
    await repositorio.apagarTudo();
    await repositorio.importar(copia);
    await repositorio.importar(copia);
    expect(await repositorio.listarCriancas()).toEqual([pedro]);
  });

  it('apagar tudo descarta a chave', async () => {
    const { descartarChave } = jest.requireMock('@/storage/chave');
    await repositorio.salvarCrianca(pedro);
    await repositorio.apagarTudo();
    expect(await repositorio.listarCriancas()).toEqual([]);
    expect(descartarChave).toHaveBeenCalled();
  });
});
