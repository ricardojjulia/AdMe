"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import Link from "next/link";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/client";

export default function RewardsPage() {
  const { user, savedAds, redeemPerk } = useUser();
  const [history, setHistory] = useState<any[]>([]);

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
    loadHistory();
  }, [user]);

  const handleRedeem = async (perk: any) => {
    if (balance >= perk.cost) {
      try {
        const code = await redeemPerk(perk.name, perk.cost);
        // Optimistic UI update
        setHistory([{
          id: Date.now(),
          action: `Redeemed ${perk.name} (Code: ${code})`,
          points: `-${perk.cost}`,
          date: new Date().toLocaleDateString()
        }, ...history]);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const perks = [
    { id: 1, name: "$5 Coffee Gift Card", cost: 500, emoji: "☕" },
    { id: 2, name: "1 Ad-Free Day", cost: 1000, emoji: "🛡️" },
    { id: 3, name: "$10 Amazon Card", cost: 2000, emoji: "📦" },
  ];

  return (
    <main className={`container ${styles.shell} animate-fade-in`}>
      <header className={styles.header}>
        <Link href="/" className={styles.backBtn}>← Back to Feed</Link>
        <h1>Rewards Hub</h1>
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

      <section className={styles.storeSection}>
        <h3>Rewards Store</h3>
        <p className={styles.storeSubtext}>Redeem your attention for real value.</p>
        
        <div className={styles.perkGrid}>
          {perks.map((perk) => (
            <div key={perk.id} className={`${styles.perkCard} glass hover-lift`}>
              <div className={styles.perkEmoji}>{perk.emoji}</div>
              <h4>{perk.name}</h4>
              <button 
                className={`btn ${styles.redeemBtn}`}
                disabled={balance < perk.cost}
                onClick={() => handleRedeem(perk)}
              >
                Redeem for {perk.cost} ★
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
