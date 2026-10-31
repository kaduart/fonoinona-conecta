import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import type { RegistroDiario } from '@/domain/diario';
import type { Conclusao } from '@/domain/missoes';
import { repositorio, type TriagemSalva } from '@/storage/repositorio';

/** Triagens, missões e Diário da criança, recarregadas sempre que a tela ganha foco. */
export function useDadosCrianca(criancaId: string | undefined) {
  const [dados, setDados] = useState<{ triagens: TriagemSalva[]; conclusoes: Conclusao[]; diario: RegistroDiario[] } | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!criancaId) return;
      let ativo = true;
      Promise.all([repositorio.listarTriagens(criancaId), repositorio.listarConclusoes(criancaId), repositorio.listarDiario(criancaId)])
        .then(([triagens, conclusoes, diario]) => ativo && setDados({ triagens, conclusoes, diario }))
        .catch((e) => console.error('[dados] falha ao carregar', e));
      return () => {
        ativo = false;
      };
    }, [criancaId]),
  );

  return dados;
}
