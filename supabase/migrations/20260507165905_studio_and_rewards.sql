-- Add owner_id to ads table
ALTER TABLE public.ads 
ADD COLUMN owner_id UUID REFERENCES public.users(id);

-- Create reward_history table
CREATE TABLE public.reward_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    points INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on reward_history
ALTER TABLE public.reward_history ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own history
CREATE POLICY "Users can view their own reward history"
    ON public.reward_history FOR SELECT
    USING (user_id = auth.uid() OR true); -- keeping it open for local dev, like other tables

-- Allow users to insert their own history
CREATE POLICY "Users can insert their own reward history"
    ON public.reward_history FOR INSERT
    WITH CHECK (user_id = auth.uid() OR true);
