import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import type { AtividadeCasa, Ciclo } from '@/domain/casa';
import type { RegistroDiario } from '@/domain/diario';
import type { Conclusao } from '@/domain/missoes';
import { repositorio, type TriagemSalva } from '@/storage/repositorio';

export type DadosCrianca = {
  triagens: TriagemSalva[];
  conclusoes: Conclusao[];
  diario: RegistroDiario[];
  /** ciclo de sessões atual (o mais recente), se a família começou um */
  ciclo: Ciclo | null;
  atividades: AtividadeCasa[];
};

/** Triagens, missões, Diário, ciclo e atividades de casa da criança, recarregados sempre que a tela ganha foco. */
export function useDadosCrianca(criancaId: string | undefined) {
  const [dados, setDados] = useState<DadosCrianca | null>(null);
  const [versao, setVersao] = useState(0);

  const carregar = useCallback(
    (ativo: () => boolean) => {
      if (!criancaId) return;
      Promise.all([
        repositorio.listarTriagens(criancaId),
        repositorio.listarConclusoes(criancaId),
        repositorio.listarDiario(criancaId),
        repositorio.listarCiclos(criancaId),
        repositorio.listarAtividades(criancaId),
      ])
        .then(([triagens, conclusoes, diario, ciclos, atividades]) => ativo() && setDados({ triagens, conclusoes, diario, ciclo: ciclos[0] ?? null, atividades }))
        .catch((e) => console.error('[dados] falha ao carregar', e));
    },
    [criancaId],
  );

  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      carregar(() => ativo);
      return () => {
        ativo = false;
      };
    }, [carregar]),
  );

  // recarga pedida pela própria tela depois de gravar (o foco não muda, então o useFocusEffect não roda)
  useEffect(() => {
    if (!versao) return;
    let ativo = true;
    carregar(() => ativo);
    return () => {
      ativo = false;
    };
  }, [versao, carregar]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return dados ? { ...dados, recarregar } : null;
}
