# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-06-07

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
