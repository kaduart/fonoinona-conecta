// Teste de integração com MongoDB real. Roda com TESTE_MONGO=1: no CI usa o serviço mongo (MONGO_URI_TESTE);
// localmente, sem MONGO_URI_TESTE, sobe um Mongo em memória (baixa o binário na primeira vez).
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { montarConteudo } from '../scripts/conteudo.js';
import { conectar, desconectar, reposMongo } from '../src/mongo.js';

describe.skipIf(!process.env.TESTE_MONGO)('repositórios Mongo', () => {
  let mongo: MongoMemoryServer | undefined;
  const repos = reposMongo();

  beforeAll(async () => {
    let uri = process.env.MONGO_URI_TESTE;
    if (!uri) {
      mongo = await MongoMemoryServer.create();
      uri = mongo.getUri('conecta');
    }
    await conectar(uri);
    await mongoose.connection.db?.dropDatabase();
  }, 120_000);

  afterAll(async () => {
    await desconectar();
    await mongo?.stop();
  });

  it('publica e lê conteúdo (idempotente pela versão)', async () => {
    const c = montarConteudo();
    await repos.conteudo.publicar(c);
    await repos.conteudo.publicar(c);
    expect((await repos.conteudo.atual())?.versao).toBe(c.versao);
  });

  it('eventos não duplicam', async () => {
    const ev = { id: 'ev-mongo-1', em: '2026-10-31T10:00:00.000Z', tipo: 'app_aberto' as const };
    expect(await repos.eventos.inserir('inst-1', '1.0.0', [ev])).toEqual({ novos: 1, duplicados: 0 });
    expect(await repos.eventos.inserir('inst-1', '1.0.0', [ev])).toEqual({ novos: 0, duplicados: 1 });
  });

  it('lead conta repetições sem duplicar', async () => {
    const a = await repos.leads.registrar({ codigo: 'CONECTA-MNG2', origem: 'resultado' });
    const b = await repos.leads.registrar({ codigo: 'CONECTA-MNG2', origem: 'resultado' });
    expect(a.criado).toBe(true);
    expect(b.criado).toBe(false);
    expect(b.lead.vezes).toBe(2);
    expect((await repos.leads.buscar('CONECTA-MNG2'))?.vezes).toBe(2);
  });
});
