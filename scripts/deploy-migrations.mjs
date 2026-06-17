#!/usr/bin/env node

import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';

const { Pool } = pg;

async function main() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:53322/postgres';
  console.log('Deploying all database migrations in sequence...');
  
  const pool = new Pool({
    connectionString,
    max: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

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

      await pool.query(sqlContent);
      console.log(`Migration ${file} applied successfully.`);
    }

    console.log('All migrations deployed successfully!');
  } catch (error) {
    console.error('Failed to deploy migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
