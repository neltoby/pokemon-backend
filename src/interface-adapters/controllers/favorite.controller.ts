import { AddFavoriteUseCase } from '../../application/use-cases/add-favorite.usecase';
import { ListFavoritesUseCase } from '../../application/use-cases/list-favorites.usecase';
import { RemoveFavoriteUseCase } from '../../application/use-cases/remove-favorite.usecase';
import { AddFavoriteDTO } from '../../application/dto/add-favorite.dto';

export class FavoriteController {
  constructor(
    private readonly addFavoriteUseCase: AddFavoriteUseCase,
    private readonly listFavoritesUseCase: ListFavoritesUseCase,
    private readonly removeFavoriteUseCase: RemoveFavoriteUseCase,
  ) {}

  async listFavorites() {
    return this.listFavoritesUseCase.execute();
  }

  async addFavorite(input: AddFavoriteDTO) {
    const favorite = await this.addFavoriteUseCase.execute(input);
    return favorite ? favorite.toPrimitives() : null;
  }

  async removeFavorite(pokemonId: number) {
    await this.removeFavoriteUseCase.execute(pokemonId);
  }
}
