# AdMe ── Voluntary, Beautiful Advertising

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js 16](https://img.shields.io/badge/Next.js-16.0.8-black.svg?style=flat&logo=nextdotjs)](https://nextjs.org/)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-blueviolet.svg?style=flat&logo=supabase)](https://supabase.com/)

AdMe is a Next.js web application designed to transform the advertising experience. Instead of intrusive pop-ups and tracking, AdMe features a high-fidelity, user-controlled ad feed where attention is treated as a premium value exchange. Users curate their vibes, follow brands, earn rewards for interaction, and localise campaigns based on proximity.

---

## 🌟 Key Features

### 1. Unified Consumer Experience
*   **Voluntary, Curated Feed**: Ad recommendations driven entirely by user-toggled categories (e.g., Tech, local, Wellness).
*   **Ad Wallet & Save Center**: A wallet where users save interesting drops, deals, or coupon cards to redeem later.
*   **Gamified Streaks**: Daily action milestones that reward consistent interaction.
*   **Proximity-based Filtering**: Automatic location tracking and distance calculation to display campaigns within a 25-mile radius.

### 2. Premium Ad Formats
*   **Native Ads**: Clean layouts organically blended into the feed.
*   **Carousel Ads**: Multi-media horizontal swipe cards with smooth micro-animations.
*   **Interactive Comments & Feedback**: Community threads on ad campaigns to discuss drops.

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

3. Spin up local Supabase container (optional if using cloud instance):
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

## 🛠️ Architecture & Core Guidelines

*   **Design Aesthetics**: Style with strict vanilla **CSS Modules**. Avoid ad-hoc utility classes. Ensure smooth transitions (`hover-lift`, HSL variables) and accessibility.
*   **Security & RLS**: All tables in Supabase have Row Level Security enabled. Policies are defined inside `supabase/migrations`.
*   **TypeScript Strictness**: Type safety is mandatory. Do not use `any` casting unless absolutely required for dynamic reducer indexes.
*   **Performance First**: Lazy load non-critical libraries (e.g., dynamic imports for Supabase inside Client components).

---

## 📄 License
This project is licensed under the **MIT License** - see the [LICENSE](file:///Users/rjulia/programs/AdMe/LICENSE) file for details.
