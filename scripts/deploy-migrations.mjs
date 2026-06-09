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

  console.log('Deploying localization governance migrations to remote database...');
  const pool = getPool();

  try {
    const migrationPath = path.resolve('supabase/migrations/20260609000000_localization_governance.sql');
    console.log(`Reading migration file: ${migrationPath}`);
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');

    console.log('Executing SQL migration script on remote database...');
    await pool.query(sqlContent);
    console.log('Migrations deployed successfully!');
  } catch (error) {
    console.error('Failed to deploy migrations:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
