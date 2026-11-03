import {
  CODIGO_RENOVACAO,
  desmarcarSessao,
  feitaHoje,
  feitasNaSemana,
  idFizemos,
  limiteRenovacao,
  marcarSessao,
  nosDaTrilha,
  novaAtividade,
  novoCiclo,
  progressoCiclo,
  registroFizemos,
  TEXTO_RENOVACAO,
} from '../casa';
import { normalizarRegistro, resumir, textoResumo } from '../diario';

const agora = new Date(2026, 10, 1, 10, 0);

describe('ciclo de sessões', () => {
  it('80%: fica "quase" faltando até 20%, com piso de 1', () => {
    expect(limiteRenovacao(12)).toBe(2);
    expect(limiteRenovacao(8)).toBe(1);
    expect(limiteRenovacao(4)).toBe(1);
    let c = novoCiclo('c1', 12, agora);
    for (let d = 1; d <= 9; d++) c = marcarSessao(c, `2026-10-${String(d).padStart(2, '0')}`);
    expect(progressoCiclo(c).estagio).toBe('andando');
    c = marcarSessao(c, '2026-10-10');
    expect(progressoCiclo(c)).toEqual({ feitas: 10, total: 12, restantes: 2, estagio: 'quase' });
    let m = novoCiclo('c1', 4, agora);
    m = marcarSessao(marcarSessao(m, '2026-10-01'), '2026-10-08');
    expect(progressoCiclo(m).estagio).toBe('andando');
    m = marcarSessao(m, '2026-10-15');
    expect(progressoCiclo(m).estagio).toBe('quase');
    m = marcarSessao(m, '2026-10-22');
    expect(progressoCiclo(m).estagio).toBe('completo');
  });

  it('marcar é idempotente por dia e não passa do total', () => {
    let c = novoCiclo('c1', 4, agora);
    c = marcarSessao(c, '2026-10-01');
    expect(marcarSessao(c, '2026-10-01')).toBe(c);
    for (const d of ['2026-10-02', '2026-10-03', '2026-10-04', '2026-10-05']) c = marcarSessao(c, d);
    expect(c.sessoes).toHaveLength(4);
    expect(desmarcarSessao(c, '2026-10-02').sessoes).toEqual(['2026-10-01', '2026-10-03', '2026-10-04']);
  });

  it('nós da trilha: feitos, próximo e futuros', () => {
    let c = novoCiclo('c1', 12, agora);
    for (let d = 1; d <= 7; d++) c = marcarSessao(c, `2026-10-0${d}`);
    const nos = nosDaTrilha(c);
    expect(nos.filter((n) => n.estado === 'feito')).toHaveLength(7);
    expect(nos[7].estado).toBe('proximo');
    expect(nos.slice(8).every((n) => n.estado === 'futuro')).toBe(true);
    expect(nos[11].ultimo).toBe(true);
  });

  it('mensagem de renovação traz o código limpo e nenhum dado da criança', () => {
    expect(TEXTO_RENOVACAO).toBe('Olá! Meu filho está concluindo o ciclo de sessões do Conecta (Código: CONECTA-RENOVA). Gostaria de confirmar os próximos agendamentos.');
    expect(CODIGO_RENOVACAO).toBe('CONECTA-RENOVA');
  });
});

describe('atividades de casa', () => {
  it('valida título e vezes por semana', () => {
    expect(novaAtividade('c1', '  Leitura   dialogada ', 3, agora)).toMatchObject({ ok: true, atividade: { titulo: 'Leitura dialogada', vezesSemana: 3 } });
    expect(novaAtividade('c1', '   ', 3, agora)).toEqual({ ok: false, erro: 'titulo' });
    expect(novaAtividade('c1', 'x'.repeat(81), 3, agora)).toEqual({ ok: false, erro: 'titulo' });
    expect(novaAtividade('c1', 'Imitar', 0, agora)).toEqual({ ok: false, erro: 'vezes' });
    expect(novaAtividade('c1', 'Imitar', 8, agora)).toEqual({ ok: false, erro: 'vezes' });
  });

  it('"Fizemos!" vira registro do Diário com id fixo por dia (não duplica)', () => {
    const r = novaAtividade('c1', 'Imitar sons', 2, agora);
    if (!r.ok) throw new Error('inválida');
    const reg = registroFizemos(r.atividade, agora);
    expect(reg.id).toBe(idFizemos(r.atividade.id, '2026-11-01'));
    expect(registroFizemos(r.atividade, new Date(2026, 10, 1, 18)).id).toBe(reg.id);
    expect(reg).toMatchObject({ contexto: 'casa', data: '2026-11-01', atividadeId: r.atividade.id, atividadeTitulo: 'Imitar sons' });
    // um "Fizemos!" sozinho é um registro válido do Diário
    expect(normalizarRegistro(reg, agora).ok).toBe(true);
    expect(feitaHoje(r.atividade.id, [reg], agora)).toBe(true);
  });

  it('conta dias feitos nos últimos 7 dias', () => {
    const r = novaAtividade('c1', 'Imitar sons', 3, agora);
    if (!r.ok) throw new Error('inválida');
    const dias = [new Date(2026, 9, 25), new Date(2026, 9, 26), new Date(2026, 9, 30), agora];
    const regs = dias.map((d) => registroFizemos(r.atividade, d));
    expect(feitasNaSemana(r.atividade.id, regs, agora)).toBe(3);
    expect(feitasNaSemana('outra', regs, agora)).toBe(0);
  });

  it('resumo do Diário conta as atividades de casa feitas', () => {
    const r = novaAtividade('c1', 'Imitar sons', 3, agora);
    if (!r.ok) throw new Error('inválida');
    const resumo = resumir([registroFizemos(r.atividade, agora)], 7, agora);
    expect(resumo.atividadesFeitas).toBe(1);
    expect(textoResumo(resumo, 'CONECTA-AB12')).toContain('1 atividade de casa feita');
  });
});
