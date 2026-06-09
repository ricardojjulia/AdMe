"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import canonicalCatalog from "./i18n/catalog.en-US.json";
import spanishCatalog from "./i18n/catalog.es-PR.json";

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
  coupons: any[];
  redeemPerk: (name: string, cost: number) => Promise<string>;
  setLocation: (loc: { lat: number; lng: number } | null) => void;
  selectPersona: (id: string | null, redirectPath?: string) => Promise<void>;
  adFrequency: 'low' | 'balanced' | 'high';
  deliveryChannels: { feed: boolean; geofenced: boolean; push: boolean };
  quietHours: { enabled: boolean; start: string; end: string };
  updateAdControlSettings: (settings: { adFrequency?: 'low' | 'balanced' | 'high'; deliveryChannels?: { feed: boolean; geofenced: boolean; push: boolean }; quietHours?: { enabled: boolean; start: string; end: string } }) => void;
  locale: string;
  setLocale: (l: string) => void;
  t: (key: string, variables?: Record<string, any>) => string;
  loadingCatalog: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);


export const DEMO_PERSONAS = [
  {
    id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1',
    name: 'Sarah (Tech Dev)',
    avatar: 'S',
    rewardsBalance: 2450,
    role: 'consumer' as const,
    adCreditsBalance: 0,
    currentStreak: 7,
    lastActiveDate: null,
    subscriptionTier: 'free',
    preferences: ['Tech & SaaS', 'Gaming', 'Finance']
  },
  {
    id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2',
    name: 'Marcus (Local Foodie)',
    avatar: 'M',
    rewardsBalance: 350,
    role: 'consumer' as const,
    adCreditsBalance: 0,
    currentStreak: 3,
    lastActiveDate: null,
    subscriptionTier: 'free',
    preferences: ['Local Eateries', 'Wellness & Health', 'Faith & Books']
  },
  {
    id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3',
    name: 'Elena (New Consumer)',
    avatar: 'E',
    rewardsBalance: 50,
    role: 'consumer' as const,
    adCreditsBalance: 0,
    currentStreak: 1,
    lastActiveDate: null,
    subscriptionTier: 'free',
    preferences: ['Faith & Books', 'Veteran-owned']
  },
  {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Valor Brews (Business)',
    avatar: 'VB',
    rewardsBalance: 850,
    role: 'business' as const,
    adCreditsBalance: 15000,
    currentStreak: 5,
    lastActiveDate: null,
    subscriptionTier: 'growth',
    preferences: []
  },
  {
    id: 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f5',
    name: 'WorkStation (Business)',
    avatar: 'WS',
    rewardsBalance: 1200,
    role: 'business' as const,
    adCreditsBalance: 45000,
    currentStreak: 12,
    lastActiveDate: null,
    subscriptionTier: 'enterprise',
    preferences: []
  }
];

export function UserProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('adme_locale');
      if (savedLocale) return savedLocale;
    }
    return 'en-US';
  });

  const [catalog, setCatalog] = useState<Record<string, string>>({});
  const [loadingCatalog, setLoadingCatalog] = useState<boolean>(false);

  useEffect(() => {
    async function loadCatalog() {
      if (locale === 'en-US') {
        setCatalog(canonicalCatalog);
        return;
      }
      setLoadingCatalog(true);
      try {
        const { getClientActiveCatalog } = await import('./i18n/client');
        const messages = await getClientActiveCatalog(locale);
        setCatalog(messages);
      } catch (err) {
        console.error('Failed to load locale catalog:', err);
        setCatalog(canonicalCatalog);
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, [locale]);

  const setLocale = (newLocale: string) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('adme_locale', newLocale);
    }
  };

  const t = (key: string, variables: Record<string, any> = {}) => {
    let lookupKey = key;
    if ('count' in variables) {
      const count = Number(variables.count);
      const isOne = count === 1;
      const pluralKey = `${key}_${isOne ? 'one' : 'other'}`;
      if (catalog[pluralKey] || canonicalCatalog[pluralKey as keyof typeof canonicalCatalog]) {
        lookupKey = pluralKey;
      }
    }
    const msg = catalog[lookupKey] || 
                (locale.startsWith('es') ? (spanishCatalog as Record<string, string>)[lookupKey] : undefined) ||
                canonicalCatalog[lookupKey as keyof typeof canonicalCatalog] || 
                key;
    return msg.replace(/\{([A-Za-z0-9_]+)\}/g, (match, name) => {
      return name in variables ? String(variables[name]) : match;
    });
  };

  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const demoPersonaId = localStorage.getItem('adme_demo_persona_id');
      if (demoPersonaId) {
        const persona = DEMO_PERSONAS.find(p => p.id === demoPersonaId);
        if (persona) {
          return {
            id: persona.id,
            name: persona.name,
            avatar: persona.avatar,
            rewardsBalance: persona.rewardsBalance,
            role: persona.role,
            adCreditsBalance: persona.adCreditsBalance,
            currentStreak: persona.currentStreak,
            lastActiveDate: persona.lastActiveDate,
            subscriptionTier: persona.subscriptionTier || 'free',
            subscriptionRenewal: null
          };
        }
      }
    }
    return null;
  });

  const [coupons, setCoupons] = useState<any[]>([]);

  const [preferences, setPreferences] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const demoPersonaId = localStorage.getItem('adme_demo_persona_id');
      if (demoPersonaId) {
        const persona = DEMO_PERSONAS.find(p => p.id === demoPersonaId);
        if (persona) {
          return persona.preferences;
        }
      }
    }
    return ["Tech & SaaS", "Local Eateries", "Faith & Books", "Veteran-owned"];
  });

  const [savedAds, setSavedAds] = useState<string[]>([]);
  const [reportedAds, setReportedAds] = useState<string[]>([]);
  const [skippedAds, setSkippedAds] = useState<string[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSupabaseEnabled, setIsSupabaseEnabled] = useState(false);

  const [adFrequency, setAdFrequency] = useState<'low' | 'balanced' | 'high'>(() => {
    if (typeof window !== 'undefined') {
      const savedFrequency = localStorage.getItem("adme_ad_frequency") as 'low' | 'balanced' | 'high' | null;
      if (savedFrequency) return savedFrequency;
    }
    return 'balanced';
  });

  const [deliveryChannels, setDeliveryChannels] = useState<{ feed: boolean; geofenced: boolean; push: boolean }>(() => {
    if (typeof window !== 'undefined') {
      const savedChannels = localStorage.getItem("adme_delivery_channels");
      if (savedChannels) {
        try { return JSON.parse(savedChannels); } catch (e) {}
      }
    }
    return { feed: true, geofenced: true, push: true };
  });

  const [quietHours, setQuietHours] = useState<{ enabled: boolean; start: string; end: string }>(() => {
    if (typeof window !== 'undefined') {
      const savedQuietHours = localStorage.getItem("adme_quiet_hours");
      if (savedQuietHours) {
        try { return JSON.parse(savedQuietHours); } catch (e) {}
      }
    }
    return { enabled: false, start: "22:00", end: "08:00" };
  });

  useEffect(() => {
    const loadData = async () => {
      const demoPersonaId = typeof window !== 'undefined' ? localStorage.getItem('adme_demo_persona_id') : null;
      const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';
      setIsSupabaseEnabled(!!hasSupabase);

      // Load settings from localStorage
      if (typeof window !== 'undefined') {
        const savedFrequency = localStorage.getItem("adme_ad_frequency") as 'low' | 'balanced' | 'high' | null;
        if (savedFrequency) setAdFrequency(savedFrequency);

        const savedChannels = localStorage.getItem("adme_delivery_channels");
        if (savedChannels) {
          try { setDeliveryChannels(JSON.parse(savedChannels)); } catch (e) {}
        }

        const savedQuietHours = localStorage.getItem("adme_quiet_hours");
        if (savedQuietHours) {
          try { setQuietHours(JSON.parse(savedQuietHours)); } catch (e) {}
        }
      }

      if (demoPersonaId) {
        const persona = DEMO_PERSONAS.find(p => p.id === demoPersonaId);
        if (persona) {
          setUser({
            id: persona.id,
            name: persona.name,
            avatar: persona.avatar,
            rewardsBalance: persona.rewardsBalance,
            role: persona.role,
            adCreditsBalance: persona.adCreditsBalance,
            currentStreak: persona.currentStreak,
            lastActiveDate: persona.lastActiveDate,
            subscriptionTier: persona.subscriptionTier,
            subscriptionRenewal: null
          });
          setPreferences(persona.preferences);
          
          if (hasSupabase) {
            try {
              const supabase = createClient();
              const { data: couponData } = await supabase.from('coupons').select('*').eq('user_id', persona.id).order('created_at', { ascending: false });
              if (couponData) {
                setCoupons(couponData);
              }
            } catch (e) {
              console.error("Failed to load coupons for demo user:", e);
            }
          }
          return;
        }
      }

      if (hasSupabase) {
        try {
          const supabase = createClient();
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

            const { data: couponData } = await supabase.from('coupons').select('*').eq('user_id', userData.id).order('created_at', { ascending: false });
            if (couponData) {
              setCoupons(couponData);
            }
          }
        } catch (error) {
          console.error("Supabase load error:", error);
          setUser(null);
        }
      } else {
        const defaultPersona = DEMO_PERSONAS[0];
        setUser({
          id: defaultPersona.id,
          name: defaultPersona.name,
          avatar: defaultPersona.avatar,
          rewardsBalance: defaultPersona.rewardsBalance,
          role: defaultPersona.role,
          adCreditsBalance: defaultPersona.adCreditsBalance,
          currentStreak: defaultPersona.currentStreak,
          lastActiveDate: defaultPersona.lastActiveDate,
          subscriptionTier: defaultPersona.subscriptionTier,
          subscriptionRenewal: null
        });
        setPreferences(defaultPersona.preferences);
      }
    };

    loadData();

    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here') {
      const supabase = createClient();
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
    
    if (isSupabaseEnabled && user) {
      try {
        const supabase = createClient();
        const { error } = await supabase.rpc('add_reward_points', {
          points: amount,
          action_name: actionName
        });
        if (error) throw error;
      } catch (e) {
        console.error("Failed to add reward in Supabase via RPC:", e);
      }
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

  const redeemPerk = async (name: string, cost: number): Promise<string> => {
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase();
    const randomHex = Math.random().toString(16).substring(2, 6).toUpperCase();
    const generatedCode = `${cleanName}-${randomHex}`;
    const couponId = crypto.randomUUID();

    setUser(prev => prev ? { ...prev, rewardsBalance: Math.max(0, prev.rewardsBalance - cost) } : prev);

    const newCoupon = {
      id: couponId,
      user_id: user?.id || '00000000-0000-0000-0000-000000000001',
      code: generatedCode,
      name: name,
      cost_points: cost,
      is_used: false,
      created_at: new Date().toISOString()
    };

    setCoupons(prev => [newCoupon, ...prev]);

    if (isSupabaseEnabled && user) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.rpc('redeem_perk_coupon', {
          perk_name: name,
          cost_points: cost,
          generated_code: generatedCode,
          coupon_id: couponId
        });
        if (error) throw error;
        return data || generatedCode;
      } catch (e) {
        console.error("Failed to redeem perk coupon in Supabase via RPC:", e);
      }
    }

    return generatedCode;
  };

  const updateAdControlSettings = (settings: {
    adFrequency?: 'low' | 'balanced' | 'high';
    deliveryChannels?: { feed: boolean; geofenced: boolean; push: boolean };
    quietHours?: { enabled: boolean; start: string; end: string };
  }) => {
    if (settings.adFrequency) {
      setAdFrequency(settings.adFrequency);
      localStorage.setItem("adme_ad_frequency", settings.adFrequency);
    }
    if (settings.deliveryChannels) {
      setDeliveryChannels(settings.deliveryChannels);
      localStorage.setItem("adme_delivery_channels", JSON.stringify(settings.deliveryChannels));
    }
    if (settings.quietHours) {
      setQuietHours(settings.quietHours);
      localStorage.setItem("adme_quiet_hours", JSON.stringify(settings.quietHours));
    }
  };

  const selectPersona = async (id: string | null, redirectPath?: string) => {
    if (!id) {
      localStorage.removeItem('adme_demo_persona_id');
      if (isSupabaseEnabled) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } else {
      localStorage.setItem('adme_demo_persona_id', id);
      if (isSupabaseEnabled) {
        try {
          const supabase = createClient();
          let email = '';
          if (id === 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1') email = 'sarah@adme.demo';
          else if (id === 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2') email = 'marcus@adme.demo';
          else if (id === 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3') email = 'elena@adme.demo';
          else if (id === '00000000-0000-0000-0000-000000000001') email = 'valor@adme.demo';
          else if (id === 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f5') email = 'workstation@adme.demo';
          
          if (email) {
            await supabase.auth.signInWithPassword({
              email,
              password: 'password123'
            });
          }
        } catch (e) {
          console.error("Failed to authenticate demo persona on Supabase:", e);
        }
      }
    }
    if (redirectPath) {
      window.location.href = redirectPath;
    } else {
      window.location.reload();
    }
  };

  return (
    <UserContext.Provider value={{ user, preferences, savedAds, reportedAds, skippedAds, location, addReward, togglePreference, toggleSavedAd, reportAd, skipAd, updateStreak, switchRole, buyCredits, deductCredits, enableLocation, upgradeSubscription, submitLead, coupons, redeemPerk, setLocation, selectPersona, adFrequency, deliveryChannels, quietHours, updateAdControlSettings, locale, setLocale, t, loadingCatalog }}>
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
