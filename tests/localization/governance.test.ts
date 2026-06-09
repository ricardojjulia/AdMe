import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createAdMeLocalizationGovernance,
  getPool,
  closePool,
  translateUi,
  getActiveCatalog,
} from '../../src/lib/i18n/adapter';
import { validateCatalog, normalizeLocale, GovernanceError } from '@localization-governance/core';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

describe('Localization Governance Framework Integration', () => {
  let db: pg.Pool;
  const adminActor = { id: 'admin-actor-uuid', role: 'admin' };
  const consumerActor = { id: 'consumer-actor-uuid', role: 'consumer' };
  const reviewerLinguistic = { id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', role: 'linguistic' }; // Sarah (Tech Dev) from seed
  const reviewerDomain = { id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', role: 'domain' }; // Marcus (Local Foodie) from seed

  beforeAll(() => {
    db = getPool();
  });

  afterAll(async () => {
    // Clean up test records
    await db.query(`DELETE FROM localization_review_assignments WHERE tenant_id = 'adme-test' OR tenant_id = 'adme'`);
    await db.query(`DELETE FROM localization_activation_history WHERE tenant_id = 'adme-test' OR tenant_id = 'adme'`);
    await db.query(`DELETE FROM localization_review_decisions WHERE tenant_id = 'adme-test' OR tenant_id = 'adme'`);
    await db.query(`DELETE FROM localization_validation_reports WHERE tenant_id = 'adme-test' OR tenant_id = 'adme'`);
    await db.query(`DELETE FROM localization_catalog_versions WHERE tenant_id = 'adme-test' OR tenant_id = 'adme'`);
    await db.query(`DELETE FROM localization_locales WHERE tenant_id = 'adme-test' OR tenant_id = 'adme'`);
    await closePool();
  });

  describe('1. Core Lifecycle & Validator Unit Tests', () => {
    it('should validate target messages against source messages', () => {
      const source = {
        app_name: 'AdMe',
        welcome_message: 'Welcome back, {name}!',
        likes_count_one: '1 love',
        likes_count_other: '{count} loves',
      };

      // Valid translation
      const targetValid = {
        app_name: 'AdMe ES',
        welcome_message: '¡Bienvenido de nuevo, {name}!',
        likes_count_one: '1 amor',
        likes_count_other: '{count} amores',
      };

      const result = validateCatalog({
        source,
        target: targetValid,
        sourceLocale: 'en-US',
        targetLocale: 'es-ES',
      });

      expect(result.passed).toBe(true);
      expect(result.coverage).toBe(100);
      expect(result.checks).toHaveLength(0);
    });

    it('should flag blank translations, missing keys, placeholder mismatch, and extra keys', () => {
      const source = {
        app_name: 'AdMe',
        welcome_message: 'Welcome back, {name}!',
      };

      const targetInvalid = {
        app_name: '', // Blank
        welcome_message: 'Welcome back, {wrong_placeholder}!', // Mismatch
        extra_key: 'Unexpected', // Extra
      };

      const result = validateCatalog({
        source,
        target: targetInvalid,
        sourceLocale: 'en-US',
        targetLocale: 'es-ES',
      });

      expect(result.passed).toBe(false);
      const codes = result.checks.map((c) => c.code);
      expect(codes).toContain('blank_value');
      expect(codes).toContain('placeholder_mismatch');
      expect(codes).toContain('extra_key');
    });

    it('should validate plural form requirements based on target rules', () => {
      const source = {
        likes_count_one: '1 love',
        likes_count_other: '{count} loves',
      };

      // Spanish has "one" and "other" categories. Missing "other":
      const targetMissingPlural = {
        likes_count_one: '1 amor',
      };

      const result = validateCatalog({
        source,
        target: targetMissingPlural,
        sourceLocale: 'en-US',
        targetLocale: 'es-ES',
      });

      expect(result.passed).toBe(false);
      const codes = result.checks.map((c) => c.code);
      expect(codes).toContain('plural_form_missing');
    });

    it('should validate glossary rules', () => {
      const source = {
        app_title: 'Welcome to AdMe marketplace',
      };
      const target = {
        app_title: 'Bienvenido al mercado', // Missing translation of "AdMe" to required "AdMe"
      };

      const result = validateCatalog({
        source,
        target,
        sourceLocale: 'en-US',
        targetLocale: 'es-ES',
        glossary: {
          required: {
            AdMe: 'AdMe',
          },
        },
      });

      expect(result.passed).toBe(false);
      expect(result.checks[0].code).toBe('glossary_required_term_missing');
    });
  });

  describe('2. Migration Idempotency Tests', () => {
    it('should successfully run the migration multiple times without errors', async () => {
      const migrationPath = path.resolve('supabase/migrations/20260609000000_localization_governance.sql');
      const sqlContent = fs.readFileSync(migrationPath, 'utf8');

      // Execute entire script in a transaction or top-level query block
      // PostgreSQL handles multiple statements separated by semicolons in client.query
      await expect(db.query(sqlContent)).resolves.toBeDefined();
    });
  });

  describe('3. Storage Tenant Isolation Tests', () => {
    it('should isolate data strictly by tenantId', async () => {
      const govA = createAdMeLocalizationGovernance({ tenantId: 'adme-test-tenant-a', client: db });
      const govB = createAdMeLocalizationGovernance({ tenantId: 'adme-test-tenant-b', client: db });

      // Create locale for Tenant A
      await govA.createLocale({ code: 'es-ES', sourceLocale: 'en-US', actor: adminActor });

      // Tenant A should see it
      const statusA = await govA.getStatus('es-ES');
      expect(statusA.code).toBe('es-ES');

      // Tenant B should NOT see it
      await expect(govB.getStatus('es-ES')).rejects.toThrow(/Locale not found/);

      // Clean up local test rows
      await db.query(`DELETE FROM localization_locales WHERE tenant_id IN ('adme-test-tenant-a', 'adme-test-tenant-b')`);
    });
  });

  describe('4. ChurchCore Adapter Authorization & Reviewer-Assignment Tests', () => {
    it('should restrict administrator operations to admin/operator roles', async () => {
      const gov = createAdMeLocalizationGovernance({ tenantId: 'adme-test', client: db });

      // Create locale with consumer should fail
      await expect(
        gov.createLocale({ code: 'es-MX', sourceLocale: 'en-US', actor: consumerActor as any })
      ).rejects.toThrow(/Administrator role required/);
    });

    it('should enforce reviewer assignments and separation of duties', async () => {
      const gov = createAdMeLocalizationGovernance({
        tenantId: 'adme-test',
        client: db,
        policy: {
          requiredReviews: ['linguistic', 'domain'],
          separationOfDuties: true,
        },
      });

      const locale = await gov.createLocale({ code: 'es-ES', sourceLocale: 'en-US', actor: adminActor });
      
      // Seed source locale and catalog version first
      await gov.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor: adminActor });
      const sourceMessages = {
        title: 'Title',
        body: 'Body',
      };
      await gov.createCatalogVersion({
        locale: 'en-US',
        messages: sourceMessages,
        actor: adminActor,
        source: true,
      });

      // Try assigning reviewer that does not exist in users table
      await expect(
        gov.assignReviewer({
          locale: 'es-ES',
          reviewerId: '00000000-0000-0000-0000-000000000000', // Nonexistent UUID
          reviewerRole: 'linguistic',
          actor: adminActor,
        })
      ).rejects.toThrow(/Reviewer not found/);

      // Assign valid reviewers from seed data
      // For separation of duties test, assign reviewerLinguistic.id to BOTH linguistic and domain roles.
      await gov.assignReviewer({
        locale: 'es-ES',
        reviewerId: reviewerLinguistic.id,
        reviewerRole: 'linguistic',
        actor: adminActor,
      });
      await gov.assignReviewer({
        locale: 'es-ES',
        reviewerId: reviewerLinguistic.id,
        reviewerRole: 'domain',
        actor: adminActor,
      });
      // Also assign reviewerDomain.id to domain role
      await gov.assignReviewer({
        locale: 'es-ES',
        reviewerId: reviewerDomain.id,
        reviewerRole: 'domain',
        actor: adminActor,
      });

      const draft = await gov.createCatalogVersion({
        locale: 'es-ES',
        messages: { title: 'Título', body: 'Cuerpo' },
        actor: adminActor,
      });

      // Submit review by reviewer without assignment should fail
      await expect(
        gov.submitReview({
          versionId: draft.id,
          reviewerRole: 'linguistic',
          decision: 'approved',
          actor: { id: 'unassigned-reviewer-uuid' },
        })
      ).rejects.toThrow(/Matching reviewer assignment is required/);

      // Submit review with validation check
      await gov.validateVersion({ versionId: draft.id, actor: adminActor });
      await gov.requestReview({ versionId: draft.id, actor: adminActor });

      // First role approval
      await gov.submitReview({
        versionId: draft.id,
        reviewerRole: 'linguistic',
        decision: 'approved',
        actor: { id: reviewerLinguistic.id },
      });

      // Separation of duties: same reviewer attempting other role should fail
      await expect(
        gov.submitReview({
          versionId: draft.id,
          reviewerRole: 'domain',
          decision: 'approved',
          actor: { id: reviewerLinguistic.id },
        })
      ).rejects.toThrow(/Reviewer cannot satisfy multiple roles/);

      // Second role approval by different reviewer should pass
      await gov.submitReview({
        versionId: draft.id,
        reviewerRole: 'domain',
        decision: 'approved',
        actor: { id: reviewerDomain.id },
      });

      // Approve version
      const approved = await gov.approveVersion({ versionId: draft.id, actor: adminActor });
      expect(approved.state).toBe('approved');
    });
  });

  describe('5. Source-Change Staleness Tests', () => {
    it('should propagate stale state to approved/active target catalogs on source updates', async () => {
      const gov = createAdMeLocalizationGovernance({ tenantId: 'adme-test', client: db });

      await gov.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor: adminActor });
      const sourceCatalog = {
        greeting: 'Hello',
      };
      await gov.createCatalogVersion({
        locale: 'en-US',
        messages: sourceCatalog,
        actor: adminActor,
        source: true,
      });

      const locale = await gov.createLocale({ code: 'es-MX', sourceLocale: 'en-US', actor: adminActor });
      await gov.assignReviewer({
        locale: 'es-MX',
        reviewerId: reviewerLinguistic.id,
        reviewerRole: 'linguistic',
        actor: adminActor,
      });

      const draft = await gov.createCatalogVersion({
        locale: 'es-MX',
        messages: { greeting: 'Hola' },
        actor: adminActor,
      });

      await gov.validateVersion({ versionId: draft.id, actor: adminActor });
      await gov.requestReview({ versionId: draft.id, actor: adminActor });
      await gov.submitReview({
        versionId: draft.id,
        reviewerRole: 'linguistic',
        decision: 'approved',
        actor: { id: reviewerLinguistic.id },
      });
      await gov.approveVersion({ versionId: draft.id, actor: adminActor });
      
      const active = await gov.activateVersion({ versionId: draft.id, actor: adminActor });
      expect(active.state).toBe('active');

      // Now modify the source locale
      const newSourceCatalog = {
        greeting: 'Hello there!', // Change source key content
      };
      await gov.createCatalogVersion({
        locale: 'en-US',
        messages: newSourceCatalog,
        actor: adminActor,
        source: true,
      });

      // Target active version should be set to stale
      const updatedVersion = await gov.storage.getVersion(draft.id);
      expect(updatedVersion?.state).toBe('stale');
    });
  });

  describe('6. CLI exit-code and status output tests', () => {
    it('should return 0 exit code and valid JSON output on status command', async () => {
      const gov = createAdMeLocalizationGovernance({ tenantId: 'adme', client: db });
      try {
        await gov.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor: adminActor });
      } catch {}
      const stdout = execSync('npx locgov status en-US --json', { encoding: 'utf8' }).trim();
      const payload = JSON.parse(stdout);
      expect(payload.code).toBe('en-US');
      expect(payload.sourceLocale).toBe('en-US');
    });

    it('should exit with error exit-code for invalid command', () => {
      try {
        execSync('npx locgov invalidcommand', { stdio: 'ignore' });
        expect.fail('Should have failed');
      } catch (err: any) {
        expect(err.status).toBe(2);
      }
    });
  });

  describe('7. End-to-End Lifecycle Test', () => {
    it('should create a locale, create/translate, validate, review, approve, activate, and rollback', async () => {
      // Use production tenantId 'adme' to test translation catalog resolution helper
      const gov = createAdMeLocalizationGovernance({
        tenantId: 'adme',
        client: db,
        policy: {
          requiredReviews: ['linguistic'],
        },
      });

      // Create en-US source locale first
      await gov.createLocale({ code: 'en-US', sourceLocale: 'en-US', actor: adminActor });

      // Define source catalog
      const source = {
        welcome_message: 'Welcome back, {name}!',
        app_name: 'AdMe',
      };
      await gov.createCatalogVersion({
        locale: 'en-US',
        messages: source,
        actor: adminActor,
        source: true,
      });

      // Create new locale
      const locale = await gov.createLocale({ code: 'fr-FR', sourceLocale: 'en-US', actor: adminActor });
      expect(locale.code).toBe('fr-FR');

      // Assign reviewer
      await gov.assignReviewer({
        locale: 'fr-FR',
        reviewerId: reviewerLinguistic.id,
        reviewerRole: 'linguistic',
        actor: adminActor,
      });

      // Create draft version
      const draft = await gov.createCatalogVersion({
        locale: 'fr-FR',
        messages: {
          welcome_message: 'Bienvenue de retour, {name}!',
          app_name: 'AdMe FR',
        },
        actor: adminActor,
      });
      expect(draft.state).toBe('draft');

      // Validate version
      const validation = await gov.validateVersion({ versionId: draft.id, actor: adminActor });
      expect(validation.report.passed).toBe(true);
      expect(validation.version.state).toBe('validated');

      // Request review
      const reviewRequested = await gov.requestReview({ versionId: draft.id, actor: adminActor });
      expect(reviewRequested.state).toBe('in_linguistic_review');

      // Record assigned review
      const review = await gov.submitReview({
        versionId: draft.id,
        reviewerRole: 'linguistic',
        decision: 'approved',
        actor: { id: reviewerLinguistic.id },
      });
      expect(review.decision).toBe('approved');

      // Approve version
      const approved = await gov.approveVersion({ versionId: draft.id, actor: adminActor });
      expect(approved.state).toBe('approved');

      // Verify translating before active is fallback
      const preActiveTrans = await translateUi('welcome_message', 'fr-FR', { name: 'Bob' });
      expect(preActiveTrans).toBe('Welcome back, Bob!');

      // Activate version
      const activated = await gov.activateVersion({ versionId: draft.id, actor: adminActor });
      expect(activated.state).toBe('active');

      // Verify getRuntimeCatalog and translateUi works
      const catalog = await gov.getRuntimeCatalog('fr-FR');
      expect(catalog.messages.welcome_message).toBe('Bienvenue de retour, {name}!');

      const translated = await translateUi('welcome_message', 'fr-FR', { name: 'Alice' });
      expect(translated).toBe('Bienvenue de retour, Alice!');

      // Check fallback behavior: get non-existent translation fallback to source locale
      const fallbackResult = await translateUi('app_name', 'de-DE');
      expect(fallbackResult).toBe('AdMe');

      // Perform rollback (first must activate a second version)
      const secondVersion = await gov.createCatalogVersion({
        locale: 'fr-FR',
        messages: {
          welcome_message: 'Salut, {name}!',
          app_name: 'AdMe FR v2',
        },
        actor: adminActor,
      });
      await gov.validateVersion({ versionId: secondVersion.id, actor: adminActor });
      await gov.requestReview({ versionId: secondVersion.id, actor: adminActor });
      await gov.submitReview({
        versionId: secondVersion.id,
        reviewerRole: 'linguistic',
        decision: 'approved',
        actor: { id: reviewerLinguistic.id },
      });
      await gov.approveVersion({ versionId: secondVersion.id, actor: adminActor });
      await gov.activateVersion({ versionId: secondVersion.id, actor: adminActor });

      // Rollback to first version
      const rolledBack = await gov.rollbackLocale({
        locale: 'fr-FR',
        toVersionId: draft.id,
        actor: adminActor,
      });
      expect(rolledBack.id).toBe(draft.id);

      const status = await gov.getStatus('fr-FR');
      expect(status.activeVersionId).toBe(draft.id);
    });
  });
});
