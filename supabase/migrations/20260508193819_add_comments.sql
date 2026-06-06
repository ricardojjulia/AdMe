-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
