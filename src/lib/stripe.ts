import Stripe from 'stripe';

let stripeServerInstance: Stripe | null = null;

export function getStripeServer(): Stripe | null {
  if (stripeServerInstance) {
    return stripeServerInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return null;
  }

  stripeServerInstance = new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia' as any,
    typescript: true,
  });

  return stripeServerInstance;
}

export function isStripeLive(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && key.startsWith('sk_'));
}

export interface CreditPackConfig {
  priceDollars: number;
  credits: number;
  label: string;
}

export interface SubscriptionConfig {
  id: string;
  name: string;
  priceDollars: number;
  interval: 'month';
}

export const CREDIT_PACKS: Record<number, CreditPackConfig> = {
  10: { priceDollars: 10, credits: 1000, label: 'Starter Pack' },
  50: { priceDollars: 50, credits: 5000, label: 'Growth Pack' },
  100: { priceDollars: 100, credits: 10000, label: 'Scale Pack' },
};

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionConfig> = {
  starter: { id: 'starter', name: 'Starter Plan', priceDollars: 10, interval: 'month' },
  growth: { id: 'growth', name: 'Growth Plan', priceDollars: 25, interval: 'month' },
  scale: { id: 'scale', name: 'Scale Plan', priceDollars: 99, interval: 'month' },
};
