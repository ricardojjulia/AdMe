-- Add tables to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.engagements;

-- Create RPC function to safely increment likes on an ad
CREATE OR REPLACE FUNCTION increment_ad_likes(target_ad_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ads
  SET likes = coalesce(likes, 0) + 1
  WHERE id = target_ad_id;
END;
$$;
