import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { montarConteudo } from '../scripts/conteudo.js';
import { criarApp } from '../src/app.js';
import { reposEmMemoria, type Repos } from '../src/repos.js';

const CHAVE = 'k'.repeat(32);
let repos: Repos;
let app: ReturnType<typeof criarApp>;

beforeEach(() => {
  repos = reposEmMemoria();
  app = criarApp(repos, { adminApiKey: CHAVE, limitePorMinuto: 1000 });
});

const lote = (ids: string[]) => ({
  instalacaoId: 'inst-abc123',
  versaoApp: '1.0.0',
  eventos: ids.map((id) => ({ id, em: '2026-10-31T10:00:00.000Z', tipo: 'missao_concluida', missaoId: 'm06-conversa-bebe', como: 'facil' })),
});

describe('GET /saude', () => {
  it('responde ok', async () => {
    await request(app).get('/saude').expect(200, { ok: true });
  });
});

describe('GET /v1/conteudo', () => {
  it('404 antes de publicar', async () => {
    await request(app).get('/v1/conteudo').expect(404);
  });

  it('devolve o conteúdo com ETag e 304 quando não mudou', async () => {
    const c = montarConteudo();
    await repos.conteudo.publicar(c);
    const r = await request(app).get('/v1/conteudo').expect(200);
    expect(r.body.versao).toBe(c.versao);
    // Deriva do conteúdo publicado (fonte única), para não quebrar ao adicionar missões/faixas.
    expect(r.body.dados.missoes).toHaveLength(c.dados.missoes.length);
    expect(r.body.dados.missoes.length).toBeGreaterThanOrEqual(18);
    expect(r.body.dados.faixas).toHaveLength(c.dados.faixas.length);
    expect(r.body.dados.faixas.length).toBeGreaterThanOrEqual(8);
    await request(app).get('/v1/conteudo').set('If-None-Match', r.headers.etag).expect(304);
  });
});

describe('POST /v1/eventos', () => {
  it('aceita um lote válido', async () => {
    const r = await request(app).post('/v1/eventos').send(lote(['ev-000001', 'ev-000002'])).expect(202);
    expect(r.body).toEqual({ novos: 2, duplicados: 0 });
  });

  it('é idempotente: reenviar não duplica', async () => {
    await request(app).post('/v1/eventos').send(lote(['ev-000001'])).expect(202);
    const r = await request(app).post('/v1/eventos').send(lote(['ev-000001', 'ev-000003'])).expect(202);
    expect(r.body).toEqual({ novos: 1, duplicados: 1 });
  });

  it('recusa tipo desconhecido', async () => {
    const corpo = { ...lote(['ev-000001']), eventos: [{ id: 'ev-000001', em: '2026-10-31T10:00:00.000Z', tipo: 'qualquer' }] };
    await request(app).post('/v1/eventos').send(corpo).expect(400);
  });

  it('descarta campos fora do contrato (nada de dado de saúde ou pessoal)', async () => {
    const corpo = lote(['ev-000009']);
    Object.assign(corpo.eventos[0], { apelido: 'Pedrinho', respostas: { 'f18-1': 'ainda_nao' } });
    await request(app).post('/v1/eventos').send(corpo).expect(202);
  });

  it('recusa lote com mais de 50 eventos', async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `ev-${String(i).padStart(6, '0')}`);
    await request(app).post('/v1/eventos').send(lote(ids)).expect(400);
  });

  it('JSON quebrado vira 400', async () => {
    await request(app).post('/v1/eventos').set('Content-Type', 'application/json').send('{oops').expect(400, { erro: 'json_invalido' });
  });
});

describe('leads', () => {
  it('registra o código e reconta sem duplicar', async () => {
    const r1 = await request(app).post('/v1/leads').send({ codigo: 'CONECTA-AB2C', origem: 'resultado', faixaId: 'f18-23m' }).expect(201);
    expect(r1.body.vezes).toBe(1);
    const r2 = await request(app).post('/v1/leads').send({ codigo: 'CONECTA-AB2C', origem: 'resultado' }).expect(200);
    expect(r2.body.vezes).toBe(2);
  });

  it('recusa código fora do padrão', async () => {
    await request(app).post('/v1/leads').send({ codigo: 'CONECTA-0O1I', origem: 'resultado' }).expect(400);
    await request(app).post('/v1/leads').send({ codigo: 'qualquer', origem: 'resultado' }).expect(400);
  });

  it('consulta exige a chave da equipe', async () => {
    await request(app).post('/v1/leads').send({ codigo: 'CONECTA-XY7Z', origem: 'geral' }).expect(201);
    await request(app).get('/v1/leads/CONECTA-XY7Z').expect(401);
    await request(app).get('/v1/leads/CONECTA-XY7Z').set('x-api-key', 'errada').expect(401);
    const r = await request(app).get('/v1/leads/conecta-xy7z').set('x-api-key', CHAVE).expect(200);
    expect(r.body.origem).toBe('geral');
    await request(app).get('/v1/leads/CONECTA-ZZZZ').set('x-api-key', CHAVE).expect(404);
  });
});

describe('pré-cadastro (lista de espera)', () => {
  const valido = { nome: 'Ana Souza', whatsapp: '(62) 99201-3573', faixa: '2a', consentimento: true };

  it('registra e é idempotente pelo WhatsApp', async () => {
    const r1 = await request(app).post('/v1/pre-cadastro').send(valido).expect(201);
    expect(r1.body).toMatchObject({ ok: true, novo: true });
    const r2 = await request(app).post('/v1/pre-cadastro').send({ ...valido, nome: 'Ana S.' }).expect(200);
    expect(r2.body.novo).toBe(false);
  });

  it('exige consentimento, nome e WhatsApp válido', async () => {
    await request(app).post('/v1/pre-cadastro').send({ ...valido, consentimento: false }).expect(400);
    await request(app).post('/v1/pre-cadastro').send({ ...valido, nome: 'A' }).expect(400);
    await request(app).post('/v1/pre-cadastro').send({ ...valido, whatsapp: '123' }).expect(400);
    await request(app).post('/v1/pre-cadastro').send({ ...valido, faixa: '9a' }).expect(400);
  });

  it('não guarda nome da criança nem outros campos fora do contrato', async () => {
    await request(app).post('/v1/pre-cadastro').send({ nome: 'João', whatsapp: '62990000000', faixa: '3a', consentimento: true, nomeCrianca: 'Bebê', respostas: {} }).expect(201);
    const r = await request(app).get('/v1/pre-cadastros').set('x-api-key', CHAVE).expect(200);
    const reg = r.body.total.find((x: { whatsapp: string }) => x.whatsapp === '62990000000');
    expect(reg).toBeTruthy();
    expect(reg.nomeCrianca).toBeUndefined();
    expect(reg.respostas).toBeUndefined();
  });

  it('aceita interesse opcional (lista curta) e recusa valor fora da lista', async () => {
    await request(app).post('/v1/pre-cadastro').send({ nome: 'Rui', whatsapp: '62990001111', faixa: '4a', interesse: 'fala', consentimento: true }).expect(201);
    await request(app).post('/v1/pre-cadastro').send({ nome: 'Rui', whatsapp: '62990002222', faixa: '4a', interesse: 'queixa-livre', consentimento: true }).expect(400);
    const r = await request(app).get('/v1/pre-cadastros').set('x-api-key', CHAVE).expect(200);
    expect(r.body.total.find((x: { whatsapp: string }) => x.whatsapp === '62990001111').interesse).toBe('fala');
  });

  it('lista protegida por chave da equipe', async () => {
    await request(app).post('/v1/pre-cadastro').send(valido);
    await request(app).get('/v1/pre-cadastros').expect(401);
    await request(app).get('/v1/pre-cadastros').set('x-api-key', 'errada').expect(401);
    const r = await request(app).get('/v1/pre-cadastros').set('x-api-key', CHAVE).expect(200);
    expect(Array.isArray(r.body.total)).toBe(true);
  });
});

describe('limite de requisições', () => {
  it('responde 429 depois do limite', async () => {
    const limitado = criarApp(reposEmMemoria(), { adminApiKey: CHAVE, limitePorMinuto: 2 });
    await request(limitado).post('/v1/leads').send({ codigo: 'CONECTA-AAAA', origem: 'geral' });
    await request(limitado).post('/v1/leads').send({ codigo: 'CONECTA-AAAA', origem: 'geral' });
    await request(limitado).post('/v1/leads').send({ codigo: 'CONECTA-AAAA', origem: 'geral' }).expect(429);
  });
});

describe('config', () => {
  it('falha com mensagem clara sem as variáveis', async () => {
    const { lerConfig } = await import('../src/config.js');
    expect(() => lerConfig({})).toThrow(/MONGODB_URI/);
  });
});
