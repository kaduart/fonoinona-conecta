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

// Aviso da próxima triagem: uma notificação local no dia em que a triagem libera, às 10h.
// Não pede permissão (só agenda se a família já liberou notificações) e não leva o nome da criança.
// Idempotente: usa um identificador fixo por criança, então reagendar substitui o anterior.
export const TEXTO_AVISO_TRIAGEM = { title: 'Nova triagem liberada', body: 'Veja como está o desenvolvimento agora. Leva uns 3 minutos.' };
const HORA_AVISO_TRIAGEM = 10;
const idAvisoTriagem = (criancaId: string) => `triagem-${criancaId}`;

export async function agendarAvisoTriagem(criancaId: string, quando: Date, disponivel: boolean): Promise<void> {
  if (!lembreteDisponivel()) return;
  try {
    const identifier = idAvisoTriagem(criancaId);
    if (disponivel) {
      await N.cancelScheduledNotificationAsync(identifier).catch(() => undefined);
      return;
    }
    if (!(await N.getPermissionsAsync()).granted) return;
    const data = new Date(quando);
    data.setHours(HORA_AVISO_TRIAGEM, 0, 0, 0);
    if (data.getTime() <= Date.now()) return;
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(CANAL, { name: 'Lembrete do Diário', importance: N.AndroidImportance.DEFAULT });
    }
    await N.scheduleNotificationAsync({
      identifier,
      content: { ...TEXTO_AVISO_TRIAGEM, data: { rota: '/inicio' } },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: data, ...(Platform.OS === 'android' ? { channelId: CANAL } : {}) },
    });
  } catch (e) {
    console.warn('[lembrete] aviso da triagem', e);
  }
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
    if (rota === '/diario' || rota === '/inicio') abrir(rota);
  });
  return () => sub.remove();
}
