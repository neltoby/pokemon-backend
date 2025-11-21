import { Favorite } from '../../entities/favorite.entity';

export interface IFavoriteRepository {
  add(favorite: Favorite): Promise<Favorite>;
  removeByPokemonId(pokemonId: number): Promise<void>;
  findAll(): Promise<Favorite[]>;
  existsByPokemonId(pokemonId: number): Promise<boolean>;
}
