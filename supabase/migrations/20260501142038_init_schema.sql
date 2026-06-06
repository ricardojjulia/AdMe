-- Create users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT,
  rewards_balance INTEGER DEFAULT 0,
  role TEXT DEFAULT 'consumer',
  ad_credits_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- Create ads table
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  format_type TEXT NOT NULL, -- 'social', 'native', 'carousel'
  advertiser_name TEXT NOT NULL,
  advertiser_avatar TEXT,
  headline TEXT NOT NULL,
  content_text TEXT,
  media_url TEXT,
  media_type TEXT DEFAULT 'image',
  primary_color TEXT,
  cta_label TEXT,
  cta_url TEXT,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create engagements table
CREATE TABLE public.engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  engagement_type TEXT NOT NULL, -- 'view', 'click', 'like', 'save'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ad_reports table
CREATE TABLE public.ad_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous/public access (since we are using the anon key for now)
-- WARNING: In a production app, you should authenticate users and restrict these.
CREATE POLICY "Enable read access for all users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Enable insert/update for all users" ON public.users FOR ALL USING (true);

CREATE POLICY "Enable read access for all preferences" ON public.user_preferences FOR SELECT USING (true);
CREATE POLICY "Enable insert/update/delete for all preferences" ON public.user_preferences FOR ALL USING (true);

CREATE POLICY "Enable read access for all ads" ON public.ads FOR SELECT USING (true);

CREATE POLICY "Enable all for engagements" ON public.engagements FOR ALL USING (true);

CREATE POLICY "Enable all for ad_reports" ON public.ad_reports FOR ALL USING (true);

-- Insert dummy test user "RJ" so the app doesn't break
INSERT INTO public.users (id, name, avatar, rewards_balance, role, ad_credits_balance)
VALUES ('00000000-0000-0000-0000-000000000001', 'RJ', 'RJ', 186, 'consumer', 0);
