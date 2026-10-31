import type { NivelResultado } from '@/domain/triagem';

/** Código curto que identifica o contato sem expor dado de saúde. Determinístico pelo id da triagem (idempotente). */
export function codigoContato(triagemId: string): string {
  let h = 0;
  for (const ch of triagemId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 4; i++) {
    s += alfabeto[h % alfabeto.length];
    h = Math.floor(h / alfabeto.length);
  }
  return `CONECTA-${s}`;
}

/** WhatsApp da clínica. Vale quando EXPO_PUBLIC_WHATSAPP_CLINICA não está definido no build. */
export const WHATSAPP_CLINICA_PADRAO = '5562992013573';
const numeroClinica = () => process.env.EXPO_PUBLIC_WHATSAPP_CLINICA || WHATSAPP_CLINICA_PADRAO;

const MENSAGEM: Record<NivelResultado, string> = {
  esperado: 'Olá, equipe Fono Inova! Fiz a triagem no app FonoInova Conecta para meu filho(a) de {idade} e gostaria de agendar uma avaliação para acompanhar o desenvolvimento. Código: {codigo}',
  observar: 'Olá, equipe Fono Inova! Fiz a triagem no app FonoInova Conecta para meu filho(a) de {idade} e gostaria de agendar uma avaliação. Código: {codigo}',
  avaliar: 'Olá, equipe Fono Inova! Fiz a triagem no app FonoInova Conecta para meu filho(a) de {idade} e gostaria de agendar uma avaliação. Código: {codigo}',
};

/**
 * Resumo neutro da triagem, que só entra na mensagem se os pais marcarem a opção.
 * Nunca usa "atraso", "laudo" ou diagnóstico: só as habilidades ainda em desenvolvimento.
 */
export function resumoTriagem(areasEmDesenvolvimento: string[], noEsperado: number, total: number): string {
  const contagem = `${noEsperado} de ${total} habilidades no esperado`;
  if (!areasEmDesenvolvimento.length) return `Resumo da triagem: ${contagem}.`;
  const lista = areasEmDesenvolvimento.map((a) => a.toLowerCase());
  const juntas = lista.length === 1 ? lista[0] : `${lista.slice(0, -1).join(', ')} e ${lista[lista.length - 1]}`;
  return `Resumo da triagem: ${contagem}. Ainda em desenvolvimento: ${juntas}.`;
}

/** Link wa.me com a mensagem pronta. Usa o número da clínica. O resumo é opcional (escolha dos pais). */
export function linkWhatsApp(nivel: NivelResultado, idade: string, codigo: string, numero = numeroClinica(), resumo?: string): string {
  const base = MENSAGEM[nivel].replace('{idade}', idade).replace('{codigo}', codigo);
  const texto = resumo ? `${base}\n\n${resumo}` : base;
  const destino = numero.replace(/\D/g, '');
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
}

const MENSAGEM_GERAL = 'Olá, equipe Fono Inova! Vim pelo app FonoInova Conecta e gostaria de tirar uma dúvida.';
const MENSAGEM_MISSOES = 'Olá, equipe Fono Inova! Estou fazendo as missões do app FonoInova Conecta com meu filho(a) de {idade} e algumas estão difíceis. Gostaria de uma orientação.';

/** Contato sem triagem: dúvida geral ou dificuldade nas missões. Também sem dados de saúde. */
export function linkWhatsAppGeral(motivo: 'geral' | 'missoes' = 'geral', idade = '', numero = numeroClinica()): string {
  const texto = motivo === 'missoes' ? MENSAGEM_MISSOES.replace('{idade}', idade) : MENSAGEM_GERAL;
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
}
