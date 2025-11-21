export class Favorite {
  private _id?: string;
  private _pokemonId: number;
  private _pokemonName: string;
  private _createdAt: Date;

  constructor(params: {
    id?: string;
    pokemonId: number;
    pokemonName: string;
    createdAt?: Date;
  }) {
    if (!params.pokemonName) {
      throw new Error('Favorite must have a pokemonName');
    }
    this._id = params.id;
    this._pokemonId = params.pokemonId;
    this._pokemonName = params.pokemonName.toLowerCase();
    this._createdAt = params.createdAt ?? new Date();
  }

  get id() {
    return this._id;
  }

  get pokemonId() {
    return this._pokemonId;
  }

  get pokemonName() {
    return this._pokemonName;
  }

  get createdAt() {
    return this._createdAt;
  }

  toPrimitives() {
    return {
      id: this._id,
      pokemonId: this._pokemonId,
      pokemonName: this._pokemonName,
      createdAt: this._createdAt,
    };
  }

  static fromPrimitives(data: {
    id?: string;
    pokemonId: number;
    pokemonName: string;
    createdAt?: Date;
  }) {
    return new Favorite(data);
  }
}
