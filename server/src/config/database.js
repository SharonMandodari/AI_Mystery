import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    if (env.nodeEnv === 'production') throw new Error('MONGODB_URI is required in production.');
    console.warn('MONGODB_URI is not configured. API persistence is unavailable until MongoDB is configured.');
    return false;
  }
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });
  } catch (cause) {
    const authenticationFailure = cause?.code === 18 || /authentication failed|bad auth/i.test(cause?.message || '');
    const dnsFailure = /ENOTFOUND|querySrv|ENODATA|ECONNREFUSED/i.test(cause?.message || '') || /ENOTFOUND|ENODATA/.test(cause?.cause?.code || '');
    const message = authenticationFailure
      ? 'MongoDB authentication failed. Check the Atlas database username/password and URL-encode any special characters in the password.'
      : dnsFailure
        ? 'MongoDB host lookup or connection failed. Check the Atlas cluster hostname, internet/DNS access, and Atlas Network Access IP allowlist.'
        : 'MongoDB could not select a reachable Atlas server. Check Atlas Network Access includes this machine’s public IP, then confirm the cluster is active and the URI is correct.';
    const error = new Error(message, { cause });
    error.code = 'DATABASE_CONNECTION_FAILED';
    throw error;
  }
  console.log('Connected to MongoDB');
  return true;
}
