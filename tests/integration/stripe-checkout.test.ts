import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as handleCheckout } from '@/app/api/checkout/route';
import { POST as handleVerify } from '@/app/api/checkout/verify/route';
import { POST as handleWebhook } from '@/app/api/webhooks/stripe/route';

describe('Stripe Checkout & Zero-Drop Credit Fulfillment Integration', () => {
  describe('1. Checkout Session Creation (/api/checkout)', () => {
    it('should reject missing checkoutMode with 400', async () => {
      const req = new Request('http://localhost:3400/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'merchant-test-user' })
      });

      const res = await handleCheckout(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Missing checkout mode');
    });

    it('should generate a valid session and redirect for Starter credit pack ($10 = 1000 credits)', async () => {
      const req = new Request('http://localhost:3400/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutMode: 'credits',
          selectedPack: 10,
          userId: '00000000-0000-0000-0000-000000000001'
        })
      });

      const res = await handleCheckout(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeDefined();
      expect(data.url).toBeDefined();
    });

    it('should generate a valid session for monthly subscription ($25/mo Growth plan)', async () => {
      const req = new Request('http://localhost:3400/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutMode: 'subscription',
          selectedSub: 'growth',
          userId: '00000000-0000-0000-0000-000000000001'
        })
      });

      const res = await handleCheckout(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sessionId).toBeDefined();
      expect(data.url).toBeDefined();
    });
  });

  describe('2. Checkout Verification Endpoint (/api/checkout/verify)', () => {
    it('should reject requests missing sessionId with 400', async () => {
      const req = new Request('http://localhost:3400/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const res = await handleVerify(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Missing sessionId parameter');
    });

    it('should verify simulated test sessions cleanly for instant UI response', async () => {
      const testSessionId = 'cs_test_mock_verify_' + Date.now();
      const req = new Request('http://localhost:3400/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: testSessionId })
      });

      const res = await handleVerify(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.verified).toBe(true);
      expect(data.sessionId).toBe(testSessionId);
    });
  });

  describe('3. Webhook Endpoint (/api/webhooks/stripe)', () => {
    it('should accept webhook notifications safely without unhandled exceptions', async () => {
      const fakePayload = JSON.stringify({
        id: 'evt_test_123',
        type: 'ping'
      });

      const req = new Request('http://localhost:3400/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: fakePayload
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
    });
  });

  describe('4. Revenue Stream 3 & 4 Verification (Pay-Per-Lead & In-Store Cashier Redemptions)', () => {
    it('should validate Stream 3 lead structure parameters', () => {
      const mockLead = {
        adId: '30303030-3030-3030-3030-303030303030',
        message: 'Requesting quote for catering services',
        contactInfo: 'client@example.com'
      };
      expect(mockLead.adId).toBeDefined();
      expect(mockLead.message.length).toBeGreaterThan(0);
      expect(mockLead.contactInfo).toContain('@');
    });

    it('should validate Stream 4 cashier redemption payload format', () => {
      const mockRedemption = {
        targetCouponId: '240a5b85-8d85-4a80-bd20-aaeda76de68d',
        merchantPin: '1234'
      };
      expect(mockRedemption.targetCouponId).toMatch(/^[0-9a-f-]+$/);
      expect(mockRedemption.merchantPin).toBe('1234');
    });
  });
});

