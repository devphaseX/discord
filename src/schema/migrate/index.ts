import { parsedEnv } from '../../config/env';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import path from 'path';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

const migrationClient = postgres(parsedEnv.DATABASE_URL, {
  max: 1,
  ssl: 'require',
});
const db: PostgresJsDatabase = drizzle(migrationClient);

(async () => {
  try {
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, '..', 'migrations'),
    });
    console.log('migration completed');
  } catch (e) {
    console.log('failed to complete migration');
    console.log(e);
  } finally {
    process.exit(0);
  }
})();
