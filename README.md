# AdMe ── The World's First Privacy-First, Permission-Based Advertising Marketplace

[![Release: v3.0.0](https://img.shields.io/badge/Release-v3.0.0-blue.svg?style=flat)](https://github.com/ricardojjulia/AdMe/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js 16](https://img.shields.io/badge/Next.js-16.0.8-black.svg?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-blueviolet.svg?style=flat&logo=supabase)](https://supabase.com/)

> **"We know what you like, but we don't know who you are."**

AdMe is a revolutionary discovery platform built to fix digital advertising for both users and businesses. Instead of surveillance-based tracking, AdMe operates as a consent-first, privacy-first ad marketplace. Users voluntarily control their preferences, maintain complete anonymity through hashed UIDs, and earn value for their attention. Small businesses get an affordable, level playing field to reach high-intent customers locally.

---

## 🌐 Live Demo Environment

You can try the fully deployed production application immediately in the cloud:

*   **Production Application**: [https://adme-psi.vercel.app](https://adme-psi.vercel.app)
*   **Database & API Backend**: Powered by a hosted [Supabase](https://supabase.com) PostgreSQL database instance.

*Note: The demo environments are configured with preloaded demo personas (Sarah the Developer, Marcus the Local Foodie, Elena the New Consumer, and Valor Brews Business Owner) accessible directly via the Persona switcher in the interface header.*

---

## 🎯 The Core Problems We Solve

### 1. Ad Relevance Without Surveillance (Consumers)
Nobody wants diapers when they don’t have children, or political ads they disagree with. Users select precisely what they want to discover (e.g., Tech, Local restaurants, Home renovation, Veteran-owned businesses).

### 2. High-Outcome local Discovery (Small Businesses)
Traditional platforms (Google, Meta, TikTok) favor big spenders, burying local restaurants, coffee shops, contractors, and authors. AdMe provides low-cost subscription tiers (e.g., Free, $10/mo, $25/mo) allowing small businesses to compete and build volume first.

### 3. Absolute Privacy by Design
Meta and TikTok monitor every click, scroll, and keystroke. AdMe stores **zero personally identifiable information (PII)** in the public application layer. Attacker breaches yield only anonymous interaction lists, which are virtually worthless.

---

## 🛡️ Privacy-First Architecture

*   **Anonymous UIDs**: Upon signup, the application generates a hashed UID (e.g., `UID-73A8-XP92-AB44`).
*   **Zero PII Storage**: The public database table stores **no** real names, addresses, phone numbers, emails, birthdates, or genders.
*   **Anonymous Metrics**: Advertisers track outcomes rather than identities. Supported interaction logs include:
    *   UID clicked
    *   UID viewed
    *   UID saved
    *   UID requested info
    *   UID visited business page

---

## 🌟 Key Application Features

### 1. Unified Consumer Experience
*   **Voluntary, Curated Feed**: Ad recommendations driven entirely by user-toggled categories.
*   **Client-Side Contextual Ad Injection**: A smart-blending feed that dynamically interleaves mock organic social posts and matching category ads client-side, ensuring user profiling queries are never sent to the server.
*   **Local Differential Privacy (LDP) Shield**: Toggles 30% randomized response perturbation (double-coin-flip math) for preference database synchronization, offering mathematically provable plausible deniability while honoring reward points truthfully.
*   **Ad Wallet & Proximity Scratch Cards**: Save interesting drops, and play canvas-based scratch-off "Gift Card Drops" inside geofence alerts to claim a +50 point bonus and reveal voucher codes.
*   **Gamified Preference Swipe Polls**: Tinder-style swipeable card deck that awards users with points for refining their interest profiles.
*   **Value Exchange (Reward Points)**: Users earn `AdPoints` for voluntary interaction (watching a demo, reviewing an ad, visiting a page), redeemable for gift cards, local business discounts, or charitable giving.

### 2. Premium Ad Formats
*   **Native Ads**: Clean layouts organically blended into the feed.
*   **Carousel Ads**: Multi-media horizontal swipe cards with smooth micro-animations.
*   **Canvas-based Compass Proximity Maps**: GPS compass tracking and route animations rendered dynamically on `<canvas>` inside localized deal alert cards.
*   **Interactive Comments**: Community feedback loops on ad campaigns.

### 3. Business Ad Studio & Pacing
*   **Campaign Builder**: Self-serve campaign wizard supporting targeting filters, formatting, and daily budgeting.
*   **Advertiser Budget Pacemaker**: Time-based campaign pacing that matches the daily elapsed time fraction against campaign spend fraction, throttling ad displays when spending velocity is too high.
*   **Interactive Feed Density Visualizer**: An animated 24h timeline canvas graph slider displaying muted quiet hours slots, delivery cadence, and pacing score simulator controls.
*   **A/B Test Variations**: Built-in support to run headline and design variants to test effectiveness.
*   **Real-time Analytics**: Live reporting of views, clicks, and CTR (Click-Through Rate) utilizing Supabase Realtime subscriptions.

---

## 🛡️ Architecture & Visual Design

To understand the core mechanics, system topology, security boundaries, and data flow pipelines of the AdMe platform, refer to the visual **[ARCHITECTURE.md](./ARCHITECTURE.md)** guide. It features interactive Mermaid diagrams for:
*   **System Architecture Map**: Frontend route guards, Edge layouts, and Supabase service blocks.
*   **Ledger Balance RPC Flow**: RLS rules, and server-side balance updates using `SECURITY DEFINER` constraints.
*   **GDPR Cascade Erasure**: Automatic account purges and PostgreSQL cascades on user deletion.
*   **Sticky A/B Splits Pipeline**: Hashed user-variation mapping.
*   **Cryptographic Viewport Heartbeats**: HMAC-signed dwelled tracking endpoint flows.

---

## 📁 Repository & Software Structure

The project follows a standard Next.js App Router hierarchy backed by Supabase:

```
├── public/                  # Static assets and brand logos
├── supabase/                # Supabase Local Development Setup
│   ├── config.toml          # Local Supabase configuration
│   ├── migrations/          # SQL database schemas & security policies
│   └── seed.sql             # Mock seeding scripts
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── auth/            # OAuth & passwordless callbacks
│   │   ├── checkout/        # Stripe/mock credits top-up
│   │   ├── login/           # Authentication endpoints & pages
│   │   ├── onboarding/      # Consumer questionnaire/interests
│   │   ├── profile/         # Wallet, saved cards, and preferences
│   │   ├── rewards/         # User points ledger and earnings history
│   │   └── studio/          # Campaign dashboard and creation flows
│   ├── components/          # Reusable React components (Feed, Cards, Comments)
│   ├── lib/                 # Core utilities and contexts
│   │   ├── hooks/           # Analytics & engagement hooks
│   │   ├── supabase/        # Database clients (Server vs. Client components)
│   │   ├── utils/           # Proximity & mathematical functions
│   │   ├── UserContext.tsx  # Global state provider (consumer vs. business roles)
│   │   └── ToastContext.tsx # Notification alerts system
│   ├── types/               # TypeScript interface declarations
│   └── proxy.ts             # Next.js session validation and route guards (formerly middleware.ts)
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 18+** and the **Supabase CLI** installed.

### 2. Local Setup
1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/ricardojjulia/AdMe.git
   cd AdMe
   npm install
   ```

2. Copy the environment template:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:53321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Spin up local Supabase container:
   ```bash
   supabase start
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3400](http://localhost:3400) to view the application.

### 3. Build & Production Verification
To compile the TypeScript project and generate static pages:
```bash
npm run build
```

### 4. Running Tests
To run unit and integration tests (Vitest):
```bash
npm run test
```

To run the full Playwright E2E browser test suite:
```bash
npm run test:e2e
```

Refer to the [deployment_guide.md](./deployment_guide.md) for detailed instructions on production deployment and configuration.

---

## 🌍 Localization Governance Framework

AdMe integrates a portable, tenant-bound localization governance framework built using packed npm tarballs of `@localization-governance/*`. This enforces a strict validation and review lifecycle for translation catalogs, preventing bad strings or incomplete formats from reaching users.

### 📦 Staged Tarballs & Overrides
The core libraries are installed locally via packed tarballs situated in the `tarballs/` directory:
- `@localization-governance/core`
- `@localization-governance/storage-postgres`
- `@localization-governance/provider-google`
- `@localization-governance/cli`

To ensure dependency cycles resolve correctly, standard `overrides` are configured in `package.json`:
```json
"overrides": {
  "@localization-governance/core": "file:./tarballs/localization-governance-core-0.1.0.tgz"
}
```

### ⚙️ Database Migration
Localization states are persisted in a Supabase PostgreSQL instance using the `storage-postgres` adapter. The database tables are created via the additive migration:
- `supabase/migrations/20260609000000_localization_governance.sql`

All database queries are bound to the product tenant ID (`'adme'`) to support multi-tenant isolation.

### 🛠️ CLI Operations & Commands
The CLI reads settings from the local `localization-governance.config.mjs` config file and connects directly using the `DATABASE_URL` environment variable.

#### 1. Create a Locale
Initialize support for a new BCP 47 locale (e.g. `es-ES` Spanish):
```bash
npx locgov locale create es-ES
```

#### 2. Create and Populate a Catalog Draft
Drafts can be created programmatically or via the adapter. In the background, automated provider translations can be requested:
```bash
npx locgov translate es-ES --version <version_id> --provider google --scope missing
```

#### 3. Run Validation Checks
Validate formatting placeholders, plural forms matching counts/names, required glossary terms, and empty translations:
```bash
npx locgov validate es-ES --version <version_id>
```

#### 4. Request Linguistic and Domain Review
Before a catalog can be approved, it must be validated and explicitly reviewed by assigned reviewers:
```bash
# Request review transition (validated -> in_linguistic_review)
npx locgov review request es-ES --version <version_id>

# Submit assigned reviewer decision
npx locgov review submit es-ES --version <version_id> --role linguistic --decision approved --comment "Grammar looks correct"
```

#### 5. Approve Version
Transition the catalog to `approved` state after satisfying policy constraints (separation of duties requires separate linguistic and domain approvals if configured):
```bash
npx locgov approve es-ES --version <version_id>
```

#### 6. Activate and Deploy Catalogs Atomically
Deploy the catalog version to production. This updates the active pointer atomically:
```bash
npx locgov activate es-ES --version <version_id>
```

#### 7. Atomic Rollbacks
Roll back to a previously active catalog version immediately in case of emergency:
```bash
npx locgov rollback es-ES --to <version_id>
```

#### 8. Verify Status & CI Policy
Check the state of localized catalogs and evaluate policy compliance in CI pipelines:
```bash
# Get status report (outputs JSON with --json)
npx locgov status es-ES --json

# Evaluate CI pipeline policy status
npx locgov ci
```

---

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.
