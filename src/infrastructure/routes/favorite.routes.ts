import { Router, Request, Response, NextFunction } from 'express';
import { plainToInstance } from 'class-transformer';
import { FavoriteController } from '../../interface-adapters/controllers/favorite.controller';
import { AddFavoriteDTO } from '../../application/dto/add-favorite.dto';
import { validateDto } from '../../shared/validation/validate-dto';
import { DeleteFavoriteDTO } from '../../application/dto/delete-favorite.dto';



export function createFavoriteRouter(
  favoriteController: FavoriteController,
): Router {
  const router = Router();

  // GET /api/favorites
  router.get(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const favorites = await favoriteController.listFavorites();
        res.json(favorites);
      } catch (err) {
        next(err);
      }
    },
  );

  // POST /api/favorites
  // body: { pokemonId: number, pokemonName: string }
  router.post(
    '/',
    async (req: Request, res: Response, next: NextFunction) => {
      try {


         const dto = plainToInstance(AddFavoriteDTO, req.body);

        // validate with class-validator (infra helper)
        await validateDto(dto);

        const { pokemonId, pokemonName } = req.body;

        const favorite = await favoriteController.addFavorite({
          pokemonId,
          pokemonName,
        });

        res.status(201).json(favorite);
      } catch (err) {
        next(err);
      }
    },
  );

  // DELETE /api/favorites/:pokemonId
  router.delete(
    '/:pokemonId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Parse param (strings in Express) into number before DTO validation
        const pokemonId = Number.parseInt(req.params.pokemonId, 10);
        const dto = plainToInstance(DeleteFavoriteDTO, { pokemonId });

        // validate with class-validator (infra helper)
        await validateDto(dto);

        await favoriteController.removeFavorite(dto.pokemonId);
        res.status(204).send();
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
