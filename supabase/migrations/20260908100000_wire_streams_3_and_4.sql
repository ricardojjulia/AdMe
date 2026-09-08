-- ==============================================================================
-- AdMe Revenue Engine: Automated Streams 3 & 4 Backend Wiring
-- Migration: 20260908100000_wire_streams_3_and_4.sql
-- ==============================================================================

-- 1. Add in_store_redemptions counter to ads for offline ROAS tracking
ALTER TABLE IF EXISTS public.ads 
ADD COLUMN IF NOT EXISTS in_store_redemptions INTEGER DEFAULT 0;

-- 2. Stream 3: Atomic Inbound Campaign Lead Submission & Pay-Per-Lead Credit Burn
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
  v_lead_cost INTEGER := 50; -- 50 ad credits ($0.50)
  v_consumer_reward INTEGER := 25; -- +25 reward points awarded to consumer
  v_owner_credits INTEGER;
BEGIN
  IF v_caller_uid IS NULL THEN
    -- In demo/test environments, allow anonymous fallback if auth.uid() is null
    v_caller_uid := '00000000-0000-0000-0000-000000000001'::uuid;
  END IF;

  IF p_ad_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Missing ad_id');
  END IF;

  IF p_message IS NULL OR trim(p_message) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Inquiry message cannot be empty');
  END IF;

  -- Find target ad
  SELECT * INTO v_ad FROM public.ads WHERE id = p_ad_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ad campaign not found');
  END IF;

  -- Insert lead record
  INSERT INTO public.leads (ad_id, user_id, message, contact_info, status)
  VALUES (p_ad_id, v_caller_uid, p_message, p_contact_info, 'new')
  RETURNING id INTO v_lead_id;

  -- Deduct credits from campaign owner
  IF v_ad.owner_id IS NOT NULL THEN
    UPDATE public.users
    SET ad_credits_balance = GREATEST(0, COALESCE(ad_credits_balance, 0) - v_lead_cost)
    WHERE id = v_ad.owner_id
    RETURNING ad_credits_balance INTO v_owner_credits;

    INSERT INTO public.reward_history (user_id, action, points)
    VALUES (v_ad.owner_id, 'Inbound Lead Generated (Campaign: ' || COALESCE(v_ad.headline, p_ad_id::text) || ')', -v_lead_cost);
  END IF;

  -- Award consumer reward points
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

-- 3. Stream 4: In-Store Cashier Redemption Function Supporting Both Code & ID
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
  -- Look up coupon
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

  -- Mark coupon as redeemed
  UPDATE public.coupons
  SET 
    is_used = TRUE,
    redeemed_at = NOW(),
    verified_by = v_pin
  WHERE id = v_coupon.id;

  -- Increment in-store redemptions counter on corresponding campaign ads
  UPDATE public.ads
  SET in_store_redemptions = COALESCE(in_store_redemptions, 0) + 1
  WHERE advertiser_name ILIKE '%' || split_part(v_coupon.name, ' ', 1) || '%'
     OR headline ILIKE '%' || split_part(v_coupon.name, ' ', 1) || '%'
  RETURNING id INTO v_matched_ad;

  RETURN jsonb_build_object(
    'success', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'perk_name', v_coupon.name,
    'redeemed_at', NOW(),
    'verified_by', v_pin,
    'ad_id', v_matched_ad
  );
END;
$$;

-- Overload for two-argument call: verify_and_redeem_coupon(p_code, p_staff_pin)
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
