const mockPlay = jest.fn();
const mockCriar = jest.fn(() => ({ play: mockPlay, seekTo: jest.fn(async () => undefined), volume: 1 }));
jest.mock('expo-audio', () => ({ createAudioPlayer: (...a: unknown[]) => mockCriar(...(a as [])), setAudioModeAsync: jest.fn(async () => undefined) }));
jest.mock('expo-haptics', () => ({ notificationAsync: jest.fn(async () => undefined), impactAsync: jest.fn(async () => undefined), NotificationFeedbackType: { Success: 's' }, ImpactFeedbackStyle: { Light: 'l', Medium: 'm' } }));
let mockSons = true;
jest.mock('@/storage/repositorio', () => ({ repositorio: { lerSons: async () => mockSons, salvarSons: async (v: boolean) => { mockSons = v; } } }));

import { definirSons, tocar } from '@/servicos/sons';

beforeEach(() => jest.clearAllMocks());

describe('sons', () => {
  it('toca e reaproveita o player', async () => {
    await tocar('missao');
    await tocar('missao');
    expect(mockCriar).toHaveBeenCalledTimes(1);
    expect(mockPlay).toHaveBeenCalledTimes(2);
  });

  it('desligado no Perfil, não toca', async () => {
    await definirSons(false);
    await tocar('medalha');
    expect(mockPlay).not.toHaveBeenCalled();
    await definirSons(true);
  });

  it('nunca lança erro, mesmo se o áudio falhar', async () => {
    mockCriar.mockImplementationOnce(() => {
      throw new Error('sem áudio');
    });
    await expect(tocar('conquista')).resolves.toBeUndefined();
  });
});
