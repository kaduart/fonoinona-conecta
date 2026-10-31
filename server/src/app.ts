import { timingSafeEqual } from 'node:crypto';

import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';
import { z } from 'zod';

import { LoteEventos, NovoLead, PreCadastro } from './esquemas.js';
import { log } from './log.js';
import type { Repos } from './repos.js';

export type OpcoesApp = { adminApiKey: string; corsOrigens?: string[]; limitePorMinuto?: number };

function chaveConfere(recebida: string | undefined, esperada: string): boolean {
  if (!recebida) return false;
  const a = Buffer.from(recebida);
  const b = Buffer.from(esperada);
  return a.length === b.length && timingSafeEqual(a, b);
}

function invalido(res: Response, erro: z.ZodError) {
  return res.status(400).json({ erro: 'dados_invalidos', detalhes: erro.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })) });
}

export function criarApp(repos: Repos, opcoes: OpcoesApp) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: opcoes.corsOrigens?.length ? opcoes.corsOrigens : false }));
  app.use(express.json({ limit: '32kb' }));

  const limite = rateLimit({ windowMs: 60_000, limit: opcoes.limitePorMinuto ?? 60, standardHeaders: 'draft-8', legacyHeaders: false, message: { erro: 'muitas_requisicoes' } });

  app.get('/saude', async (_req, res) => {
    const ok = await repos.saudavel().catch(() => false);
    res.status(ok ? 200 : 503).json({ ok });
  });

  /** Conteúdo versionado (perguntas, textos, missões). ETag = versão, para o app baixar só quando mudar. */
  app.get('/v1/conteudo', async (req, res) => {
    const c = await repos.conteudo.atual();
    if (!c) return res.status(404).json({ erro: 'sem_conteudo' });
    const etag = `"${c.versao}"`;
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=300');
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.json(c);
  });

  /** Eventos anônimos de uso. Idempotente pelo id de cada evento. */
  app.post('/v1/eventos', limite, async (req, res) => {
    const r = LoteEventos.safeParse(req.body);
    if (!r.success) return invalido(res, r.error);
    const { novos, duplicados } = await repos.eventos.inserir(r.data.instalacaoId, r.data.versaoApp, r.data.eventos);
    res.status(202).json({ novos, duplicados });
  });

  /** Registra o código CONECTA-XXXX quando a família abre o WhatsApp, para a equipe reconhecer o contato. */
  app.post('/v1/leads', limite, async (req, res) => {
    const r = NovoLead.safeParse(req.body);
    if (!r.success) return invalido(res, r.error);
    const { criado, lead } = await repos.leads.registrar(r.data);
    if (criado) log.info('lead novo', { codigo: lead.codigo, origem: lead.origem });
    res.status(criado ? 201 : 200).json(lead);
  });

  /** Pré-cadastro da lista de espera (landing page). Consentimento LGPD obrigatório. Idempotente pelo WhatsApp. */
  app.post('/v1/pre-cadastro', limite, async (req, res) => {
    const r = PreCadastro.safeParse(req.body);
    if (!r.success) return invalido(res, r.error);
    const { criado } = await repos.preCadastros.registrar(r.data);
    if (criado) log.info('pre-cadastro novo', { faixa: r.data.faixa, origem: r.data.origem ?? 'landing' });
    res.status(criado ? 201 : 200).json({ ok: true, novo: criado });
  });

  /** Lista da equipe: contatos interessados no app. Protegida por chave. */
  app.get('/v1/pre-cadastros', limite, async (req, res) => {
    if (!chaveConfere(req.header('x-api-key'), opcoes.adminApiKey)) return res.status(401).json({ erro: 'nao_autorizado' });
    const limiteN = Math.min(500, Math.max(1, Number(req.query.limite) || 200));
    res.json({ total: await repos.preCadastros.listar(limiteN) });
  });

  /** Consulta da equipe: "esse código veio do app?". Protegida por chave. */
  app.get('/v1/leads/:codigo', limite, async (req, res) => {
    if (!chaveConfere(req.header('x-api-key'), opcoes.adminApiKey)) return res.status(401).json({ erro: 'nao_autorizado' });
    const lead = await repos.leads.buscar(String(req.params.codigo).toUpperCase());
    if (!lead) return res.status(404).json({ erro: 'nao_encontrado' });
    res.json(lead);
  });

  app.use((_req, res) => res.status(404).json({ erro: 'rota_inexistente' }));

  // erros inesperados: loga sem corpo da requisição e responde genérico
  app.use((erro: Error & { type?: string; status?: number }, req: Request, res: Response, _next: NextFunction) => {
    if (erro.type === 'entity.parse.failed') return res.status(400).json({ erro: 'json_invalido' });
    if (erro.type === 'entity.too.large') return res.status(413).json({ erro: 'muito_grande' });
    log.error('erro na rota', { rota: req.path, metodo: req.method, erro: erro.message });
    res.status(500).json({ erro: 'interno' });
  });

  return app;
}
