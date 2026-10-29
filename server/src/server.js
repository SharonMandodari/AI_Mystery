import app from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

try {
  await connectDatabase();
} catch (error) {
  console.error(`[startup] ${error.message}`);
  process.exit(1);
}

app.listen(env.port, '0.0.0.0', ()=>console.log(`AI Mystery Room API listening on port ${env.port}`));
