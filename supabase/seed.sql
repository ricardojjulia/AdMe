-- Expand SQL seed data for local testing of aggregate analytics, subscriptions, and leads

-- 1. Truncate existing tables to avoid conflict on re-seed (if reset)
-- Note: Cascade handles dependencies
TRUNCATE TABLE public.users, public.ads, public.user_preferences, public.engagements, public.ad_reports, public.leads CASCADE;

-- 2. Insert dummy business owner and 15 anonymous consumers
-- Owner ID matches default test UUID from migrations
INSERT INTO public.users (id, name, avatar, rewards_balance, role, ad_credits_balance, subscription_tier)
VALUES 
('00000000-0000-0000-0000-000000000001', 'RJ', 'RJ', 850, 'business', 15000, 'growth'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'UID-E4D2-89CF', 'E4', 120, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'UID-A2B4-99D3', 'A2', 450, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', 'UID-38C9-2F10', '38', 0, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e4', 'UID-9D3E-A40C', '9D', 80, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5', 'UID-1A3C-44E2', '1A', 230, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e6', 'UID-F9B4-9D38', 'F9', 600, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e7', 'UID-C2D0-2F9A', 'C2', 50, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e8', 'UID-8A4B-A3D9', '8A', 900, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e9', 'UID-4D2A-E90B', '4D', 15, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f0', 'UID-B3A9-77DF', 'B3', 180, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f1', 'UID-6E2D-44C1', '6E', 25, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f2', 'UID-E2A4-F9D3', 'E2', 400, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f3', 'UID-9C8D-32A4', '9C', 70, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f4', 'UID-7B4C-2D99', '7B', 1500, 'consumer', 0, 'free'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f5', 'UID-3A8B-FF2C', '3A', 310, 'consumer', 0, 'free');

-- 3. Seed User Preference distributions to build analytics counts
-- We target the updated categories: Tech & SaaS, Local Eateries, Faith & Books, Auto under $40k, Veteran-owned
INSERT INTO public.user_preferences (user_id, category) VALUES
-- User 1
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'Tech & SaaS'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'Local Eateries'),
-- User 2
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'Faith & Books'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'Veteran-owned'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'Local Eateries'),
-- User 3
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', 'Auto under $40k'),
-- User 4
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e4', 'Tech & SaaS'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e4', 'Auto under $40k'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e4', 'Home & Garden'),
-- User 5
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5', 'Wellness & Health'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5', 'Faith & Books'),
-- User 6
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e6', 'Tech & SaaS'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e6', 'Veteran-owned'),
-- User 7
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e7', 'Local Eateries'),
-- User 8
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e8', 'Faith & Books'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e8', 'Wellness & Health'),
-- User 9
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e9', 'Auto under $40k'),
-- User 10
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f0', 'Tech & SaaS'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f0', 'Local Eateries'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f0', 'Gaming'),
-- User 11
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f1', 'Veteran-owned'),
-- User 12
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f2', 'Tech & SaaS'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f2', 'Home & Garden'),
-- User 13
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f3', 'Local Eateries'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f3', 'Faith & Books'),
-- User 14
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f4', 'Wellness & Health'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f4', 'Finance'),
-- User 15
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f5', 'Tech & SaaS'),
('a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f5', 'Veteran-owned');

-- 4. Seed sample Campaigns (with proximity boosting and layout variations)
INSERT INTO public.ads (id, category, format_type, advertiser_name, advertiser_avatar, headline, content_text, media_url, media_type, primary_color, cta_label, cta_url, likes, shares, latitude, longitude, owner_id, is_boosted) VALUES
-- Boosted Local Ad (Veteran-owned coffee shop)
('10101010-1010-1010-1010-101010101010', 'Veteran-owned', 'native', 'Valor Brews', 'VB', 'Veteran-Owned Craft Coffee', 'Support our team. Freshly roasted micro-batches delivered straight to your door.', 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&q=80', 'image', '#ffb703', 'Get Coffee', 'https://valorbrews.com', 432, 57, 34.0195, -118.4912, '00000000-0000-0000-0000-000000000001', TRUE),

-- Standard Ad (Faith & Books)
('20202020-2020-2020-2020-202020202020', 'Faith & Books', 'social', 'Beacon Publishing', 'BP', 'Discover New Hope', 'A collection of writings to rebuild faith, community, and daily inspiration. Available in paperback and digital.', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80', 'image', '#2a9d8f', 'Read Chapter', 'https://beaconpublishing.com', 124, 11, 37.7749, -122.4194, '00000000-0000-0000-0000-000000000001', FALSE),

-- Boosted Ad (Local eateries)
('30303030-3030-3030-3030-303030303030', 'Local Eateries', 'social', 'The Green Kitchen', 'GK', 'Organic bowls $5 off', 'Try our local California harvest bowls. Real food, local ingredients. Santa Monica location.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80', 'image', '#2b9348', 'Order Bowl', 'https://greenkitchensm.com', 289, 44, 34.0122, -118.4922, '00000000-0000-0000-0000-000000000001', TRUE),

-- Standard Ad (Auto under 40k)
('40404040-4040-4040-4040-404040404040', 'Auto under $40k', 'carousel', 'Nomad Motors', 'NM', 'EVs starting at $34,900', 'Explore the compact Voyager EV. 280-mile range. Financing starting at 2.9% APR.', 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80', 'image', '#457b9d', 'Book Test Drive', 'https://nomadmotors.com', 95, 8, 34.0522, -118.2437, '00000000-0000-0000-0000-000000000001', FALSE);

-- 5. Seed incoming inquiry Leads (Anonymous inquiries)
INSERT INTO public.leads (id, ad_id, user_id, message, contact_info, created_at) VALUES
('50505050-5050-5050-5050-505050505050', '10101010-1010-1010-1010-101010101010', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'Do you ship to military APO addresses?', 'APO box details provided: militarypost@usa.mil', NOW() - INTERVAL '2 hours'),
('60606060-6060-6060-6060-606060606060', '10101010-1010-1010-1010-101010101010', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5', 'Do you offer catering options for local veteran events?', 'None provided (stayed anonymous)', NOW() - INTERVAL '1 day'),
('70707070-7070-7070-7070-707070707070', '30303030-3030-3030-3030-303030303030', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'Are the harvest bowls allergen-free (peanut allergy)?', 'info-request@healthyliving.com', NOW() - INTERVAL '3 hours');
