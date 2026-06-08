-- Migration: Real-Time Bidding & Bidding Schema (v3.2.0)

-- 1. Add max_cpc_bid column to public.ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS max_cpc_bid INTEGER DEFAULT 15;

-- 2. Update record_ad_engagement RPC to charge the campaign's custom CPC bid for clicks
CREATE OR REPLACE FUNCTION public.record_ad_engagement(
  target_ad_id UUID, 
  eng_type TEXT, 
  duration_sec NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ad_owner_id UUID;
  credit_cost INTEGER := 0;
  current_bal INTEGER;
  spend_reset_time TIMESTAMP WITH TIME ZONE;
  ad_cpc_bid INTEGER;
BEGIN
  -- Fetch campaign owner, spend reset timestamp, and custom CPC bid
  SELECT owner_id, last_spend_reset, COALESCE(max_cpc_bid, 15) INTO ad_owner_id, spend_reset_time, ad_cpc_bid
  FROM public.ads
  WHERE id = target_ad_id;

  IF ad_owner_id IS NULL THEN
    RAISE EXCEPTION 'Ad campaign not found';
  END IF;

  -- Reset spent budget count if last reset was on a previous day
  IF DATE_TRUNC('day', spend_reset_time) < DATE_TRUNC('day', NOW()) THEN
    UPDATE public.ads
    SET credits_spent_today = 0, last_spend_reset = NOW()
    WHERE id = target_ad_id;
  END IF;

  -- Determine credit cost based on engagement type
  IF eng_type = 'view' THEN
    credit_cost := 5;
  ELSIF eng_type = 'click' THEN
    credit_cost := ad_cpc_bid;
  ELSIF eng_type = 'lead' THEN
    credit_cost := 50;
  END IF;

  -- Charge the advertiser/owner if credit cost is greater than 0
  IF credit_cost > 0 THEN
    SELECT ad_credits_balance INTO current_bal
    FROM public.users
    WHERE id = ad_owner_id;

    IF current_bal IS NOT NULL AND current_bal > 0 THEN
      -- Cap deduction so balance doesn't drop below 0
      IF current_bal < credit_cost THEN
        credit_cost := current_bal;
      END IF;

      -- Deduct credits from user (runs under SECURITY DEFINER bypass)
      UPDATE public.users
      SET ad_credits_balance = ad_credits_balance - credit_cost
      WHERE id = ad_owner_id;

      -- Track spent campaign credits
      UPDATE public.ads
      SET credits_spent_today = COALESCE(credits_spent_today, 0) + credit_cost
      WHERE id = target_ad_id;
    END IF;
  END IF;

  -- Insert engagement record into engagements ledger
  INSERT INTO public.engagements (user_id, ad_id, engagement_type, view_duration_seconds)
  VALUES (auth.uid(), target_ad_id, eng_type, duration_sec);
END;
$$;
