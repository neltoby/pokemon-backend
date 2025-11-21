import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import { createPokemonRouter } from '../routes/pokemon.routes';
import { createFavoriteRouter } from '../routes/favorite.routes';
import { PokemonController } from '../../interface-adapters/controllers/pokemon.controller';
import { FavoriteController } from '../../interface-adapters/controllers/favorite.controller';
import { errorHandler } from '../../interfaces/http/middleware/error-handler.middleware';
import { notFoundHandler } from '../../interfaces/http/middleware/not-found-handler.middleware';
import rateLimit from 'express-rate-limit';

export class ExpressAppFactory {
  static create(
    pokemonController: PokemonController,
    favoriteController: FavoriteController,
  ): Application {
    const app = express();

    // Hide Express signature
    app.disable('x-powered-by');
    app.use((_req, res, next) => {
      res.removeHeader('X-Powered-By');
      res.removeHeader('Server');
      next();
    });

    app.use(cors());
    app.use(express.json({ limit: '100kb' }));
    app.use(compression());
    if (process.env.NODE_ENV !== 'production') {
      app.use(morgan('dev'));
    }
    app.set('etag', 'strong');

    app.get('/health', (_req, res) => res.json({ status: 'ok' }));
    // Apply rate limit to PokéAPI-proxy routes
    const readLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false });
    app.use('/api/pokemon', readLimiter, createPokemonRouter(pokemonController));
    app.use('/api/favorites', createFavoriteRouter(favoriteController));

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
  }
}
