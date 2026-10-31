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
    const [lista, cons] = await Promise.all([repositorio.listarCriancas(), repositorio.lerConsentimento()]);
    setCriancas(lista);
    setConsentimento(cons);
    setAtualId((id) => (id && lista.some((c) => c.id === id) ? id : (lista.at(-1)?.id ?? null)));
    setCarregando(false);
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const valor = useMemo<Estado>(
    () => ({
      carregando,
      criancas,
      consentimento,
      criancaAtual: criancas.find((c) => c.id === atualId) ?? null,
      recarregar,
      selecionar: setAtualId,
    }),
    [carregando, criancas, consentimento, atualId, recarregar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp precisa estar dentro de <AppProvider>');
  return v;
}
