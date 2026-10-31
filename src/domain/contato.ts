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

const MENSAGEM: Record<NivelResultado, string> = {
  esperado: 'Olá, equipe Fono Inova! Fiz a triagem no app FonoInova Conecta e queria dicas para continuar estimulando meu filho(a) de {idade}. Código: {codigo}',
  observar: 'Olá, equipe Fono Inova! Fiz a triagem no app FonoInova Conecta para meu filho(a) de {idade} e gostaria de uma orientação sobre alguns pontos. Código: {codigo}',
  avaliar: 'Olá, equipe Fono Inova! Fiz a triagem no app FonoInova Conecta para meu filho(a) de {idade} e gostaria de agendar uma avaliação. Código: {codigo}',
};

/** Link wa.me com a mensagem pronta. Sem número configurado, o WhatsApp pede para escolher o contato. */
export function linkWhatsApp(nivel: NivelResultado, idade: string, codigo: string, numero = process.env.EXPO_PUBLIC_WHATSAPP_CLINICA ?? ''): string {
  const texto = MENSAGEM[nivel].replace('{idade}', idade).replace('{codigo}', codigo);
  const destino = numero.replace(/\D/g, '');
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto)}`;
}

const MENSAGEM_GERAL = 'Olá, equipe Fono Inova! Vim pelo app FonoInova Conecta e gostaria de tirar uma dúvida.';
const MENSAGEM_MISSOES = 'Olá, equipe Fono Inova! Estou fazendo as missões do app FonoInova Conecta com meu filho(a) de {idade} e algumas estão difíceis. Gostaria de uma orientação.';

/** Contato sem triagem: dúvida geral ou dificuldade nas missões. Também sem dados de saúde. */
export function linkWhatsAppGeral(motivo: 'geral' | 'missoes' = 'geral', idade = '', numero = process.env.EXPO_PUBLIC_WHATSAPP_CLINICA ?? ''): string {
  const texto = motivo === 'missoes' ? MENSAGEM_MISSOES.replace('{idade}', idade) : MENSAGEM_GERAL;
  return `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;
}
