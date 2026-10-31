// Monta o pacote de conteúdo a partir dos mesmos arquivos que o app usa (fonte única da verdade).
import { MISSOES, VERSAO_MISSOES } from '../../src/content/missoes.ts';
import { ALERTAS, FAIXAS, ROTULO_AREA, VERSAO_CONTEUDO } from '../../src/content/perguntas.ts';
import { AVISO_PEDIATRA, AVISO_RESULTADO, RESPONSAVEL_TECNICA, TEXTOS_RESULTADO } from '../../src/content/resultados.ts';

export function montarConteudo() {
  return {
    versao: `${VERSAO_CONTEUDO}+${VERSAO_MISSOES}`,
    publicadoEm: new Date().toISOString(),
    dados: { faixas: FAIXAS, alertas: ALERTAS, rotuloArea: ROTULO_AREA, missoes: MISSOES, textosResultado: TEXTOS_RESULTADO, avisoResultado: AVISO_RESULTADO, avisoPediatra: AVISO_PEDIATRA, responsavelTecnica: RESPONSAVEL_TECNICA },
  };
}
