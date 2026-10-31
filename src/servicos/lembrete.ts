import * as N from 'expo-notifications';
import { Platform } from 'react-native';

import { repositorio, type Lembrete } from '@/storage/repositorio';

// Lembrete diário do Diário: notificação LOCAL (nada passa por servidor).
// O texto não leva o nome da criança, porque aparece na tela bloqueada.

export const TEXTO_LEMBRETE = { title: 'Como foi o dia hoje?', body: 'Anote em 20 segundos no Diário do Conecta.' };
export const HORARIOS_LEMBRETE = [8, 12, 18, 20, 21];
const CANAL = 'lembrete-diario';

export const lembreteDisponivel = () => Platform.OS === 'ios' || Platform.OS === 'android';

/** Liga (ou troca o horário) do lembrete. Devolve false se a pessoa negou a permissão. Idempotente: cancela o anterior antes. */
export async function ligarLembrete(hora: number, minuto = 0): Promise<boolean> {
  if (!lembreteDisponivel()) return false;
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync(CANAL, { name: 'Lembrete do Diário', importance: N.AndroidImportance.DEFAULT });
  }
  const atual = await N.getPermissionsAsync();
  const permitido = atual.granted || (await N.requestPermissionsAsync()).granted;
  if (!permitido) return false;

  const antes = await repositorio.lerLembrete();
  if (antes.notificacaoId) await N.cancelScheduledNotificationAsync(antes.notificacaoId).catch(() => undefined);
  const notificacaoId = await N.scheduleNotificationAsync({
    content: { ...TEXTO_LEMBRETE, data: { rota: '/diario' } },
    trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: hora, minute: minuto, ...(Platform.OS === 'android' ? { channelId: CANAL } : {}) },
  });
  await repositorio.salvarLembrete({ ativo: true, hora, minuto, notificacaoId });
  return true;
}

export async function desligarLembrete(): Promise<void> {
  const antes = await repositorio.lerLembrete();
  if (lembreteDisponivel() && antes.notificacaoId) {
      await N.cancelScheduledNotificationAsync(antes.notificacaoId).catch((e) => console.warn('[lembrete] cancelar', e));
  }
  await repositorio.salvarLembrete({ ...antes, ativo: false, notificacaoId: null });
}

export function rotuloHorario(l: Pick<Lembrete, 'hora' | 'minuto'>): string {
  return `${l.hora}h${l.minuto ? String(l.minuto).padStart(2, '0') : ''}`;
}

/** Mostra o lembrete mesmo com o app aberto e leva ao Diário ao tocar. Chamar uma vez na raiz. */
export async function prepararNotificacoes(abrir: (rota: string) => void): Promise<() => void> {
  if (!lembreteDisponivel()) return () => undefined;
  N.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
  const sub = N.addNotificationResponseReceivedListener((r) => {
    const rota = r.notification.request.content.data?.rota;
    if (rota === '/diario') abrir('/diario');
  });
  return () => sub.remove();
}
