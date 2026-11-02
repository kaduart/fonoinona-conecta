import type { RegistroDiario } from '@/domain/diario';
import { agruparPorMes, dataDaMedalha, montarLinhaDoTempo, textoLinhaDoTempo } from '@/domain/linhaDoTempo';
import { fasesDaTrilha, missoesParaIdade, montarTrilha, type Conclusao } from '@/domain/missoes';

let seq = 0;
const feita = (missaoId: string, em: string): Conclusao => ({ id: `c${++seq}`, criancaId: 'k1', missaoId, como: 'facil', em });
const registro = (data: string, conquista: boolean, nota = ''): RegistroDiario =>
  ({ id: `r${++seq}`, criancaId: 'k1', data, contexto: 'casa', humor: 'bom', areas: [], conquista, nota, criadoEm: `${data}T20:00:00`, editadoEm: `${data}T20:00:00` });

const missoes = missoesParaIdade(30);
const fase1 = missoes.slice(0, 4).map((m) => m.id);

describe('linha do tempo de conquistas', () => {
  it('medalha leva a data da última missão da fase (primeira vez que cada uma foi feita)', () => {
    const conclusoes = [feita(fase1[0], '2026-10-01T10:00:00'), feita(fase1[1], '2026-10-03T10:00:00'), feita(fase1[2], '2026-10-05T10:00:00'), feita(fase1[3], '2026-10-09T10:00:00'), feita(fase1[0], '2026-10-20T10:00:00')];
    const fases = fasesDaTrilha(montarTrilha(missoes, conclusoes));
    expect(dataDaMedalha(fases[0], conclusoes)).toBe('2026-10-09T10:00:00');
    expect(dataDaMedalha(fases[1], conclusoes)).toBeNull();
  });

  it('junta conquistas do Diário, medalhas e a primeira missão, do mais novo ao mais antigo', () => {
    const conclusoes = fase1.map((id, i) => feita(id, `2026-10-0${i + 1}T10:00:00`));
    const fases = fasesDaTrilha(montarTrilha(missoes, conclusoes));
    const diario = [registro('2026-11-01', true, 'Falou "água"'), registro('2026-10-15', false, 'dia comum')];
    const marcos = montarLinhaDoTempo(diario, conclusoes, fases);
    expect(marcos.map((m) => m.tipo)).toEqual(['conquista', 'medalha', 'primeira_missao']);
  });

  it('agrupa por mês e monta o texto para a família', () => {
    const conclusoes = [feita(fase1[0], '2026-10-01T10:00:00')];
    const marcos = montarLinhaDoTempo([registro('2026-11-01', true, 'Apontou para pedir')], conclusoes, []);
    expect(agruparPorMes(marcos).map((g) => g.mes)).toEqual(['novembro de 2026', 'outubro de 2026']);
    const texto = textoLinhaDoTempo('Pedrinho', marcos, () => 'Caça aos Tesouros');
    expect(texto).toContain('Conquistas de Pedrinho');
    expect(texto).toContain('⭐ Apontou para pedir');
    expect(texto).toContain('🎯 Primeira missão: Caça aos Tesouros');
  });
});
