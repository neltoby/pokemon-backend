import { IFavoriteRepository } from '../../../domain/repositories/interface/favorite-repository.interface';
import { Favorite } from '../../../domain/entities/favorite.entity';
import { FavoriteModel } from '../models/favorite.model';

export class FavoriteRepository implements IFavoriteRepository {
  async add(favorite: Favorite): Promise<Favorite> {
    const doc = new FavoriteModel({
      pokemonId: favorite.pokemonId,
      pokemonName: favorite.pokemonName,
      createdAt: favorite.createdAt,
    });

    const saved = await doc.save();

    return Favorite.fromPrimitives({
      id: saved.id,
      pokemonId: saved.pokemonId,
      pokemonName: saved.pokemonName,
      createdAt: saved.createdAt,
    });
  }

  async removeByPokemonId(pokemonId: number): Promise<void> {
    await FavoriteModel.deleteOne({ pokemonId }).exec();
  }

  async findAll(): Promise<Favorite[]> {
    const docs = await FavoriteModel.find()
      .sort({ createdAt: -1 })
      .select('pokemonId pokemonName createdAt')
      .lean()
      .exec();
    return docs.map((doc: any) =>
      Favorite.fromPrimitives({
        id: doc._id ? String(doc._id) : undefined,
        pokemonId: doc.pokemonId,
        pokemonName: doc.pokemonName,
        createdAt: doc.createdAt,
      }),
    );
  }

  async existsByPokemonId(pokemonId: number): Promise<boolean> {
    const exists = await FavoriteModel.exists({ pokemonId }).lean().exec();
    return !!exists;
  }
}
