// Publica no banco a versão atual do conteúdo. Idempotente: rodar de novo com a mesma versão só atualiza.
// Uso: npm run seed:conteudo   (lê MONGODB_URI do .env)
import { lerConfig } from '../src/config.js';
import { log } from '../src/log.js';
import { conectar, desconectar, reposMongo } from '../src/mongo.js';
import { montarConteudo } from './conteudo.js';

const config = lerConfig();
await conectar(config.mongoUri);
const c = montarConteudo();
await reposMongo().conteudo.publicar(c);
log.info('conteúdo publicado', { versao: c.versao });
await desconectar();
