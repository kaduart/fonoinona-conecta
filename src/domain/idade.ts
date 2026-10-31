const SEMANAS_TERMO = 40;
const LIMITE_PREMATURO = 37;
/** Até quando a idade corrigida é usada (meses). */
const CORRIGIR_ATE_MESES = 24;

/** Meses completos entre duas datas. */
export function mesesEntre(inicio: Date, fim: Date): number {
  let meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth());
  if (fim.getDate() < inicio.getDate()) meses -= 1;
  return meses;
}

/**
 * Idade em meses usada pela triagem. Para prematuros (< 37 semanas) até os 2 anos,
 * desconta as semanas que faltaram para o termo (idade corrigida).
 */
export function idadeParaTriagem(nascimento: Date, hoje: Date, semanasGestacao?: number | null): number {
  const cronologica = mesesEntre(nascimento, hoje);
  if (!semanasGestacao || semanasGestacao >= LIMITE_PREMATURO || cronologica >= CORRIGIR_ATE_MESES) {
    return cronologica;
  }
  const diasFaltando = (SEMANAS_TERMO - semanasGestacao) * 7;
  const corrigido = new Date(nascimento.getTime() + diasFaltando * 24 * 60 * 60 * 1000);
  return Math.max(0, mesesEntre(corrigido, hoje));
}

export function formatarIdade(meses: number): string {
  if (meses < 12) return meses === 1 ? '1 mês' : `${meses} meses`;
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  const a = anos === 1 ? '1 ano' : `${anos} anos`;
  if (resto === 0) return a;
  return `${a} e ${resto === 1 ? '1 mês' : `${resto} meses`}`;
}

/** Aceita "DD/MM/AAAA". Retorna null se inválida ou no futuro. */
export function lerData(texto: string, hoje: Date = new Date()): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!m) return null;
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(ano, mes - 1, dia);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  if (d.getTime() > hoje.getTime()) return null;
  return d;
}

/** Máscara simples DD/MM/AAAA enquanto digita. */
export function mascararData(texto: string): string {
  const n = texto.replace(/\D/g, '').slice(0, 8);
  if (n.length <= 2) return n;
  if (n.length <= 4) return `${n.slice(0, 2)}/${n.slice(2)}`;
  return `${n.slice(0, 2)}/${n.slice(2, 4)}/${n.slice(4)}`;
}

/** Data de nascimento guardada como ISO yyyy-mm-dd, lida no fuso local. */
export function lerIso(iso: string): Date {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, m - 1, d);
}

/** Idade da triagem (corrigida quando for o caso) de uma criança cadastrada. */
export function idadeDe(c: { nascimento: string; semanasGestacao: number | null }, hoje: Date = new Date()): number {
  return idadeParaTriagem(lerIso(c.nascimento), hoje, c.semanasGestacao);
}
