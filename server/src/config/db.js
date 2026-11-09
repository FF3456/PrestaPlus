import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
  console.log(`[db] MongoDB conectado: ${mongoose.connection.name}`);
  mongoose.connection.on('error', (e) => console.error('[db] error', e));
  mongoose.connection.on('disconnected', () => console.warn('[db] desconectado'));
}

export const disconnectDB = () => mongoose.disconnect();
