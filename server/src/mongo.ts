import mongoose, { Schema } from 'mongoose';

import type { Evento, NovoLead, PreCadastro } from './esquemas.js';
import { log } from './log.js';
import type { Conteudo, Lead, PreCadastroSalvo, Repos } from './repos.js';

const ConteudoModelo = mongoose.model(
  'Conteudo',
  new Schema({ versao: { type: String, required: true, unique: true }, publicadoEm: { type: Date, required: true }, dados: { type: Schema.Types.Mixed, required: true } }, { collection: 'conteudos' }),
);

const EventoModelo = mongoose.model(
  'Evento',
  new Schema(
    {
      _id: { type: String },
      instalacaoId: { type: String, required: true, index: true },
      versaoApp: String,
      tipo: { type: String, required: true, index: true },
      em: { type: Date, required: true, index: true },
      faixaId: String,
      missaoId: String,
      como: String,
      origem: String,
      recebidoEm: { type: Date, default: Date.now },
    },
    { collection: 'eventos', versionKey: false },
  ),
);

const LeadModelo = mongoose.model(
  'Lead',
  new Schema(
    {
      codigo: { type: String, required: true, unique: true },
      origem: { type: String, required: true },
      faixaId: String,
      vezes: { type: Number, default: 1 },
      criadoEm: { type: Date, default: Date.now },
      ultimoEm: { type: Date, default: Date.now },
    },
    { collection: 'leads', versionKey: false },
  ),
);

// Pré-cadastros do site (lista de espera). Guarda dado de contato com consentimento.
const PreCadastroModelo = mongoose.model(
  'PreCadastro',
  new Schema(
    {
      nome: { type: String, required: true },
      whatsapp: { type: String, required: true, unique: true },
      faixa: { type: String, required: true },
      origem: String,
      consentimentoEm: { type: Date, required: true },
      criadoEm: { type: Date, default: Date.now },
    },
    { collection: 'pre_cadastros', versionKey: false },
  ),
);

function paraLead(d: { codigo: string; origem: string; faixaId?: string | null; vezes: number; criadoEm: Date }): Lead {
  return { codigo: d.codigo, origem: d.origem as Lead['origem'], faixaId: (d.faixaId ?? undefined) as Lead['faixaId'], vezes: d.vezes, criadoEm: d.criadoEm.toISOString() };
}

export async function conectar(uri: string): Promise<void> {
  mongoose.connection.on('disconnected', () => log.warn('mongo desconectado'));
  mongoose.connection.on('reconnected', () => log.info('mongo reconectado'));
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  await Promise.all([ConteudoModelo.syncIndexes(), EventoModelo.syncIndexes(), LeadModelo.syncIndexes(), PreCadastroModelo.syncIndexes()]);
  log.info('mongo conectado', { banco: mongoose.connection.name });
}

export async function desconectar(): Promise<void> {
  await mongoose.disconnect();
}

export function reposMongo(): Repos {
  return {
    conteudo: {
      async atual() {
        const d = await ConteudoModelo.findOne().sort({ publicadoEm: -1 }).lean();
        return d ? { versao: d.versao, publicadoEm: d.publicadoEm.toISOString(), dados: d.dados } : null;
      },
      async publicar(c: Conteudo) {
        await ConteudoModelo.updateOne({ versao: c.versao }, { $set: { publicadoEm: new Date(c.publicadoEm), dados: c.dados } }, { upsert: true });
      },
    },
    eventos: {
      async inserir(instalacaoId: string, versaoApp: string, eventos: Evento[]) {
        // upsert com $setOnInsert: reenvio do mesmo id não altera nem duplica
        const r = await EventoModelo.bulkWrite(
          eventos.map(({ id, ...resto }) => ({
            updateOne: { filter: { _id: id }, update: { $setOnInsert: { ...resto, em: new Date(resto.em), instalacaoId, versaoApp } }, upsert: true },
          })),
          { ordered: false },
        );
        return { novos: r.upsertedCount, duplicados: eventos.length - r.upsertedCount };
      },
    },
    leads: {
      async registrar(l: NovoLead) {
        const r = await LeadModelo.findOneAndUpdate(
          { codigo: l.codigo },
          { $setOnInsert: { origem: l.origem, faixaId: l.faixaId, criadoEm: new Date() }, $inc: { vezes: 1 }, $set: { ultimoEm: new Date() } },
          { upsert: true, returnDocument: 'after', includeResultMetadata: true, setDefaultsOnInsert: false },
        );
        const doc = r.value!;
        return { criado: !r.lastErrorObject?.updatedExisting, lead: paraLead(doc) };
      },
      async buscar(codigo: string) {
        const d = await LeadModelo.findOne({ codigo }).lean();
        return d ? paraLead(d) : null;
      },
    },
    preCadastros: {
      async registrar(p: PreCadastro) {
        const agora = new Date();
        const r = await PreCadastroModelo.findOneAndUpdate(
          { whatsapp: p.whatsapp },
          { $setOnInsert: { nome: p.nome, faixa: p.faixa, origem: p.origem, consentimentoEm: agora, criadoEm: agora } },
          { upsert: true, includeResultMetadata: true },
        );
        return { criado: !r.lastErrorObject?.updatedExisting };
      },
      async listar(limite: number): Promise<PreCadastroSalvo[]> {
        const ds = await PreCadastroModelo.find().sort({ criadoEm: -1 }).limit(limite).lean();
        return ds.map((d) => ({ nome: d.nome, whatsapp: d.whatsapp, faixa: d.faixa as PreCadastroSalvo['faixa'], origem: d.origem ?? undefined, criadoEm: d.criadoEm.toISOString() }));
      },
    },
    async saudavel() {
      return mongoose.connection.readyState === 1;
    },
  };
}
