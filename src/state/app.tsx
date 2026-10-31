import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { repositorio, type Consentimento, type Crianca } from '@/storage/repositorio';

type Estado = {
  carregando: boolean;
  criancas: Crianca[];
  criancaAtual: Crianca | null;
  consentimento: Consentimento | null;
  recarregar: () => Promise<void>;
  selecionar: (id: string) => void;
};

const Ctx = createContext<Estado | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [criancas, setCriancas] = useState<Crianca[]>([]);
  const [consentimento, setConsentimento] = useState<Consentimento | null>(null);
  const [atualId, setAtualId] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    const [lista, cons, salvo] = await Promise.all([repositorio.listarCriancas(), repositorio.lerConsentimento(), repositorio.lerAtual()]);
    setCriancas(lista);
    setConsentimento(cons);
    setAtualId((id) => {
      const preferido = id ?? salvo;
      return preferido && lista.some((c) => c.id === preferido) ? preferido : (lista.at(-1)?.id ?? null);
    });
    setCarregando(false);
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const selecionar = useCallback((id: string) => {
    setAtualId(id);
    repositorio.salvarAtual(id).catch((e) => console.warn('[app] não salvou a criança atual', e));
  }, []);

  const valor = useMemo<Estado>(
    () => ({
      carregando,
      criancas,
      consentimento,
      criancaAtual: criancas.find((c) => c.id === atualId) ?? null,
      recarregar,
      selecionar,
    }),
    [carregando, criancas, consentimento, atualId, recarregar, selecionar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp precisa estar dentro de <AppProvider>');
  return v;
}
