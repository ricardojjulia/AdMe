"use client";

import { useEffect, useState, useRef } from "react";
import { useToast } from "@/lib/ToastContext";
import { createClient } from "@/lib/supabase/client";

interface Competitor {
  id: string;
  name: string;
  bid: number;
  isUser: boolean;
  pulse?: boolean;
}

interface AuctionSimulatorProps {
  campaign: any; // The selected campaign
  onBidUpdate: (newBid: number) => void;
}

export function AuctionSimulator({ campaign, onBidUpdate }: AuctionSimulatorProps) {
  const { addToast } = useToast();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [userBidInput, setUserBidInput] = useState(campaign?.maxCpcBid || 15);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastCampaignIdRef = useRef<string | null>(null);

  // Initialize competitors based on campaign category
  useEffect(() => {
    if (!campaign) return;
    
    if (lastCampaignIdRef.current !== campaign.id) {
      lastCampaignIdRef.current = campaign.id;
      setUserBidInput(campaign.maxCpcBid || 15);

      // Initial seed list of mock competitors per category
      const category = campaign.category || "General";
      
      const mockCompetitors: Competitor[] = [
        { id: "comp-1", name: `${category} Co.`, bid: 18, isUser: false },
        { id: "comp-2", name: `Zenith ${category}`, bid: 28, isUser: false },
        { id: "comp-3", name: `Nova Alpha`, bid: 12, isUser: false },
        { id: "user-campaign", name: `${campaign.headline.substring(0, 16)}... (You)`, bid: campaign.maxCpcBid || 15, isUser: true }
      ];

      // Sort descending by bid
      mockCompetitors.sort((a, b) => b.bid - a.bid);
      setCompetitors(mockCompetitors);
    } else {
      // If same campaign but maxCpcBid updated in parent, update user's competitor list item
      setCompetitors(prev => {
        const updated = prev.map(c => {
          if (c.isUser) {
            return { ...c, bid: campaign.maxCpcBid || 15 };
          }
          return c;
        });
        return [...updated].sort((a, b) => b.bid - a.bid);
      });
    }
  }, [campaign.id, campaign.maxCpcBid]);

  // Live auction background simulation
  useEffect(() => {
    if (competitors.length === 0) return;

    const interval = setInterval(() => {
      // Pick a random competitor (excluding the user)
      const nonUsers = competitors.filter(c => !c.isUser);
      if (nonUsers.length === 0) return;

      const randomComp = nonUsers[Math.floor(Math.random() * nonUsers.length)];
      
      // Shift bid by a small random delta (-3 to +4)
      const delta = Math.floor(Math.random() * 8) - 3;
      const newBid = Math.max(10, randomComp.bid + delta);

      setCompetitors(prev => {
        const updated = prev.map(c => {
          if (c.id === randomComp.id) {
            return { ...c, bid: newBid, pulse: true };
          }
          return { ...c, pulse: false };
        });
        
        // Sort descending
        return [...updated].sort((a, b) => b.bid - a.bid);
      });
    }, 7000);

    return () => clearInterval(interval);
  }, [competitors]);

  // Handle bid update from input
  const handleUpdateBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaign) return;

    const bidVal = parseInt(String(userBidInput));
    if (isNaN(bidVal) || bidVal < 15 || bidVal > 100) {
      addToast("Bid must be between 15 and 100 credits.", "error");
      return;
    }

    setIsUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('ads')
        .update({ max_cpc_bid: bidVal })
        .eq('id', campaign.id);

      if (error) throw error;

      addToast(`Bid successfully updated to ${bidVal} credits!`, "success");
      onBidUpdate(bidVal);

      // Instantly update local simulator list
      setCompetitors(prev => {
        const updated = prev.map(c => {
          if (c.isUser) {
            return { ...c, bid: bidVal, pulse: true };
          }
          return { ...c, pulse: false };
        });
        return [...updated].sort((a, b) => b.bid - a.bid);
      });
    } catch (err) {
      console.error("Failed to update campaign bid:", err);
      addToast("Failed to update bid in database. Updating locally.", "info");
      onBidUpdate(bidVal);
      setCompetitors(prev => {
        const updated = prev.map(c => {
          if (c.isUser) {
            return { ...c, bid: bidVal, pulse: true };
          }
          return { ...c, pulse: false };
        });
        return [...updated].sort((a, b) => b.bid - a.bid);
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Find user's current rank
  const userRank = competitors.findIndex(c => c.isUser) + 1;

  // Compute Win Probability
  const getWinProbability = (rank: number) => {
    if (rank === 1) return { text: "High Win Probability (Rank 1)", color: "#1bf693" };
    if (rank === 2) return { text: "Medium Win Probability (Rank 2)", color: "#00e5ff" };
    return { text: "Low Win Probability (Rank 3+)", color: "#ef4444" };
  };

  const prob = getWinProbability(userRank);

  return (
    <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>Live Category Auction Board</h3>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
          Compete in real-time for top injection slots in <strong>{campaign.category}</strong>
        </p>
      </div>

      {/* Win Probability Indicator */}
      <div style={{
        padding: '0.75rem 1rem', 
        borderRadius: '0.5rem', 
        background: 'rgba(255,255,255,0.02)', 
        borderLeft: `4px solid ${prob.color}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}>Win Status:</span>
        <strong style={{ fontSize: '0.9rem', color: prob.color }}>{prob.text}</strong>
      </div>

      {/* Bids Leaderboard */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {competitors.map((c, i) => (
          <div 
            key={c.id} 
            className="glass"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: c.isUser ? '1px solid hsl(var(--primary)/0.4)' : '1px solid rgba(255,255,255,0.03)',
              background: c.isUser ? 'rgba(27, 246, 147, 0.05)' : 'rgba(255,255,255,0.01)',
              animation: c.pulse ? 'pulse-border 1s infinite alternate' : 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ 
                width: '24px', 
                height: '24px', 
                borderRadius: '50%', 
                background: i === 0 ? 'gold' : i === 1 ? 'silver' : 'rgba(255,255,255,0.1)', 
                color: i < 2 ? 'black' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {i + 1}
              </span>
              <span style={{ fontWeight: c.isUser ? 'bold' : 'normal', color: c.isUser ? 'hsl(var(--primary))' : 'white' }}>
                {c.name}
              </span>
            </div>
            <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: c.isUser ? 'hsl(var(--primary))' : 'white' }}>
              ★ {c.bid} CPC
            </strong>
          </div>
        ))}
      </div>

      {/* Bid Editor Input Form */}
      <form onSubmit={handleUpdateBid} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))' }}>Your Max CPC Bid (Credits)</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="number" 
              min="15" 
              max="100" 
              value={userBidInput}
              onChange={(e) => setUserBidInput(parseInt(e.target.value) || 0)}
              style={{
                flex: 1,
                padding: '0.6rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'hsl(var(--input))',
                border: '1px solid hsl(var(--border))',
                color: 'white',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button 
              type="submit" 
              disabled={isUpdating}
              className="btn"
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
            >
              {isUpdating ? "Saving..." : "Place Bid"}
            </button>
          </div>
        </label>
        <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))' }}>
          * Minimum bid is 15 credits. Outbid competitors to win first-place contextual placements in search feeds.
        </span>
      </form>

      <style jsx global>{`
        @keyframes pulse-border {
          0% { border-color: rgba(27, 246, 147, 0.2); }
          100% { border-color: rgba(27, 246, 147, 0.8); }
        }
      `}</style>
    </div>
  );
}
