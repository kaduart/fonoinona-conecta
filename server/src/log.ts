// Log em JSON de uma linha, fácil de ler em qualquer hospedagem. Nunca registrar corpo de requisição.
type Nivel = 'info' | 'warn' | 'error';

function escrever(nivel: Nivel, msg: string, extra?: Record<string, unknown>) {
  const linha = JSON.stringify({ t: new Date().toISOString(), nivel, msg, ...extra });
  if (nivel === 'error') console.error(linha);
  else console.log(linha);
}

export const log = {
  info: (msg: string, extra?: Record<string, unknown>) => escrever('info', msg, extra),
  warn: (msg: string, extra?: Record<string, unknown>) => escrever('warn', msg, extra),
  error: (msg: string, extra?: Record<string, unknown>) => escrever('error', msg, extra),
};
