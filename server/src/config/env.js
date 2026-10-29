import 'dotenv/config';

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  caseTokenSecret: process.env.CASE_TOKEN_SECRET || 'local-development-secret-change-me',
  useMockGenerator: process.env.USE_MOCK_GENERATOR !== 'false'
};

export const allowedOrigins = env.clientOrigin.split(',').map(origin => origin.trim()).filter(Boolean);

if (env.nodeEnv === 'production') {
  const invalidOrigins = allowedOrigins.some(origin => {
    try { return new URL(origin).protocol !== 'https:'; } catch { return true; }
  });
  if (!env.mongoUri || !env.geminiApiKey || env.caseTokenSecret.length < 32 || invalidOrigins) {
    throw new Error('Production requires MONGODB_URI, GEMINI_API_KEY, a CASE_TOKEN_SECRET of at least 32 characters, and HTTPS CLIENT_ORIGIN value(s).');
  }
}
