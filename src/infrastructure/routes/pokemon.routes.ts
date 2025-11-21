import { Router, Request, Response, NextFunction } from 'express';
import { PokemonController } from '../../interface-adapters/controllers/pokemon.controller';
import { plainToInstance } from 'class-transformer';
import { validateDto } from '../../shared/validation/validate-dto';
import { ListPokemonQueryDTO } from '../../application/dto/list-pokemon-query.dto';

export function createPokemonRouter(
  pokemonController: PokemonController,
): Router {
  const router = Router();

  // GET /api/pokemon?limit=50&offset=0 (capped to first 150)
  router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const dto = plainToInstance(ListPokemonQueryDTO, {
          limit: req.query.limit,
          offset: req.query.offset,
        });
        await validateDto(dto);

        const MAX_TOTAL = 150;
        const offset = dto.offset;

        if (offset >= MAX_TOTAL) {
          res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
          res.set('Vary', 'Accept-Encoding');
          return res.json({ items: [], hasMore: false, nextOffset: null });
        }

        const effectiveLimit = Math.min(dto.limit, Math.max(0, MAX_TOTAL - offset));

        const items = await pokemonController.listFirstGeneration(
          effectiveLimit,
          offset,
        );

        const totalSoFar = offset + items.length;
        const hasMore = totalSoFar < MAX_TOTAL && items.length === effectiveLimit;
        const nextOffset = hasMore ? totalSoFar : null;
        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
        res.set('Vary', 'Accept-Encoding');
        res.json({ items, hasMore, nextOffset });
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/pokemon/:nameOrId
  router.get(
    '/:nameOrId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { nameOrId } = req.params;
        const data = await pokemonController.getDetails(nameOrId);
        res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400');
        res.set('Vary', 'Accept-Encoding');
        res.json(data);
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
