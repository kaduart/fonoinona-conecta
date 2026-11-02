/** Animações Lottie do app (JSON vetorial feito para o Conecta, nas cores da marca). */
export const ARQUIVOS_LOTTIE = {
  /** anéis verdes que se expandem: "estamos preparando o resultado" */
  ondas: require('../../assets/lottie/ondas.json'),
  /** raios dourados girando devagar atrás da medalha */
  raios: require('../../assets/lottie/raios.json'),
  /** estrela que salta com brilhos: conquista */
  estrela: require('../../assets/lottie/estrela.json'),
} as const;

export type NomeLottie = keyof typeof ARQUIVOS_LOTTIE;
