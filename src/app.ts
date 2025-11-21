import { PokeApiGateway } from './infrastructure/http/pokemon-apigateway.http';
import { FavoriteRepository } from './infrastructure/db/repository/favorite.repository';

import { ListPokemonUseCase } from './application/use-cases/list-pokemon.usecase';
import { GetPokemonDetailsUseCase } from './application/use-cases/get-pokemon-details.usecase';
import { AddFavoriteUseCase } from './application/use-cases/add-favorite.usecase';
import { ListFavoritesUseCase } from './application/use-cases/list-favorites.usecase';
import { RemoveFavoriteUseCase } from './application/use-cases/remove-favorite.usecase';

import { PokemonController } from './interface-adapters/controllers/pokemon.controller';
import { FavoriteController } from './interface-adapters/controllers/favorite.controller';

import { ExpressAppFactory } from './infrastructure/web/express-app-factory.web';

export function buildApp() {
  // infra
  const pokemonGateway = new PokeApiGateway();
  const favoriteRepository = new FavoriteRepository();

  // use cases
  const listPokemonUseCase = new ListPokemonUseCase(pokemonGateway);
  const getPokemonDetailsUseCase = new GetPokemonDetailsUseCase(
    pokemonGateway,
  );
  const addFavoriteUseCase = new AddFavoriteUseCase(favoriteRepository);
  const listFavoritesUseCase = new ListFavoritesUseCase(
    favoriteRepository,
  );
  const removeFavoriteUseCase = new RemoveFavoriteUseCase(
    favoriteRepository,
  );

  // controllers (framework-agnostic)
  const pokemonController = new PokemonController(
    listPokemonUseCase,
    getPokemonDetailsUseCase,
  );
  const favoriteController = new FavoriteController(
    addFavoriteUseCase,
    listFavoritesUseCase,
    removeFavoriteUseCase,
  );

  // express app
  const app = ExpressAppFactory.create(
    pokemonController,
    favoriteController,
  );

  return app;
}
