-- ==============================================================================
-- AdMe Stripe Payment Fulfillment & Ledger Table
-- Migration: 20260908000000_stripe_payment_fulfillment.sql
-- Description: Creates payment_transactions ledger and fulfill_stripe_payment
--              SECURITY DEFINER RPC ensuring zero-drop idempotent fulfillment.
-- ==============================================================================

-- 1. Create public.payment_transactions ledger
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

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own payment transactions
DROP POLICY IF EXISTS "Allow select for own payment transactions" ON public.payment_transactions;
CREATE POLICY "Allow select for own payment transactions"
  ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Atomic, Idempotent Fulfillment RPC function
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
  -- Basic parameter validation
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
    -- Return existing transaction details safely without adding double credits
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

    -- Record in reward_history for audit trail
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

    -- Record in reward_history for audit trail
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
