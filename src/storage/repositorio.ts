import AsyncStorage from '@react-native-async-storage/async-storage';

import { FILA_VAZIA, type Fila } from '@/api/fila';
import type { RegistroDiario } from '@/domain/diario';
import type { Conclusao } from '@/domain/missoes';
import { chaveDoAparelho, descartarChave, novoNonce } from '@/storage/chave';
import { cifrar, decifrar, estaCifrado } from '@/storage/cifra';
import type { Resposta, Resultado } from '@/domain/triagem';

// Tudo fica no aparelho, no AsyncStorage, cifrado com XChaCha20-Poly1305.
// A chave fica no Keychain/Keystore (expo-secure-store). Dados antigos em texto puro são cifrados na primeira leitura.

export type Crianca = {
  id: string;
  apelido: string;
  /** ISO yyyy-mm-dd */
  nascimento: string;
  /** só quando nasceu antes de 37 semanas */
  semanasGestacao: number | null;
  criadaEm: string;
};

export type Consentimento = { versaoTermo: string; aceitoEm: string };

export type TriagemSalva = {
  id: string;
  criancaId: string;
  versaoConteudo: string;
  faixaId: string;
  idadeMeses: number;
  respostas: Record<string, Resposta>;
  alertas: Record<string, boolean>;
  resultado: Resultado;
  criadaEm: string;
};

const CHAVES = {
  criancas: 'conecta:criancas:v1',
  consentimento: 'conecta:consentimento:v1',
  triagens: 'conecta:triagens:v1',
  conclusoes: 'conecta:conclusoes:v1',
  atual: 'conecta:crianca-atual:v1',
  instalacao: 'conecta:instalacao:v1',
  fila: 'conecta:fila-eventos:v1',
  conteudo: 'conecta:conteudo-remoto:v1',
  diario: 'conecta:diario:v1',
  kitInteresse: 'conecta:kit-interesse:v1',
} as const;

export type ConteudoRemoto = { versao: string; publicadoEm: string; dados: unknown };

async function ler<T>(chave: string, padrao: T): Promise<T> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    if (!bruto) return padrao;
    if (estaCifrado(bruto)) return JSON.parse(decifrar(await chaveDoAparelho(), bruto)) as T;
    // formato antigo (Sprint 1): migra para cifrado
    const valor = JSON.parse(bruto) as T;
    await gravar(chave, valor);
    return valor;
  } catch (e) {
    console.warn(`[repositorio] falha ao ler ${chave}`, e);
    return padrao;
  }
}

async function gravar<T>(chave: string, valor: T): Promise<void> {
  await AsyncStorage.setItem(chave, cifrar(await chaveDoAparelho(), JSON.stringify(valor), novoNonce()));
}

export function novoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const repositorio = {
  listarCriancas: () => ler<Crianca[]>(CHAVES.criancas, []),

  async salvarCrianca(c: Crianca) {
    const lista = await repositorio.listarCriancas();
    const outras = lista.filter((x) => x.id !== c.id);
    await gravar(CHAVES.criancas, [...outras, c]);
  },

  lerConsentimento: () => ler<Consentimento | null>(CHAVES.consentimento, null),
  salvarConsentimento: (c: Consentimento) => gravar(CHAVES.consentimento, c),

  listarTriagens: async (criancaId?: string) => {
    const todas = await ler<TriagemSalva[]>(CHAVES.triagens, []);
    return (criancaId ? todas.filter((t) => t.criancaId === criancaId) : todas).sort((a, b) => b.criadaEm.localeCompare(a.criadaEm));
  },

  async salvarTriagem(t: TriagemSalva) {
    const todas = await ler<TriagemSalva[]>(CHAVES.triagens, []);
    // idempotente pelo id
    await gravar(CHAVES.triagens, [...todas.filter((x) => x.id !== t.id), t]);
  },

  async lerTriagem(id: string) {
    const todas = await ler<TriagemSalva[]>(CHAVES.triagens, []);
    return todas.find((t) => t.id === id) ?? null;
  },

  lerAtual: () => ler<string | null>(CHAVES.atual, null),
  salvarAtual: (id: string) => gravar(CHAVES.atual, id),

  listarConclusoes: async (criancaId: string) => {
    const todas = await ler<Conclusao[]>(CHAVES.conclusoes, []);
    return todas.filter((c) => c.criancaId === criancaId).sort((a, b) => b.em.localeCompare(a.em));
  },

  async salvarConclusao(c: Conclusao) {
    const todas = await ler<Conclusao[]>(CHAVES.conclusoes, []);
    // idempotente pelo id
    await gravar(CHAVES.conclusoes, [...todas.filter((x) => x.id !== c.id), c]);
  },

  listarDiario: async (criancaId: string) => {
    const todos = await ler<RegistroDiario[]>(CHAVES.diario, []);
    return todos.filter((r) => r.criancaId === criancaId).sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm));
  },

  /** Cria ou edita (idempotente pelo id). Validar antes com normalizarRegistro. */
  async salvarRegistroDiario(r: RegistroDiario) {
    const todos = await ler<RegistroDiario[]>(CHAVES.diario, []);
    await gravar(CHAVES.diario, [...todos.filter((x) => x.id !== r.id), r]);
  },

  async removerRegistroDiario(id: string) {
    const todos = await ler<RegistroDiario[]>(CHAVES.diario, []);
    await gravar(CHAVES.diario, todos.filter((x) => x.id !== id));
  },

  /** Fases em que a família pediu aviso do kit (lista de espera local; a contagem anônima vai pela telemetria). */
  listarKitInteresse: () => ler<number[]>(CHAVES.kitInteresse, []),

  async marcarKitInteresse(fase: number) {
    const atual = await repositorio.listarKitInteresse();
    if (!atual.includes(fase)) await gravar(CHAVES.kitInteresse, [...atual, fase]);
  },

  /** Id aleatório desta instalação, sem ligação com a família. Criado na primeira vez. */
  async instalacaoId() {
    const id = await ler<string | null>(CHAVES.instalacao, null);
    if (id) return id;
    const novo = `inst-${novoId()}`;
    await gravar(CHAVES.instalacao, novo);
    return novo;
  },

  lerFila: () => ler<Fila>(CHAVES.fila, FILA_VAZIA),
  salvarFila: (f: Fila) => gravar(CHAVES.fila, f),

  lerConteudoRemoto: () => ler<ConteudoRemoto | null>(CHAVES.conteudo, null),
  salvarConteudoRemoto: (c: ConteudoRemoto) => gravar(CHAVES.conteudo, c),

  /** Remove uma criança e tudo dela (triagens, missões e Diário). */
  async removerCrianca(id: string) {
    const [criancas, triagens, conclusoes, diario] = await Promise.all([
      repositorio.listarCriancas(),
      ler<TriagemSalva[]>(CHAVES.triagens, []),
      ler<Conclusao[]>(CHAVES.conclusoes, []),
      ler<RegistroDiario[]>(CHAVES.diario, []),
    ]);
    await Promise.all([
      gravar(CHAVES.criancas, criancas.filter((c) => c.id !== id)),
      gravar(CHAVES.triagens, triagens.filter((t) => t.criancaId !== id)),
      gravar(CHAVES.conclusoes, conclusoes.filter((c) => c.criancaId !== id)),
      gravar(CHAVES.diario, diario.filter((r) => r.criancaId !== id)),
    ]);
  },

  /** Direito de exclusão (LGPD): apaga tudo do aparelho. */
  async apagarTudo() {
    await AsyncStorage.multiRemove(Object.values(CHAVES));
    await descartarChave();
  },
};
