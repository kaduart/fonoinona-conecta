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

  it('resumo de métricas: instalações, ativos por dia e plataforma mais recente', async () => {
    const agora = Date.now();
    const haDias = (d: number) => new Date(agora - d * 86_400_000).toISOString();
    await repos.eventos.inserir('inst-m1', '1.1.0', [
      { id: 'ev-m-1', em: haDias(2), tipo: 'app_aberto', modo: 'navegador', plataforma: 'android' },
      { id: 'ev-m-2', em: haDias(1), tipo: 'app_instalado', plataforma: 'android' },
      { id: 'ev-m-3', em: haDias(1), tipo: 'diario_registro', contexto: 'casa' },
      { id: 'ev-m-4', em: haDias(1), tipo: 'instalacao_oferecida', plataforma: 'android' },
    ]);
    const r = await repos.eventos.resumo(new Date(agora - 7 * 86_400_000));
    const m1 = r.instalacoes.find((i) => i.instalacaoId === 'inst-m1')!;
    expect(m1.plataforma).toBe('android');
    expect(m1.instaladoEm?.toISOString()).toBe(haDias(1));
    expect(r.instalacoes.find((i) => i.instalacaoId === 'inst-1')?.instaladoEm).toBeNull();
    expect(r.convidadas).toBe(1);
    expect(r.porTipo.find((t) => t.tipo === 'diario_registro')?.total).toBe(1);
    expect(r.ativosPorDia.reduce((s, d) => s + d.ativos, 0)).toBeGreaterThanOrEqual(2);
    // campos que antes o Mongoose descartava
    const salvo = await mongoose.connection.db!.collection('eventos').findOne({ _id: 'ev-m-3' as never });
    expect(salvo?.contexto).toBe('casa');
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
