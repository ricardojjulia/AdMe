-- Migration: 20260908183000_fix_comments_schema_and_rls.sql
-- Allow comments on all ad formats, campaign variations, and organic posts by converting ad_id and user_id to TEXT
-- and setting open community RLS policies.

ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_ad_id_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

ALTER TABLE public.comments ALTER COLUMN ad_id TYPE TEXT USING ad_id::text;
ALTER TABLE public.comments ALTER COLUMN user_id TYPE TEXT USING user_id::text;

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Allow public read of all comments
DROP POLICY IF EXISTS "Allow public read comments" ON public.comments;
CREATE POLICY "Allow public read comments" ON public.comments FOR SELECT USING (true);

-- Allow public insert of comments
DROP POLICY IF EXISTS "Allow public insert comments" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert comments" ON public.comments FOR INSERT WITH CHECK (true);
