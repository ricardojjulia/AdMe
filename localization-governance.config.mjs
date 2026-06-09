import { createGovernanceService } from '@localization-governance/core';
import { createPostgresStorage } from '@localization-governance/storage-postgres';
import { createGoogleTranslationProvider } from '@localization-governance/provider-google';
import pg from 'pg';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:53322/postgres';

const pool = new pg.Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 100,
});

const storage = createPostgresStorage({
  client: pool,
  tenantId: 'adme',
});

const providers = {};
if (process.env.GOOGLE_TRANSLATE_API_KEY) {
  providers.google = createGoogleTranslationProvider({
    apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
  });
}

const service = createGovernanceService({
  storage,
  providers,
  policy: {
    requiredReviews: ['linguistic'],
    separationOfDuties: true,
  },
});

export default {
  service,
  actor: { id: 'cli-operator', role: 'admin' },
  requiredLocales: ['es-ES'],
};
export { pool };
