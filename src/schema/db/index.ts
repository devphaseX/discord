import { parsedEnv } from '@/config/env';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../tables';

declare global {
  var queryClient: postgres.Sql<{}>;
}

const queryClient =
  globalThis.queryClient ??
  (globalThis.queryClient = postgres(parsedEnv.DATABASE_URL, {
    ssl: 'require',
    max: 1,
  }));
const db = drizzle(queryClient, { schema });

export { db };
