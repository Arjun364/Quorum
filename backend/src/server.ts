import { createApp } from './app';
import { loadConfig, loadEnvFile } from './config';
import { createRateLimiters } from './middlewares';
import { createPrismaClients } from './prisma';
import { createRepositories } from './repositories';
import { createServices } from './services';
import { createLogger } from './utils';

const logger = createLogger('Server');

/** Starts the API: loads settings, connects to the database, creates the bootstrap owner if needed, and listens. */
async function main(): Promise<void> {
  loadEnvFile();
  const config = loadConfig();

  const { raw } = createPrismaClients();
  const repos = createRepositories(raw);
  const services = createServices(repos, config);
  await raw.$connect();
  await services.bootstrap.run();

  const app = createApp({
    config,
    services,
    users: repos.users,
    companies: repos.companies,
    checkDatabase: async () => {
      await raw.$queryRaw`SELECT 1`;
    },
    rateLimiters: createRateLimiters(),
  });

  const server = app.listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port}/api`);
  });

  /** Stops accepting requests, then closes the database connection. */
  const shutdown = (signal: string): void => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      void raw.$disconnect().finally(() => process.exit(0));
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error: unknown) => {
  logger.error('Failed to start', error);
  process.exit(1);
});
