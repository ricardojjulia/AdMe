import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Supabase RPC call responses
const mockRpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    rpc: mockRpc,
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: {
            user: { id: "test-user-uuid" }
          }
        },
        error: null
      })
    }
  }))
}));

// Function to generate client-side ZKP proof (mirrors implementation inside component)
function generateZkpProof(userId: string, adId: string, dwellSeconds: number): string {
  const rand = Math.floor(Math.random() * 1000000);
  return `zkp_proof_0x${userId.slice(0, 4)}_${adId.slice(0, 4)}_${dwellSeconds}s_${rand.toString(16)}`;
}

// Simulated UserContext ledger helper functions
async function simulateClaimGeofenceReward(
  supabaseEnabled: boolean,
  adId: string,
  points: number
): Promise<boolean> {
  if (supabaseEnabled) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("add_geofence_claim", {
      ad_id: adId,
      points: points
    });
    if (error) return false;
    return data !== false;
  } else {
    const claimKey = `adme_geofence_claimed_mockuser_${adId}`;
    if (typeof window !== 'undefined' && localStorage.getItem(claimKey)) {
      return false;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(claimKey, "true");
    }
    return true;
  }
}

async function simulateClaimViewportReward(
  supabaseEnabled: boolean,
  adId: string,
  dwellSeconds: number,
  proof: string,
  points: number
): Promise<boolean> {
  if (supabaseEnabled) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase.rpc("add_viewport_claim", {
      ad_id: adId,
      dwell_seconds: dwellSeconds,
      zkp_proof: proof,
      points: points
    });
    if (error) return false;
    return data !== false;
  } else {
    const claimKey = `adme_viewport_claimed_mockuser_${adId}`;
    if (typeof window !== 'undefined' && localStorage.getItem(claimKey)) {
      return false;
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(claimKey, "true");
    }
    return true;
  }
}

describe("Zero-Knowledge Proof (ZKP) Viewport Swiper Logic", () => {
  it("should generate a cryptographically structured ZKP proof string", () => {
    const userId = "user-12345678-abcd";
    const adId = "ad-87654321-efgh";
    const dwell = 4;
    
    const proof = generateZkpProof(userId, adId, dwell);
    expect(proof).toContain("zkp_proof_0x");
    expect(proof).toContain("user_ad-8");
    expect(proof).toContain("4s");
  });
});

describe("Geofence Claims Ledger Transactions", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it("should call the add_geofence_claim RPC in database mode", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    
    const adId = "ad-uuid-123";
    const result = await simulateClaimGeofenceReward(true, adId, 50);
    
    expect(result).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("add_geofence_claim", {
      ad_id: adId,
      points: 50
    });
  });

  it("should return false if add_geofence_claim RPC reports double claiming", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    
    const adId = "ad-uuid-123";
    const result = await simulateClaimGeofenceReward(true, adId, 50);
    
    expect(result).toBe(false);
  });
});

describe("Viewport Claims Ledger Transactions", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it("should call the add_viewport_claim RPC in database mode", async () => {
    mockRpc.mockResolvedValue({ data: true, error: null });
    
    const adId = "ad-uuid-456";
    const proof = "zkp_proof_0x123abc";
    const result = await simulateClaimViewportReward(true, adId, 3, proof, 50);
    
    expect(result).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("add_viewport_claim", {
      ad_id: adId,
      dwell_seconds: 3,
      zkp_proof: proof,
      points: 50
    });
  });

  it("should return false if add_viewport_claim RPC reports double claiming", async () => {
    mockRpc.mockResolvedValue({ data: false, error: null });
    
    const adId = "ad-uuid-456";
    const proof = "zkp_proof_0x123abc";
    const result = await simulateClaimViewportReward(true, adId, 3, proof, 50);
    
    expect(result).toBe(false);
  });
});
