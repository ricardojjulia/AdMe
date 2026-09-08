-- ==============================================================================
-- AdMe AI Safety, Content Moderation & Merchant Verification Architecture
-- Migration: 20260908200000_ai_safety_and_moderation.sql
-- ==============================================================================

-- 1. Extend public.ads with automated moderation and takedown audit columns
ALTER TABLE IF EXISTS public.ads 
ADD COLUMN IF NOT EXISTS moderation_score NUMERIC DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS moderation_flags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS moderation_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS takedown_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS takedown_reason TEXT DEFAULT NULL;

-- 2. Extend public.users with merchant verification and violation strike tracking
ALTER TABLE IF EXISTS public.users 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified', -- 'unverified' | 'pending' | 'verified' | 'suspended' | 'terminated'
ADD COLUMN IF NOT EXISTS violation_strikes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS business_website TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS business_address TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Extend public.ad_reports with automated AI arbitration fields
ALTER TABLE IF EXISTS public.ad_reports 
ADD COLUMN IF NOT EXISTS arbitration_decision TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS arbitrated_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC DEFAULT NULL;

-- 4. Atomic AI Report Arbitration & Instant Takedown RPC Function
CREATE OR REPLACE FUNCTION public.arbitrate_ad_report(
  p_report_id UUID,
  p_should_takedown BOOLEAN,
  p_terminate_merchant BOOLEAN DEFAULT FALSE,
  p_decision TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_report RECORD;
  v_ad RECORD;
BEGIN
  -- Fetch report
  SELECT * INTO v_report FROM public.ad_reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Report not found');
  END IF;

  -- Update report
  UPDATE public.ad_reports
  SET 
    status = CASE WHEN p_should_takedown THEN 'actioned' ELSE 'dismissed' END,
    arbitration_decision = p_decision,
    arbitrated_at = NOW()
  WHERE id = p_report_id;

  -- If takedown is warranted, instantly pull the ad
  IF p_should_takedown THEN
    SELECT * INTO v_ad FROM public.ads WHERE id = v_report.ad_id;
    
    IF FOUND THEN
      UPDATE public.ads
      SET 
        status = 'takedown',
        takedown_at = NOW(),
        takedown_reason = p_decision
      WHERE id = v_report.ad_id;

      -- If ad has an owner, add a violation strike
      IF v_ad.owner_id IS NOT NULL THEN
        UPDATE public.users
        SET violation_strikes = COALESCE(violation_strikes, 0) + 1
        WHERE id = v_ad.owner_id;

        -- Check if strikes warrant account termination
        IF p_terminate_merchant THEN
          UPDATE public.users
          SET verification_status = 'terminated'
          WHERE id = v_ad.owner_id;

          -- Suspend all remaining ads owned by this merchant
          UPDATE public.ads
          SET status = 'suspended', takedown_reason = 'Merchant account terminated for safety violations'
          WHERE owner_id = v_ad.owner_id AND status = 'active';
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'report_id', p_report_id,
    'takedown_applied', p_should_takedown,
    'merchant_terminated', p_terminate_merchant,
    'decision', p_decision
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.arbitrate_ad_report(UUID, BOOLEAN, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.arbitrate_ad_report(UUID, BOOLEAN, BOOLEAN, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.arbitrate_ad_report(UUID, BOOLEAN, BOOLEAN, TEXT) TO service_role;
