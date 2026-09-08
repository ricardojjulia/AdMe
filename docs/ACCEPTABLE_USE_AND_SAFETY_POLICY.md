# AdMe Acceptable Use, Merchant Compliance & AI Safety Architecture

## 1. Executive Purpose & Zero-Tolerance Philosophy
AdMe operates on the foundational principle of a **fair, consensual, and safe value exchange**. Because consumers voluntarily give their time and attention to engage with merchant campaigns, the platform holds an unwavering, zero-tolerance standard against harmful, illegal, deceptive, or abusive practices.

We reject the toxic legacy of traditional ad networks that prioritize click volume over human dignity and community safety. AdMe enforces strict pre-publication AI screening, continuous merchant verification, automated community reporting with instant AI arbitration, and clear commercial boundaries.

---

## 2. Core Policy Pillars (The 7 Pillars)

### Pillar 1: AI-Powered Pre-Publication Ad Moderation
Every creative asset (headline, body copy, imagery, outbound links, and call-to-action) must pass an automated AI Safety & Moderation gate prior to becoming active in the public feed.
* **Prohibited Content Rubric**:
  * **Inhuman & Harmful Content**: Promotion or depiction of violence, self-harm, gore, physical endangerment, cruelty to animals, or exploitative acts.
  * **Hate Speech, Racism & Social Hatred**: Any content that attacks, dehumanizes, denigrates, incites hatred against, or uses slurs targeting protected classes, race, ethnicity, religion, disability, age, nationality, veteran status, sexual orientation, or gender identity.
  * **Misleading & Deceptive Claims**: False health cures, miraculous investment schemes ("guaranteed 10x returns"), deceptive pricing, impersonation of legitimate institutions, and clickbait with bait-and-switch destinations.
  * **Malformed & Degraded Creative**: Low-resolution, broken layouts, spammy keyword stuffing, deceptive UI mimics (e.g. fake "close" buttons or fake system error dialogs).
* **Technical Integration**: Evaluated via an OpenRouter / Multi-LLM safety pipeline (using high-reasoning models with vision support) that scores each creative across risk dimensions [0.0 to 1.0]. Any score above 0.20 triggers an automatic publication hold and rejection explanation.

### Pillar 2: AI Merchant Verification & Ground-Truth Vetting
To eliminate ghost businesses, fly-by-night scams, and malicious actors, AdMe requires merchant verification backed by automated AI background auditing:
* **Digital Storefront Vetting**: The merchant’s target website is crawled by AI to verify valid HTTPS, operational checkout, legitimate domain age, published return/refund policies, and real contact information.
* **Physical Location & Map Ground-Truthing**: Local merchants submitting physical addresses are cross-referenced with Google Maps / Google Earth satellite data and local registry records to verify that a genuine brick-and-mortar presence exists at the claimed coordinates.
* **Social Media & Public Footprint Check**: Automated evaluation of merchant public profiles, business entity registration, and public customer sentiment to weed out known fraudulent networks.
* **Trust Status**: Verified merchants earn the **Verified Merchant Trust Shield** (`verified_badge`), while unverified or suspicious merchants are blocked from launching campaigns.

### Pillar 3: Upfront & Center Merchant Education & Clarity
Merchants must be fully read in and explicitly acknowledge how AdMe functions before spending their first dollar:
* **What They Are Paying For**: Merchants pay for **guaranteed human attention, verified dwell time, and opt-in engagement**. They are informed clearly that AdMe is not a magic sales generator; conversion depends on the quality of their offer.
* **Clear Pricing & Zero Hidden Fees**: Ad delivery credit rates ($0.01/credit) and SaaS subscription tiers ($10, $25, $99/mo) are displayed transparently with live balances and pacing metrics.
* **Credit Expiration & Policy Transparency**: Merchants have 24/7 visibility into their campaign cockpit, budget pacing, and credit consumption ledgers.

### Pillar 4: Upfront & Center Consumer Transparency
Consumers are partners in the ecosystem, not products to be harvested:
* **The Fair Value Exchange**: Users know exactly why an ad appears (based on voluntarily selected category preferences, never covert tracking).
* **Clear Reward Mechanics**: Users see exact reward point values (+5, +10, +25, +50 points) before engaging.
* **Zero Surveillance Guarantee**: Re-affirmed under Architecture Council Decision **COUNCIL-2026-004**; location coordinates are quantized on-device (~1.1km grid) and never stored on servers. Personal profiles are never sold to data brokers.

### Pillar 5: Off-Platform Commerce & Non-Liability Clause
* **Storefront Redirection**: AdMe is an advertising and discovery marketplace, **not an e-commerce merchant of record**.
* **External Purchases**: All product purchases, payments, shipping, and fulfillment take place on the merchant’s own website, e-commerce store (e.g., Shopify, WooCommerce), or physical establishment.
* **Clear Disclaimer**: AdMe is not responsible for, nor does AdMe sell, manufacture, warehouse, warrant, or fulfill any products advertised by merchants. Any disputes regarding purchased physical or digital items must be resolved directly between the buyer and the merchant.

### Pillar 6: Strict Prohibition Against Illicit & Illegal Business
AdMe strictly forbids and refuses service to any business engaged in illegal, illicit, or harmful trade:
* **Prohibited Categories**:
  * Weapons, firearms, ammunition, and explosives.
  * Illicit drugs, narcotics, prescription medication without medical authorization, and drug paraphernalia.
  * Counterfeit, pirated, or replica goods.
  * Adult services, non-consensual sexual content, and escort services.
  * Unregulated gambling, sports betting, or predatory payday lending.
  * Spyware, hacking software, and unauthorized surveillance tools.
  * Hate group paraphernalia or extremist propaganda.
* **Enforcement**: Any attempt to advertise prohibited categories results in immediate suspension, ad takedown, and notification to relevant law enforcement when legally required.

### Pillar 7: Automated User Reporting, AI Takedowns & Immediate Account Termination
Users are empowered with real-time reporting tools backed by automated AI arbitration:
* **1-Click Ad Reporting**: Every ad card features a discreet "Report Ad" option with standard violation categories (Offensive, Misleading, Scam, Inappropriate, Broken Link).
* **Instant AI Arbitration Pipeline**:
  1. A user report immediately triggers an automated AI arbitration request.
  2. The AI compares the ad copy, media, target URL, and user report details against the AdMe Acceptable Use Policy.
  3. **Immediate Automatic Takedown**: If the AI determines a high probability of violation, the ad is **pulled from feed circulation immediately** (status updated to `takedown`).
  4. **Merchant Penalty & Account Termination**:
     * Minor policy issues trigger a mandatory ad rejection and credit freeze until remedied.
     * Egregious violations (hate speech, fraud, illicit sales, harassment) result in **immediate and permanent termination of the merchant account**, forfeiture of unused ad credits, and permanent blacklisting of the merchant's domain, payment credentials, and IP footprint.
     * Personal user accounts found engaging in abusive reporting manipulation or coordinated bad-faith attacks are likewise subject to immediate account termination.
  5. **Whistleblower Feedback**: Users who report verified violations receive notification that the offensive content was safely removed, maintaining trust in the platform.

---

## 3. Technical Implementation Architecture

```
                          ┌──────────────────────────┐
                          │ Merchant Creates Campaign│
                          └────────────┬─────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │ Gate 1: AI Pre-Flight Moderation  │
                     │ (OpenRouter / Multi-LLM Pipeline) │
                     └─────────┬───────────────┬─────────┘
                               │               │
                     Passed    │               │ Failed (>0.20 Risk)
                               ▼               ▼
                        ┌─────────────┐ ┌───────────────────┐
                        │ Status:     │ │ Status: Rejected  │
                        │ Active Feed │ │ Rejection Reason  │
                        └──────┬──────┘ └───────────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │ Live in Feed│
                        └──────┬──────┘
                               │
             User Reports Ad   │
                               ▼
                     ┌───────────────────────────────────┐
                     │ Gate 2: Instant AI Arbitration    │
                     │ (Automated Takedown & Striking)   │
                     └─────────┬───────────────┬─────────┘
                               │               │
                    Violated   │               │ Cleared
                               ▼               ▼
                      ┌─────────────────┐ ┌─────────────┐
                      │ Immediate Pull  │ │ Kept Active │
                      │ Account Strikes │ └─────────────┘
                      │ Termination     │
                      └─────────────────┘
```

---

## 4. Verification & Transparency Statement
This policy is published permanently within the AdMe codebase under `docs/ACCEPTABLE_USE_AND_SAFETY_POLICY.md` and integrated directly into the application interface for both merchants and consumers.
