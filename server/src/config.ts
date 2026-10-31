import { z } from 'zod';

const Esquema = z.object({
  PORT: z.coerce.number().int().positive().default(3333),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI é obrigatória'),
  ADMIN_API_KEY: z.string().min(24, 'ADMIN_API_KEY precisa de pelo menos 24 caracteres'),
  CORS_ORIGENS: z.string().default(''),
});

export type Config = { porta: number; mongoUri: string; adminApiKey: string; corsOrigens: string[] };

export function lerConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const r = Esquema.safeParse(env);
  if (!r.success) {
    const faltando = r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Configuração inválida: ${faltando}`);
  }
  return {
    porta: r.data.PORT,
    mongoUri: r.data.MONGODB_URI,
    adminApiKey: r.data.ADMIN_API_KEY,
    corsOrigens: r.data.CORS_ORIGENS.split(',').map((s) => s.trim()).filter(Boolean),
  };
}
