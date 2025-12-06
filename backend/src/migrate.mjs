import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './models/db.mjs';

async function runMigrations() {
  console.log('Running migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
  } finally {
    process.exit(0);
  }
}

runMigrations();
