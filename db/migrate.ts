import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL!;

async function runMigrations() {
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './drizzle/migrations' });
  console.log('Migrations complete!');

  await client.end();
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
