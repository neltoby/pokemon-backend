import { Schema, model, Document } from 'mongoose';

export interface FavoriteDocument extends Document {
  pokemonId: number;
  pokemonName: string;
  createdAt: Date;
}

const FavoriteSchema = new Schema<FavoriteDocument>(
  {
    pokemonId: { type: Number, required: true, unique: true },
    pokemonName: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: 'favorites',
    timestamps: false,
  },
);


export const FavoriteModel = model<FavoriteDocument>(
  'Favorite',
  FavoriteSchema,
);
