-- Migration: Geofence and Viewport ZKP Ledger Tables and RPC Functions

-- 1. Create public.geofence_claims table
CREATE TABLE IF NOT EXISTS public.geofence_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

-- Enable RLS
ALTER TABLE public.geofence_claims ENABLE ROW LEVEL SECURITY;

-- Add SELECT policy
CREATE POLICY "Allow select for own geofence claims" ON public.geofence_claims
  FOR SELECT USING (auth.uid() = user_id);


-- 2. Create public.viewport_claims table
CREATE TABLE IF NOT EXISTS public.viewport_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  dwell_seconds INTEGER NOT NULL,
  zkp_proof TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, ad_id)
);

-- Enable RLS
ALTER TABLE public.viewport_claims ENABLE ROW LEVEL SECURITY;

-- Add SELECT policy
CREATE POLICY "Allow select for own viewport claims" ON public.viewport_claims
  FOR SELECT USING (auth.uid() = user_id);


-- 3. Create public.add_geofence_claim RPC function
CREATE OR REPLACE FUNCTION public.add_geofence_claim(ad_id UUID, points INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Authenticate user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate points to prevent client-side manipulation of rewards
  IF points IS NULL OR points < 0 OR points > 100 THEN
    RAISE EXCEPTION 'Invalid points amount';
  END IF;

  -- Check if user already claimed reward for this ad
  IF EXISTS (
    SELECT 1 FROM public.geofence_claims 
    WHERE user_id = auth.uid() AND ad_id = $1
  ) THEN
    RETURN FALSE;
  END IF;

  -- Record geofence claim entry
  INSERT INTO public.geofence_claims (user_id, ad_id, points)
  VALUES (auth.uid(), $1, $2);

  -- Securely increment user rewards balance
  UPDATE public.users
  SET rewards_balance = COALESCE(rewards_balance, 0) + $2
  WHERE id = auth.uid();

  -- Add to reward history
  INSERT INTO public.reward_history (user_id, action, points)
  VALUES (auth.uid(), 'Geofence Claim: ' || $1::text, $2);

  RETURN TRUE;
END;
$$;


-- 4. Create public.add_viewport_claim RPC function
CREATE OR REPLACE FUNCTION public.add_viewport_claim(ad_id UUID, dwell_seconds INTEGER, zkp_proof TEXT, points INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Authenticate user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Validate points to prevent client-side manipulation of rewards
  IF points IS NULL OR points < 0 OR points > 100 THEN
    RAISE EXCEPTION 'Invalid points amount';
  END IF;

  -- Check if user already claimed reward for this ad
  IF EXISTS (
    SELECT 1 FROM public.viewport_claims 
    WHERE user_id = auth.uid() AND ad_id = $1
  ) THEN
    RETURN FALSE;
  END IF;

  -- Record viewport claim entry
  INSERT INTO public.viewport_claims (user_id, ad_id, dwell_seconds, zkp_proof)
  VALUES (auth.uid(), $1, $2, $3);

  -- Securely increment user rewards balance
  UPDATE public.users
  SET rewards_balance = COALESCE(rewards_balance, 0) + $4
  WHERE id = auth.uid();

  -- Add to reward history
  INSERT INTO public.reward_history (user_id, action, points)
  VALUES (auth.uid(), 'Viewport ZKP Swipe: ' || $1::text, $4);

  RETURN TRUE;
END;
$$;
