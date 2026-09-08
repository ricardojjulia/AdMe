/**
 * AdMe Automated Stripe Product & Price Setup Script
 * Usage: node scripts/setup-stripe-products.mjs
 * 
 * Automatically provisions the official AdMe product catalog in your Stripe account.
 */

import fs from 'fs';
import Stripe from 'stripe';

// Read local .env.local for credentials
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) process.env[k.trim()] = v.join('=').trim();
});

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("Missing STRIPE_SECRET_KEY in .env.local");
  process.exit(1);
}

const stripe = new Stripe(secretKey);

const PRODUCTS_TO_CREATE = [
  // 1. Credit Packs (One-Time)
  {
    name: "AdMe Campaign Credits - Starter Pack",
    description: "1,000 ad credits for high-intent merchant ad delivery.",
    price: 1000, // $10.00
    currency: "usd",
    type: "one_time",
    metadata: { category: "credits", credits: "1000", pack: "starter" }
  },
  {
    name: "AdMe Campaign Credits - Growth Pack",
    description: "5,000 ad credits for scaling campaigns and local deals.",
    price: 5000, // $50.00
    currency: "usd",
    type: "one_time",
    metadata: { category: "credits", credits: "5000", pack: "growth" }
  },
  {
    name: "AdMe Campaign Credits - Scale Pack",
    description: "10,000 ad credits for continuous A/B split-testing and lead gen.",
    price: 10000, // $100.00
    currency: "usd",
    type: "one_time",
    metadata: { category: "credits", credits: "10000", pack: "scale" }
  },

  // 2. SaaS Subscriptions (Recurring Monthly)
  {
    name: "AdMe Merchant SaaS - Starter Plan",
    description: "1 active campaign, basic analytics, standard targeting.",
    price: 1000, // $10.00/mo
    currency: "usd",
    type: "recurring",
    interval: "month",
    metadata: { category: "subscription", tier: "starter", max_campaigns: "1" }
  },
  {
    name: "AdMe Merchant SaaS - Growth Plan",
    description: "5 active campaigns, A/B testing, proximity boosting, priority support.",
    price: 2500, // $25.00/mo
    currency: "usd",
    type: "recurring",
    interval: "month",
    metadata: { category: "subscription", tier: "growth", max_campaigns: "5" }
  },
  {
    name: "AdMe Merchant SaaS - Scale Plan",
    description: "Unlimited campaigns, advanced analytics, dedicated account rep.",
    price: 9900, // $99.00/mo
    currency: "usd",
    type: "recurring",
    interval: "month",
    metadata: { category: "subscription", tier: "scale", max_campaigns: "unlimited" }
  },

  // 3. Premium Add-ons
  {
    name: "AdMe Verified Merchant Trust Shield",
    description: "Official verified merchant checkmark badge boosting consumer engagement.",
    price: 1500, // $15.00/mo
    currency: "usd",
    type: "recurring",
    interval: "month",
    metadata: { category: "addon", feature: "verified_badge" }
  }
];

async function setupCatalog() {
  console.log("Connecting to Stripe to provision AdMe commercial catalog...");

  for (const item of PRODUCTS_TO_CREATE) {
    try {
      console.log(`Creating product: ${item.name}...`);
      const product = await stripe.products.create({
        name: item.name,
        description: item.description,
        metadata: item.metadata
      });

      const priceData = {
        product: product.id,
        unit_amount: item.price,
        currency: item.currency,
        metadata: item.metadata
      };

      if (item.type === "recurring") {
        priceData.recurring = { interval: item.interval };
      }

      const price = await stripe.prices.create(priceData);
      console.log(`✓ Product created: ${product.id} | Price: ${price.id} ($${(item.price / 100).toFixed(2)})`);
    } catch (err) {
      console.error(`Error creating ${item.name}:`, err.message);
    }
  }

  console.log("\nAll Stripe products provisioned successfully!");
}

setupCatalog();
