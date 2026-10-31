import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { Conclusao } from '@/domain/missoes';
import { repositorio, type TriagemSalva } from '@/storage/repositorio';

/** Triagens e missões da criança, recarregadas sempre que a tela ganha foco. */
export function useDadosCrianca(criancaId: string | undefined) {
  const [dados, setDados] = useState<{ triagens: TriagemSalva[]; conclusoes: Conclusao[] } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!criancaId) return;
      let ativo = true;
      Promise.all([repositorio.listarTriagens(criancaId), repositorio.listarConclusoes(criancaId)])
        .then(([triagens, conclusoes]) => ativo && setDados({ triagens, conclusoes }))
        .catch((e) => console.error('[dados] falha ao carregar', e));
      return () => {
        ativo = false;
      };
    }, [criancaId]),
  );

  return dados;
}
