# GitHub Setup & Required Secrets

This guide documents the environment setup, branch protection, and required secrets to run the CI/CD pipeline for the AdMe repository.

## Required Secrets

Configure these secrets in GitHub under **Settings -> Secrets and variables -> Actions**:

| Secret | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (build-time Next.js configuration) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (build-time Next.js configuration) |
| `TEST_SUPABASE_URL` | Test project URL (e2e only) |
| `TEST_SUPABASE_ANON_KEY` | Test project anon key (e2e only) |
| `TEST_SUPABASE_SERVICE_ROLE_KEY` | Test service role key (e2e seed only) |
| `TEST_USER_PASSWORD` | Shared password for seed test users |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI personal access token (deploy) |
| `SUPABASE_PROJECT_REF` | Production Supabase project ref |
| `STAGING_SUPABASE_PROJECT_REF` | Staging Supabase project ref |
| `DEPLOY_WEBHOOK_URL` | Slack/Discord webhook (optional, skipped if absent) |
| `CRON_SECRET` | Bearer token for cron route authorization |
| `OPENAI_API_KEY` | OpenAI API key (server-side only, AI features) |

## GitHub Environments

Create two environments in your repository under **Settings -> Environments**:

1. **`staging`**:
   - Deployment branch: `main` only.
   - Secrets: `STAGING_SUPABASE_PROJECT_REF` and environment-specific settings.

2. **`production`**:
   - Deployment branch: `main` only.
   - Required reviewers: Set an architectural team or owner reviewer gate.
   - Secrets: `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`, etc.

## Branch Protection

Configure branch protection rules for the `main` branch:
- Require a pull request before merging.
- Require status checks to pass before merging:
  - `lint`
  - `typecheck`
  - `unit-tests`
  - `build`
- Require branches to be up to date before merging.
- Dismiss stale pull request approvals when new commits are pushed.
