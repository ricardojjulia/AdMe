#!/usr/bin/env node

/**
 * Data Isolation & Row-Level Security (RLS) Audit Script
 * 
 * Verifies that:
 * 1. Every application table in the public schema has Row-Level Security enabled (relrowsecurity = true).
 * 2. Every table has active RLS policies defined in pg_policy.
 * 
 * Exits with code 0 on success, code 1 on any violation.
 */

import pg from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:53322/postgres';

async function runAudit() {
  console.log('🔍 Starting Data Isolation & RLS Security Audit...');
  console.log(`📡 Connecting to PostgreSQL target: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  try {
    await client.connect();
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL database:', err.message);
    console.error('👉 Ensure PostgreSQL is running or DATABASE_URL is set.');
    process.exit(1);
  }

  try {
    // Query public tables and their RLS status from pg_tables and pg_class
    const tablesQuery = `
      SELECT 
        c.relname AS table_name,
        c.relrowsecurity AS rls_enabled,
        c.relforcerowsecurity AS rls_forced,
        COUNT(p.polname) AS policy_count
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_policy p ON p.polrelid = c.oid
      WHERE n.nspname = 'public' 
        AND c.relkind = 'r'
        AND c.relname NOT LIKE 'pg_%'
        AND c.relname NOT IN ('schema_migrations', '_prisma_migrations')
      GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
      ORDER BY c.relname ASC;
    `;

    const res = await client.query(tablesQuery);
    const tables = res.rows;

    if (tables.length === 0) {
      console.warn('⚠️ No public user tables found in database. Check that migrations have been applied.');
      // If migrations haven't run, this is a failure in audit
      process.exit(1);
    }

    console.log('\n┌────────────────────────────────────────┬─────────────┬──────────────┬──────────────┐');
    console.log('│ Table Name                             │ RLS Enabled │ Policies     │ Status       │');
    console.log('├────────────────────────────────────────┼─────────────┼──────────────┼──────────────┤');

    let failureCount = 0;

    for (const row of tables) {
      const isRls = row.rls_enabled === true;
      const policies = parseInt(row.policy_count, 10);
      const isCompliant = isRls && policies > 0;

      if (!isCompliant) {
        failureCount++;
      }

      const status = isCompliant ? '✅ PASS' : '❌ FAIL';
      const rlsStr = isRls ? 'ENABLED' : 'DISABLED';

      console.log(
        `│ ${row.table_name.padEnd(38)} │ ${rlsStr.padEnd(11)} │ ${String(policies).padStart(6)} pols   │ ${status.padEnd(12)} │`
      );
    }

    console.log('└────────────────────────────────────────┴─────────────┴──────────────┴──────────────┘\n');

    if (failureCount > 0) {
      console.error(`❌ Security Audit FAILED: ${failureCount} table(s) lack proper RLS enforcement or policies.`);
      process.exit(1);
    }

    console.log(`✅ Security Audit PASSED: All ${tables.length} tables have Row-Level Security enabled with active policies.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Audit execution error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runAudit();
