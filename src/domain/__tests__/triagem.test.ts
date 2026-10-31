import { FAIXAS } from '@/content/perguntas';
import { avaliar, contarHabilidades, faixaPara, personalizar, type Resposta } from '@/domain/triagem';

const faixa = FAIXAS.find((f) => f.id === 'f18-23m')!;
const todas = (r: Resposta) => Object.fromEntries(faixa.perguntas.map((p) => [p.id, r]));
const semAlerta = { a1: false, a2: false };

describe('banco de perguntas', () => {
  it('cobre 0 a 72 meses sem buracos nem sobreposição', () => {
    for (let m = 0; m < 72; m++) {
      expect(FAIXAS.filter((f) => m >= f.minMeses && m < f.maxMeses)).toHaveLength(1);
    }
  });
  it('tem 8 perguntas com ids únicos por faixa', () => {
    const ids = FAIXAS.flatMap((f) => f.perguntas.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
    FAIXAS.forEach((f) => expect(f.perguntas).toHaveLength(8));
  });
});

describe('faixaPara', () => {
  it('escolhe a faixa pela idade', () => {
    expect(faixaPara(19)?.id).toBe('f18-23m');
    expect(faixaPara(0)?.id).toBe('f0-5m');
    expect(faixaPara(71)?.id).toBe('f5a');
  });
  it('fora de 0–6 anos retorna null', () => expect(faixaPara(72)).toBeNull());
});

describe('avaliar', () => {
  it('tudo "sim" → esperado, sem área de foco', () => {
    const r = avaliar(faixa, todas('sim'), semAlerta);
    expect(r.nivel).toBe('esperado');
    expect(r.areaFoco).toBeNull();
  });
  it('1 "às vezes" ainda é esperado', () => {
    expect(avaliar(faixa, { ...todas('sim'), 'f18-1': 'as_vezes' }, semAlerta).nivel).toBe('esperado');
  });
  it('2 "às vezes" → observar', () => {
    expect(avaliar(faixa, { ...todas('sim'), 'f18-1': 'as_vezes', 'f18-2': 'as_vezes' }, semAlerta).nivel).toBe('observar');
  });
  it('1 "ainda não" → observar, com foco na área dele', () => {
    const r = avaliar(faixa, { ...todas('sim'), 'f18-5': 'ainda_nao' }, semAlerta);
    expect(r.nivel).toBe('observar');
    expect(r.areaFoco).toBe('imitacao');
  });
  it('2 "ainda não" → avaliar', () => {
    expect(avaliar(faixa, { ...todas('sim'), 'f18-1': 'ainda_nao', 'f18-3': 'ainda_nao' }, semAlerta).nivel).toBe('avaliar');
  });
  it('alerta de regressão leva direto a avaliar', () => {
    const r = avaliar(faixa, todas('sim'), { a1: true, a2: false });
    expect(r.nivel).toBe('avaliar');
    expect(r.alertaMarcado).toBe(true);
  });
  it('recusa triagem incompleta', () => {
    expect(() => avaliar(faixa, { 'f18-1': 'sim' }, semAlerta)).toThrow(/incompleta/);
  });
});

it('personalizar troca variáveis conhecidas e mantém as outras', () => {
  expect(personalizar('{nome} tem {faixa} e {x}', { nome: 'Pedrinho', faixa: '18 a 23 meses' })).toBe(
    'Pedrinho tem 18 a 23 meses e {x}',
  );
});

it('contarHabilidades conta só as respostas "sim" das perguntas da faixa', () => {
  expect(contarHabilidades({ a: 'sim', b: 'as_vezes', c: 'sim', d: 'ainda_nao', e: 'sim', f: 'sim' })).toEqual({ noEsperado: 4, total: 6 });
});
