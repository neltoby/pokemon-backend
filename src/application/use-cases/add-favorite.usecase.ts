import { IFavoriteRepository } from '../../domain/repositories/interface/favorite-repository.interface';
import { AddFavoriteDTO } from '../dto/add-favorite.dto';
import { Favorite } from '../../domain/entities/favorite.entity';

export class AddFavoriteUseCase {
  constructor(private readonly favoriteRepository: IFavoriteRepository) {}

  async execute(input: AddFavoriteDTO) {
    const exists = await this.favoriteRepository.existsByPokemonId(
      input.pokemonId,
    );
    if (exists) {
      // idempotent add
      return;
    }

    const favorite = new Favorite({
      pokemonId: input.pokemonId,
      pokemonName: input.pokemonName,
    });

    const saved = await this.favoriteRepository.add(favorite);
    return saved;
  }
}
