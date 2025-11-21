import { IFavoriteRepository } from '../../domain/repositories/interface/favorite-repository.interface';

export class RemoveFavoriteUseCase {
  constructor(private readonly favoriteRepository: IFavoriteRepository) {}

  async execute(pokemonId: number) {
    await this.favoriteRepository.removeByPokemonId(pokemonId);
  }
}
