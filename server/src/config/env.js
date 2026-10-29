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

if (env.nodeEnv === 'production' && (!env.mongoUri || !env.geminiApiKey || env.caseTokenSecret.includes('change-me'))) {
  throw new Error('Production requires MONGODB_URI, GEMINI_API_KEY, and a strong CASE_TOKEN_SECRET.');
}
