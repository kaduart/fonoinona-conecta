import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Conclusao } from '@/domain/missoes';
import type { Resposta, Resultado } from '@/domain/triagem';

// Sprint 1: tudo fica no aparelho via AsyncStorage.
// TODO(sprint 3): migrar respostas para armazenamento criptografado (expo-sqlite + expo-secure-store).

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
} as const;

async function ler<T>(chave: string, padrao: T): Promise<T> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch (e) {
    console.warn(`[repositorio] falha ao ler ${chave}`, e);
    return padrao;
  }
}

async function gravar<T>(chave: string, valor: T): Promise<void> {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
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

  /** Remove uma criança e tudo dela (triagens e missões). */
  async removerCrianca(id: string) {
    const [criancas, triagens, conclusoes] = await Promise.all([
      repositorio.listarCriancas(),
      ler<TriagemSalva[]>(CHAVES.triagens, []),
      ler<Conclusao[]>(CHAVES.conclusoes, []),
    ]);
    await Promise.all([
      gravar(CHAVES.criancas, criancas.filter((c) => c.id !== id)),
      gravar(CHAVES.triagens, triagens.filter((t) => t.criancaId !== id)),
      gravar(CHAVES.conclusoes, conclusoes.filter((c) => c.criancaId !== id)),
    ]);
  },

  /** Direito de exclusão (LGPD): apaga tudo do aparelho. */
  async apagarTudo() {
    await AsyncStorage.multiRemove(Object.values(CHAVES));
  },
};
