import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { bytesToHex, bytesToUtf8, concatBytes, hexToBytes, utf8ToBytes } from '@noble/ciphers/utils.js';

/** Prefixo dos valores cifrados; valores sem ele são do formato antigo (texto puro). */
export const PREFIXO = 'enc1:';
const TAM_NONCE = 24;

/**
 * XChaCha20-Poly1305: autentica e cifra. Nonce aleatório de 24 bytes por gravação
 * (seguro para gerar ao acaso), guardado junto do texto cifrado.
 */
export function cifrar(chave: Uint8Array, texto: string, nonce: Uint8Array): string {
  if (nonce.length !== TAM_NONCE) throw new Error('nonce precisa de 24 bytes');
  const cifrado = xchacha20poly1305(chave, nonce).encrypt(utf8ToBytes(texto));
  return PREFIXO + bytesToHex(concatBytes(nonce, cifrado));
}

/** Lança erro se o conteúdo foi alterado ou a chave é outra. */
export function decifrar(chave: Uint8Array, valor: string): string {
  if (!valor.startsWith(PREFIXO)) throw new Error('valor não está cifrado');
  const bytes = hexToBytes(valor.slice(PREFIXO.length));
  const nonce = bytes.subarray(0, TAM_NONCE);
  return bytesToUtf8(xchacha20poly1305(chave, nonce).decrypt(bytes.subarray(TAM_NONCE)));
}

export function estaCifrado(valor: string): boolean {
  return valor.startsWith(PREFIXO);
}
