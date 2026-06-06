-- Add gamified streaks to users table
ALTER TABLE public.users ADD COLUMN current_streak INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN last_active_date DATE;

-- Add A/B testing support to ads table
ALTER TABLE public.ads ADD COLUMN campaign_id UUID DEFAULT gen_random_uuid();
ALTER TABLE public.ads ADD COLUMN variation_name TEXT DEFAULT 'A';
