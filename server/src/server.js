import app from './app.js';
import { assertEnv, env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { syncLoanStatuses } from './services/loanService.js';

const MAINTENANCE_EVERY_MS = 30 * 60 * 1000;

async function main() {
  assertEnv();
  await connectDB();

  // RF-011/012 · Marca vencidos y emite avisos de vencimiento próximo
  const maintenance = async () => {
    try {
      const r = await syncLoanStatuses();
      if (r.overdue || r.dueSoon) console.log(`[jobs] vencidos: ${r.overdue}, por vencer notificados: ${r.dueSoon}`);
    } catch (err) {
      console.error('[jobs] error de mantenimiento', err.message);
    }
  };
  await maintenance();
  const timer = setInterval(maintenance, MAINTENANCE_EVERY_MS);

  const server = app.listen(env.port, () => {
    console.log(`[api] PRESTA+ escuchando en http://localhost:${env.port}  ·  Swagger: /api-docs`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} recibido, cerrando…`);
    clearInterval(timer);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[api] No se pudo iniciar:', err.message);
  process.exit(1);
});
