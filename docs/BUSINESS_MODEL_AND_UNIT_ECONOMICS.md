# AdMe Business Model, Monetization Architecture & Unit Economics

## Executive Summary
AdMe is a **consent-driven, double-sided attention marketplace**. Traditional advertising networks (Meta, Google, TikTok) operate on an extractive model: they capture 100% of advertiser dollars, reward users with 0%, and harvest surveillance data. 

AdMe aligns the economic incentives of all stakeholders:
1. **Businesses (Merchants)** fund the ecosystem with fiat currency to purchase guaranteed, fraud-free, high-intent human attention and qualified leads.
2. **Consumers** receive a tangible cut of the ad economy in the form of redeemable reward points, local perks, and digital gift cards in exchange for their verified time and attention.
3. **AdMe Platform** acts as the automated clearinghouse, capturing an **~80% net gross margin** on attention transactions while collecting recurring SaaS fees.

---

## The 4 Core Revenue Streams

```
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           AdMe REVENUE ENGINE                          │
  └───────┬───────────────────┬────────────────────┬───────────────────┬───┘
          │                   │                    │                   │
          ▼                   ▼                    ▼                   ▼
    1. Ad Credits       2. SaaS Merchant     3. Pay-Per-Lead     4. Hyper-Local
     (Usage/CPM)          Subscriptions         (B2B/CPA)          Proximity
   $10, $50, $100/pack   $10, $25, $99/mo    $2 – $15/inbound    Cashier verified
```

### 1. Ad Delivery Credits (Usage-Based Fiat Spend)
* **How it Works**: Merchants purchase credits via Stripe Checkout ($10 = 1,000 credits, $50 = 5,000 credits, $100 = 10,000 credits).
* **Delivery Burn**: Every time a consumer views an ad, answers a brand trivia question, or engages with a poll, credits are deducted from the merchant's balance.
* **Pricing**: Base rate is **$0.01 per credit**. A verified high-dwell impression costs the merchant ~10 to 25 credits ($0.10 – $0.25).
* **Gross Margin**: AdMe retains the spread between fiat cash received and rewards liability issued.

### 2. Recurring Merchant SaaS Subscriptions
Businesses pay monthly subscriptions for software tooling, analytics, A/B testing, and campaign management:
* **Starter Plan ($10/mo)**: 1 active campaign, basic analytics, standard targeting.
* **Growth Plan ($25/mo)**: 5 active campaigns, A/B split testing, proximity boosting, priority support.
* **Scale Plan ($99/mo)**: Unlimited campaigns, continuous variant testing, advanced analytics, dedicated account rep.
* **Gross Margin**: **~90%+** (pure software recurring revenue).

### 3. Pay-Per-Lead (Inbound Customer Acquisition / CPA)
* **How it Works**: High-value advertisers (SaaS, home services, real estate, professional services, healthcare) capture verified, opt-in inquiries via the `LeadModal`.
* **Pricing**: Advertisers are charged a premium deduction of **50 to 500 credits ($0.50 to $5.00+) per qualified inbound lead**.
* **Value Proposition**: Replaces blind click-through traffic with real customer inquiries containing intent messages and contact details.

### 4. Hyper-Local Proximity & In-Store Cashier Redemptions
* **How it Works**: Brick-and-mortar merchants (restaurants, cafes, boutiques) deploy proximity deals to nearby consumers.
* **In-Store Verification**: When a consumer enters the establishment, they present a digital coupon from their `CouponWallet`. The cashier enters their staff PIN or scans the code to mark it redeemed.
* **Monetization**: Merchants pay a success fee per verified in-store foot-traffic redemption, proving 100% offline Return on Ad Spend (ROAS).

---

## The Margin Secret: "Sponsored Perk Arbitrage"

Traditional loyalty programs fail because they pay cash for every point redeemed. AdMe maintains high margins through **Sponsored Perk Arbitrage**:

1. **Zero-Cost Merchant Inventory**: Most perks in the AdMe Marketplace (e.g., *"Free Espresso with breakfast at Valor Brews"*, *"$5 off lunch at The Green Kitchen"*) are **provided by the merchants themselves at zero cost to AdMe**.
   * Merchants gladly donate coupons because every redeemed coupon brings a paying customer into their business.
2. **Breakage & Point Sinks**: Users accumulate points to unlock higher-tier perks or maintain daily app streaks. Points do not represent immediate cash outflows.
3. **The Economic Spread**:
   * Merchant spends: **$1.00** in credits for 4 verified ad engagements.
   * Users earn: **40 points** (perceived value: ~$0.40).
   * Users redeem points for: A free espresso provided by Valor Brews (Cost to AdMe: **$0.00**).
   * **AdMe Net Margin: $1.00 (100% retained) on this transaction.**

---

## Unit Economics Breakdown ($100 Merchant Spend)

| Economic Component | Amount | % of Gross | Rationale |
| :--- | :--- | :--- | :--- |
| **Gross Merchant Spend** | **$100.00** | 100.0% | Merchant purchases 10,000 Ad Credits via Stripe |
| **Stripe Processing Fee** | -$3.20 | 3.2% | Standard 2.9% + $0.30 payment processing cost |
| **Cloud Infrastructure & Edge** | -$1.80 | 1.8% | Supabase DB, Next.js edge runtime, telemetry |
| **Third-Party Gift Card Redemptions** | -$15.00 | 15.0% | Blended reserve for digital gift cards (Amazon/Target) |
| **Sponsored Merchant Coupons** | $0.00 | 0.0% | Free coupons supplied by partner businesses |
| **Net Contribution Margin** | **~$80.00** | **~80.0%** | **Operating gross profit per $100 ad revenue** |

---

## Zero-Surveillance Privacy Guarantee

AdMe's business model is explicitly structured so that user personal data is **never monetized or sold**:
* **No Third-Party Trackers**: Zero tracking pixels, zero cookies sold to data brokers.
* **On-Device Proximity Matching**: As ratified under **COUNCIL-2026-004**, location coordinates are quantized on-device (~1.1km grid) and never written to database tables.
* **Transparent Value Exchange**: Users know exactly why they are seeing an ad, how many points they will earn, and where those points come from.
