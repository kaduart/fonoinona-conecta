import { atrasoMs, confirmar, enfileirar, falhou, FILA_VAZIA, MAX_FILA, proximoLote, type EventoApp } from '@/api/fila';

const ev = (id: string): EventoApp => ({ id, em: '2026-10-31T10:00:00.000Z', tipo: 'app_aberto' });

describe('fila de eventos', () => {
  it('não duplica o mesmo id', () => {
    const f = enfileirar(enfileirar(FILA_VAZIA, ev('a')), ev('a'));
    expect(f.eventos).toHaveLength(1);
  });

  it('respeita o teto descartando os mais antigos', () => {
    let f = FILA_VAZIA;
    for (let i = 0; i < MAX_FILA + 5; i++) f = enfileirar(f, ev(`e${i}`));
    expect(f.eventos).toHaveLength(MAX_FILA);
    expect(f.eventos[0].id).toBe('e5');
  });

  it('lote de no máximo 50', () => {
    let f = FILA_VAZIA;
    for (let i = 0; i < 70; i++) f = enfileirar(f, ev(`e${i}`));
    expect(proximoLote(f, 0)).toHaveLength(50);
  });

  it('confirmar remove só os enviados e zera o backoff', () => {
    let f = enfileirar(enfileirar(FILA_VAZIA, ev('a')), ev('b'));
    f = falhou(f, 0);
    f = confirmar(f, ['a']);
    expect(f.eventos.map((e) => e.id)).toEqual(['b']);
    expect(f.tentativas).toBe(0);
  });

  it('depois de falhar, espera o backoff', () => {
    const f = falhou(enfileirar(FILA_VAZIA, ev('a')), 1000);
    expect(proximoLote(f, 1000 + 29_000)).toEqual([]);
    expect(proximoLote(f, 1000 + 30_000)).toHaveLength(1);
  });

  it('backoff cresce e para em 1 hora', () => {
    expect(atrasoMs(0)).toBe(30_000);
    expect(atrasoMs(1)).toBe(60_000);
    expect(atrasoMs(20)).toBe(3_600_000);
  });
});
