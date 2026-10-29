import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    if (env.nodeEnv === 'production') throw new Error('MONGODB_URI is required in production.');
    console.warn('MONGODB_URI is not configured. API persistence is unavailable until MongoDB is configured.');
    return false;
  }
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('Connected to MongoDB');
  return true;
}
