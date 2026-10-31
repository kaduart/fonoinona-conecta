import { MISSOES } from '@/content/missoes';
import { FAIXAS } from '@/content/perguntas';
import { areasComDificuldade, ponteProposito, diasSeguidos, missaoDoDia, missoesParaIdade, montarTrilha, semana, type Conclusao } from '@/domain/missoes';

let seq = 0;
function feita(missaoId: string, em: string, como: Conclusao['como'] = 'facil'): Conclusao {
  seq += 1;
  return { id: `c${seq}`, criancaId: 'k1', missaoId, como, em };
}

describe('catálogo de missões', () => {
  it('tem 18 missões com ids e ordens únicos', () => {
    expect(MISSOES).toHaveLength(18);
    expect(new Set(MISSOES.map((m) => m.id)).size).toBe(18);
    expect(new Set(MISSOES.map((m) => m.ordem)).size).toBe(18);
  });

  it('toda faixa de idade tem pelo menos uma missão', () => {
    for (const f of FAIXAS) expect(missoesParaIdade(f.minMeses).length).toBeGreaterThan(0);
  });

  it('toda missão tem passos, dica e quando parar', () => {
    for (const m of MISSOES) {
      expect(m.passos.length).toBeGreaterThanOrEqual(3);
      expect(m.dica).toBeTruthy();
      expect(m.quandoParar).toBeTruthy();
    }
  });
});

describe('missoesParaIdade', () => {
  it('só mostra missões da idade', () => {
    expect(missoesParaIdade(3).map((m) => m.id)).toEqual(['m06-conversa-bebe']);
    expect(missoesParaIdade(30).every((m) => m.idadeMinMeses <= 30)).toBe(true);
  });

  it('coloca a área de foco primeiro', () => {
    const lista = missoesParaIdade(30, 'audicao');
    expect(lista[0].areas).toContain('audicao');
    expect(lista[1].areas).toContain('audicao');
    expect(lista[2].areas).not.toContain('audicao');
  });
});

describe('montarTrilha', () => {
  const missoes = missoesParaIdade(20);

  it('só a primeira começa liberada', () => {
    const t = montarTrilha(missoes, []);
    expect(t[0].liberada).toBe(true);
    expect(t.slice(1).every((i) => !i.liberada)).toBe(true);
  });

  it('concluir uma libera a próxima', () => {
    const t = montarTrilha(missoes, [feita(missoes[0].id, '2026-10-30T10:00:00')]);
    expect(t[0].feitas).toBe(1);
    expect(t[1].liberada).toBe(true);
    expect(t[2].liberada).toBe(false);
  });
});

describe('missaoDoDia', () => {
  const missoes = missoesParaIdade(3);

  it('é a primeira pendente', () => {
    const m = missoesParaIdade(20);
    const c = [feita(m[0].id, '2026-10-30T10:00:00')];
    expect(missaoDoDia(montarTrilha(m, c), c)?.id).toBe(m[1].id);
  });

  it('quando tudo foi feito, repete a feita há mais tempo', () => {
    const c = [feita(missoes[0].id, '2026-10-01T10:00:00')];
    expect(missaoDoDia(montarTrilha(missoes, c), c)?.id).toBe(missoes[0].id);
  });

  it('sem missões, retorna null', () => {
    expect(missaoDoDia([], [])).toBeNull();
  });
});

describe('diasSeguidos e semana', () => {
  const hoje = new Date(2026, 9, 31, 15);

  it('conta dias consecutivos até hoje', () => {
    const c = [feita('a', new Date(2026, 9, 31, 9).toISOString()), feita('a', new Date(2026, 9, 30, 9).toISOString()), feita('a', new Date(2026, 9, 28, 9).toISOString())];
    expect(diasSeguidos(c, hoje)).toBe(2);
  });

  it('não zera se ainda não fez hoje mas fez ontem', () => {
    expect(diasSeguidos([feita('a', new Date(2026, 9, 30, 9).toISOString())], hoje)).toBe(1);
  });

  it('zera quando pulou um dia', () => {
    expect(diasSeguidos([feita('a', new Date(2026, 9, 29, 9).toISOString())], hoje)).toBe(0);
  });

  it('semana marca os 7 últimos dias', () => {
    const s = semana([feita('a', new Date(2026, 9, 31, 9).toISOString())], hoje);
    expect(s).toHaveLength(7);
    expect(s[6].feito).toBe(true);
    expect(s[5].feito).toBe(false);
  });
});

describe('areasComDificuldade', () => {
  it('sugere a equipe após 3 "Difícil" na mesma área', () => {
    const c = [
      feita('m02-bau-sons', '2026-10-01T10:00:00', 'dificil'),
      feita('m14-detetive-sons', '2026-10-02T10:00:00', 'dificil'),
      feita('m02-bau-sons', '2026-10-03T10:00:00', 'dificil'),
      feita('m09-fazenda-sons', '2026-10-03T10:00:00', 'dificil'),
    ];
    expect(areasComDificuldade(c)).toEqual(['audicao']);
  });

  it('ignora "Fácil" e "Com ajuda"', () => {
    const c = ['facil', 'com_ajuda', 'com_ajuda'].map((como, i) => feita('m02-bau-sons', `2026-10-0${i + 1}T10:00:00`, como as Conclusao['como']));
    expect(areasComDificuldade(c)).toEqual([]);
  });
});

describe('ponteProposito', () => {
  it('elogia a área da missão feita e aponta a próxima liberada da trilha', () => {
    const missoes = missoesParaIdade(30);
    const primeira = missoes[0];
    const r = ponteProposito(primeira, 'Pedro', missoes, [feita(primeira.id, '2026-10-31T10:00:00Z')]);
    expect(r.feedback).toMatch(/^Muito bem! Hoje Pedro exercitou /);
    expect(r.proxima?.id).toBe(missoes[1].id);
    expect(r.motivo).toContain(missoes[1].titulo);
  });

  it('sem próxima pendente, não inventa próximo passo', () => {
    const missoes = missoesParaIdade(3);
    const r = ponteProposito(missoes[0], 'Ana', missoes, [feita(missoes[0].id, '2026-10-31T10:00:00Z')]);
    expect(r.proxima).toBeNull();
    expect(r.motivo).toBeNull();
  });
});

it('toda missão tem o que observar', () => {
  for (const m of MISSOES) expect(m.observar).toBeTruthy();
});
