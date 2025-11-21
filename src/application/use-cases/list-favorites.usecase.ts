import { IFavoriteRepository } from '../../domain/repositories/interface/favorite-repository.interface';

export class ListFavoritesUseCase {
  constructor(private readonly favoriteRepository: IFavoriteRepository) {}

  async execute() {
    const favorites = await this.favoriteRepository.findAll();
    return favorites.map(f => f.toPrimitives());
  }
}
