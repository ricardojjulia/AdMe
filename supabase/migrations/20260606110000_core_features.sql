-- Migration to add subscription tiers, campaign boosting, and anonymous lead generation

-- 1. Alter public.users to add subscription fields
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_renewal TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days';

-- 2. Alter public.ads to add boosting indicator
ALTER TABLE public.ads 
ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE;

-- 3. Create public.leads table for anonymous inquiries
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  contact_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies for leads
CREATE POLICY "Enable insert access for all leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all leads" ON public.leads FOR SELECT USING (true);
