import { criarApp } from './app.js';
import { lerConfig } from './config.js';
import { log } from './log.js';
import { conectar, desconectar, reposMongo } from './mongo.js';

async function iniciar() {
  const config = lerConfig();
  await conectar(config.mongoUri);
  const app = criarApp(reposMongo(), { adminApiKey: config.adminApiKey, corsOrigens: config.corsOrigens });
  const servidor = app.listen(config.porta, () => log.info('api no ar', { porta: config.porta }));

  const encerrar = (sinal: string) => {
    log.info('encerrando', { sinal });
    servidor.close(() => desconectar().finally(() => process.exit(0)));
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => encerrar('SIGTERM'));
  process.on('SIGINT', () => encerrar('SIGINT'));
}

iniciar().catch((e) => {
  log.error('falha ao iniciar', { erro: e instanceof Error ? e.message : String(e) });
  process.exit(1);
});
