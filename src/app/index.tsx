import { Redirect } from 'expo-router';

import { useApp } from '@/state/app';

/** Decide a primeira tela: cadastro, consentimento ou o início com as missões. */
export default function Inicio() {
  const { criancaAtual, consentimento } = useApp();
  if (!criancaAtual) return <Redirect href="/boas-vindas" />;
  if (!consentimento) return <Redirect href="/consentimento" />;
  return <Redirect href="/inicio" />;
}
