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

  it('aceita Diário (só o contexto) e interesse no kit, sem levar a nota', async () => {
    const corpo = {
      ...lote(['ev-000001']),
      eventos: [
        { id: 'ev-000010', em: '2026-10-31T10:00:00.000Z', tipo: 'diario_registro', contexto: 'escola', nota: 'falou água', humor: 'dificil' },
        { id: 'ev-000011', em: '2026-10-31T10:00:00.000Z', tipo: 'kit_interesse', fase: 2 },
      ],
    };
    const gravados: unknown[] = [];
    const original = repos.eventos.inserir;
    repos.eventos.inserir = async (inst, versao, lista) => {
      gravados.push(...lista);
      return original(inst, versao, lista);
    };
    await request(app).post('/v1/eventos').send(corpo).expect(202);
    expect(gravados).toHaveLength(2);
    expect(JSON.stringify(gravados)).not.toContain('falou');
    expect(JSON.stringify(gravados)).not.toContain('dificil');
    await request(app)
      .post('/v1/eventos')
      .send({ ...corpo, eventos: [{ id: 'ev-000012', em: '2026-10-31T10:00:00.000Z', tipo: 'diario_registro', contexto: 'praia' }] })
      .expect(400);
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

describe('métricas de instalação e uso', () => {
  const ev = (id: string, em: string, extra: Record<string, unknown>) => ({ id, em, ...extra });
  const enviar = (instalacaoId: string, eventos: Record<string, unknown>[]) =>
    request(app).post('/v1/eventos').send({ instalacaoId, versaoApp: '1.1.0', eventos }).expect(202);

  it('exige a chave', async () => {
    await request(app).get('/v1/metricas').expect(401);
  });

  it('aceita os eventos novos de instalação e o contexto da abertura', async () => {
    const hoje = new Date().toISOString();
    await enviar('inst-novo01', [
      ev('ev-cv0001', hoje, { tipo: 'instalacao_oferecida', plataforma: 'android' }),
      ev('ev-in0001', hoje, { tipo: 'app_instalado', plataforma: 'android' }),
      ev('ev-ab0001', hoje, { tipo: 'app_aberto', modo: 'instalado', plataforma: 'android' }),
    ]);
    await request(app)
      .post('/v1/eventos')
      .send({ instalacaoId: 'inst-novo01', versaoApp: '1.1.0', eventos: [ev('ev-ab0002', hoje, { tipo: 'app_aberto', modo: 'foguete' })] })
      .expect(400);
  });

  it('conta usuários, instalações, ativos e uso', async () => {
    const agora = Date.now();
    const haDias = (d: number) => new Date(agora - d * 86_400_000).toISOString();
    // Android: navegador convidou, instalou e abriu instalado
    await enviar('inst-andr01', [
      ev('ev-a00001', haDias(3), { tipo: 'instalacao_oferecida', plataforma: 'android' }),
      ev('ev-a00002', haDias(3), { tipo: 'app_instalado', plataforma: 'android' }),
      ev('ev-a00003', haDias(0), { tipo: 'app_aberto', modo: 'instalado', plataforma: 'android' }),
      ev('ev-a00004', haDias(0), { tipo: 'missao_concluida', missaoId: 'm06-conversa-bebe', como: 'facil' }),
    ]);
    // iPhone: não existe appinstalled; conta pela abertura em modo instalado
    await enviar('inst-ios001', [ev('ev-i00001', haDias(10), { tipo: 'app_aberto', modo: 'instalado', plataforma: 'ios' })]);
    // usa só no navegador
    await enviar('inst-nav001', [
      ev('ev-n00001', haDias(1), { tipo: 'app_aberto', modo: 'navegador', plataforma: 'desktop' }),
      ev('ev-n00002', haDias(1), { tipo: 'triagem_concluida', faixaId: 'f2a' }),
    ]);
    // versão antiga do app (sem modo/plataforma), antiga demais para o período de 7 dias
    await enviar('inst-velho1', [ev('ev-v00001', haDias(40), { tipo: 'app_aberto' })]);

    const r = await request(app).get('/v1/metricas?dias=7').set('x-api-key', CHAVE).expect(200);
    const m = r.body;
    expect(m.totais).toEqual({ usuarios: 4, instalados: 2, convidadosAInstalar: 1, porPlataforma: { android: 1, ios: 1, desktop: 1, desconhecida: 1 } });
    expect(m.periodo).toEqual({ novosUsuarios: 2, novasInstalacoes: 1 });
    expect(m.ativos).toEqual({ hoje: 1, ultimos7dias: 2, ultimos30dias: 3 });
    expect(m.uso).toMatchObject({ aberturas: 2, triagens: 1, missoes: 1 });
    expect(m.porDia).toHaveLength(7);
    expect(m.porDia.at(-1)).toMatchObject({ ativos: 1 });
    expect(m.porDia.reduce((s: number, d: { novos: number }) => s + d.novos, 0)).toBe(2);
  });

  it('limita o período e serve o painel', async () => {
    const r = await request(app).get('/v1/metricas?dias=999').set('x-api-key', CHAVE).expect(200);
    expect(r.body.periodoDias).toBe(90);
    const p = await request(app).get('/painel').expect(200);
    expect(p.text).toContain('/painel.js');
    await request(app).get('/painel.js').expect(200).expect('Content-Type', /javascript/);
  });
});
