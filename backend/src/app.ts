import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { errorHandler, notFoundHandler } from './middlewares';
import { createApiRouter, type AppDependencies } from './routes';

/** Builds the Express application: security headers, body and cookie parsing, the /api routes and error handling. */
export function createApp(deps: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  if (deps.config.trustProxy) app.set('trust proxy', 1);

  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.use('/api', createApiRouter(deps));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
