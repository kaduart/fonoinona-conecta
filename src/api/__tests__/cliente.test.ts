import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const mockChave = crypto.getRandomValues(new Uint8Array(32));
jest.mock('@/storage/chave', () => ({
  chaveDoAparelho: async () => mockChave,
  descartarChave: async () => undefined,
  novoNonce: () => globalThis.crypto.getRandomValues(new Uint8Array(24)),
}));

import { registrarEvento, registrarLead, sincronizar } from '@/api/cliente';
import { repositorio } from '@/storage/repositorio';

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

beforeEach(async () => {
  process.env.EXPO_PUBLIC_API_URL = 'https://api.exemplo.test/';
  await AsyncStorage.clear();
  fetchMock.mockReset();
});

async function aceitarTermo() {
  await repositorio.salvarConsentimento({ versaoTermo: 't', aceitoEm: '2026-10-31T10:00:00Z' });
}

describe('cliente da API', () => {
  it('sem o termo aceito, não registra nada', async () => {
    await registrarEvento({ tipo: 'app_aberto' });
    expect((await repositorio.lerFila()).eventos).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('envia o lote e esvazia a fila', async () => {
    await aceitarTermo();
    fetchMock.mockResolvedValue({ ok: true, status: 202 });
    await registrarEvento({ tipo: 'missao_concluida', missaoId: 'm06-conversa-bebe', como: 'facil' });
    await sincronizar();
    expect(fetchMock).toHaveBeenCalledWith('https://api.exemplo.test/v1/eventos', expect.objectContaining({ method: 'POST' }));
    const corpo = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(corpo.eventos[0]).toMatchObject({ tipo: 'missao_concluida', missaoId: 'm06-conversa-bebe' });
    expect(JSON.stringify(corpo)).not.toMatch(/apelido|nascimento|respostas/);
    expect((await repositorio.lerFila()).eventos).toEqual([]);
  });

  it('sem internet, guarda e agenda nova tentativa', async () => {
    await aceitarTermo();
    fetchMock.mockRejectedValue(new Error('offline'));
    await registrarEvento({ tipo: 'app_aberto' });
    await sincronizar();
    const fila = await repositorio.lerFila();
    expect(fila.eventos).toHaveLength(1);
    expect(fila.tentativas).toBe(1);
    expect(fila.proximaTentativaEm).toBeGreaterThan(Date.now());
  });

  it('lead envia só código, origem e faixa', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201 });
    await registrarLead('CONECTA-AB2C', 'resultado', 'f18-23m');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ codigo: 'CONECTA-AB2C', origem: 'resultado', faixaId: 'f18-23m' });
  });
});
