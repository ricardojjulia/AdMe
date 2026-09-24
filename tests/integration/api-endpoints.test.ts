import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

import { POST as handleCheckout } from '@/app/api/checkout/route';
import { POST as handleCheckoutVerify } from '@/app/api/checkout/verify/route';
import { POST as handleInitEngagement } from '@/app/api/engagement/init/route';
import { POST as handleHeartbeat } from '@/app/api/engagement/heartbeat/route';
import { POST as handleFeedback } from '@/app/api/engagement/feedback/route';
import { POST as handleVoucherClaim } from '@/app/api/engagement/voucher-claim/route';
import { GET as handleCoarseLocation } from '@/app/api/location/coarse/route';
import { GET as handleMarketplaceNearby } from '@/app/api/marketplace/nearby/route';
import { GET as handlePlacesNearby } from '@/app/api/places/nearby/route';
import { POST as handleModerationAd } from '@/app/api/moderation/ad/route';
import { POST as handleModerationReport } from '@/app/api/moderation/report/route';
import { POST as handleStudioCopilot } from '@/app/api/studio/copilot/route';
import { POST as handleStripeWebhook } from '@/app/api/webhooks/stripe/route';

describe('AdMe Complete API Integration Test Suite', () => {
  const SECRET = process.env.JWT_SECRET || 'adme_developer_secret_key_heartbeat_123';

  // 1. Checkout & Payment Verification APIs
  describe('1. Checkout & Verification APIs (/api/checkout, /api/checkout/verify)', () => {
    it('should reject checkout requests missing checkoutMode with 400', async () => {
      const req = new Request('http://localhost:3400/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'user-123' })
      });

      const res = await handleCheckout(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Missing checkout mode');
    });

    it('should initialize credits checkout session with valid redirect URL', async () => {
      const req = new Request('http://localhost:3400/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutMode: 'credits',
          selectedPack: 25,
          userId: 'user-test-uuid'
        })
      });

      const res = await handleCheckout(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.sessionId).toMatch(/^cs_test_/);
      expect(data.url).toContain('mode=credits');
      expect(data.url).toContain('val=25');
    });

    it('should initialize subscription upgrade session with valid plan redirect', async () => {
      const req = new Request('http://localhost:3400/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkoutMode: 'subscription',
          selectedSub: 'growth',
          userId: 'business-user-uuid'
        })
      });

      const res = await handleCheckout(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.url).toContain('mode=subscription');
      expect(data.url).toContain('val=growth');
    });

    it('should reject verification requests missing sessionId with 400', async () => {
      const req = new Request('http://localhost:3400/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const res = await handleCheckoutVerify(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Missing sessionId parameter');
    });

    it('should verify simulated checkout sessions successfully', async () => {
      const req = new Request('http://localhost:3400/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: 'cs_test_simulated_987654' })
      });

      const res = await handleCheckoutVerify(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.verified).toBe(true);
      expect(data.isSimulated).toBe(true);
    });
  });

  // 2. Engagement & Dwell Cryptographic Verification APIs
  describe('2. Engagement Primitives (/api/engagement/*)', () => {
    it('should reject engagement init without adId or userId with 400', async () => {
      const req = new Request('http://localhost:3400/api/engagement/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: 'ad-123' })
      });

      const res = await handleInitEngagement(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Missing parameters');
    });

    it('should issue a cryptographically signed HMAC token upon handshake', async () => {
      const req = new Request('http://localhost:3400/api/engagement/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: 'campaign-ad-456',
          userId: 'consumer-user-789'
        })
      });

      const res = await handleInitEngagement(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.engagementId).toBeDefined();

      const parts = data.token.split(':');
      expect(parts.length).toBe(5);
      expect(parts[0]).toBe('campaign-ad-456');
      expect(parts[1]).toBe('consumer-user-789');

      const rawPayload = `${parts[0]}:${parts[1]}:${parts[2]}:${parts[3]}`;
      const expectedSig = crypto
        .createHmac('sha256', SECRET)
        .update(rawPayload)
        .digest('hex');

      expect(parts[4]).toBe(expectedSig);
    });

    it('should reject heartbeat with tampered HMAC signature with 401', async () => {
      const adId = 'ad-tamper';
      const userId = 'user-tamper';
      const timestamp = Date.now();
      const engagementId = crypto.randomUUID();
      const tamperedSignature = 'deadbeefcafebabe1234567890abcdef';

      const tamperedToken = `${adId}:${userId}:${timestamp}:${engagementId}:${tamperedSignature}`;

      const req = new Request('http://localhost:3400/api/engagement/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tamperedToken,
          duration: 3.5
        })
      });

      const res = await handleHeartbeat(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid signature');
    });

    it('should reject heartbeat dwell time anomaly (duration > elapsed + 5s) with 400', async () => {
      const adId = 'ad-anomaly';
      const userId = 'user-anomaly';
      const timestamp = Date.now();
      const engagementId = crypto.randomUUID();

      const raw = `${adId}:${userId}:${timestamp}:${engagementId}`;
      const sig = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
      const validToken = `${raw}:${sig}`;

      const req = new Request('http://localhost:3400/api/engagement/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: validToken,
          duration: 120.0
        })
      });

      const res = await handleHeartbeat(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Dwell time anomaly detected');
    });

    it('should record zero-knowledge ad feedback (/api/engagement/feedback)', async () => {
      const req = new Request('http://localhost:3400/api/engagement/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: 'feed-mock-ad-1',
          action: 'snooze_advertiser',
          category: 'Specialty Coffee'
        })
      });

      const res = await handleFeedback(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.syndicated).toBe(true);
    });

    it('should reject feedback with invalid action with 400', async () => {
      const req = new Request('http://localhost:3400/api/engagement/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: 'feed-mock-ad-1',
          action: 'unsupported_action'
        })
      });

      const res = await handleFeedback(req);
      expect(res.status).toBe(400);
    });

    it('should record zero-knowledge voucher claims (/api/engagement/voucher-claim)', async () => {
      const req = new Request('http://localhost:3400/api/engagement/voucher-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: 'feed-mock-ad-2',
          merchantName: 'The Green Kitchen',
          offerName: '20% Off Organic Bowls',
          code: 'VLB-TEST-2026'
        })
      });

      const res = await handleVoucherClaim(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.code).toBe('VLB-TEST-2026');
    });
  });

  // 3. Location Privacy & Discovery APIs
  describe('3. Location & Nearby Discovery APIs (/api/location/coarse, /api/places/nearby, /api/marketplace/nearby)', () => {
    it('should return coarse quantized location metadata (/api/location/coarse)', async () => {
      const nextReq = new NextRequest('http://localhost:3400/api/location/coarse', {
        headers: {
          'x-vercel-ip-city': 'San Juan',
          'x-vercel-ip-country-region': 'PR',
          'x-vercel-ip-country': 'US'
        }
      });

      const res = await handleCoarseLocation(nextReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.city).toBe('San Juan');
      expect(data.region).toBe('PR');
      expect(data.source).toBe('edge-header');
    });

    it('should return syndicated marketplace items (/api/marketplace/nearby)', async () => {
      const nextReq = new NextRequest('http://localhost:3400/api/marketplace/nearby?city=Tampa&category=Tech%20%26%20SaaS');
      const res = await handleMarketplaceNearby(nextReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.source).toBe('facebook_marketplace_syndication');
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.items[0].city).toBe('Tampa');
    });

    it('should gracefully return local discovery places (/api/places/nearby)', async () => {
      const nextReq = new NextRequest('http://localhost:3400/api/places/nearby?city=Orlando&category=Specialty%20Coffee');
      const res = await handlePlacesNearby(nextReq);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.places)).toBe(true);
    });
  });

  // 4. Content Safety & Moderation APIs
  describe('4. Moderation & Safety APIs (/api/moderation/ad, /api/moderation/report)', () => {
    it('should reject ad moderation evaluation missing headline with 400', async () => {
      const req = new Request('http://localhost:3400/api/moderation/ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'Tech' })
      });

      const res = await handleModerationAd(req);
      expect(res.status).toBe(400);
    });

    it('should successfully evaluate ad creative for brand safety', async () => {
      const req = new Request('http://localhost:3400/api/moderation/ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: 'Artisanal Single-Origin Pour Over',
          contentText: 'Sustainably sourced beans roasted in small batches with zero additives.',
          category: 'Specialty Coffee'
        })
      });

      const res = await handleModerationAd(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.moderation).toBeDefined();
      expect(typeof data.moderation.approved).toBe('boolean');
    });

    it('should arbitrate user report on syndicated item safely (/api/moderation/report)', async () => {
      const req = new Request('http://localhost:3400/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adId: 'feed-item-123',
          reason: 'misleading',
          headline: 'Miracle Fast Weight Loss Scheme',
          contentText: 'Lose 50 pounds overnight with one weird trick!'
        })
      });

      const res = await handleModerationReport(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(typeof data.takedownApplied).toBe('boolean');
      expect(data.decision).toBeDefined();
    });
  });

  // 5. Studio AI Co-Pilot & Webhook APIs
  describe('5. Studio Co-Pilot & Stripe Webhooks (/api/studio/copilot, /api/webhooks/stripe)', () => {
    it('should reject creative copilot without category with 400', async () => {
      const req = new Request('http://localhost:3400/api/studio/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantName: 'Local Roaster' })
      });

      const res = await handleStudioCopilot(req);
      expect(res.status).toBe(400);
    });

    it('should synthesize 3 strategic angles via Creative Co-Pilot with fallback', async () => {
      const req = new Request('http://localhost:3400/api/studio/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantName: 'Valor Brews',
          category: 'Specialty Coffee',
          productBrief: 'Locally roasted beans supporting veteran initiatives'
        })
      });

      const res = await handleStudioCopilot(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.variants)).toBe(true);
      expect(data.variants.length).toBe(3);
      expect(data.variants[0].angle).toBe('value');
      expect(data.variants[0].angleTitle).toBe('Value & Utility');
      expect(data.variants[1].angle).toBe('story');
      expect(data.variants[1].angleTitle).toBe('Story & Mission');
      expect(data.variants[2].angle).toBe('curiosity');
      expect(data.variants[2].angleTitle).toBe('Curiosity & Innovation');
    });

    it('should accept simulated Stripe webhook events safely (/api/webhooks/stripe)', async () => {
      const req = new Request('http://localhost:3400/api/webhooks/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'evt_test_123',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_test_123',
              payment_status: 'paid',
              metadata: {
                userId: 'test-user-id',
                checkoutMode: 'credits',
                credits: '50',
                amountCents: '5000'
              }
            }
          }
        })
      });

      const res = await handleStripeWebhook(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.received).toBe(true);
    });
  });
});
