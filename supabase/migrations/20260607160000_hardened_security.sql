-- Hardened Security, Authorization, and Privacy Migration

-- 1. Drop existing permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert/update for all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Enable insert/update/delete for all preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Enable read access for all ads" ON public.ads;
DROP POLICY IF EXISTS "Allow update for ad owners" ON public.ads;
DROP POLICY IF EXISTS "Enable all for engagements" ON public.engagements;
DROP POLICY IF EXISTS "Enable all for ad_reports" ON public.ad_reports;
DROP POLICY IF EXISTS "Users can view their own reward history" ON public.reward_history;
DROP POLICY IF EXISTS "Users can insert their own reward history" ON public.reward_history;
DROP POLICY IF EXISTS "Enable insert access for all leads" ON public.leads;
DROP POLICY IF EXISTS "Enable read access for all leads" ON public.leads;
DROP POLICY IF EXISTS "Enable insert access for all coupons" ON public.coupons;
DROP POLICY IF EXISTS "Enable read access for all coupons" ON public.coupons;

-- 2. Create database triggers to secure column updates and handle cascade deletions

-- Prevent client queries from updating rewards_balance and ad_credits_balance directly
CREATE OR REPLACE FUNCTION public.restrict_user_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.rewards_balance IS DISTINCT FROM NEW.rewards_balance OR OLD.ad_credits_balance IS DISTINCT FROM NEW.ad_credits_balance THEN
    -- If trigger runs under a standard authenticated client role, reset balances to OLD values
    IF current_setting('role', true) = 'authenticated' AND (auth.uid() = NEW.id) THEN
      NEW.rewards_balance := OLD.rewards_balance;
      NEW.ad_credits_balance := OLD.ad_credits_balance;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_restrict_user_updates ON public.users;
CREATE TRIGGER trigger_restrict_user_updates
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.restrict_user_updates();

-- Handle GDPR cascade deletion for auth.users
CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_public_user_deleted ON public.users;
CREATE TRIGGER on_public_user_deleted
  AFTER DELETE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_deleted_user();

-- 3. Update handle_new_user to handle conflicts when seeding auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  anon_uid text;
  avatar_char text;
begin
  anon_uid := 'UID-' || upper(substring(new.id::text from 1 for 4)) || '-' || upper(substring(new.id::text from 10 for 4));
  avatar_char := upper(substring(anon_uid from 5 for 2));

  insert into public.users (id, name, avatar, role, rewards_balance, ad_credits_balance)
  values (
    new.id,
    case 
      when (new.raw_user_meta_data->>'account_type') = 'business' then coalesce(new.raw_user_meta_data->>'full_name', 'Business ' || anon_uid)
      else anon_uid
    end,
    case 
      when (new.raw_user_meta_data->>'account_type') = 'business' then '🏢'
      else avatar_char
    end,
    coalesce(new.raw_user_meta_data->>'account_type', 'consumer'),
    0,
    0
  )
  on conflict (id) do update set
    role = excluded.role,
    name = case 
      when excluded.name like 'Business%' then public.users.name 
      else excluded.name 
    end;
  return new;
end;
$$;

-- 4. Seed auth users with bcrypt-hashed password 'password123'
INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role, confirmation_token, email_change, email_change_token_current, email_change_token_new, phone_change, phone_change_token, reauthentication_token, recovery_token, created_at, updated_at)
VALUES
('00000000-0000-0000-0000-000000000000', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'sarah@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "Sarah (Tech Dev)", "account_type": "consumer"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'marcus@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "Marcus (Local Foodie)", "account_type": "consumer"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', 'elena@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "Elena (New Consumer)", "account_type": "consumer"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now()),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'valor@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "Valor Brews (Business)", "account_type": "business"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f5', 'workstation@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "WorkStation (Business)", "account_type": "business"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Synchronize roles and names in public.users (for seeded users)
UPDATE public.users SET role = 'business', name = 'Valor Brews (Business)' WHERE id = '00000000-0000-0000-0000-000000000001';
UPDATE public.users SET role = 'business', name = 'WorkStation (Business)' WHERE id = 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f5';
UPDATE public.users SET role = 'consumer', name = 'Sarah (Tech Dev)', avatar = 'S' WHERE id = 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1';
UPDATE public.users SET role = 'consumer', name = 'Marcus (Local Foodie)', avatar = 'M' WHERE id = 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2';
UPDATE public.users SET role = 'consumer', name = 'Elena (New Consumer)', avatar = 'E' WHERE id = 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3';

-- 5. Create secure database functions (RPC)

-- RPC to add reward points safely from the server/definer context
CREATE OR REPLACE FUNCTION public.add_reward_points(points INTEGER, action_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.users
  SET rewards_balance = COALESCE(rewards_balance, 0) + points
  WHERE id = auth.uid();

  INSERT INTO public.reward_history (user_id, action, points)
  VALUES (auth.uid(), action_name, points);
END;
$$;

-- RPC to redeem a perk and insert a coupon safely
CREATE OR REPLACE FUNCTION public.redeem_perk_coupon(perk_name TEXT, cost_points INTEGER, generated_code TEXT, coupon_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_bal INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT rewards_balance INTO current_bal
  FROM public.users
  WHERE id = auth.uid();

  IF current_bal IS NULL OR current_bal < cost_points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  -- Deduct points
  UPDATE public.users
  SET rewards_balance = current_bal - cost_points
  WHERE id = auth.uid();

  -- Insert reward history
  INSERT INTO public.reward_history (user_id, action, points)
  VALUES (auth.uid(), 'Redeemed ' || perk_name, -cost_points);

  -- Insert coupon
  INSERT INTO public.coupons (id, user_id, code, name, cost_points)
  VALUES (coupon_id, auth.uid(), generated_code, perk_name, cost_points);

  RETURN generated_code;
END;
$$;

-- 6. Create production-hardened RLS policies

-- Users table policies
CREATE POLICY "Allow select for everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow update for own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow delete for own profile" ON public.users FOR DELETE USING (auth.uid() = id);

-- Preferences table policies
CREATE POLICY "Allow select for own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert for own preferences" ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow delete for own preferences" ON public.user_preferences FOR DELETE USING (auth.uid() = user_id);

-- Ads table policies
CREATE POLICY "Allow select for everyone" ON public.ads FOR SELECT USING (true);
CREATE POLICY "Allow insert for business users" ON public.ads FOR INSERT WITH CHECK (auth.uid() = owner_id AND (SELECT role FROM public.users WHERE id = auth.uid()) = 'business');
CREATE POLICY "Allow update for ad owners" ON public.ads FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Allow delete for ad owners" ON public.ads FOR DELETE USING (auth.uid() = owner_id);

-- Engagements table policies
CREATE POLICY "Allow select for own engagements or ad owner" ON public.engagements FOR SELECT USING (auth.uid() = user_id OR (SELECT owner_id FROM public.ads WHERE id = ad_id) = auth.uid());
CREATE POLICY "Allow insert for own engagements or ad owner" ON public.engagements FOR INSERT WITH CHECK (auth.uid() = user_id OR (SELECT owner_id FROM public.ads WHERE id = ad_id) = auth.uid());
CREATE POLICY "Allow delete for own engagements" ON public.engagements FOR DELETE USING (auth.uid() = user_id);

-- Reports table policies
CREATE POLICY "Allow select for own reports" ON public.ad_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Allow insert for own reports" ON public.ad_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Reward history policies (inserts are handled via SECURITY DEFINER function)
CREATE POLICY "Allow select for own reward history" ON public.reward_history FOR SELECT USING (auth.uid() = user_id);

-- Coupons policies (inserts are handled via SECURITY DEFINER function)
CREATE POLICY "Allow select for own coupons" ON public.coupons FOR SELECT USING (auth.uid() = user_id);

-- Leads table policies (read only by ad owners)
CREATE POLICY "Allow select for ad owner" ON public.leads FOR SELECT USING (auth.uid() = (SELECT owner_id FROM public.ads WHERE id = ad_id));
CREATE POLICY "Allow insert for own leads or anonymous" ON public.leads FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
