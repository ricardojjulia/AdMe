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

-- ------------------------------------------------------------------------------
-- 4. Stripe Payment Transactions Ledger and Idempotent Fulfillment
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_session_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  mode TEXT NOT NULL, -- 'credits' or 'subscription'
  credits_added INTEGER DEFAULT 0,
  plan_tier TEXT DEFAULT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select for own payment transactions" ON public.payment_transactions;
CREATE POLICY "Allow select for own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.fulfill_stripe_payment(
  p_user_id UUID,
  p_session_id TEXT,
  p_mode TEXT,
  p_amount_cents INTEGER,
  p_credits INTEGER DEFAULT 0,
  p_plan TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
  v_new_credits INTEGER;
  v_renewal TIMESTAMPTZ;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing user_id');
  END IF;

  IF p_session_id IS NULL OR trim(p_session_id) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing session_id');
  END IF;

  -- 1. Idempotency check: Has this Stripe session already been fulfilled?
  SELECT * INTO v_existing
  FROM public.payment_transactions
  WHERE stripe_session_id = p_session_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_fulfilled', true,
      'session_id', p_session_id,
      'credits_added', v_existing.credits_added,
      'plan_tier', v_existing.plan_tier,
      'message', 'Payment already fulfilled previously.'
    );
  END IF;

  -- 2. Insert into payment transactions ledger
  INSERT INTO public.payment_transactions (
    user_id,
    stripe_session_id,
    amount_cents,
    mode,
    credits_added,
    plan_tier,
    status
  ) VALUES (
    p_user_id,
    p_session_id,
    COALESCE(p_amount_cents, 0),
    p_mode,
    COALESCE(p_credits, 0),
    p_plan,
    'completed'
  );

  -- 3. Execute credit top up or subscription tier upgrade
  IF p_mode = 'credits' AND COALESCE(p_credits, 0) > 0 THEN
    UPDATE public.users
    SET ad_credits_balance = COALESCE(ad_credits_balance, 0) + p_credits
    WHERE id = p_user_id
    RETURNING ad_credits_balance INTO v_new_credits;

    INSERT INTO public.reward_history (user_id, action, points)
    VALUES (p_user_id, 'Purchased Ad Credits (' || p_credits || ' credits, Stripe: ' || p_session_id || ')', p_credits);

    RETURN jsonb_build_object(
      'success', true,
      'already_fulfilled', false,
      'mode', 'credits',
      'credits_added', p_credits,
      'new_balance', v_new_credits,
      'session_id', p_session_id
    );

  ELSIF p_mode = 'subscription' AND p_plan IS NOT NULL THEN
    v_renewal := NOW() + INTERVAL '30 days';

    UPDATE public.users
    SET subscription_tier = p_plan,
        subscription_renewal = v_renewal
    WHERE id = p_user_id;

    INSERT INTO public.reward_history (user_id, action, points)
    VALUES (p_user_id, 'Upgraded Plan to ' || upper(p_plan) || ' (Stripe: ' || p_session_id || ')', 0);

    RETURN jsonb_build_object(
      'success', true,
      'already_fulfilled', false,
      'mode', 'subscription',
      'plan_tier', p_plan,
      'renewal', v_renewal,
      'session_id', p_session_id
    );

  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'already_fulfilled', false,
      'session_id', p_session_id
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fulfill_stripe_payment(UUID, TEXT, TEXT, INTEGER, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fulfill_stripe_payment(UUID, TEXT, TEXT, INTEGER, INTEGER, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.fulfill_stripe_payment(UUID, TEXT, TEXT, INTEGER, INTEGER, TEXT) TO service_role;

-- ------------------------------------------------------------------------------
-- 5. Revenue Engine: Automated Streams 3 & 4 (Leads & In-Store Cashier Drops)
-- ------------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.ads 
ADD COLUMN IF NOT EXISTS in_store_redemptions INTEGER DEFAULT 0;

CREATE OR REPLACE FUNCTION public.submit_campaign_lead(
  p_ad_id UUID,
  p_message TEXT,
  p_contact_info TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_caller_uid UUID := auth.uid();
  v_ad RECORD;
  v_lead_id UUID;
  v_lead_cost INTEGER := 50;
  v_consumer_reward INTEGER := 25;
  v_owner_credits INTEGER;
BEGIN
  IF v_caller_uid IS NULL THEN
    v_caller_uid := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  IF p_ad_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing ad_id');
  END IF;

  IF p_message IS NULL OR trim(p_message) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inquiry message cannot be empty');
  END IF;

  SELECT * INTO v_ad FROM public.ads WHERE id = p_ad_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ad campaign not found');
  END IF;

  INSERT INTO public.leads (ad_id, user_id, message, contact_info, status)
  VALUES (p_ad_id, v_caller_uid, p_message, p_contact_info, 'new')
  RETURNING id INTO v_lead_id;

  IF v_ad.owner_id IS NOT NULL THEN
    UPDATE public.users
    SET ad_credits_balance = GREATEST(0, COALESCE(ad_credits_balance, 0) - v_lead_cost)
    WHERE id = v_ad.owner_id
    RETURNING ad_credits_balance INTO v_owner_credits;

    INSERT INTO public.reward_history (user_id, action, points)
    VALUES (v_ad.owner_id, 'Inbound Lead Generated (Campaign: ' || COALESCE(v_ad.headline, p_ad_id::text) || ')', -v_lead_cost);
  END IF;

  UPDATE public.users
  SET rewards_balance = COALESCE(rewards_balance, 0) + v_consumer_reward
  WHERE id = v_caller_uid;

  INSERT INTO public.reward_history (user_id, action, points)
  VALUES (v_caller_uid, 'Verified Inquiry Reward (' || COALESCE(v_ad.advertiser_name, 'Partner') || ')', v_consumer_reward);

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'consumer_points_awarded', v_consumer_reward,
    'advertiser_credits_deducted', v_lead_cost,
    'advertiser_new_balance', v_owner_credits
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_campaign_lead(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_campaign_lead(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_campaign_lead(UUID, TEXT, TEXT) TO service_role;

DROP FUNCTION IF EXISTS public.verify_and_redeem_coupon(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.verify_and_redeem_coupon(UUID, TEXT);
DROP FUNCTION IF EXISTS public.verify_and_redeem_coupon(TEXT, TEXT, UUID, TEXT);

CREATE OR REPLACE FUNCTION public.verify_and_redeem_coupon(
  p_code TEXT DEFAULT NULL,
  p_staff_pin TEXT DEFAULT NULL,
  target_coupon_id UUID DEFAULT NULL,
  merchant_pin TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pin TEXT := COALESCE(p_staff_pin, merchant_pin, 'In-Store Cashier');
  v_coupon RECORD;
  v_matched_ad UUID;
BEGIN
  IF target_coupon_id IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.coupons WHERE id = target_coupon_id;
  ELSIF p_code IS NOT NULL THEN
    SELECT * INTO v_coupon FROM public.coupons WHERE code = p_code;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Missing coupon identification');
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not found');
  END IF;

  IF v_coupon.is_used = TRUE OR v_coupon.redeemed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Coupon has already been redeemed',
      'redeemed_at', v_coupon.redeemed_at
    );
  END IF;

  UPDATE public.coupons
  SET 
    is_used = TRUE,
    redeemed_at = NOW(),
    verified_by = v_pin
  WHERE id = v_coupon.id;

  UPDATE public.ads
  SET in_store_redemptions = COALESCE(in_store_redemptions, 0) + 1
  WHERE advertiser_name ILIKE '%' || split_part(v_coupon.name, ' ', 1) || '%'
     OR headline ILIKE '%' || split_part(v_coupon.name, ' ', 1) || '%';

  RETURN jsonb_build_object(
    'success', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'perk_name', v_coupon.name,
    'redeemed_at', NOW(),
    'verified_by', v_pin
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_and_redeem_coupon(
  p_code TEXT,
  p_staff_pin TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN public.verify_and_redeem_coupon(p_code, p_staff_pin, NULL, NULL);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_and_redeem_coupon(TEXT, TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_and_redeem_coupon(TEXT, TEXT, UUID, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_and_redeem_coupon(TEXT, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_and_redeem_coupon(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_and_redeem_coupon(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_and_redeem_coupon(TEXT, TEXT) TO service_role;


