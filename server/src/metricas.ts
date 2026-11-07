// Métricas de instalação e uso do app, calculadas a partir dos eventos anônimos.
// Função pura: o repositório (Mongo ou memória) entrega o resumo bruto e aqui vira o relatório da equipe.

export const FUSO = 'America/Sao_Paulo';

/** Uma linha por instalação (aparelho/navegador que aceitou o termo). */
export type ResumoInstalacao = {
  instalacaoId: string;
  primeiroEm: Date;
  ultimoEm: Date;
  /** quando virou app instalado (evento appinstalled ou primeira abertura em modo instalado) */
  instaladoEm: Date | null;
  plataforma: string | null;
};

export type ResumoEventos = {
  instalacoes: ResumoInstalacao[];
  /** instalações distintas com algum evento em cada dia (fuso de Brasília), a partir de `desde` */
  ativosPorDia: { dia: string; ativos: number }[];
  /** total de eventos por tipo a partir de `desde` */
  porTipo: { tipo: string; total: number }[];
  /** quantas instalações distintas o navegador convidou a instalar, a partir de `desde` */
  convidadas: number;
};

const DIA_MS = 86_400_000;

/** Data YYYY-MM-DD no fuso da clínica. */
export function diaLocal(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

function contarPor<T>(lista: T[], chave: (x: T) => string): Record<string, number> {
  const r: Record<string, number> = {};
  for (const x of lista) r[chave(x)] = (r[chave(x)] ?? 0) + 1;
  return r;
}

export function montarMetricas(resumo: ResumoEventos, dias: number, agora = new Date()) {
  const desde = new Date(agora.getTime() - dias * DIA_MS);
  const ins = resumo.instalacoes;
  const instaladas = ins.filter((i) => i.instaladoEm);
  const ativasDesde = (n: number) => ins.filter((i) => i.ultimoEm.getTime() >= agora.getTime() - n * DIA_MS).length;

  const novosPorDia = contarPor(ins.filter((i) => i.primeiroEm >= desde), (i) => diaLocal(i.primeiroEm));
  const instalPorDia = contarPor(instaladas.filter((i) => i.instaladoEm! >= desde), (i) => diaLocal(i.instaladoEm!));
  const ativosPorDia = Object.fromEntries(resumo.ativosPorDia.map((d) => [d.dia, d.ativos]));

  // série contínua (dias sem uso aparecem com zero), do mais antigo ao de hoje
  const serie = [];
  for (let i = dias - 1; i >= 0; i--) {
    const dia = diaLocal(new Date(agora.getTime() - i * DIA_MS));
    serie.push({ dia, novos: novosPorDia[dia] ?? 0, instalacoes: instalPorDia[dia] ?? 0, ativos: ativosPorDia[dia] ?? 0 });
  }
  const eventos = Object.fromEntries(resumo.porTipo.map((t) => [t.tipo, t.total]));

  return {
    geradoEm: agora.toISOString(),
    fuso: FUSO,
    periodoDias: dias,
    totais: {
      /** aparelhos que abriram o app e aceitaram o termo (PWA no navegador ou instalado) */
      usuarios: ins.length,
      /** desses, quantos instalaram na tela inicial */
      instalados: instaladas.length,
      /** quantos o navegador convidou a instalar no período (só Chrome/Android avisa) */
      convidadosAInstalar: resumo.convidadas,
      porPlataforma: contarPor(ins, (i) => i.plataforma ?? 'desconhecida'),
    },
    periodo: {
      novosUsuarios: ins.filter((i) => i.primeiroEm >= desde).length,
      novasInstalacoes: instaladas.filter((i) => i.instaladoEm! >= desde).length,
    },
    ativos: { hoje: ativosPorDia[diaLocal(agora)] ?? 0, ultimos7dias: ativasDesde(7), ultimos30dias: ativasDesde(30) },
    uso: {
      aberturas: eventos.app_aberto ?? 0,
      triagens: eventos.triagem_concluida ?? 0,
      missoes: eventos.missao_concluida ?? 0,
      diario: eventos.diario_registro ?? 0,
      whatsapp: eventos.whatsapp_aberto ?? 0,
      kitInteresse: eventos.kit_interesse ?? 0,
      indicacoes: eventos.app_indicado ?? 0,
    },
    porDia: serie,
  };
}
export type Metricas = ReturnType<typeof montarMetricas>;
