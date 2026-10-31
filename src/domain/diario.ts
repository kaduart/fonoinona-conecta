import { ROTULO_AREA, type Area } from '@/content/perguntas';

// Diário Terapêutico: anotações dos pais sobre o dia da criança (casa, escola ou terapia).
// Fica só no aparelho, cifrado. Nada daqui vai para a API: o resumo sai pelo WhatsApp só quando o responsável envia.

export type ContextoDiario = 'casa' | 'escola' | 'terapia';
export type HumorDiario = 'bom' | 'normal' | 'dificil';

export type RegistroDiario = {
  id: string;
  criancaId: string;
  /** dia a que o registro se refere, yyyy-mm-dd (local) */
  data: string;
  contexto: ContextoDiario;
  humor: HumorDiario | null;
  areas: Area[];
  conquista: boolean;
  nota: string;
  /** quando o registro nasceu ao concluir uma missão */
  missaoId?: string;
  /** ISO */
  criadoEm: string;
  /** ISO */
  editadoEm: string;
};

export const NOTA_MAX = 500;
/** Até quantos dias para trás dá para anotar. */
export const DIAS_RETROATIVOS = 7;

export const ROTULO_CONTEXTO: Record<ContextoDiario, string> = { casa: 'Casa', escola: 'Escola', terapia: 'Terapia' };
export const EMOJI_CONTEXTO: Record<ContextoDiario, string> = { casa: '🏠', escola: '🏫', terapia: '🩺' };
export const EMOJI_HUMOR: Record<HumorDiario, string> = { bom: '🌞', normal: '⛅', dificil: '🌧️' };
export const ROTULO_HUMOR: Record<HumorDiario, string> = { bom: 'Bom dia', normal: 'Dia normal', dificil: 'Dia difícil' };

/** Áreas oferecidas como chips no Anotar (linguagem do dia a dia, sem termos clínicos). */
export const AREAS_DIARIO: Area[] = ['fala', 'compreensao', 'interacao', 'gestos', 'brincar', 'audicao', 'imitacao', 'alimentacao'];

const ROTULO_AREA_DIARIO: Partial<Record<Area, string>> = { interacao: 'Troca com as pessoas', audicao: 'Escuta' };
export function rotuloAreaDiario(a: Area): string {
  return ROTULO_AREA_DIARIO[a] ?? ROTULO_AREA[a];
}

export function dataLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function inicioDoDia(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Datas que o Anotar aceita: de hoje até DIAS_RETROATIVOS atrás (nunca no futuro). */
export function dataPermitida(data: string, hoje: Date): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return false;
  const [a, m, d] = data.split('-').map(Number);
  const alvo = new Date(a, m - 1, d);
  if (dataLocal(alvo) !== data) return false;
  const h = inicioDoDia(hoje);
  const limite = new Date(h.getFullYear(), h.getMonth(), h.getDate() - DIAS_RETROATIVOS);
  return alvo <= h && alvo >= limite;
}

export type ErroRegistro = 'data' | 'nota_longa' | 'vazio';

/**
 * Limpa e valida um registro antes de gravar. Um registro precisa de pelo menos
 * humor, área, nota ou ser conquista: só o contexto não diz nada.
 */
export function normalizarRegistro(r: RegistroDiario, hoje: Date): { ok: true; registro: RegistroDiario } | { ok: false; erro: ErroRegistro } {
  if (!dataPermitida(r.data, hoje)) return { ok: false, erro: 'data' };
  const nota = r.nota.trim();
  if (nota.length > NOTA_MAX) return { ok: false, erro: 'nota_longa' };
  const areas = [...new Set(r.areas)].filter((a) => a in ROTULO_AREA);
  if (!r.humor && !areas.length && !nota && !r.conquista) return { ok: false, erro: 'vazio' };
  return { ok: true, registro: { ...r, nota, areas } };
}

/** Mais recente primeiro: pela data do dia e, no mesmo dia, pela criação. */
export function ordenar(registros: RegistroDiario[]): RegistroDiario[] {
  return [...registros].sort((a, b) => b.data.localeCompare(a.data) || b.criadoEm.localeCompare(a.criadoEm));
}

export type FiltroDiario = 'todos' | ContextoDiario | 'conquistas';

export function filtrar(registros: RegistroDiario[], filtro: FiltroDiario): RegistroDiario[] {
  if (filtro === 'todos') return registros;
  if (filtro === 'conquistas') return registros.filter((r) => r.conquista);
  return registros.filter((r) => r.contexto === filtro);
}

/** Agrupa por dia para a linha do tempo, do dia mais recente para o mais antigo. */
export function agruparPorDia(registros: RegistroDiario[]): { data: string; registros: RegistroDiario[] }[] {
  const grupos = new Map<string, RegistroDiario[]>();
  for (const r of ordenar(registros)) grupos.set(r.data, [...(grupos.get(r.data) ?? []), r]);
  return [...grupos].map(([data, regs]) => ({ data, registros: regs }));
}

/**
 * Marcas de atividade para a sequência 🔥 e a meta da semana, no mesmo formato das conclusões de missão.
 * Meio-dia local: o dia não muda com o fuso ao converter para ISO.
 */
export function marcasDeAtividade(registros: RegistroDiario[]): { em: string }[] {
  return registros.map((r) => {
    const [a, m, d] = r.data.split('-').map(Number);
    return { em: new Date(a, m - 1, d, 12).toISOString() };
  });
}

/** Conjunto de dias (yyyy-mm-dd) com algum registro: alimenta a semana e a sequência 🔥. */
export function diasComRegistro(registros: RegistroDiario[]): Set<string> {
  return new Set(registros.map((r) => r.data));
}

export type ResumoDiario = {
  dias: number;
  diasAnotados: number;
  humor: Record<HumorDiario, number>;
  /** até 3 áreas mais marcadas, da mais para a menos */
  areasMaisMarcadas: Area[];
  conquistas: number;
  missoesFeitas: number;
};

/** Contagens neutras do período (últimos `dias`, incluindo hoje). Humor conta um por dia: o último registro do dia. */
export function resumir(registros: RegistroDiario[], dias: number, hoje: Date, missoesFeitas = 0): ResumoDiario {
  const h = inicioDoDia(hoje);
  const desde = dataLocal(new Date(h.getFullYear(), h.getMonth(), h.getDate() - (dias - 1)));
  const ate = dataLocal(h);
  const noPeriodo = ordenar(registros).filter((r) => r.data >= desde && r.data <= ate);

  const humorPorDia = new Map<string, HumorDiario>();
  const contaArea = new Map<Area, number>();
  for (const r of noPeriodo) {
    if (r.humor && !humorPorDia.has(r.data)) humorPorDia.set(r.data, r.humor);
    for (const a of r.areas) contaArea.set(a, (contaArea.get(a) ?? 0) + 1);
  }
  const humor: Record<HumorDiario, number> = { bom: 0, normal: 0, dificil: 0 };
  for (const v of humorPorDia.values()) humor[v] += 1;

  return {
    dias,
    diasAnotados: diasComRegistro(noPeriodo).size,
    humor,
    areasMaisMarcadas: [...contaArea]
      .sort((a, b) => b[1] - a[1] || AREAS_DIARIO.indexOf(a[0]) - AREAS_DIARIO.indexOf(b[0]))
      .slice(0, 3)
      .map(([a]) => a),
    conquistas: noPeriodo.filter((r) => r.conquista).length,
    missoesFeitas,
  };
}

function lista(itens: string[]): string {
  if (itens.length <= 1) return itens.join('');
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/**
 * Texto do resumo para a equipe. Neutro: só contagens, sem nome da criança e sem
 * interpretação. As notas escritas só entram se o responsável marcar.
 */
export function textoResumo(resumo: ResumoDiario, codigo: string, notas?: { data: string; nota: string }[]): string {
  const linhas = [`Olá, equipe Fono Inova! Sou responsável pela criança do código ${codigo}. Segue o resumo do Diário dos últimos ${resumo.dias} dias:`, ''];
  const { bom, normal, dificil } = resumo.humor;
  const partesHumor = [bom && `${bom} ${bom === 1 ? 'bom' : 'bons'}`, normal && `${normal} ${normal === 1 ? 'normal' : 'normais'}`, dificil && `${dificil} ${dificil === 1 ? 'difícil' : 'difíceis'}`].filter(Boolean) as string[];
  linhas.push(`• ${resumo.diasAnotados} ${resumo.diasAnotados === 1 ? 'dia anotado' : 'dias anotados'}${partesHumor.length ? ` (${partesHumor.join(', ')})` : ''}`);
  if (resumo.areasMaisMarcadas.length) linhas.push(`• Mais observado: ${lista(resumo.areasMaisMarcadas.map((a) => rotuloAreaDiario(a).toLowerCase()))}`);
  if (resumo.conquistas) linhas.push(`• ${resumo.conquistas} ${resumo.conquistas === 1 ? 'conquista registrada' : 'conquistas registradas'}`);
  if (resumo.missoesFeitas) linhas.push(`• ${resumo.missoesFeitas} ${resumo.missoesFeitas === 1 ? 'missão feita' : 'missões feitas'} em casa`);
  if (notas?.length) {
    linhas.push('', 'Minhas anotações:');
    for (const n of notas) if (n.nota.trim()) linhas.push(`${n.data.split('-').reverse().slice(0, 2).join('/')}: ${n.nota.trim()}`);
  }
  linhas.push('', 'Gostaria de conversar com a equipe.');
  return linhas.join('\n');
}

const DIA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "Hoje · sex, 31 out", "Ontem · qui, 30 out" ou "qua, 29 out". */
export function rotuloDia(data: string, hoje: Date): string {
  const [a, m, d] = data.split('-').map(Number);
  const dia = new Date(a, m - 1, d);
  const base = `${DIA_SEMANA[dia.getDay()]}, ${d} ${MES[m - 1]}`;
  const h = inicioDoDia(hoje);
  const diff = Math.round((h.getTime() - dia.getTime()) / 86_400_000);
  if (diff === 0) return `Hoje · ${base}`;
  if (diff === 1) return `Ontem · ${base}`;
  return base;
}

/** Datas que o Anotar oferece, de hoje para trás. */
export function datasParaAnotar(hoje: Date): string[] {
  const h = inicioDoDia(hoje);
  return Array.from({ length: DIAS_RETROATIVOS + 1 }, (_, i) => dataLocal(new Date(h.getFullYear(), h.getMonth(), h.getDate() - i)));
}

/** Texto para o responsável compartilhar uma conquista com a família. Sem nome da criança: quem envia escolhe. */
export function textoConquista(r: RegistroDiario): string {
  const nota = r.nota.trim();
  return `⭐ Conquista de hoje: ${nota || 'mais um passo no desenvolvimento!'}\n\nRegistrado no app FonoInova Conecta.`;
}
