-- Migration: Campaign Lifecycle & Inbound Leads Cockpit (MVP Phase 2)

-- 1. Add status column to ads table if it doesn't exist
ALTER TABLE public.ads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. Add status column to leads table if it doesn't exist
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- 3. Enable ad owners to update their own ads (pause/resume status, daily_budget)
DROP POLICY IF EXISTS "Allow update for ad owner" ON public.ads;
CREATE POLICY "Allow update for ad owner" ON public.ads
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 4. Enable ad owners to update status of leads received on their ads
DROP POLICY IF EXISTS "Allow update leads for ad owner" ON public.leads;
CREATE POLICY "Allow update leads for ad owner" ON public.leads
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT owner_id FROM public.ads WHERE id = ad_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT owner_id FROM public.ads WHERE id = ad_id
    )
  );
