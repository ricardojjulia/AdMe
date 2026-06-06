# AdMe ── The World's First Privacy-First, Permission-Based Advertising Marketplace

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js 16](https://img.shields.io/badge/Next.js-16.0.8-black.svg?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-blueviolet.svg?style=flat&logo=supabase)](https://supabase.com/)

> **"We know what you like, but we don't know who you are."**

AdMe is a revolutionary discovery platform built to fix digital advertising for both users and businesses. Instead of surveillance-based tracking, AdMe operates as a consent-first, privacy-first ad marketplace. Users voluntarily control their preferences, maintain complete anonymity through hashed UIDs, and earn value for their attention. Small businesses get an affordable, level playing field to reach high-intent customers locally.

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
*   **Ad Wallet**: A local deal wallet where users save interesting drops, deals, or coupon cards to redeem later.
*   **Gamified Streaks**: Daily action milestones that reward consistent interaction.
*   **Proximity-based Proximity Filtering**: Localised feed calculation displaying campaigns within a 25-mile radius.
*   **Value Exchange (Reward Points)**: Users earn `AdPoints` for voluntary interaction (watching a demo, reviewing an ad, visiting a page), redeemable for gift cards, local business discounts, or charitable giving.

### 2. Premium Ad Formats
*   **Native Ads**: Clean layouts organically blended into the feed.
*   **Carousel Ads**: Multi-media horizontal swipe cards with smooth micro-animations.
*   **Interactive Comments**: Community feedback loops on ad campaigns.

### 3. Business Ad Studio
*   **Campaign Builder**: Self-serve campaign wizard supporting targeting filters, formatting, and budgeting.
*   **A/B Test Variations**: Built-in support to run headline and design variants to test effectiveness.
*   **Real-time Analytics**: Live reporting of views, clicks, and CTR (Click-Through Rate) utilizing Supabase Realtime subscriptions.

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
│   └── middleware.ts        # Next.js session validation and route guards
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

---

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](file:///Users/rjulia/programs/AdMe/LICENSE) file for details.
