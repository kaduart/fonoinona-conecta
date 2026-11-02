import type { AtividadeCasa, Ciclo } from '@/domain/casa';
import type { RegistroDiario } from '@/domain/diario';
import type { Conclusao } from '@/domain/missoes';
import type { Crianca, TriagemSalva } from '@/storage/repositorio';

// Cópia dos dados do app (troca de celular e portabilidade da LGPD).
// Arquivo JSON legível, gerado só quando o responsável pede, e que só sai do celular pelas mãos dele.

export const FORMATO_BACKUP = 'fonoinova-conecta-backup';
export const VERSAO_BACKUP = 1;

export type Backup = {
  formato: typeof FORMATO_BACKUP;
  versao: number;
  exportadoEm: string;
  criancas: Crianca[];
  triagens: TriagemSalva[];
  conclusoes: Conclusao[];
  diario: RegistroDiario[];
  /** opcionais: cópias antigas não têm */
  ciclos?: Ciclo[];
  atividades?: AtividadeCasa[];
};

export type ConteudoBackup = Omit<Backup, 'formato' | 'versao' | 'exportadoEm'>;

export function montarBackup(c: ConteudoBackup, agora: Date = new Date()): Backup {
  return { formato: FORMATO_BACKUP, versao: VERSAO_BACKUP, exportadoEm: agora.toISOString(), ...c };
}

export function nomeArquivoBackup(agora: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `conecta-copia-${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}.json`;
}

const ehTexto = (v: unknown): v is string => typeof v === 'string' && v.length > 0;
const ehLista = (v: unknown): v is unknown[] => Array.isArray(v);
const comId = (x: unknown) => !!x && typeof x === 'object' && ehTexto((x as { id?: unknown }).id);
const comCrianca = (x: unknown) => comId(x) && ehTexto((x as { criancaId?: unknown }).criancaId);

export type ErroBackup = 'json' | 'formato' | 'versao' | 'conteudo';

/** Lê e confere um arquivo de cópia. Recusa o que não for do app ou estiver incompleto, sem gravar nada. */
export function lerBackup(texto: string): { ok: true; backup: Backup } | { ok: false; erro: ErroBackup } {
  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return { ok: false, erro: 'json' };
  }
  const b = bruto as Partial<Backup>;
  if (!b || typeof b !== 'object' || b.formato !== FORMATO_BACKUP) return { ok: false, erro: 'formato' };
  if (typeof b.versao !== 'number' || b.versao > VERSAO_BACKUP) return { ok: false, erro: 'versao' };
  const listas = [b.criancas, b.triagens, b.conclusoes, b.diario];
  if (!listas.every(ehLista)) return { ok: false, erro: 'conteudo' };
  const criancasOk = (b.criancas as unknown[]).every((c) => comId(c) && ehTexto((c as Crianca).apelido) && ehTexto((c as Crianca).nascimento));
  const extras = [b.ciclos, b.atividades].filter((l) => l !== undefined);
  if (!extras.every(ehLista)) return { ok: false, erro: 'conteudo' };
  const filhosOk = [b.triagens, b.conclusoes, b.diario, ...extras].every((l) => (l as unknown[]).every(comCrianca));
  if (!criancasOk || !filhosOk) return { ok: false, erro: 'conteudo' };
  return { ok: true, backup: b as Backup };
}

/** Junta a cópia ao que já existe, pelo id: o que já está no celular fica como está (restaurar duas vezes não duplica). */
export function mesclar<T extends { id: string }>(atual: T[], vindo: T[]): T[] {
  const ids = new Set(atual.map((x) => x.id));
  return [...atual, ...vindo.filter((x) => !ids.has(x.id))];
}

export function contarBackup(b: ConteudoBackup) {
  return { criancas: b.criancas.length, triagens: b.triagens.length, missoes: b.conclusoes.length, diario: b.diario.length };
}
