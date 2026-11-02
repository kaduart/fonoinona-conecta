jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('@/storage/chave', () => ({ chaveDoAparelho: async () => new Uint8Array(32), descartarChave: async () => undefined, novoNonce: () => new Uint8Array(24) }));

import { codigoValido, enviarAdesao, lerCicloRemoto, vincular, vinculoAtivo } from '../vinculo';

const v = { vinculoId: 'v1', token: 't', crianca: { primeiroNome: 'Ana' } };

describe('vínculo com a clínica (desligado)', () => {
  const fetchOriginal = globalThis.fetch;
  beforeEach(() => {
    globalThis.fetch = jest.fn() as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    delete process.env.EXPO_PUBLIC_VINCULO_CLINICA;
    delete process.env.EXPO_PUBLIC_API_URL;
  });

  it('fica desligado por padrão e não faz nenhuma chamada', async () => {
    process.env.EXPO_PUBLIC_API_URL = 'https://api.exemplo';
    expect(vinculoAtivo()).toBe(false);
    expect(await vincular('123456')).toBeNull();
    expect(await lerCicloRemoto(v)).toBeNull();
    expect(await enviarAdesao(v, 'a1', '2026-11-01')).toBe(false);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('só liga com a flag E a URL da API', () => {
    process.env.EXPO_PUBLIC_VINCULO_CLINICA = '1';
    expect(vinculoAtivo()).toBe(false);
    process.env.EXPO_PUBLIC_API_URL = 'https://api.exemplo';
    expect(vinculoAtivo()).toBe(true);
  });

  it('código da recepção tem 6 dígitos', () => {
    expect(codigoValido('123456')).toBe(true);
    expect(codigoValido(' 123456 ')).toBe(true);
    expect(codigoValido('12345')).toBe(false);
    expect(codigoValido('abcdef')).toBe(false);
  });
});
