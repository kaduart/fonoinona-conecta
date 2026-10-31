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
