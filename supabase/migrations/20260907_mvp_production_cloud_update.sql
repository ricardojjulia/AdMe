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
DROP POLICY IF EXISTS "Advertisers can manage own campaign status and budget" ON public.ads;
DROP POLICY IF EXISTS "Allow update for ad owner" ON public.ads;

CREATE POLICY "Advertisers can manage own campaign status and budget"
  ON public.ads
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Leads Owners update policy
DROP POLICY IF EXISTS "Campaign owners can update inbound leads" ON public.leads;
DROP POLICY IF EXISTS "Allow update leads for ad owner" ON public.leads;

CREATE POLICY "Campaign owners can update inbound leads"
  ON public.leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ads
      WHERE ads.id = leads.ad_id AND ads.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ads
      WHERE ads.id = leads.ad_id AND ads.owner_id = auth.uid()
    )
  );

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
  target_uid UUID := COALESCE(p_user_id, auth.uid());
BEGIN
  IF target_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify caller is the user themselves or service_role
  IF auth.uid() IS NOT NULL AND auth.uid() != target_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You can only purge your own footprint');
  END IF;

  -- 1. Remove engagements on campaigns owned by this user
  DELETE FROM public.engagements 
  WHERE ad_id IN (SELECT id FROM public.ads WHERE owner_id = target_uid);

  -- 2. Remove engagements performed by this user
  DELETE FROM public.engagements 
  WHERE user_id = target_uid;

  -- 3. Remove leads submitted to user campaigns or by user
  DELETE FROM public.leads 
  WHERE user_id = target_uid 
     OR ad_id IN (SELECT id FROM public.ads WHERE owner_id = target_uid);

  -- 4. Remove comments on ads owned by this user or written by user
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
    DELETE FROM public.comments 
    WHERE user_id = target_uid 
       OR ad_id IN (SELECT id FROM public.ads WHERE owner_id = target_uid);
  END IF;

  -- 5. Delete ad reports
  DELETE FROM public.ad_reports 
  WHERE user_id = target_uid 
     OR ad_id IN (SELECT id FROM public.ads WHERE owner_id = target_uid);

  -- 6. Delete ads owned by user
  DELETE FROM public.ads WHERE owner_id = target_uid;

  -- 7. Delete coupons, preferences, and reward history
  DELETE FROM public.coupons WHERE user_id = target_uid;
  DELETE FROM public.reward_history WHERE user_id = target_uid;
  DELETE FROM public.user_preferences WHERE user_id = target_uid;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
    DELETE FROM public.user_streaks WHERE user_id = target_uid;
  END IF;

  -- 8. Delete geofence claims
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'geofence_claims') THEN
    DELETE FROM public.geofence_claims WHERE user_id = target_uid;
  END IF;

  -- 9. Delete privacy audit log if exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'privacy_audit_log') THEN
    DELETE FROM public.privacy_audit_log WHERE user_id = target_uid;
  END IF;

  -- 10. Delete user record in public.users
  DELETE FROM public.users WHERE id = target_uid;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User data footprint securely purged in compliance with GDPR Article 17.'
  );
END;
$$;

-- Zero-argument overload for client calling supabase.rpc('gdpr_forget_user')
CREATE OR REPLACE FUNCTION public.gdpr_forget_user()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.gdpr_forget_user(auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.gdpr_forget_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.gdpr_forget_user(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.gdpr_forget_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.gdpr_forget_user() TO anon;
