# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Full Software Testing Suite & Unified 6-Tier Verification Pipeline**:
  - **Comprehensive API Integration Matrix (`tests/integration/api-endpoints.test.ts`)**:
    - 21 automated integration tests covering 100% of Next.js route handlers (`/api/checkout`, `/api/checkout/verify`, `/api/engagement/*`, `/api/location/coarse`, `/api/marketplace/nearby`, `/api/places/nearby`, `/api/moderation/ad`, `/api/moderation/report`, `/api/studio/copilot`, `/api/webhooks/stripe`).
  - **Full-Stack Playwright Browser E2E Suite (`tests/e2e/`)**:
    - Expanded end-to-end browser coverage to 25 test journeys across all 26 application routes.
    - Added `tests/e2e/checkout-and-studio.spec.ts` for Stripe monetization and advertiser campaign lifecycle.
    - Added `tests/e2e/admin-hq-and-roles.spec.ts` for persona switching, role guards, and bilingual localization (`EN` vs `ES-PR`).
  - **Unified Verification Orchestrator (`scripts/run-full-test-suite.mjs` & `npm run test:all`)**:
    - Single-command 6-tier release gate executing Version Check, ESLint, TypeScript Typecheck, RLS Security Audit, Vitest Unit/Integration Suites, and Playwright E2E with structured summary reporting.
  - **Formal Testing Guidelines & Release Governance (`docs/testing/TESTING_GUIDELINES.md`)**:
    - Enforces mandatory testing surfaces for all future pull requests and features.
    - Wired pre-merge testing gates into `AGENTS.md`, `improve-software.md`, and GitHub Actions CI (`.github/workflows/ci.yml`).
- **Ephemeral Contextual Intent Tuner & Client-Side Zero-Tracking Feed Personalization Engine (COUNCIL-2026-011)**:
  - **Client-Side Intent Tuner Engine (`src/lib/services/intent-tuner.ts`)**:
    - Pure, deterministic scoring for 4 contextual modes: `All-Around Discovery`, `Local Gems`, `Deal Hunter`, and `Mindful / Low-Stimulus`.
    - Real-time scoring factoring in geographic proximity, discount density, typographical agitation penalties (exclamation counts, all-caps clickbait), ethical smart score, and artisan authenticity.
    - Zero server-side tracking, zero persistent profiling cookies, zero user mood retention.
  - **Floating Glassmorphic Intent Tuner HUD (`src/components/IntentTunerHUD.tsx`)**:
    - Accessible, keyboard-navigable (`role="radiogroup"`) pill selector atop the consumer feed.
    - Real-time zero-tracking privacy assurance indicator.
  - **Intent Resonance Micro-Badges (`src/components/IntentResonanceBadge.tsx`)**:
    - Dynamic pulsing badges (`📍 Local Gem`, `🏷️ Deal Pick`, `🌿 Mindful Match`) rendering explanation context directly on resonant feed cards across `FeedCard`, `NativeAdCard`, and `CarouselAdCard`.
  - **Localization & Test Verification**:
    - Full English (`en-US`) and Puerto Rican Spanish (`es-PR`) translation keys in i18n catalogs.
    - Comprehensive unit test suite (`src/components/intent-tuner.test.ts`, 12 tests) and Playwright browser E2E test (`tests/e2e/intent-tuner.spec.ts`).
- **Zero-Knowledge Ad-Free 'Focus Pass' & Editorial Zen Stream Mode (COUNCIL-2026-010)**:
  - **Ad-Free Focus Pass Architecture (`src/lib/services/focus-pass.ts` & `src/lib/hooks/useFocusPass.ts`)**:
    - Dedicated redemption tiers: `15m Sprint` (100 pts), `1h Deep Work` (250 pts), and `24h Day of Calm` (500 pts).
    - Cryptographic client-side HMAC token generation and validation preventing local storage clock tampering without central telemetry.
    - Full suppression of commercial ads, carousels, and geofence alerts during active focus windows across `Feed.tsx` and `GeofenceAlert.tsx`.
  - **Editorial Zen Stream (`src/components/ZenCard.tsx`)**:
    - Curated mindful cards with tranquil imagery, inspiring philosophical quotes, and interactive 4-4-4 breathing pacing exercises.
  - **Floating Zen HUD (`src/components/FocusModeWidget.tsx`)**:
    - Minimalist collapsible HUD tracking real-time remaining focus duration with one-click cancellation or extension.
  - **Rewards Store Integration (`src/app/rewards/page.tsx`)**:
    - Dedicated Focus Pass redemption cards with real-time balance checks and instant ledger deduction RPC sync.
  - Adopted Software Factory & Council Governance System (`improve-software.md`, `CLAUDE.md`, skills, and subagents).
  - Adopted Pilot Feedback & Error-Triage System Playbook (`docs/playbooks/pilot-feedback-and-error-triage.md`).
  - Adopted Language Translation Pipeline skill (`language-translation`).
  - Automated data-isolation RLS audit script (`scripts/audit-data-isolation.mjs` and `npm run audit:rls`).

### Fixed
- Eliminated SSR hydration mismatch warnings across Client Components (`src/app/rewards/page.tsx`, `src/app/studio/create/page.tsx`, `src/app/profile/page.tsx`, `src/components/Feed.tsx`, `src/components/FocusModeWidget.tsx`) by replacing brittle attribute suppression with robust client-mount gating.

## [5.3.0] - 2026-09-17

### Added
- **Instant Value-Exchange Voucher Minting ('Claim to Wallet') & Anti-Fatigue Attention Shield (COUNCIL-2026-009)**:
  - **Client-Side Anti-Fatigue Attention Shield (`src/lib/services/attention-shield.ts`)**:
    - Pure, deterministic session fatigue capping de-prioritizing over-served ads ($\ge$ 3 impressions).
    - Intelligent category anti-clustering enforcing a strict limit of max 2 contiguous ads of the same category.
    - Zero-knowledge ephemeral storage isolated entirely within browser `sessionStorage` with zero persistent user tracking.
    - Exported `useAttentionShield` React hook for seamless state consumption and live fatigue metrics.
  - **Direct Attention Value-Exchange Stash (`src/lib/UserContext.tsx`)**:
    - Added `claimAdVoucher(ad)` action allowing users to instantly save any merchant promo deal or drop directly to their Coupon & Perk Wallet.
    - Cryptographically structured coupon code generation (`VLB-7A9F-2026`) with deterministic merchant hashing.
    - Awards +25 immediate attention reward points upon claim, creating a tangible reciprocal value exchange.
    - Anonymous server-side conversion logging (`/api/engagement/voucher-claim`) without harvesting user PII.
  - **UI/UX Feed & Card Integration**:
    - Created `AttentionShieldBadge` component with live pulsing status indicator, fatigue count, zero-knowledge guarantee explainer, and one-click session reset.
    - Integrated "🎟️ Claim Deal (+25 pts)" / "🎟️ Saved to Wallet" interactive buttons across `FeedCard`, `NativeAdCard`, and `CarouselAdCard`.
    - Integrated voucher redemption into `/rewards` Coupon & Perk Wallet for in-store Barcode / QR matrix redemption.
  - **Advertiser Studio Integration (`/studio`)**:
    - Added `🎟️ Voucher Claims` conversion metric column to Campaign Performance analytics.
    - Added voucher claim event firing in the Audience Behavior Simulator for interactive testing.
  - **Verification & Test Suite**:
    - Unit tests in `src/components/attention-shield.test.ts` (19 test suites, 133 tests passing).
    - Playwright browser E2E test in `tests/e2e/attention-shield.spec.ts` (16/16 E2E tests passing).

## [5.2.0] - 2026-09-16

### Added
- **Autonomous AI Creative Co-Pilot for Ad Studio (COUNCIL-2026-008)**:
  - Created interactive assistant card component `CreativeCopilot.tsx` embedded in `/studio/create`.
  - Integrates server-side `/api/studio/copilot` endpoint backed by Google Gemini API and high-fidelity deterministic heuristic fallback.
  - Automatically synthesizes 3 distinct strategic angles:
    1. *Value & Utility* (clear consumer savings, perks, welcome offers, projected +24-28% CTR).
    2. *Story & Mission* (craftsmanship, authenticity, veteran/local community roots, projected +29-34% CTR).
    3. *Curiosity & Innovation* (thoughtful inquiry, quality differentiation without clickbait, projected +18-22% CTR).
  - One-click application buttons: `Apply to Variant A (Main)` and `Apply to Variant B (A/B Test)` for frictionless campaign setup.
- **Ethical Ad Scorer & Non-Intrusive Compliance Engine**:
  - Implemented pure, deterministic scoring utility `src/lib/services/ethical-ad-scorer.ts` evaluating ad copy across:
    * *Politeness & Tone* (penalizes shouting uppercase text, excessive exclamation marks, aggressive commands).
    * *Value Exchange Clarity* (rewards tangible perks, discounts, warranty, artisan craft).
    * *Honesty & Transparency* (penalizes fake urgency, deceptive clickbait, artificial scarcity).
  - Returns composite 0-100 Ethical Score index with qualitative ratings (`Excellent`, `Good`, `Fair`, `Needs Revision`) and actionable recommendations.
  - Embedded real-time draft compliance meter directly in the campaign creation form and live mobile device mockup.
- **Comprehensive Automated Testing & Verification**:
  - Unit tests in `src/components/studio/creative-copilot.test.ts` verifying scoring precision, spam penalties, and fallback generation (18/18 test suites, 125/125 unit tests pass 100%).
  - End-to-end browser test in `tests/e2e/copilot.spec.ts` verifying end-to-end angle generation, variant application to A/B inputs, and live ethics badge recalculation (15/15 Playwright tests pass 100%).

## [5.1.0] - 2026-09-15

### Added
- **Real-Time Consumer Ad Transparency Inspector (COUNCIL-2026-007)**:
  - Added portaled dialog component `AdTransparencyModal.tsx` accessible via `Why this ad?` / `Why this? ✨` on all sponsored cards (`NativeAdCard`, `FeedCard`, `CarouselAdCard`).
  - Implemented real-time client-side explainability breakdown displaying matched Zero-Knowledge interest tags, neighborhood coarse proximity factor, category auction status, and cryptographic privacy attestation.
- **Consumer Direct Relevance & Experience Tuning Agency**:
  - Added one-click actions: "Snooze [Merchant] for 30 Days", "See 50% Less in [Category]", "Not Relevant to Me (Hide)", and "This Ad Was Relevant".
  - Incorporated `snoozedMerchants` and `categoryWeights` state in `UserContext`, automatically filtering out snoozed advertisers from the live feed and attenuating category frequency without page reload.
- **Anonymous Privacy-Preserving Feedback Ingestion**:
  - Built `/api/engagement/feedback` endpoint to receive un-fingerprinted feedback events with zero user PII, recording anonymous relevance signals in Supabase.
- **Ad Studio Campaign Relevance & Quality Score Indicators**:
  - Enhanced `/studio` to calculate real-time campaign relevance ratios from positive vs. negative feedback signals, rendering a high-contrast `🎯 Relevance: XX%` quality badge on campaign rows.
- **Comprehensive Testing Suite**:
  - Created unit test suite in `src/components/transparency.test.ts` (119 unit tests passing 100%).
  - Created automated browser test in `tests/e2e/transparency.spec.ts` (14 Playwright E2E browser tests passing 100%).

## [5.0.0] - 2026-09-07

### Added
- **Segmented Authentication & Signup Pathways**: Implemented dedicated Sign In and Create Account segmented flows in `/login` with individual vs. business role selection, input validation, and clear error handling.
- **3-Step Consumer Preference Onboarding**: Connected `/onboarding` to save user category preferences directly into Supabase and automatically award a 100 AdPoints welcome bonus.
- **Business Studio Campaign Lifecycle Management**:
  - Direct route to `/studio` for newly registered business accounts.
  - Added inline lifecycle action controls: `⏸ Pause`, `▶ Resume`, `✏ Edit Budget` (interactive modal), and `🗑 Archive`.
  - Added ad credits deduction and balance validation on campaign creation in `/studio/create`.
- **Inbound Customer Leads Cockpit**: Added an advertiser leads management pipeline in `/studio` with status filtering (`All`, `New`, `Contacted`, `Closed`) and quick actions (`Mark Contacted`, `Close Lead`, `Reopen`).
- **High-Contrast Barcode & 2D QR Code Scanner Wallet**:
  - Added format toggle between linear Code-128 barcode and dynamic HTML canvas 25×25 QR code matrix with corner finder patterns.
  - Built an in-store cashier verification PIN input with database state updating via `verify_and_redeem_coupon` RPC.
- **Privacy & GDPR Compliance Enhancements**:
  - GDPR Article 20 one-click anonymous profile data export to formatted JSON in `/profile`.
  - GDPR Article 17 "Forget Me" account deletion with cascading database erasure via `gdpr_forget_user` RPC.
  - Enforced client-side Zero-Knowledge feed filtering to prevent preference query leakage.
- **Comprehensive Unit & Integration Test Suites**:
  - `tests/unit/campaign-lifecycle.test.ts`: Added tests for RTB auction ranking, deterministic A/B split-testing variations, budget pacemaker rate limits, and geofence proximity calculations.
  - `tests/integration/api-endpoints.test.ts`: Added integration tests for Stripe checkout validation and cryptographic HMAC dwell-time heartbeats.
- **Playwright End-to-End Test Expansion**:
  - Codified consumer account creation, 3-step preference onboarding, and welcome points grant into automated browser test suite.
  - Codified business account creation with brand name and automatic studio routing.
  - Achieved 12/12 passing E2E browser tests and 58/58 passing Vitest unit/integration tests.
- **Bilingual Localization Parity**: Synchronized 100% of all UI strings across canonical English (`catalog.en-US.json`) and Puerto Rican Spanish (`catalog.es-PR.json`).
- **Comprehensive User & Developer Guide**: Created `HOW-TO.md` covering SaaS app access on Vercel, consumer onboarding, business studio tools, barcode/QR verification, and local development.

## [4.1.0] - 2026-06-17

### Added
- **AI-Governed Council HQ Dashboard**: Built dynamic AI deliberation features at `/hq` to process proposals, cast votes, and write ratified markdown decisions.
- **Geofence Verification Ledger**: Implemented Postgres table `geofence_claims` with RLS and unique constraint checks alongside a secure `SECURITY DEFINER` RPC helper to prevent double-claiming points.
- **3D WebGL ZKP Viewport Swiper**: Built a local WebGL rotating 3D advertiser card with drag controls, visibility tracking, on-device mock Zero-Knowledge Proof generation, and database ledger integration.

## [4.0.0] - 2026-06-09

### Added
- **Portable Localization Governance Framework**: Integrated the tenant-bound localization workflow from ChurchCore Care, supporting immutable translation versions and states: `draft` -> `translated` -> `validated` -> `in_linguistic_review` -> `approved` -> `active` -> `stale`.
- **Supabase Postgres Storage Adapter**: Added new SQL migrations and configured `@localization-governance/storage-postgres` bound strictly to tenant ID `'adme'`.
- **Row-Level Security (RLS) Policies**: Enabled RLS on all localization governance tables, defining select policies for public access.
- **Reviewer Assignment & Separation of Duties**: Enforced explicit reviewer role assignments (`linguistic`, `domain`) to prevent unauthorized reviews and satisfy separation of duties policies.
- **Automatic Translation & Validation Suite**: Integrated validation checks for key coverage, blank values, exact placeholder matching, plural forms, and glossary terms.
- **Source-Change Staleness & Rollbacks**: Implemented automatic staleness propagation for approved/active versions on source updates and atomic rollback capabilities.
- **Fast-Expiry UI Translation Helper**: Implemented `translateUi` and `getActiveCatalog` with a 5-second fast-expiry in-memory cache to prevent database bottlenecks.
- **CLI Runner Integration**: Added `localization-governance.config.mjs` config connecting the CLI to local/production Postgres instances.
- **Comprehensive Integration Tests**: Implemented a comprehensive test suite in `tests/localization/governance.test.ts` verifying all requirements.

## [3.0.0] - 2026-06-07

### Added
- **Client-Side Contextual Ad Injection**: Implemented smart-blending feed matching category tagging of mock organic posts and ads to protect preference mapping.
- **Local Differential Privacy (LDP) for Polls**: Added a 30% randomized response coin-flip math toggle providing database-level plausible deniability of user preferences while paying out point rewards truthfully.
- **Proximity Deal Scratch-to-Reveal**: Created a canvas-based interactive scratch-off voucher reveal widget rewarding users with a +50 point bonus upon completion.
- **Interactive Feed Density Visualizer**: Developed an animated 24h timeline canvas graph slider plotting active delivery waves, quiet hours, and real-time cadence scoring.
- **Zero-Knowledge Preference Matching**: Relocated category filtering entirely client-side to prevent profiling leaks through database server queries. Global ads are retrieved and shuffled using the Fisher-Yates randomizer before filtering.
- **Advertiser Budget Pacemaker**: Introduced daily budget pacing controls that compare elapsed time fractions with campaign spend fractions to smoothly throttle ad distribution across a 24-hour cycle.
- **Canvas GPS Compass Navigation**: Designed a custom HTML5 canvas component within geofence alert cards displaying users' real-time walking path, bearing compass, and glowing hotspots.
- **Gamified Tinder-style Polls**: Created a Tinder-style swipeable card deck widget in the Rewards Hub, allowing users to earn points while adding or removing ad preference categories with fluid angle/inertia animations.
- **Authenticated Demo Switcher Alignment**: Standardized demo switcher navigation, ensuring local Supabase session authentication cookies are properly generated and resolved before executing role-based page updates.

### Fixed
- Fixed Playwright E2E testing button selector collisions via strict exact matching constraints.

## [2.0.0] - 2026-06-07

### Added
- **Hardened Row-Level Security (RLS)**: Enforced strict Supabase policies on engagements, preferences, reports, and ad records.
- **Service Role RPC for Rewards**: Secured rewards balance updates using a database function restricted to service role execution, paired with an database trigger protecting balance updates.
- **Cascading GDPR Footprint Erasure**: Created a database trigger on user deletion that automatically cascades to clear Auth metadata, engagements, leads, reports, and preferences.
- **Cryptographic Heartbeat Dwell-Time Tracking**: Implemented secure HMAC-signed dwell-time heartbeats (`/api/engagement/init` and `/api/engagement/heartbeat`) to prevent analytics spoofing.
- **Visual Z-Test Campaign Comparison**: Built a side-by-side significance card in the Ad Studio using normal CDF calculations to evaluate A/B test campaign performance.
- **Consistent Split Testing**: Created deterministic user/device ID hashing to ensure consistent variation presentation in the feed.
- **E2E Playwright Test Suite**: Created robust end-to-end browser tests verifying user flow, simulated location proximity deal triggers, and GDPR erasure.
- **Deployment Architecture Guide**: Added `deployment_guide.md` covering staging setup, database schema migration, and build verification.

### Fixed
- Fixed asynchronous loading state mismatches in `UserProvider` to avoid unauthorized routing redirects during initial hydration.
- Corrected A/B testing array order preservation to prevent filtered split test variations from being sliced out of the feed.

## [1.2.0] - 2026-06-06

### Added
- **Demo Personas Switcher**: Collapsible floating glassmorphic panel drawer enabling hot-swapping between three consumer personas and two business accounts with credentials-free local session bypass.
- **Ad Frequency & Placement Settings**: User settings for ad insertion cadence (Low, Balanced, High) and channel toggles (Feed, Geofenced, Push) to restrict ad visibility in accordance with user preferences.
- **Quiet Hours Scheduling**: Interactive time schedule selectors to temporarily block geofenced alert triggers during specific windows (handles midnight span).
- **Geofencing & Proximity Alerts**: Location-based client alerts triggering popup vouchers when a consumer walks within 0.25 miles of a saved ad placement.
- **Proximity Simulator Widget**: Sidebar tool allowing developers to simulate local geolocations at Valor Brews, The Green Kitchen, or Nomad Motors.
- **Value-Exchange Interaction Units**: HTML5 Canvas-based Scratch Card and Brand Trivia Quiz interactive cards embedded inside feed and native ad components that reward users with points upon completion.
- **Ad Studio Audience Behavior Simulator**: Advanced studio tools enabling business owners to simulate customer retention events (Bounce, Deep Read, Click) and observe real-time chart and CTR updates via reactive Supabase realtime channels.
- **Privacy Ledger & Consent Settings**: A dedicated, full-width section in profile settings showing anonymous preferences and footprint trackers, supporting JSON profile data downloads, and a verified "Forget Me & Purge" reset action.

---

## [1.1.0] - 2026-06-06

### Added
- **Privacy-First Anonymous UIDs**: Implemented a database migration trigger to automatically generate anonymous UIDs (`UID-XXXX-XXXX`) for consumer accounts instead of copying raw email addresses to the public `users` table.
- **Enhanced Signup Metadata Flow**: Forward company names on signup in `actions.ts` when registering business accounts, while maintaining strict consumer anonymity.
- **Positioning and Marketing Strategy README**: Completely updated the repository documentation to align with the core positioning: *"The world's first privacy-first, permission-based advertising marketplace"*.

---

## [1.0.0] - 2026-06-06

### Added
- **Supabase Backend Integration**: Complete database schema and API integration for user management, ad campaigns, engagements, and rewards.
- **Ad Studio**: Real-time business dashboard supporting campaign creation, budget management, and detailed performance analytics (Views, Clicks, CTR).
- **A/B Testing**: Support for variation testing of headlines and assets in ad campaigns.
- **Consumer Profile & Ad Wallet**: Dedicated space for consumers to tune feed recommendations, view active day streaks, and access saved deals or drops.
- **Location-based Feed**: Real-time distance calculation and proximity filtering for localized campaigns.
- **Engagement Logs & Real-Time Analytics**: Supabase real-time subscription model to track views, clicks, likes, and skips.
- **Comments Component**: Interactive feedback loop for campaigns.
- **Toast Notifications & Global State Providers**: Improved user feedback and unified context for seamless role switching.

### Fixed
- TypeScript compilation issues regarding conditional property access on optional profiles and context state definitions.
- Resolved type casting issues inside `Object.entries` mapping for campaign summaries.

---

## [0.1.0] - 2026-05-01

### Added
- Initial project layout and structure bootstrapped with Next.js App Router.
- Mock-data-driven feed and basic consumer role navigation.
