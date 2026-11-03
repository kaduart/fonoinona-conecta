import { apiAtiva, chamar } from '@/api/cliente';

// Vínculo com a clínica (camada 2 da evolução lúdica): PREPARADO E DESLIGADO.
// Só liga com EXPO_PUBLIC_VINCULO_CLINICA=1 no build, depois do parecer jurídico (dado de saúde da criança).
// Desligado, toda função devolve null/false sem rede, e o app segue com o ciclo e as atividades que a família informa.
//
// Contrato combinado (API do Conecta, que fala com o sistema da clínica por chave de serviço; o app nunca fala com ele direto):
//   POST /v1/vinculo                { codigo: '123456' }          → { vinculoId, token, crianca: { primeiroNome } }
//   GET  /v1/vinculo/:id/ciclo      Authorization: Bearer <token> → CicloRemoto
//   POST /v1/vinculo/:id/adesao     { atividadeId, data }         → 204 (idempotente por atividadeId + data)

export const vinculoAtivo = () => process.env.EXPO_PUBLIC_VINCULO_CLINICA === '1' && apiAtiva();

export type Vinculo = { vinculoId: string; token: string; crianca: { primeiroNome: string } };

export type DiaSemana = 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado';
export type Periodo = 'manha' | 'tarde';

export type CicloRemoto = {
  feitas: number;
  total: number;
  estagio: 'andando' | 'quase' | 'completo';
  /** só dia e período, nunca horário exato */
  proximaSessao: { dia: DiaSemana; periodo: Periodo } | null;
  atividadesCasa: { id: string; titulo: string; vezesSemana: number }[];
};

/** Código que a recepção gera: 6 dígitos, vale 24 h. */
export function codigoValido(codigo: string): boolean {
  return /^\d{6}$/.test(codigo.trim());
}

const auth = (v: Vinculo) => ({ Authorization: `Bearer ${v.token}` });

/** Troca o código da recepção por um vínculo. null quando desligado, código inválido ou recusado. */
export async function vincular(codigo: string): Promise<Vinculo | null> {
  if (!vinculoAtivo() || !codigoValido(codigo)) return null;
  try {
    const r = await chamar('/v1/vinculo', { method: 'POST', body: JSON.stringify({ codigo: codigo.trim() }) });
    return r.ok ? ((await r.json()) as Vinculo) : null;
  } catch (e) {
    console.warn('[vinculo] vincular falhou', String(e));
    return null;
  }
}

/** Ciclo real vindo da clínica. null quando desligado ou sem resposta (a tela usa o ciclo local). */
export async function lerCicloRemoto(v: Vinculo): Promise<CicloRemoto | null> {
  if (!vinculoAtivo()) return null;
  try {
    const r = await chamar(`/v1/vinculo/${encodeURIComponent(v.vinculoId)}/ciclo`, { headers: auth(v) });
    return r.ok ? ((await r.json()) as CicloRemoto) : null;
  } catch (e) {
    console.warn('[vinculo] ciclo falhou', String(e));
    return null;
  }
}

/** Avisa a terapeuta que a atividade foi feita (só o "Fizemos!", sem nota nem humor). Só com autorização da família. */
export async function enviarAdesao(v: Vinculo, atividadeId: string, data: string): Promise<boolean> {
  if (!vinculoAtivo()) return false;
  try {
    const r = await chamar(`/v1/vinculo/${encodeURIComponent(v.vinculoId)}/adesao`, {
      method: 'POST',
      headers: auth(v),
      body: JSON.stringify({ atividadeId, data }),
    });
    return r.ok;
  } catch (e) {
    console.warn('[vinculo] adesão falhou', String(e));
    return false;
  }
}
