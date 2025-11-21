import mongoose from 'mongoose';
import { env } from './env';
import { FavoriteModel } from '../infrastructure/db/models/favorite.model';

export async function connectMongo(): Promise<void> {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 20,
    });
    console.log('[MongoDB] Connected');
    await FavoriteModel.syncIndexes();
    console.log('[MongoDB] Indexes synced');
  } catch (err) {
    console.error('[MongoDB] Connection error', err);
    process.exit(1);
  }
}
