import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const mockChave = crypto.getRandomValues(new Uint8Array(32));
jest.mock('@/storage/chave', () => ({
  chaveDoAparelho: async () => mockChave,
  descartarChave: async () => undefined,
  novoNonce: () => globalThis.crypto.getRandomValues(new Uint8Array(24)),
}));

import { sincronizar } from '@/api/cliente';
import { enviarPendentes, marcarInstalacao, modoAtual, plataformaAtual, registrarAbertura } from '@/servicos/instalacao';
import { repositorio } from '@/storage/repositorio';

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

beforeEach(async () => {
  process.env.EXPO_PUBLIC_API_URL = 'https://api.exemplo.test';
  await AsyncStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, status: 202 });
});

const enviados = () => fetchMock.mock.calls.flatMap((c) => JSON.parse(c[1].body).eventos);

describe('medição de instalação', () => {
  it('no app nativo, abertura vai com modo nativo e a plataforma', async () => {
    await repositorio.salvarConsentimento({ versaoTermo: 't', aceitoEm: '2026-11-04T10:00:00Z' });
    await registrarAbertura();
    await sincronizar();
    expect(enviados()).toEqual([expect.objectContaining({ tipo: 'app_aberto', modo: modoAtual(), plataforma: plataformaAtual() })]);
    expect(modoAtual()).toBe('nativo');
  });

  it('guarda a instalação antes do termo e envia uma vez só depois do aceite', async () => {
    await marcarInstalacao('instalada');
    await marcarInstalacao('instalada');
    expect(fetchMock).not.toHaveBeenCalled();

    await repositorio.salvarConsentimento({ versaoTermo: 't', aceitoEm: '2026-11-04T10:00:00Z' });
    await enviarPendentes();
    await sincronizar();
    await enviarPendentes();
    await sincronizar();
    const tipos = enviados().map((e: { tipo: string }) => e.tipo);
    expect(tipos).toEqual(['app_instalado']);
  });
});

describe('avisos simultâneos do navegador', () => {
  it('não perde nenhuma marca', async () => {
    await repositorio.salvarConsentimento({ versaoTermo: 't', aceitoEm: '2026-11-04T10:00:00Z' });
    await Promise.all([marcarInstalacao('oferecida'), marcarInstalacao('instalada')]);
    await sincronizar();
    expect(enviados().map((e: { tipo: string }) => e.tipo).sort()).toEqual(['app_instalado', 'instalacao_oferecida']);
  });
});
