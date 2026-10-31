import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { bytesToHex, hexToBytes } from '@noble/ciphers/utils.js';

const NOME_CHAVE = 'conecta.chave.v1';

let emCache: Promise<Uint8Array> | null = null;

// No celular a chave fica no Keychain (iOS) / Keystore (Android) via SecureStore.
// Na web (só desenvolvimento) não existe cofre: guardamos no AsyncStorage.
async function lerGuardada(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(NOME_CHAVE);
  return SecureStore.getItemAsync(NOME_CHAVE);
}

async function guardar(hex: string): Promise<void> {
  if (Platform.OS === 'web') return AsyncStorage.setItem(NOME_CHAVE, hex);
  return SecureStore.setItemAsync(NOME_CHAVE, hex, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY });
}

/** Chave de 256 bits do aparelho, criada na primeira vez. Idempotente e com uma única geração mesmo com chamadas paralelas. */
export function chaveDoAparelho(): Promise<Uint8Array> {
  emCache ??= (async () => {
    const existente = await lerGuardada();
    if (existente) return hexToBytes(existente);
    const nova = getRandomBytes(32);
    await guardar(bytesToHex(nova));
    return nova;
  })().catch((e) => {
    emCache = null;
    throw e;
  });
  return emCache;
}

/** Usado ao apagar tudo: sem a chave, qualquer resto cifrado fica ilegível. */
export async function descartarChave(): Promise<void> {
  emCache = null;
  if (Platform.OS === 'web') await AsyncStorage.removeItem(NOME_CHAVE);
  else await SecureStore.deleteItemAsync(NOME_CHAVE);
}

export function novoNonce(): Uint8Array {
  return getRandomBytes(24);
}
