import { parsedEnv } from './src/config/env';
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/tables/index.ts',
  out: './src/schema/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: parsedEnv.DATABASE_URL,
  },
} satisfies Config;
