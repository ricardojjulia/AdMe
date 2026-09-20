#!/usr/bin/env node

/**
 * Safe Database Query Helper Script
 * 
 * Enforces strict timeouts and process termination to prevent hanging network handles.
 * Usage:
 *   node scripts/db-query.mjs "SELECT id, name, email, rewards_balance FROM users"
 */

import pg from 'pg';

const query = process.argv[2];

if (!query) {
  console.error('Usage: node scripts/db-query.mjs "<SQL QUERY>"');
  process.exit(1);
}

// Watchdog timer: hard kill after 8 seconds
const watchdog = setTimeout(() => {
  console.error('❌ Timed out waiting for database query to finish (watchdog limit: 8s).');
  process.exit(1);
}, 8000);
watchdog.unref();

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:53322/postgres';

async function main() {
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 3000,
    query_timeout: 5000,
  });

  try {
    await client.connect();
    const res = await client.query(query);
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Query error:', err.message);
    try {
      await client.end();
    } catch (_) {}
    process.exit(1);
  }
}

main();
