-- Expand SQL seed data for local testing of aggregate analytics, subscriptions, and leads

-- 1. Truncate existing tables to avoid conflict on re-seed (if reset)
-- Note: Cascade handles dependencies
TRUNCATE TABLE public.users, public.ads, public.user_preferences, public.engagements, public.ad_reports, public.leads CASCADE;

-- Seed auth users with bcrypt-hashed password 'password123'
INSERT INTO auth.users (instance_id, id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, aud, role, confirmation_token, email_change, email_change_token_current, email_change_token_new, phone_change, phone_change_token, reauthentication_token, recovery_token, created_at, updated_at)
VALUES
('00000000-0000-0000-0000-000000000000', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'sarah@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "Sarah (Tech Dev)", "account_type": "consumer"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'marcus@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "Marcus (Local Foodie)", "account_type": "consumer"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e3', 'elena@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "Elena (New Consumer)", "account_type": "consumer"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now()),
('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', 'valor@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "Valor Brews (Business)", "account_type": "business"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now()),
('00000000-0000-0000-0000-000000000000', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0f5', 'workstation@adme.demo', '$2a$10$sGcVglm3isHcR6pw1oXlp.DbdBB1pvSbywl9SVHQ6i3MUuuHumcBy', now(), '{"full_name": "WorkStation (Business)", "account_type": "business"}'::jsonb, '{"provider": "email", "providers": ["email"]}'::jsonb, 'authenticated', 'authenticated', '', '', '', '', '', '', '', '', now(), now())
ON CONFLICT (id) DO NOTHING;

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

-- 4. Seed sample Campaigns across all 9 curated categories
INSERT INTO public.ads (id, category, format_type, advertiser_name, advertiser_avatar, headline, content_text, media_url, media_type, primary_color, cta_label, cta_url, likes, shares, latitude, longitude, owner_id, is_boosted, max_cpc_bid) VALUES
-- Veteran-owned
('10101010-1010-1010-1010-101010101010', 'Veteran-owned', 'native', 'Valor Brews', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', 'Veteran-Owned Craft Coffee', 'Support our team. Freshly roasted micro-batches delivered straight to your door. Veterans get 15% off every bag.', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=800', 'image', '#d97706', 'Shop Coffee', 'https://valorbrews.com', 1420, 380, 34.0195, -118.4912, '00000000-0000-0000-0000-000000000001', TRUE, 25),
('10101010-1010-1010-1010-101010101020', 'Veteran-owned', 'social', 'Forward March Supply', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200', 'Rugged Expedition Gear', 'Engineered by combat veterans. Field-tested modular packs and weatherproof outdoor essentials built to last a lifetime.', 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800', 'image', '#059669', 'Gear Up', 'https://forwardmarch.shop', 940, 210, 34.0250, -118.4800, '00000000-0000-0000-0000-000000000001', FALSE, 20),

-- Local Eateries
('30303030-3030-3030-3030-303030303030', 'Local Eateries', 'social', 'The Green Kitchen', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', 'California Harvest Bowls $5 Off', 'Clean eating made simple. Avocado, roasted sweet potato, and organic quinoa protein bowls with citrus tahini dressing.', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=800', 'image', '#16a34a', 'Order Bowl', 'https://greenkitchensm.com', 1280, 310, 34.0122, -118.4922, '00000000-0000-0000-0000-000000000001', TRUE, 30),
('30303030-3030-3030-3030-303030303040', 'Local Eateries', 'native', 'Artisan Sourdough Co.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', 'Wild Yeast Bread & Pastries', 'Naturally fermented 36-hour sourdough loaves and flaky morning croissants baked daily in our stone deck oven.', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800', 'image', '#b45309', 'View Bakery Menu', 'https://artisansourdough.local', 820, 140, 34.0180, -118.4950, '00000000-0000-0000-0000-000000000001', FALSE, 18),

-- Faith & Books
('20202020-2020-2020-2020-202020202020', 'Faith & Books', 'native', 'Beacon Publishing', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200', 'Discover New Hope', 'An uplifting collection of real stories exploring resilience, community, and faith. Available in hardcover and audiobook.', 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800', 'image', '#7c3aed', 'Explore Book', 'https://beaconpublishing.shop', 650, 120, 37.7749, -122.4194, '00000000-0000-0000-0000-000000000001', FALSE, 15),
('20202020-2020-2020-2020-202020202030', 'Faith & Books', 'social', 'Lumina Literary Press', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200', 'Classics for Mindful Living', 'Curated philosophical essays, poetry editions, and journals designed for quiet reflection and morning focus.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=800', 'image', '#4f46e5', 'Browse Library', 'https://luminalit.org', 490, 85, 37.7800, -122.4100, '00000000-0000-0000-0000-000000000001', FALSE, 16),

-- Tech & SaaS
('50505050-5050-5050-5050-505050505010', 'Tech & SaaS', 'native', 'DevSync Pro', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200', 'Instant Cloud Dev Environments', 'Spin up isolated staging sandboxes with live hot-reloading and end-to-end telemetry. Designed for high-velocity software teams.', 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=800', 'image', '#2563eb', 'Start Free Trial', 'https://devsync.io', 2150, 620, 37.7749, -122.4194, '00000000-0000-0000-0000-000000000001', TRUE, 35),
('50505050-5050-5050-5050-505050505020', 'Tech & SaaS', 'social', 'CloudScale AI', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200', 'Automated Database Observability', 'Real-time query profiling, slow-query regression alerts, and automated index tuning for PostgreSQL and Next.js applications.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800', 'image', '#0284c7', 'View Live Demo', 'https://cloudscale.tech', 1680, 430, 37.7850, -122.4050, '00000000-0000-0000-0000-000000000001', FALSE, 28),

-- Auto under 40k
('40404040-4040-4040-4040-404040404040', 'Auto under $40k', 'carousel', 'Nomad Motors', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200', 'Nomad Voyager EV from $34,900', '300-mile highway range, dual-motor all-weather AWD, and fast-charge to 80% in 22 minutes. Schedule a home test drive.', 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800', 'image', '#0ea5e9', 'Explore EV', 'https://nomadmotors.ev', 3540, 920, 34.0522, -118.2437, '00000000-0000-0000-0000-000000000001', FALSE, 40),
('40404040-4040-4040-4040-404040404050', 'Auto under $40k', 'native', 'Metro Hybrid 2026', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200', '54 MPG Compact City Hybrid at $24,500', 'Regenerative braking, smart lane guidance, and 10-year battery warranty. Enjoy premium efficiency without the luxury price tag.', 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800', 'image', '#14b8a6', 'Build & Price', 'https://metrohybrid.auto', 1910, 360, 34.0600, -118.2500, '00000000-0000-0000-0000-000000000001', FALSE, 25),

-- Wellness & Health
('60606060-6060-6060-6060-606060606010', 'Wellness & Health', 'native', 'Aura Mindfulness', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200', 'Guided Breathwork & Circadian Sleep', 'Science-backed soundscapes and personalized breathing exercises tailored to calm your nervous system in 10 minutes.', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=800', 'image', '#8b5cf6', 'Try 7 Days Free', 'https://auramind.app', 2400, 580, 34.0195, -118.4912, '00000000-0000-0000-0000-000000000001', TRUE, 26),
('60606060-6060-6060-6060-606060606020', 'Wellness & Health', 'social', 'Pure Botanicals', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200', 'Cold-Pressed Herbal Adaptogens', '100% organic lion''s mane, ashwagandha, and clean daily multivitamins. Third-party verified for purity and potency.', 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=800', 'image', '#10b981', 'Shop Formulas', 'https://purebotanicals.wellness', 1120, 190, 34.0220, -118.4850, '00000000-0000-0000-0000-000000000001', FALSE, 22),

-- Home & Garden
('70707070-7070-7070-7070-707070707010', 'Home & Garden', 'native', 'Terra Living Co.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200', 'Zero-Waste Home Essentials', 'Plastic-free bamboo kitchenware, natural beeswax wraps, and botanical cleaning refills delivered in compostable packaging.', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800', 'image', '#84cc16', 'Shop Sustainable', 'https://terraliving.co', 1540, 320, 34.0150, -118.4900, '00000000-0000-0000-0000-000000000001', FALSE, 20),
('70707070-7070-7070-7070-707070707020', 'Home & Garden', 'carousel', 'Bloom & Branch Nursery', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200', 'Living Houseplants for Clean Air', 'Thriving monstera, fiddle-leaf figs, and ceramic self-watering planters shipped with guaranteed safe arrival.', 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&q=80&w=800', 'image', '#22c55e', 'Find Your Plant', 'https://bloombranch.green', 1320, 280, 34.0280, -118.4750, '00000000-0000-0000-0000-000000000001', FALSE, 19),

-- Gaming
('80808080-8080-8080-8080-808080808010', 'Gaming', 'social', 'Aether Forge Studios', 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200', 'Chronicles of Sol: Tactical RPG', 'Immerse yourself in turn-based tactical combat, deep branching lore, and player-driven guild warfare. Wishlist on PC and console today.', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800', 'image', '#ec4899', 'Wishlist Now', 'https://aetherforge.games', 4200, 1100, 37.7749, -122.4194, '00000000-0000-0000-0000-000000000001', TRUE, 32),
('80808080-8080-8080-8080-808080808020', 'Gaming', 'native', 'GuildCraft Hardware', 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=200', 'Precision Ultra-Light Gaming Mice', '8000Hz polling rate, optical micro-switches, and 49-gram magnesium alloy chassis for peak competitive aim.', 'https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&q=80&w=800', 'image', '#f43f5e', 'Shop Gear', 'https://guildcraft.gg', 2890, 640, 37.7820, -122.4150, '00000000-0000-0000-0000-000000000001', FALSE, 24),

-- Finance
('90909090-9090-9090-9090-909090909010', 'Finance', 'native', 'ClearPath Financial', 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200', 'Automate Wealth with Low-Fee Indexing', 'Automated dollar-cost averaging into globally diversified index portfolios. Transparent, fiduciary, and commission-free.', 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=800', 'image', '#06b6d4', 'Start Investing', 'https://clearpath.finance', 1840, 410, 37.7749, -122.4194, '00000000-0000-0000-0000-000000000001', TRUE, 38),
('90909090-9090-9090-9090-909090909020', 'Finance', 'social', 'Harbor Trust Bank', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200', 'High-Yield FDIC Savings at 5.15% APY', 'Earn 10x the national average on your emergency reserve fund. Zero maintenance fees, no lockup periods, instant ACH transfers.', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800', 'image', '#3b82f6', 'Open Account', 'https://harbortrust.bank', 1470, 290, 37.7900, -122.4000, '00000000-0000-0000-0000-000000000001', FALSE, 30);

-- 5. Seed incoming inquiry Leads (Anonymous inquiries)
INSERT INTO public.leads (id, ad_id, user_id, message, contact_info, created_at) VALUES
('50505050-5050-5050-5050-505050505050', '10101010-1010-1010-1010-101010101010', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e1', 'Do you ship to military APO addresses?', 'APO box details provided: militarypost@usa.mil', NOW() - INTERVAL '2 hours'),
('60606060-6060-6060-6060-606060606060', '10101010-1010-1010-1010-101010101010', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e5', 'Do you offer catering options for local veteran events?', 'None provided (stayed anonymous)', NOW() - INTERVAL '1 day'),
('70707070-7070-7070-7070-707070707070', '30303030-3030-3030-3030-303030303030', 'a0e0a0e0-a0e0-a0e0-a0e0-a0e0a0e0a0e2', 'Are the harvest bowls allergen-free (peanut allergy)?', 'info-request@healthyliving.com', NOW() - INTERVAL '3 hours');
