declare module '@localization-governance/core' {
  export class GovernanceError extends Error {
    code: string;
    details: any;
    constructor(code: string, message: string, details?: any);
  }
  export function hashCatalog(catalog: any): string;
  export function normalizeLocale(value: string): string;
  export const DEFAULT_POLICY: any;
  export function normalizePolicy(policy?: any): any;
  export function validateCatalog(options: {
    sourceLocale: string;
    targetLocale: string;
    source: Record<string, string>;
    target: Record<string, string>;
    untranslatedAllowlist?: string[];
    glossary?: any;
  }): {
    passed: boolean;
    coverage: number;
    sourceContentHash: string;
    contentHash: string;
    checks: Array<{
      code: string;
      severity: string;
      keys: string[];
      count: number;
    }>;
  };
  export function createGovernanceService(options: {
    storage: any;
    providers?: Record<string, any>;
    policy?: any;
    clock?: () => string;
    idGenerator?: (prefix: string) => string;
  }): any;
}

declare module '@localization-governance/storage-postgres' {
  import pg from 'pg';
  export function createPostgresStorage(options: {
    client: pg.Pool | pg.ClientBase;
    tenantId: string;
  }): any;
}

declare module '@localization-governance/provider-google' {
  export function createGoogleTranslationProvider(options?: {
    apiKey?: string;
    fetch?: typeof fetch;
  }): any;
}
