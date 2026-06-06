"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";

interface User {
  id: string;
  name: string;
  avatar: string;
  rewardsBalance: number;
  role: 'consumer' | 'business';
  adCreditsBalance: number;
  currentStreak: number;
  lastActiveDate: string | null;
  subscriptionTier?: string;
  subscriptionRenewal?: string | null;
}

interface UserContextType {
  user: User | null;
  preferences: string[];
  savedAds: string[];
  reportedAds: string[];
  skippedAds: string[];
  location: { lat: number; lng: number } | null;
  addReward: (amount: number, actionName?: string) => void;
  togglePreference: (category: string) => void;
  toggleSavedAd: (adId: string) => void;
  reportAd: (adId: string, reason: string) => void;
  skipAd: (adId: string) => void;
  updateStreak: () => void;
  switchRole: (role: 'consumer' | 'business') => void;
  buyCredits: (amount: number) => void;
  deductCredits: (amount: number) => void;
  enableLocation: () => Promise<void>;
  upgradeSubscription: (tier: string) => Promise<void>;
  submitLead: (adId: string, message: string, contactInfo?: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [preferences, setPreferences] = useState<string[]>([
    "Tech & SaaS", "Local Eateries", "Faith & Books", "Veteran-owned"
  ]);

  const [savedAds, setSavedAds] = useState<string[]>([]);
  const [reportedAds, setReportedAds] = useState<string[]>([]);
  const [skippedAds, setSkippedAds] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSupabaseEnabled, setIsSupabaseEnabled] = useState(false);

  useEffect(() => {
    // Check if Supabase URL is available and valid
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
      setIsSupabaseEnabled(true);
      const supabase = createClient();
      
      const loadData = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
             setUser(null);
             return;
          }
          
          const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single();
          
          if (userData) {
            setUser({
              id: userData.id,
              name: userData.name || session.user.email?.split('@')[0] || 'User',
              avatar: userData.avatar || 'RJ',
              rewardsBalance: userData.rewards_balance || 0,
              role: userData.role || 'consumer',
              adCreditsBalance: userData.ad_credits_balance || 0,
              currentStreak: userData.current_streak || 0,
              lastActiveDate: userData.last_active_date || null,
              subscriptionTier: userData.subscription_tier || 'free',
              subscriptionRenewal: userData.subscription_renewal || null
            });

            const { data: prefData } = await supabase.from('user_preferences').select('category').eq('user_id', userData.id);
            if (prefData && prefData.length > 0) {
              setPreferences(prefData.map(p => p.category));
            } else {
              setPreferences([]);
            }
          }
        } catch (error) {
          console.error("Supabase load error:", error);
          setUser(null);
        }
      };

      loadData();

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
           loadData();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const addReward = async (amount: number, actionName: string = "Earned Reward") => {
    setUser((prev) => prev ? { ...prev, rewardsBalance: prev.rewardsBalance + amount } : prev);
    
    if (user) {
      const supabase = createClient();
      await supabase.from('users')
        .update({ rewards_balance: user.rewardsBalance + amount })
        .eq('id', user.id);
        
      await supabase.from('reward_history').insert({
        user_id: user.id,
        action: actionName,
        points: amount
      });
    }
  };

  const togglePreference = async (category: string) => {
    let isAdding = false;
    setPreferences((prev) => {
      isAdding = !prev.includes(category);
      return isAdding ? [...prev, category] : prev.filter((c) => c !== category);
    });

    if (isSupabaseEnabled && user) {
      const supabase = createClient();
      if (isAdding) {
        await supabase.from('user_preferences').insert({ user_id: user.id, category });
      } else {
        await supabase.from('user_preferences').delete().match({ user_id: user.id, category });
      }
    }
  };

  const toggleSavedAd = async (adId: string) => {
    let isAdding = false;
    setSavedAds((prev) => {
      isAdding = !prev.includes(adId);
      return isAdding ? [...prev, adId] : prev.filter((id) => id !== adId);
    });

    if (isSupabaseEnabled && user) {
      const supabase = createClient();
      if (isAdding) {
        await supabase.from('engagements').insert({ user_id: user.id, ad_id: adId, engagement_type: 'save' });
      } else {
        await supabase.from('engagements').delete().match({ user_id: user.id, ad_id: adId, engagement_type: 'save' });
      }
    }
  };

  const reportAd = async (adId: string, reason: string) => {
    setReportedAds((prev) => [...prev, adId]);
    
    if (isSupabaseEnabled && user) {
      const supabase = createClient();
      await supabase.from('ad_reports').insert({
        user_id: user.id,
        ad_id: adId,
        reason: reason,
        status: 'pending'
      });
    }
  };

  const skipAd = async (adId: string) => {
    setSkippedAds((prev) => [...prev, adId]);
    if (isSupabaseEnabled && user) {
      const supabase = createClient();
      await supabase.from('engagements').insert({ user_id: user.id, ad_id: adId, engagement_type: 'skip' });
    }
  };

  const updateStreak = async () => {
    if (!user || !isSupabaseEnabled) return;
    const today = new Date().toISOString().split('T')[0];
    if (user.lastActiveDate === today) return; // Already updated today

    let newStreak = 1;
    if (user.lastActiveDate) {
      const lastDate = new Date(user.lastActiveDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        newStreak = user.currentStreak + 1;
      }
    }

    setUser(prev => prev ? { ...prev, currentStreak: newStreak, lastActiveDate: today } : prev);

    const supabase = createClient();
    await supabase.from('users').update({ 
      current_streak: newStreak, 
      last_active_date: today 
    }).eq('id', user.id);
  };

  const switchRole = (role: 'consumer' | 'business') => {
    setUser((prev) => prev ? { ...prev, role } : prev);
  };

  const buyCredits = (amount: number) => {
    setUser((prev) => prev ? { ...prev, adCreditsBalance: prev.adCreditsBalance + amount } : prev);
  };

  const deductCredits = (amount: number) => {
    setUser((prev) => prev ? { ...prev, adCreditsBalance: Math.max(0, prev.adCreditsBalance - amount) } : prev);
  };

  const enableLocation = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          resolve();
        },
        (error) => {
          console.error("Error getting location", error);
          reject(error);
        }
      );
    });
  };

  const upgradeSubscription = async (tier: string) => {
    if (!user) return;
    const renewalDate = new Date();
    renewalDate.setDate(renewalDate.getDate() + 30);
    const renewalIso = renewalDate.toISOString();

    setUser(prev => prev ? { ...prev, subscriptionTier: tier, subscriptionRenewal: renewalIso } : prev);

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
      try {
        const supabase = createClient();
        await supabase.from('users').update({
          subscription_tier: tier,
          subscription_renewal: renewalIso
        }).eq('id', user.id);
      } catch (e) {
        console.error("Failed to upgrade subscription in Supabase", e);
      }
    }
  };

  const submitLead = async (adId: string, message: string, contactInfo: string = "") => {
    if (!user) return;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
      try {
        const supabase = createClient();
        
        // 1. Insert lead record
        await supabase.from('leads').insert({
          ad_id: adId,
          user_id: user.id,
          message,
          contact_info: contactInfo
        });

        // 2. Fetch the ad to identify the owner and deduct credits
        const { data: adData } = await supabase.from('ads').select('owner_id').eq('id', adId).single();
        if (adData?.owner_id) {
          // Deduct 50 credits per lead from the owner's credits balance
          const { data: ownerData } = await supabase.from('users').select('ad_credits_balance').eq('id', adData.owner_id).single();
          if (ownerData) {
            const newBalance = Math.max(0, (ownerData.ad_credits_balance || 0) - 50);
            await supabase.from('users').update({ ad_credits_balance: newBalance }).eq('id', adData.owner_id);
          }
        }
      } catch (e) {
        console.error("Failed to log lead in Supabase", e);
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, preferences, savedAds, reportedAds, skippedAds, location, addReward, togglePreference, toggleSavedAd, reportAd, skipAd, updateStreak, switchRole, buyCredits, deductCredits, enableLocation, upgradeSubscription, submitLead }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
