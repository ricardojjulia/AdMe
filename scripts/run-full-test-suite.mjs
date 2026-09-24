#!/usr/bin/env node

/**
 * AdMe Unified Full-Stack Test Suite & Verification Orchestrator
 * 
 * Runs the comprehensive 6-tier software verification pipeline:
 * 1. Version Consistency Check
 * 2. Static Analysis & Lint (ESLint)
 * 3. Strict TypeScript Typecheck
 * 4. Data Isolation & RLS Security Audit (PostgreSQL)
 * 5. Vitest Unit, Integration, and Localization Suites
 * 6. Playwright End-to-End Browser Test Suite
 * 
 * Exits with code 0 on 100% success, code 1 on any failure.
 */

import { spawn } from 'child_process';
import path from 'path';

const TIERS = [
  {
    id: 'version',
    name: 'Tier 1: Version Consistency Verification',
    command: 'node',
    args: ['scripts/check-version.mjs'],
  },
  {
    id: 'lint',
    name: 'Tier 2: Static Analysis & Code Hygiene (ESLint)',
    command: 'npm',
    args: ['run', 'lint'],
  },
  {
    id: 'typecheck',
    name: 'Tier 3: Strict TypeScript Compilation (tsc --noEmit)',
    command: 'npm',
    args: ['run', 'typecheck'],
  },
  {
    id: 'rls',
    name: 'Tier 4: Data Isolation & Row-Level Security Audit',
    command: 'npm',
    args: ['run', 'audit:rls'],
  },
  {
    id: 'unit_integration',
    name: 'Tier 5: Vitest Unit, API Integration & i18n Suite',
    command: 'npm',
    args: ['run', 'test:ci'],
  },
  {
    id: 'e2e',
    name: 'Tier 6: Playwright End-to-End Browser Test Suite',
    command: 'npm',
    args: ['run', 'test:e2e'],
  },
];

function runCommand(command, args, name) {
  return new Promise((resolve) => {
    const start = Date.now();
    console.log(`\n===============================================================`);
    console.log(`🚀 Starting: ${name}`);
    console.log(`Command: ${command} ${args.join(' ')}`);
    console.log(`===============================================================`);

    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, CI: process.env.CI || 'true' },
    });

    child.on('close', (code) => {
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      if (code === 0) {
        console.log(`✅ ${name} PASSED in ${duration}s`);
        resolve({ success: true, duration });
      } else {
        console.error(`❌ ${name} FAILED with exit code ${code} after ${duration}s`);
        resolve({ success: false, duration, code });
      }
    });

    child.on('error', (err) => {
      const duration = ((Date.now() - start) / 1000).toFixed(2);
      console.error(`❌ ${name} crashed with error: ${err.message}`);
      resolve({ success: false, duration, error: err });
    });
  });
}

async function main() {
  const suiteStart = Date.now();
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                AdMe Full Software Verification Suite            ║
║  Comprehensive Testing, Security, API & Browser Release Gate   ║
╚════════════════════════════════════════════════════════════════╝
`);

  const results = [];

  for (const tier of TIERS) {
    const result = await runCommand(tier.command, tier.args, tier.name);
    results.push({ ...tier, ...result });

    if (!result.success) {
      console.error(`\n🚨 Release verification STOPPED at ${tier.name}.`);
      console.error(`Fix the failure above before attempting release.`);
      printSummary(results, suiteStart, false);
      process.exit(1);
    }
  }

  printSummary(results, suiteStart, true);
  process.exit(0);
}

function printSummary(results, suiteStart, passed) {
  const totalDuration = ((Date.now() - suiteStart) / 1000).toFixed(2);
  console.log(`\n┌────────────────────────────────────────────────────────────┬──────────┬──────────┐`);
  console.log(`│ Verification Tier                                          │ Status   │ Duration │`);
  console.log(`├────────────────────────────────────────────────────────────┼──────────┼──────────┤`);

  for (const r of results) {
    const status = r.success ? '✅ PASS' : '❌ FAIL';
    console.log(
      `│ ${r.name.padEnd(58)} │ ${status.padEnd(8)} │ ${(r.duration + 's').padStart(8)} │`
    );
  }

  console.log(`└────────────────────────────────────────────────────────────┴──────────┴──────────┘`);
  if (passed) {
    console.log(`\n🎉 ALL 6 VERIFICATION TIERS PASSED in ${totalDuration}s. Ready for release.`);
  } else {
    console.log(`\n⚠️ Verification failed after ${totalDuration}s.`);
  }
}

main();
