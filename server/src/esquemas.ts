import { z } from 'zod';

// Contrato da API. Nenhum campo aceita dado de saúde (respostas, resultado) nem dado pessoal (nome, nascimento, telefone).

const Id = z.string().regex(/^[a-z0-9-]{6,40}$/i, 'id inválido');
const FaixaId = z.enum(['f0-5m', 'f6-11m', 'f12-17m', 'f18-23m', 'f2a', 'f3a', 'f4a', 'f5a']);
const OrigemContato = z.enum(['resultado', 'missoes', 'geral']);

export const Evento = z.discriminatedUnion('tipo', [
  z.object({ id: Id, em: z.iso.datetime(), tipo: z.literal('app_aberto') }),
  z.object({ id: Id, em: z.iso.datetime(), tipo: z.literal('triagem_concluida'), faixaId: FaixaId }),
  z.object({
    id: Id,
    em: z.iso.datetime(),
    tipo: z.literal('missao_concluida'),
    missaoId: z.string().regex(/^m\d{2}-[a-z0-9-]+$/),
    como: z.enum(['facil', 'com_ajuda', 'dificil']),
  }),
  z.object({ id: Id, em: z.iso.datetime(), tipo: z.literal('whatsapp_aberto'), origem: OrigemContato }),
]);
export type Evento = z.infer<typeof Evento>;

export const LoteEventos = z.object({
  instalacaoId: Id,
  versaoApp: z.string().max(20),
  eventos: z.array(Evento).min(1).max(50),
});
export type LoteEventos = z.infer<typeof LoteEventos>;

export const NovoLead = z.object({
  codigo: z.string().regex(/^CONECTA-[A-HJ-NP-Z2-9]{4}$/, 'código inválido'),
  origem: OrigemContato,
  faixaId: FaixaId.optional(),
});
export type NovoLead = z.infer<typeof NovoLead>;

// --- Pré-cadastro (lista de espera do site). ÚNICO contrato que recebe dado de contato,
// com consentimento explícito. Fica separado da telemetria do app, que segue sem PII. ---
export const FaixaPreCadastro = z.enum(['gravidez', '0-12m', '1a', '2a', '3a', '4a', '5-6a']);

export const PreCadastro = z.object({
  nome: z.string().trim().min(2, 'nome muito curto').max(80),
  // só dígitos; aceita DDD (10-11) com DDI opcional (até 13)
  whatsapp: z.string().transform((v) => v.replace(/\D/g, '')).pipe(z.string().regex(/^\d{10,13}$/, 'whatsapp inválido')),
  faixa: FaixaPreCadastro,
  // o consentimento LGPD tem de ser marcado
  consentimento: z.literal(true, { message: 'consentimento obrigatório' }),
  origem: z.string().trim().max(40).optional(),
});
export type PreCadastro = z.infer<typeof PreCadastro>;
