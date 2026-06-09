#!/usr/bin/env node

import { getPool, closePool } from '../src/lib/i18n/adapter.ts';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL environment variable is required.');
    process.exit(1);
  }

  console.log('Deploying all database migrations in sequence to remote database...');
  const pool = getPool();

  try {
    const migrationsDir = path.resolve('supabase/migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort(); // Sort alphabetically (by timestamp prefix) to maintain dependency order

    console.log(`Found ${files.length} migrations to deploy.`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      console.log(`Applying migration: ${file}`);
      const sqlContent = fs.readFileSync(filePath, 'utf8');

      // We run each migration file
      // Note: we can split statements or run them as a single query block
      await pool.query(sqlContent);
      console.log(`Migration ${file} applied successfully.`);
    }

    console.log('All migrations deployed successfully!');
  } catch (error) {
    console.error('Failed to deploy migrations:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
