import {
  createGovernanceService,
  normalizeLocale,
  GovernanceError,
} from '@localization-governance/core';
import { createPostgresStorage } from '@localization-governance/storage-postgres';
import { createGoogleTranslationProvider } from '@localization-governance/provider-google';
import pg from 'pg';
import canonicalCatalog from './catalog.en-US.json';

let pool: pg.Pool | null = null;

export function getPool() {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:53322/postgres';
    pool = new pg.Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Wraps node-postgres pool or client query methods to automatically stringify
// objects/arrays when passed as params, avoiding native Postgres array parser exceptions on JSONB columns.
export function wrapPoolOrClient(client: any) {
  if (!client || client._wrappedForJson) return client;

  const originalQuery = client.query;
  client.query = function (sql: any, params?: any[], ...args: any[]) {
    if (params && Array.isArray(params)) {
      const sanitizedParams = params.map((param) => {
        if (
          param !== null &&
          typeof param === 'object' &&
          !(param instanceof Date) &&
          !Buffer.isBuffer(param)
        ) {
          return JSON.stringify(param);
        }
        return param;
      });
      return originalQuery.call(this, sql, sanitizedParams, ...args);
    }
    return originalQuery.call(this, sql, params, ...args);
  };

  if (typeof client.connect === 'function') {
    const originalConnect = client.connect;
    client.connect = async function (...connectArgs: any[]) {
      const conn = await originalConnect.apply(this, connectArgs);
      if (conn) {
        wrapPoolOrClient(conn);
      }
      return conn;
    };
  }

  client._wrappedForJson = true;
  return client;
}

// Structured audit logger
export function auditGovernanceAction(
  action: string,
  actorId: string,
  result: 'success' | 'denied' | 'failure' | 'error',
  details: Record<string, any> = {}
) {
  // Exclude sensitive data (comments, translations, names, emails, PHI, secrets)
  const safeDetails = { ...details };
  delete safeDetails.comment;
  delete safeDetails.messages;
  delete safeDetails.catalogText;
  delete safeDetails.name;
  delete safeDetails.email;
  delete safeDetails.secret;
  delete safeDetails.apiKey;

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event: 'localization_audit',
      action,
      actorId,
      result,
      details: safeDetails,
    })
  );
}

const ADMIN_ROLES = new Set(['admin', 'operator', 'business']);
const REVIEW_ROLES = new Set(['linguistic', 'domain']);
const RUNTIME_STATES = new Set(['active', 'stale']);

function requireAdmin(actor: { id: string; role: string }) {
  if (!actor?.id || !ADMIN_ROLES.has(actor.role)) {
    throw new GovernanceError('authorization_denied', 'Administrator role required.');
  }
}

function requireActor(actor: { id: string }) {
  if (!actor?.id) {
    throw new GovernanceError('authorization_denied', 'Authenticated actor required.');
  }
}

function normalizeAssignment(row: any) {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    localeId: row.locale_id,
    reviewerId: row.reviewer_id,
    reviewerRole: row.reviewer_role,
    assignedBy: row.assigned_by,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

export function createReviewerAssignmentRepository({ client }: { client: pg.Pool | pg.ClientBase }) {
  return {
    async reviewerExists({ tenantId, reviewerId }: { tenantId: string; reviewerId: string }) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reviewerId);
      if (!isUuid) return false;
      const result = await client.query(
        `SELECT 1 FROM public.users WHERE id = $1 LIMIT 1`,
        [reviewerId]
      );
      return (result.rows ?? []).length > 0;
    },

    async list({ tenantId, localeId }: { tenantId: string; localeId: string }) {
      const result = await client.query(
        `SELECT id, tenant_id, locale_id, reviewer_id, reviewer_role, assigned_by, created_at
           FROM localization_review_assignments
          WHERE tenant_id = $1 AND locale_id = $2
          ORDER BY reviewer_role, reviewer_id`,
        [tenantId, localeId]
      );
      return (result.rows ?? []).map(normalizeAssignment);
    },

    async save(assignment: any) {
      const result = await client.query(
        `INSERT INTO localization_review_assignments
           (tenant_id, id, locale_id, reviewer_id, reviewer_role, assigned_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, locale_id, reviewer_role, reviewer_id)
         DO UPDATE SET assigned_by = EXCLUDED.assigned_by
         RETURNING id, tenant_id, locale_id, reviewer_id, reviewer_role, assigned_by, created_at`,
        [
          assignment.tenantId,
          assignment.id,
          assignment.localeId,
          assignment.reviewerId,
          assignment.reviewerRole,
          assignment.assignedBy,
          assignment.createdAt,
        ]
      );
      const row = (result.rows ?? [])[0];
      return row ? normalizeAssignment(row) : assignment;
    },
  };
}

export function createAdMeLocalizationGovernance({
  tenantId = 'adme',
  client,
  policy = {},
  provider,
}: {
  tenantId?: string;
  client: pg.Pool | pg.ClientBase;
  policy?: any;
  provider?: any;
}) {
  if (typeof tenantId !== 'string' || !tenantId.trim()) {
    throw new GovernanceError('storage_failure', 'tenantId is required.');
  }

  const wrappedClient = wrapPoolOrClient(client);
  const storage = createPostgresStorage({ client: wrappedClient, tenantId });
  const assignmentRepository = createReviewerAssignmentRepository({ client: wrappedClient });

  const providers: Record<string, any> = {};
  if (provider) {
    providers.google = provider;
  } else if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    providers.google = createGoogleTranslationProvider({
      apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
    });
  }

  const governanceService = createGovernanceService({
    storage,
    providers,
    policy,
  });

  const boundTenantId = tenantId.trim();

  return {
    storage,
    service: governanceService,
    policy: governanceService.policy,

    async createLocale(input: { code: string; sourceLocale: string; actor: { id: string; role: string } }) {
      try {
        requireAdmin(input.actor);
        const res = await governanceService.createLocale(input);
        auditGovernanceAction('create_locale', input.actor.id, 'success', {
          locale: input.code,
          sourceLocale: input.sourceLocale,
        });
        return res;
      } catch (err: any) {
        auditGovernanceAction('create_locale', input.actor?.id, 'failure', {
          locale: input.code,
          error: err.message,
        });
        throw err;
      }
    },

    async createCatalogVersion(input: {
      locale: string;
      messages: Record<string, string>;
      actor: { id: string; role: string };
      source?: boolean;
      provenance?: any;
    }) {
      try {
        requireAdmin(input.actor);
        const res = await governanceService.createCatalogVersion(input);
        auditGovernanceAction('create_catalog_version', input.actor.id, 'success', {
          locale: input.locale,
          versionId: res.id,
          source: input.source,
        });
        return res;
      } catch (err: any) {
        auditGovernanceAction('create_catalog_version', input.actor?.id, 'failure', {
          locale: input.locale,
          error: err.message,
        });
        throw err;
      }
    },

    async assignReviewer({
      locale,
      reviewerId,
      reviewerRole,
      actor,
    }: {
      locale: string;
      reviewerId: string;
      reviewerRole: string;
      actor: { id: string; role: string };
    }) {
      try {
        requireAdmin(actor);
        if (!REVIEW_ROLES.has(reviewerRole)) {
          throw new GovernanceError('review_role_not_required', 'Invalid reviewer role.');
        }
        if (typeof reviewerId !== 'string' || !reviewerId.trim()) {
          throw new GovernanceError('validation_failed', 'reviewerId is required.');
        }

        const exists = await assignmentRepository.reviewerExists({
          tenantId: boundTenantId,
          reviewerId: reviewerId.trim(),
        });
        if (!exists) {
          throw new GovernanceError('reviewer_not_found', 'Reviewer not found.');
        }

        const localeRecord = await storage.getLocale(normalizeLocale(locale));
        if (!localeRecord) {
          throw new GovernanceError('locale_not_found', 'Locale not found.');
        }

        const res = await assignmentRepository.save({
          id: `review-assignment-${crypto.randomUUID()}`,
          tenantId: boundTenantId,
          localeId: localeRecord.id,
          reviewerId: reviewerId.trim(),
          reviewerRole,
          assignedBy: actor.id,
          createdAt: new Date().toISOString(),
        });

        auditGovernanceAction('assign_reviewer', actor.id, 'success', {
          locale,
          reviewerId,
          reviewerRole,
        });
        return res;
      } catch (err: any) {
        const resultType = err.code === 'authorization_denied' ? 'denied' : 'failure';
        auditGovernanceAction('assign_reviewer', actor?.id, resultType, {
          locale,
          reviewerId,
          reviewerRole,
          error: err.message,
        });
        throw err;
      }
    },

    async listReviewerAssignments({ locale, actor }: { locale: string; actor: { id: string; role: string } }) {
      requireAdmin(actor);
      const localeRecord = await storage.getLocale(normalizeLocale(locale));
      if (!localeRecord) {
        throw new GovernanceError('locale_not_found', 'Locale not found.');
      }
      return assignmentRepository.list({
        tenantId: boundTenantId,
        localeId: localeRecord.id,
      });
    },

    async translateVersion(input: {
      versionId: string;
      provider: string;
      actor: { id: string; role: string };
      scope?: 'full' | 'missing';
      glossary?: any;
    }) {
      try {
        requireAdmin(input.actor);
        const res = await governanceService.translateVersion(input);
        auditGovernanceAction('translate_version', input.actor.id, 'success', {
          versionId: input.versionId,
          provider: input.provider,
        });
        return res;
      } catch (err: any) {
        auditGovernanceAction('translate_version', input.actor?.id, 'failure', {
          versionId: input.versionId,
          error: err.message,
        });
        throw err;
      }
    },

    async validateVersion(input: {
      versionId: string;
      actor: { id: string; role: string };
      glossary?: any;
      untranslatedAllowlist?: string[];
    }) {
      try {
        requireAdmin(input.actor);
        const res = await governanceService.validateVersion(input);
        auditGovernanceAction('validate_version', input.actor.id, 'success', {
          versionId: input.versionId,
          passed: res.report.passed,
          coverage: res.report.coverage,
        });
        return res;
      } catch (err: any) {
        auditGovernanceAction('validate_version', input.actor?.id, 'failure', {
          versionId: input.versionId,
          error: err.message,
        });
        throw err;
      }
    },

    async requestReview(input: { versionId: string; actor: { id: string; role: string } }) {
      try {
        requireAdmin(input.actor);
        const res = await governanceService.requestReview(input);
        auditGovernanceAction('request_review', input.actor.id, 'success', {
          versionId: input.versionId,
        });
        return res;
      } catch (err: any) {
        auditGovernanceAction('request_review', input.actor?.id, 'failure', {
          versionId: input.versionId,
          error: err.message,
        });
        throw err;
      }
    },

    async submitReview({
      versionId,
      reviewerRole,
      decision,
      comment = '',
      actor,
    }: {
      versionId: string;
      reviewerRole: string;
      decision: 'approved' | 'changes_requested';
      comment?: string;
      actor: { id: string; role: string };
    }) {
      try {
        requireActor(actor);
        const version = await storage.getVersion(versionId);
        if (!version) {
          throw new GovernanceError('version_not_found', 'Version not found.');
        }

        const assignments = await assignmentRepository.list({
          tenantId: boundTenantId,
          localeId: version.localeId,
        });
        const assigned = assignments.some(
          (assignment) => assignment.reviewerId === actor.id && assignment.reviewerRole === reviewerRole
        );
        if (!assigned) {
          throw new GovernanceError('reviewer_assignment_required', 'Matching reviewer assignment is required.');
        }

        const res = await governanceService.submitReview({
          versionId,
          reviewer: { id: actor.id, role: reviewerRole },
          decision,
          comment,
        });

        auditGovernanceAction('submit_review', actor.id, 'success', {
          versionId,
          reviewerRole,
          decision,
        });
        return res;
      } catch (err: any) {
        const resultType = err.code === 'reviewer_assignment_required' ? 'denied' : 'failure';
        auditGovernanceAction('submit_review', actor?.id, resultType, {
          versionId,
          reviewerRole,
          decision,
          error: err.message,
        });
        throw err;
      }
    },

    async approveVersion(input: { versionId: string; actor: { id: string; role: string } }) {
      try {
        requireAdmin(input.actor);
        const res = await governanceService.approveVersion(input);
        auditGovernanceAction('approve_version', input.actor.id, 'success', {
          versionId: input.versionId,
        });
        return res;
      } catch (err: any) {
        auditGovernanceAction('approve_version', input.actor?.id, 'failure', {
          versionId: input.versionId,
          error: err.message,
        });
        throw err;
      }
    },

    async activateVersion(input: { versionId: string; actor: { id: string; role: string } }) {
      try {
        requireAdmin(input.actor);
        const res = await governanceService.activateVersion(input);
        auditGovernanceAction('activate_version', input.actor.id, 'success', {
          versionId: input.versionId,
        });
        return res;
      } catch (err: any) {
        auditGovernanceAction('activate_version', input.actor?.id, 'failure', {
          versionId: input.versionId,
          error: err.message,
        });
        throw err;
      }
    },

    async rollbackLocale(input: { locale: string; toVersionId: string; actor: { id: string; role: string } }) {
      try {
        requireAdmin(input.actor);
        const res = await governanceService.rollbackLocale(input);
        auditGovernanceAction('rollback_locale', input.actor.id, 'success', {
          locale: input.locale,
          toVersionId: input.toVersionId,
        });
        return res;
      } catch (err: any) {
        auditGovernanceAction('rollback_locale', input.actor?.id, 'failure', {
          locale: input.locale,
          toVersionId: input.toVersionId,
          error: err.message,
        });
        throw err;
      }
    },

    async getStatus(locale: string) {
      return governanceService.getLocaleStatus(locale);
    },

    async listRuntimeLocales() {
      const locales = await storage.listLocales();
      const result = [];
      for (const locale of locales) {
        if (!locale.activeVersionId) continue;
        const version = await storage.getVersion(locale.activeVersionId);
        if (!version || !RUNTIME_STATES.has(version.state)) continue;
        result.push({ code: locale.code, governanceState: version.state });
      }
      return result.sort((left, right) => left.code.localeCompare(right.code));
    },

    async getRuntimeCatalog(locale: string) {
      const code = normalizeLocale(locale);
      const localeRecord = await storage.getLocale(code);
      if (!localeRecord?.activeVersionId) {
        throw new GovernanceError('locale_inactive', 'Locale is not active.');
      }
      const version = await storage.getVersion(localeRecord.activeVersionId);
      if (!version || !RUNTIME_STATES.has(version.state)) {
        throw new GovernanceError('locale_inactive', 'Locale is not active.');
      }
      return {
        locale: code,
        messages: structuredClone(version.messages),
        governanceState: version.state,
      };
    },

    async evaluateCiPolicy(input?: { requiredLocales?: string[] }) {
      return governanceService.evaluateCiPolicy(input);
    },
  };
}

export function mapGovernanceError(error: any) {
  if (!(error instanceof GovernanceError)) {
    return {
      statusCode: 503,
      body: {
        error: 'Localization governance is temporarily unavailable.',
        code: 'storage_failure',
      },
      auditResult: 'error',
      reasonCode: 'dependency_failure',
    };
  }
  const code = error?.code ?? 'unexpected_error';
  if (['authorization_denied', 'reviewer_assignment_required'].includes(code)) {
    return {
      statusCode: 403,
      body: { error: 'Localization governance access denied.', code },
      auditResult: 'denied',
      reasonCode: code === 'authorization_denied' ? 'rbac_denied' : 'reviewer_not_assigned',
    };
  }
  if (['locale_not_found', 'version_not_found', 'reviewer_not_found'].includes(code)) {
    return {
      statusCode: 404,
      body: { error: 'Localization governance record not found.', code },
      auditResult: 'failure',
      reasonCode: code,
    };
  }
  if (code === 'locale_inactive') {
    return {
      statusCode: 409,
      body: { error: 'Locale is not active.', code },
      auditResult: 'failure',
      reasonCode: code,
    };
  }
  if (['storage_failure', 'provider_failure'].includes(code)) {
    return {
      statusCode: 503,
      body: {
        error: 'Localization governance is temporarily unavailable.',
        code,
      },
      auditResult: 'error',
      reasonCode: 'dependency_failure',
    };
  }
  return {
    statusCode: 409,
    body: { error: 'Localization governance operation failed.', code },
    auditResult: 'failure',
    reasonCode: code,
  };
}

const activeCatalogCache = new Map<string, { messages: Record<string, string>; expiresAt: number }>();
const CACHE_TTL_MS = 5000;

export async function getActiveCatalog(locale: string): Promise<Record<string, string>> {
  const norm = normalizeLocale(locale);
  if (norm === 'en-US') {
    return canonicalCatalog;
  }
  const now = Date.now();
  const cached = activeCatalogCache.get(norm);
  if (cached && cached.expiresAt > now) {
    return cached.messages;
  }

  try {
    const p = getPool();
    const gov = createAdMeLocalizationGovernance({ tenantId: 'adme', client: p });
    const runtimeCatalog = await gov.getRuntimeCatalog(norm);
    activeCatalogCache.set(norm, {
      messages: runtimeCatalog.messages,
      expiresAt: now + CACHE_TTL_MS,
    });
    return runtimeCatalog.messages;
  } catch {
    return canonicalCatalog;
  }
}

export async function translateUi(key: string, locale: string, variables: Record<string, any> = {}): Promise<string> {
  const messages = await getActiveCatalog(locale);
  const msg = messages[key] ?? canonicalCatalog[key as keyof typeof canonicalCatalog] ?? key;

  return msg.replace(/\{([A-Za-z0-9_]+)\}/g, (match, name) => {
    return name in variables ? String(variables[name]) : match;
  });
}
