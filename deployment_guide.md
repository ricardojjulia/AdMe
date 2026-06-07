# AdMe Production Deployment & Security Configuration Guide

This guide details the deployment pipeline and security checks required to launch the AdMe platform in a production-ready environment using Vercel (Front-end) and Supabase (Back-end).

---

## 1. Back-end: Supabase Database Setup

### 1.1. CLI Database Migrations
To push all local migrations to a remote Supabase production instance:
1.  Initialize the project linkage:
    ```bash
    npx supabase link --project-ref your-supabase-project-ref
    ```
2.  Deploy all migration files (`/supabase/migrations/*`) sequentially:
    ```bash
    npx supabase db push
    ```

### 1.2. Production Seed Considerations
*   **Seeded Demo Users**: The migration `20260607160000_hardened_security.sql` seeds the standard demo auth profiles (`sarah@adme.demo`, etc.) with default passwords. In a staging or production environment, these accounts should be disabled or deleted from `auth.users` to prevent unauthorized access.

---

## 2. Front-end: Vercel Deployment

Deploy the Next.js App Router workspace to Vercel via the CLI or GitHub Integration.

### 2.1. Required Environment Variables
Configure these variables under Project Settings -> Environment Variables in Vercel:

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Browser | The API endpoint URL of your production Supabase project. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Browser | The public anonymous key used to initialize browser client calls. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server / Secret | **CRITICAL.** Secret service role key allowing route handlers to bypass RLS for verifying analytics. |
| `JWT_SECRET` | Server / Secret | **CRITICAL.** Cryptographic key used to sign and verify HMAC tokens for engagement viewport tracking. |

---

## 3. Production Security Audit Checklist

Before routing live traffic, complete this checklist:

1.  **Audited RLS Status**:
    Ensure Row-Level Security is active on all public schema tables:
    ```sql
    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
    ```
2.  **Verify Direct Balance Restrictions**:
    Confirm the update restrictions trigger blocks standard client updates by attempting a client-side balance write:
    ```javascript
    await supabase.from('users').update({ rewards_balance: 999999 }).eq('id', user.id);
    ```
    Verify the balance remains unchanged.
3.  **Confirm Secure Heartbeat Analytics**:
    Check that browser network logs call the `/api/engagement/heartbeat` API with HMAC signatures, and check that direct payloads with spoofed times return `400 Bad Request`.
4.  **Confirm Route Protection**:
    Verify that attempts to access `/studio` as a consumer redirect back to `/`, and attempts to access `/rewards` as a business account redirect to `/studio`.
