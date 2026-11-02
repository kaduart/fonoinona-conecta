import * as N from 'expo-notifications';

import { agendarAvisoTriagem } from '@/servicos/lembrete';

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
jest.mock('@/storage/repositorio', () => ({ repositorio: {} }));
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn().mockResolvedValue('x'),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: 'date', DAILY: 'daily' },
}));

const m = N as jest.Mocked<typeof N>;
const daqui = (dias: number) => new Date(Date.now() + dias * 86_400_000);

beforeEach(() => jest.clearAllMocks());

test('agenda às 10h do dia, com id fixo por criança, quando já há permissão', async () => {
  m.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
  await agendarAvisoTriagem('c1', daqui(10), false);
  const arg = m.scheduleNotificationAsync.mock.calls[0][0] as { identifier: string; trigger: { date: Date } };
  expect(arg.identifier).toBe('triagem-c1');
  expect(arg.trigger.date.getHours()).toBe(10);
});

test('não pede permissão nem agenda sem permissão', async () => {
  m.getPermissionsAsync.mockResolvedValue({ granted: false } as never);
  await agendarAvisoTriagem('c1', daqui(10), false);
  expect(m.scheduleNotificationAsync).not.toHaveBeenCalled();
});

test('triagem já disponível: cancela o aviso e não agenda', async () => {
  await agendarAvisoTriagem('c1', new Date(), true);
  expect(m.cancelScheduledNotificationAsync).toHaveBeenCalledWith('triagem-c1');
  expect(m.scheduleNotificationAsync).not.toHaveBeenCalled();
});
