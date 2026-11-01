import { agruparPorDia, AREAS_DIARIO, dataPermitida, diasComRegistro, filtrar, GATILHOS_NOTA, inserirGatilho, normalizarRegistro, resumir, sugerirMissao, textoResumo, NOTA_MAX, type RegistroDiario } from '@/domain/diario';

const HOJE = new Date(2026, 9, 31, 15, 0); // sáb 31/10/2026, horário local

let seq = 0;
function reg(p: Partial<RegistroDiario> = {}): RegistroDiario {
  seq += 1;
  return { id: `d${seq}`, criancaId: 'k1', data: '2026-10-31', contexto: 'casa', humor: 'bom', areas: [], conquista: false, nota: '', criadoEm: `2026-10-31T10:${String(seq).padStart(2, '0')}:00Z`, editadoEm: '2026-10-31T10:00:00Z', ...p };
}

describe('dataPermitida', () => {
  it('aceita hoje e até 7 dias para trás', () => {
    expect(dataPermitida('2026-10-31', HOJE)).toBe(true);
    expect(dataPermitida('2026-10-24', HOJE)).toBe(true);
  });
  it('recusa futuro, mais de 7 dias e datas inválidas', () => {
    expect(dataPermitida('2026-11-01', HOJE)).toBe(false);
    expect(dataPermitida('2026-10-23', HOJE)).toBe(false);
    expect(dataPermitida('2026-02-30', HOJE)).toBe(false);
    expect(dataPermitida('31/10/2026', HOJE)).toBe(false);
  });
});

describe('normalizarRegistro', () => {
  it('apara a nota e tira áreas repetidas', () => {
    const r = normalizarRegistro(reg({ nota: '  oi  ', areas: ['fala', 'fala', 'gestos'] }), HOJE);
    expect(r.ok && r.registro.nota).toBe('oi');
    expect(r.ok && r.registro.areas).toEqual(['fala', 'gestos']);
  });
  it('recusa registro sem conteúdo, nota longa e data fora da janela', () => {
    expect(normalizarRegistro(reg({ humor: null }), HOJE)).toEqual({ ok: false, erro: 'vazio' });
    expect(normalizarRegistro(reg({ nota: 'a'.repeat(NOTA_MAX + 1) }), HOJE)).toEqual({ ok: false, erro: 'nota_longa' });
    expect(normalizarRegistro(reg({ data: '2026-11-02' }), HOJE)).toEqual({ ok: false, erro: 'data' });
  });
  it('conquista sozinha já vale como registro', () => {
    expect(normalizarRegistro(reg({ humor: null, conquista: true }), HOJE).ok).toBe(true);
  });
});

describe('linha do tempo', () => {
  const lista = [reg({ data: '2026-10-30', contexto: 'escola' }), reg({ conquista: true }), reg({ contexto: 'terapia' })];
  it('agrupa por dia, mais recente primeiro', () => {
    const g = agruparPorDia(lista);
    expect(g.map((x) => x.data)).toEqual(['2026-10-31', '2026-10-30']);
    expect(g[0].registros).toHaveLength(2);
  });
  it('filtra por contexto e por conquista', () => {
    expect(filtrar(lista, 'escola')).toHaveLength(1);
    expect(filtrar(lista, 'conquistas')).toHaveLength(1);
    expect(filtrar(lista, 'todos')).toHaveLength(3);
  });
  it('dias com registro', () => {
    expect([...diasComRegistro(lista)].sort()).toEqual(['2026-10-30', '2026-10-31']);
  });
});

describe('resumo para a equipe', () => {
  const lista = [
    reg({ data: '2026-10-31', humor: 'bom', areas: ['fala'], conquista: true, nota: 'Falou água' }),
    reg({ data: '2026-10-31', humor: 'dificil', areas: ['fala', 'interacao'] }),
    reg({ data: '2026-10-29', humor: 'normal', areas: ['interacao'] }),
    reg({ data: '2026-10-10', humor: 'dificil', areas: ['gestos'] }),
  ];

  it('conta só o período, um humor por dia (o último registro do dia)', () => {
    const r = resumir(lista, 15, HOJE, 6);
    expect(r.diasAnotados).toBe(2);
    expect(r.humor).toEqual({ bom: 0, normal: 1, dificil: 1 });
    expect(r.areasMaisMarcadas).toEqual(['fala', 'interacao']);
    expect(r.conquistas).toBe(1);
  });

  it('texto neutro, com código e sem notas por padrão', () => {
    const t = textoResumo(resumir(lista, 15, HOJE, 6), 'CONECTA-7K2P');
    expect(t).toContain('CONECTA-7K2P');
    expect(t).toContain('2 dias anotados (1 normal, 1 difícil)');
    expect(t).toContain('Mais observado: fala e troca com as pessoas');
    expect(t).toContain('6 missões feitas em casa');
    expect(t).not.toContain('Falou água');
    expect(t).not.toMatch(/diagn|laudo/i);
  });

  it('inclui as notas só quando o responsável marca', () => {
    const t = textoResumo(resumir(lista, 15, HOJE), 'CONECTA-7K2P', [{ data: '2026-10-31', nota: 'Falou água' }]);
    expect(t).toContain('31/10: Falou água');
  });
});

describe('apoio às telas', () => {
  it('rotula hoje, ontem e dias anteriores', () => {
    const { rotuloDia } = jest.requireActual('@/domain/diario');
    expect(rotuloDia('2026-10-31', HOJE)).toBe('Hoje · sáb, 31 out');
    expect(rotuloDia('2026-10-30', HOJE)).toBe('Ontem · sex, 30 out');
    expect(rotuloDia('2026-10-28', HOJE)).toBe('qua, 28 out');
  });

  it('oferece hoje e os 7 dias anteriores', () => {
    const { datasParaAnotar } = jest.requireActual('@/domain/diario');
    const d = datasParaAnotar(HOJE);
    expect(d).toHaveLength(8);
    expect(d[0]).toBe('2026-10-31');
    expect(d[7]).toBe('2026-10-24');
  });

  it('marcas do Diário entram na sequência e na semana junto com as missões', () => {
    const { marcasDeAtividade } = jest.requireActual('@/domain/diario');
    const { diasSeguidos, semana } = jest.requireActual('@/domain/missoes');
    const missao = [{ em: new Date(2026, 9, 29, 9).toISOString() }];
    const diario = marcasDeAtividade([reg({ data: '2026-10-30' }), reg({ data: '2026-10-31' })]);
    expect(diasSeguidos(missao, HOJE)).toBe(0);
    expect(diasSeguidos([...missao, ...diario], HOJE)).toBe(3);
    expect(semana([...missao, ...diario], HOJE).filter((x: { feito: boolean }) => x.feito)).toHaveLength(3);
  });

  it('texto da conquista não leva nome e diz "registrado", não "verificado"', () => {
    const { textoConquista } = jest.requireActual('@/domain/diario');
    const t = textoConquista(reg({ conquista: true, nota: 'falou "água" sozinha' }));
    expect(t).toContain('falou "água" sozinha');
    expect(t).toContain('Registrado no app FonoInova Conecta');
    expect(t).not.toMatch(/verificad/i);
  });
});

describe('inserirGatilho', () => {
  it('escreve na nota vazia e emenda com ponto na nota com texto', () => {
    expect(inserirGatilho('', 'Apontou para pedir')).toBe('Apontou para pedir');
    expect(inserirGatilho('Brincou bem', 'Apontou para pedir')).toBe('Brincou bem. Apontou para pedir');
    expect(inserirGatilho('Brincou bem!  ', 'Apontou para pedir')).toBe('Brincou bem! Apontou para pedir');
  });
  it('não repete a frase nem passa do limite', () => {
    expect(inserirGatilho('Apontou para pedir', 'apontou para pedir')).toBe('Apontou para pedir');
    const cheia = 'a'.repeat(NOTA_MAX - 5);
    expect(inserirGatilho(cheia, 'Falou uma palavra nova')).toBe(cheia);
  });
  it('todo atalho aponta para uma área oferecida no Diário', () => {
    for (const g of GATILHOS_NOTA) expect(AREAS_DIARIO).toContain(g.area);
  });
});

describe('sugerirMissao', () => {
  const m = (id: string, areas: RegistroDiario['areas']) => ({ id, areas });
  const trilha = [
    { missao: m('a', ['fala']), liberada: true, feitas: 2 },
    { missao: m('b', ['brincar', 'gestos']), liberada: true, feitas: 0 },
    { missao: m('c', ['brincar']), liberada: true, feitas: 0 },
    { missao: m('d', ['interacao']), liberada: false, feitas: 0 },
  ];
  it('só sugere em dia difícil com área marcada', () => {
    expect(sugerirMissao({ humor: 'bom', areas: ['brincar'] }, trilha)).toBeNull();
    expect(sugerirMissao({ humor: null, areas: ['brincar'] }, trilha)).toBeNull();
    expect(sugerirMissao({ humor: 'dificil', areas: [] }, trilha)).toBeNull();
  });
  it('escolhe a liberada menos feita que combina, na ordem da trilha', () => {
    expect(sugerirMissao({ humor: 'dificil', areas: ['brincar'] }, trilha)?.id).toBe('b');
    expect(sugerirMissao({ humor: 'dificil', areas: ['fala'] }, trilha)?.id).toBe('a');
  });
  it('nunca sugere missão bloqueada nem inventa quando nada combina', () => {
    expect(sugerirMissao({ humor: 'dificil', areas: ['interacao'] }, trilha)).toBeNull();
    expect(sugerirMissao({ humor: 'dificil', areas: ['alimentacao'] }, trilha)).toBeNull();
  });
});
