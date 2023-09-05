import { parsedEnv } from '@/config/env';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../tables';

const queryClient = postgres(parsedEnv.DATABASE_URL);
const db = drizzle(queryClient, { schema });

export { db };
