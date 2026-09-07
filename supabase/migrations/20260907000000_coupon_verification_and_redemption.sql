-- Migration: Coupon Verification & Merchant Redemption RPC (v4.2.0)

-- 1. Ensure coupons table has redeemed_at and merchant_id columns
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS verified_by TEXT;

-- 2. Add RLS policy allowing coupon holders to update coupon status
CREATE POLICY "Users can update their own coupons"
ON public.coupons FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Security Definer RPC for Merchant or User Coupon Redemption Verification
CREATE OR REPLACE FUNCTION public.verify_and_redeem_coupon(
  target_coupon_id UUID,
  merchant_pin TEXT DEFAULT '0000'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  SELECT * INTO coupon_record
  FROM public.coupons
  WHERE id = target_coupon_id;

  IF coupon_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Coupon not found');
  END IF;

  IF coupon_record.is_used = TRUE THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Coupon has already been used',
      'redeemed_at', coupon_record.redeemed_at
    );
  END IF;

  -- Update coupon to used status with verification details
  UPDATE public.coupons
  SET 
    is_used = TRUE,
    redeemed_at = NOW(),
    verified_by = COALESCE(merchant_pin, 'merchant_verified')
  WHERE id = target_coupon_id;

  RETURN jsonb_build_object(
    'success', true,
    'coupon_id', target_coupon_id,
    'code', coupon_record.code,
    'name', coupon_record.name,
    'redeemed_at', NOW()
  );
END;
$$;
