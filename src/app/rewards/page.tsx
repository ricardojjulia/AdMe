"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { useToast } from "@/lib/ToastContext";
import Link from "next/link";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/client";
import { PollDeck } from "@/components/PollDeck";
import { CouponWallet } from "@/components/CouponWallet";

export default function RewardsPage() {
  const { user, savedAds, redeemPerk } = useUser();
  const { addToast } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [localAds, setLocalAds] = useState<any[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [affordableOnly, setAffordableOnly] = useState(false);
  const [confirmPerk, setConfirmPerk] = useState<any | null>(null);

  const balance = user?.rewardsBalance || 0;

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('reward_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data && !error) {
        setHistory(data.map(item => ({
          id: item.id,
          action: item.action,
          points: item.points > 0 ? `+${item.points}` : `${item.points}`,
          date: new Date(item.created_at).toLocaleDateString()
        })));
      }
    }

    async function loadAdvertiserAds() {
      const supabase = createClient();
      const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';
      let adsList = [];
      
      if (hasSupabase) {
        try {
          const { data, error } = await supabase.from('ads').select('*').limit(6);
          if (data && !error) {
            adsList = data;
          }
        } catch (e) {
          console.error(e);
        }
      }
      
      if (adsList.length === 0) {
        adsList = [
          { id: "10101010-1010-1010-1010-101010101010", advertiser_name: "Valor Brews", category: "Local Eateries", headline: "Valor Brews - Free Espresso" },
          { id: "30303030-3030-3030-3030-303030303030", advertiser_name: "The Green Kitchen", category: "Local Eateries", headline: "The Green Kitchen - $5 Off Salad" }
        ];
      }
      setLocalAds(adsList);
    }

    loadHistory();
    loadAdvertiserAds();
  }, [user]);

  const handleRedeem = async (perk: any) => {
    if (balance >= perk.cost) {
      try {
        const code = await redeemPerk(perk.name, perk.cost);
        
        // Optimistic UI update
        setHistory(prev => [{
          id: Date.now(),
          action: `Redeemed ${perk.name} (Code: ${code})`,
          points: `-${perk.cost}`,
          date: new Date().toLocaleDateString()
        }, ...prev]);

        addToast(`Successfully claimed: ${perk.name}! Code is stored in your wallet.`, "success");
        setConfirmPerk(null);
      } catch (err) {
        console.error(err);
        addToast("Failed to redeem reward.", "error");
      }
    } else {
      addToast("Insufficient rewards balance.", "error");
    }
  };

  // Convert database ads into local deals
  const localDiscounts = localAds.map((ad, idx) => ({
    id: `local-${ad.id || idx}`,
    name: ad.headline || `${ad.advertiser_name} local promo`,
    cost: 350 + (idx * 50),
    emoji: "🎟️",
    category: "Local Deals",
    description: `Claim a discount voucher from local merchant ${ad.advertiser_name}.`
  }));

  // Perks list
  const perks = [
    { id: "coffee", name: "$5 Coffee Gift Card", cost: 500, emoji: "☕", category: "Food & Drink", description: "Grab a warm cup of coffee on us." },
    { id: "adfree", name: "1 Ad-Free Day", cost: 1000, emoji: "Premium Perks", category: "Premium Perks", description: "Mute all ad placements in your feed for 24 hours." },
    { id: "amazon", name: "$10 Amazon Card", cost: 2000, emoji: "🛍️", category: "Shopping", description: "Save on your next Amazon purchase." },
    { id: "uber", name: "$15 Uber Eats Voucher", cost: 3000, emoji: "🍔", category: "Food & Drink", description: "Order takeout delivered straight to your door." },
    ...localDiscounts
  ];

  // Filters logic
  const categories = ["All", "Food & Drink", "Shopping", "Local Deals", "Premium Perks"];
  
  const filteredPerks = perks.filter(perk => {
    const matchesCategory = selectedCategory === "All" || perk.category === selectedCategory;
    const matchesSearch = perk.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          perk.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAffordable = !affordableOnly || balance >= perk.cost;
    return matchesCategory && matchesSearch && matchesAffordable;
  });

  return (
    <main className={`container ${styles.shell} animate-fade-in`}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>← Back to Feed</Link>
        <h1>Rewards Hub & Marketplace</h1>
      </header>

      <div className={styles.grid}>
        <section className={`${styles.balanceCard} glass`}>
          <div className={styles.balanceContent}>
            <h2>Available Balance</h2>
            <div className={styles.balanceAmount}>
              <span className={styles.currency}>★</span>
              {balance.toLocaleString()}
            </div>
            <p className={styles.balanceSubtext}>You have {savedAds.length} saved offers pending redemption.</p>
          </div>
        </section>

        <section className={styles.historySection}>
          <h3>Recent History</h3>
          <div className={`${styles.historyList} glass`}>
            {history.length === 0 ? <p style={{padding: '1rem'}}>No history yet. Start engaging with ads to earn points!</p> : null}
            {history.map((item) => (
              <div key={item.id} className={styles.historyRow}>
                <div>
                  <div className={styles.historyAction}>{item.action}</div>
                  <div className={styles.historyDate}>{item.date}</div>
                </div>
                <div className={`${styles.historyPoints} ${item.points.startsWith('+') ? styles.positive : styles.negative}`}>
                  {item.points}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Tinder-style preferences swiper */}
      <PollDeck />

      {/* Vouchers Wallet */}
      <CouponWallet />

      {/* Rewards Store Marketplace */}
      <section className={styles.storeSection} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.5rem' }}>
          <div>
            <h3>AdPoints Marketplace</h3>
            <p className={styles.storeSubtext} style={{ margin: 0 }}>Redeem your attention for real value.</p>
          </div>

          {/* Search box & Toggles */}
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="text" 
              placeholder="Search rewards..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'hsl(var(--input))',
                border: '1px solid hsl(var(--border))',
                color: 'white',
                fontSize: '0.85rem',
                outline: 'none',
                minWidth: '200px'
              }}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
              <input 
                type="checkbox" 
                checked={affordableOnly}
                onChange={(e) => setAffordableOnly(e.target.checked)}
                style={{ transform: 'scale(1.1)' }}
              />
              Affordable Only
            </label>
          </div>
        </div>

        {/* Category Filters Row */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn"
              style={{
                padding: '0.4rem 0.85rem',
                fontSize: '0.8rem',
                height: 'auto',
                background: selectedCategory === cat ? 'hsl(var(--primary))' : 'rgba(255,255,255,0.05)',
                color: selectedCategory === cat ? 'black' : 'white',
                border: selectedCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.1)',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Perks Grid */}
        <div className={styles.perkGrid}>
          {filteredPerks.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '3rem 0', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
              No matching perks found. Try adjusting your filters.
            </div>
          ) : (
            filteredPerks.map((perk) => (
              <div key={perk.id} className={`${styles.perkCard} glass hover-lift`} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-start', textAlign: 'left', padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div className={styles.perkEmoji} style={{ fontSize: '2.5rem' }}>{perk.emoji}</div>
                  <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', color: 'hsl(var(--muted-foreground))' }}>
                    {perk.category}
                  </span>
                </div>
                <div>
                  <h4 style={{ margin: '0.25rem 0', fontSize: '1.1rem', color: 'white' }}>{perk.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'hsl(var(--muted-foreground))', minHeight: '36px' }}>
                    {perk.description}
                  </p>
                </div>
                <button 
                  className={`btn ${styles.redeemBtn}`}
                  disabled={balance < perk.cost}
                  onClick={() => setConfirmPerk(perk)}
                  style={{ width: '100%', marginTop: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Redeem for {perk.cost} ★
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Confirmation Modal */}
      {confirmPerk && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(10px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div className="glass" style={{
            padding: '2rem',
            borderRadius: 'var(--radius)',
            maxWidth: '380px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{confirmPerk.emoji}</div>
              <h3 style={{ margin: 0, color: 'white' }}>Confirm Redemption</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'hsl(var(--muted-foreground))' }}>
                You are about to redeem {confirmPerk.name}
              </p>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '0.5rem',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Current Balance:</span>
                <span>★ {balance}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'hsl(var(--muted-foreground))' }}>Voucher Cost:</span>
                <span style={{ color: '#ef4444' }}>- ★ {confirmPerk.cost}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.25rem', fontWeight: 'bold' }}>
                <span style={{ color: 'white' }}>Remaining Balance:</span>
                <span style={{ color: 'hsl(var(--primary))' }}>★ {balance - confirmPerk.cost}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button 
                onClick={() => handleRedeem(confirmPerk)}
                className="btn"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', height: 'auto', background: 'hsl(var(--primary))', color: 'black' }}
              >
                Yes, Redeem
              </button>
              <button 
                onClick={() => setConfirmPerk(null)}
                className="btn"
                style={{ flex: 1, padding: '0.6rem', fontSize: '0.9rem', height: 'auto', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

