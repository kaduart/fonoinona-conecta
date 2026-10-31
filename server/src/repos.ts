import type { Evento, NovoLead } from './esquemas.js';

export type Conteudo = { versao: string; publicadoEm: string; dados: unknown };
export type Lead = NovoLead & { criadoEm: string; vezes: number };

/** Acesso a dados. A API depende só desta interface: Mongo em produção, memória nos testes. */
export interface Repos {
  conteudo: {
    atual(): Promise<Conteudo | null>;
    publicar(c: Conteudo): Promise<void>;
  };
  eventos: {
    /** Idempotente pelo id do evento: reenviar o mesmo lote não duplica. */
    inserir(instalacaoId: string, versaoApp: string, eventos: Evento[]): Promise<{ novos: number; duplicados: number }>;
  };
  leads: {
    /** Idempotente pelo código: o mesmo código conta mais uma vez, mas não cria outro lead. */
    registrar(l: NovoLead): Promise<{ criado: boolean; lead: Lead }>;
    buscar(codigo: string): Promise<Lead | null>;
  };
  saudavel(): Promise<boolean>;
}

export function reposEmMemoria(): Repos {
  const conteudos: Conteudo[] = [];
  const eventos = new Map<string, Evento & { instalacaoId: string; versaoApp: string }>();
  const leads = new Map<string, Lead>();
  return {
    conteudo: {
      atual: async () => conteudos.at(-1) ?? null,
      publicar: async (c) => {
        const i = conteudos.findIndex((x) => x.versao === c.versao);
        if (i >= 0) conteudos.splice(i, 1);
        conteudos.push(c);
      },
    },
    eventos: {
      async inserir(instalacaoId, versaoApp, lista) {
        let novos = 0;
        for (const e of lista) {
          if (eventos.has(e.id)) continue;
          eventos.set(e.id, { ...e, instalacaoId, versaoApp });
          novos += 1;
        }
        return { novos, duplicados: lista.length - novos };
      },
    },
    leads: {
      async registrar(l) {
        const existente = leads.get(l.codigo);
        if (existente) {
          existente.vezes += 1;
          return { criado: false, lead: existente };
        }
        const lead = { ...l, criadoEm: new Date().toISOString(), vezes: 1 };
        leads.set(l.codigo, lead);
        return { criado: true, lead };
      },
      buscar: async (codigo) => leads.get(codigo) ?? null,
    },
    saudavel: async () => true,
  };
}
