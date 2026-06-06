-- Migration to create coupons table for user rewards redemption

CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  cost_points INTEGER NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for coupons
CREATE POLICY "Enable insert access for all coupons" ON public.coupons FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable read access for all coupons" ON public.coupons FOR SELECT USING (true);
