import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as handleCheckout } from '@/app/api/checkout/route';
import { POST as handleInitEngagement } from '@/app/api/engagement/init/route';
import { POST as handleHeartbeat } from '@/app/api/engagement/heartbeat/route';
import crypto from 'crypto';

describe('API Endpoints Integration Tests', () => {
  describe('1. Checkout API (/api/checkout)', () => {
    it('should reject requests missing checkoutMode with 400', async () => {
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
  });

  describe('2. Engagement Handshake & Heartbeat Cryptographic Verification', () => {
    const SECRET = process.env.JWT_SECRET || 'adme_developer_secret_key_heartbeat_123';

    it('should reject engagement init without adId or userId with 400', async () => {
      const req = new Request('http://localhost:3400/api/engagement/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId: 'ad-123' }) // missing userId
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

      // Verify the cryptographic HMAC signature locally
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
      const timestamp = Date.now(); // Current time
      const engagementId = crypto.randomUUID();

      const raw = `${adId}:${userId}:${timestamp}:${engagementId}`;
      const sig = crypto.createHmac('sha256', SECRET).update(raw).digest('hex');
      const validToken = `${raw}:${sig}`;

      // Claim 120 seconds duration when 0 seconds elapsed
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
  });
});
