-- Migration: Campaign Budget Pacemaker (v2.1.0)

-- 1. Add budget tracking columns to ads table
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS daily_budget INTEGER DEFAULT 1000;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS credits_spent_today INTEGER DEFAULT 0;
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS last_spend_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create RPC function to log ad engagements and deduct budget credits securely
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
BEGIN
  -- Fetch campaign owner and spend reset timestamp
  SELECT owner_id, last_spend_reset INTO ad_owner_id, spend_reset_time
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
    credit_cost := 15;
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

      -- Deduct credits from user (bypasses restrict_user_updates trigger because it runs under SECURITY DEFINER superuser role context)
      UPDATE public.users
      SET ad_credits_balance = ad_credits_balance - credit_cost
      WHERE id = ad_owner_id;

      -- Track spent campaign credits
      UPDATE public.ads
      SET credits_spent_today = COALESCE(credits_spent_today, 0) + credit_cost
      WHERE id = target_ad_id;
    END IF;
  END IF;

  -- Insert engagement record into engagements ledger (auth.uid() is matched to active logged in consumer)
  INSERT INTO public.engagements (user_id, ad_id, engagement_type, view_duration_seconds)
  VALUES (auth.uid(), target_ad_id, eng_type, duration_sec);
END;
$$;
