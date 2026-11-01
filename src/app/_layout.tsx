import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { atualizarConteudo, registrarEvento } from '@/api/cliente';
import { prepararNotificacoes } from '@/servicos/lembrete';
import { AppProvider, useApp } from '@/state/app';
import { cores } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

function Navegacao() {
  const { carregando } = useApp();
  const [fontesProntas] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold });
  const pronto = fontesProntas && !carregando;
  const router = useRouter();

  useEffect(() => {
    if (!pronto) return;
    let desfazer: (() => void) | undefined;
    prepararNotificacoes((rota) => router.push(rota as '/diario'))
      .then((f) => (desfazer = f))
      .catch((e) => console.warn('[notificacoes] preparar', e));
    return () => desfazer?.();
  }, [pronto, router]);

  useEffect(() => {
    if (!pronto) return;
    SplashScreen.hideAsync();
    // em segundo plano: nada aqui bloqueia o app
    registrarEvento({ tipo: 'app_aberto' });
    atualizarConteudo();
  }, [pronto]);

  if (!pronto) return null;
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <Navegacao />
    </AppProvider>
  );
}
