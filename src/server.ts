import 'reflect-metadata';
import { env } from './config/env';
import { connectMongo } from './config/db';
import { buildApp } from './app';

async function bootstrap() {
  await connectMongo();

  const app = buildApp();

  const port = env.PORT || 4000;

  app.listen(port, () => {
    console.log(
      `[Server] Listening on port ${env.PORT} (${env.NODE_ENV})`,
    );
  });
}

bootstrap().catch(err => {
  console.error('[Server] Fatal error', err);
  process.exit(1);
});
