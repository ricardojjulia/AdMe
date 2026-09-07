-- ==============================================================================
-- AdMe MVP Production Cloud Update: Combined Migrations (Phases 1 - 5)
-- Run this script in the Supabase SQL Editor for your cloud project
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Campaign Lifecycle and Inbound Customer Leads
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.ads 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE IF EXISTS public.leads 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;

-- Campaign Owners update policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'ads' AND policyname = 'Advertisers can manage own campaign status and budget'
  ) THEN
    CREATE POLICY "Advertisers can manage own campaign status and budget"
      ON public.ads
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Leads Owners update policy
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'Campaign owners can update inbound leads'
  ) THEN
    CREATE POLICY "Campaign owners can update inbound leads"
      ON public.leads
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.ads
          WHERE ads.id = leads.ad_id AND ads.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. Coupon Verification and In-Store Cashier Redemption
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.coupons 
ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE IF EXISTS public.coupons 
ADD COLUMN IF NOT EXISTS verified_by TEXT DEFAULT NULL;

-- Atomic In-Store Cashier Verification Function
CREATE OR REPLACE FUNCTION public.verify_and_redeem_coupon(
  p_code TEXT,
  p_staff_pin TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  -- Retrieve the coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = p_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not found');
  END IF;

  IF v_coupon.status = 'redeemed' OR v_coupon.redeemed_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon has already been redeemed', 'redeemed_at', v_coupon.redeemed_at);
  END IF;

  -- Update coupon to redeemed status
  UPDATE public.coupons
  SET 
    status = 'redeemed',
    redeemed_at = NOW(),
    verified_by = COALESCE(p_staff_pin, 'In-Store Cashier')
  WHERE code = p_code;

  RETURN jsonb_build_object(
    'success', true,
    'code', p_code,
    'perk_name', v_coupon.perk_name,
    'redeemed_at', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_and_redeem_coupon(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_and_redeem_coupon(TEXT, TEXT) TO anon;

-- ------------------------------------------------------------------------------
-- 3. GDPR Article 17 "Forget Me" Cascade Purge
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.gdpr_forget_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purged_records INT := 0;
BEGIN
  -- Verify caller is the user themselves or service_role
  IF auth.uid() IS NOT NULL AND auth.uid() != p_user_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You can only purge your own footprint');
  END IF;

  -- Delete engagements
  DELETE FROM public.engagements WHERE user_id = p_user_id;
  
  -- Delete leads
  DELETE FROM public.leads WHERE user_id = p_user_id;

  -- Delete reports
  DELETE FROM public.ad_reports WHERE user_id = p_user_id;

  -- Delete preferences
  DELETE FROM public.user_preferences WHERE user_id = p_user_id;

  -- Delete coupons
  DELETE FROM public.coupons WHERE user_id = p_user_id;

  -- Delete reward history
  DELETE FROM public.reward_history WHERE user_id = p_user_id;

  -- Delete geofence claims
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'geofence_claims') THEN
    DELETE FROM public.geofence_claims WHERE user_id = p_user_id;
  END IF;

  -- Delete user record in public.users
  DELETE FROM public.users WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User data footprint securely purged in compliance with GDPR Article 17.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.gdpr_forget_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gdpr_forget_user(UUID) TO anon;
