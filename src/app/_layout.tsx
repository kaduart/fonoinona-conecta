import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/figtree';
import { useRouter } from 'expo-router';
import { Stack } from 'expo-router/stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Appearance, Platform } from 'react-native';

import { atualizarConteudo, registrarEvento } from '@/api/cliente';
import { AvisoProvider } from '@/components/aviso';
import { prepararNotificacoes } from '@/servicos/lembrete';
import { AppProvider, useApp } from '@/state/app';
import { cores } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

function Navegacao() {
  const { carregando } = useApp();
  const [fontesProntas] = useFonts({ Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, Figtree_800ExtraBold });
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

  // os estilos usam o tema lido ao abrir; no navegador, trocar o tema do sistema recarrega a página
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const sub = Appearance.addChangeListener(() => window.location.reload());
    return () => sub.remove();
  }, []);

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
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cores.fundo } }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <AvisoProvider>
        <Navegacao />
      </AvisoProvider>
    </AppProvider>
  );
}
