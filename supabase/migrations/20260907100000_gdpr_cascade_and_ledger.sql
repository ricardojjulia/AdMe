-- Migration: GDPR Cascade Erasure RPC and Audit Ledger (v4.3.0)

-- Function to completely purge all user-associated data under GDPR right to erasure
CREATE OR REPLACE FUNCTION public.gdpr_forget_user()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_uid UUID := auth.uid();
  deleted_ads_count INTEGER := 0;
  deleted_coupons_count INTEGER := 0;
BEGIN
  IF target_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
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
  DELETE FROM public.comments 
  WHERE user_id = target_uid 
     OR ad_id IN (SELECT id FROM public.ads WHERE owner_id = target_uid);

  -- 5. Delete ads owned by user
  WITH deleted_ads AS (
    DELETE FROM public.ads 
    WHERE owner_id = target_uid
    RETURNING id
  )
  SELECT count(*) INTO deleted_ads_count FROM deleted_ads;

  -- 6. Delete coupons and rewards
  WITH deleted_coups AS (
    DELETE FROM public.coupons 
    WHERE user_id = target_uid
    RETURNING id
  )
  SELECT count(*) INTO deleted_coupons_count FROM deleted_coups;

  DELETE FROM public.reward_history WHERE user_id = target_uid;
  DELETE FROM public.user_preferences WHERE user_id = target_uid;
  DELETE FROM public.user_streaks WHERE user_id = target_uid;

  -- 7. Delete ledger entries if tables exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'privacy_audit_log') THEN
    DELETE FROM public.privacy_audit_log WHERE user_id = target_uid;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'zero_knowledge_proofs') THEN
    DELETE FROM public.zero_knowledge_proofs WHERE user_id = target_uid;
  END IF;

  -- 8. Delete user record
  DELETE FROM public.users WHERE id = target_uid;

  RETURN jsonb_build_object(
    'success', true,
    'purged_user_id', target_uid,
    'deleted_ads', deleted_ads_count,
    'deleted_coupons', deleted_coupons_count,
    'purged_at', NOW()
  );
END;
$$;
