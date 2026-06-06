-- Insert dummy ads to populate the local database feed

-- A few 'social' format ads
INSERT INTO public.ads (id, category, format_type, advertiser_name, advertiser_avatar, headline, content_text, media_url, media_type, primary_color, cta_label, cta_url, likes, shares, latitude, longitude, owner_id) VALUES
('11111111-1111-1111-1111-111111111111', 'Food', 'social', 'Burger Queen', 'BQ', 'The New Mega Burger is Here!', 'Try our new triple patty burger with special sauce. Available for a limited time only.', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80', 'image', '#ff0000', 'Order Now', 'https://example.com/order', 145, 23, 34.0195, -118.4912, '00000000-0000-0000-0000-000000000001'), -- Santa Monica (local)
('44444444-4444-4444-4444-444444444444', 'Fashion', 'social', 'Urban Outfitters', 'UO', 'Summer Collection Drop', 'Discover the newest trends for the hot season. Stay cool, stay stylish.', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80', 'image', '#ff6600', 'Explore', 'https://example.com/explore', 567, 89, 37.7749, -122.4194, '00000000-0000-0000-0000-000000000001'); -- SF (far)

-- A few 'native' format ads
INSERT INTO public.ads (id, category, format_type, advertiser_name, advertiser_avatar, headline, content_text, media_url, media_type, primary_color, cta_label, cta_url, likes, shares, latitude, longitude, owner_id) VALUES
('22222222-2222-2222-2222-222222222222', 'Tech', 'native', 'TechCorp', 'TC', 'Upgrade your workstation', 'Get the latest ergonomic keyboards and mice. Improve your productivity instantly.', 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=800&q=80', 'image', '#0044ff', 'Shop Now', 'https://example.com/shop', 89, 12, 32.7157, -117.1611, '00000000-0000-0000-0000-000000000001'), -- San Diego (far)
('55555555-5555-5555-5555-555555555555', 'Local', 'native', 'Joe''s Coffee', 'JC', 'Your Morning Fix, Sorted.', 'Locally roasted beans. Come grab a cup and start your day right.', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&q=80', 'image', '#6f4e37', 'Get Directions', 'https://example.com/coffee', 210, 15, 34.0489, -118.2568, '00000000-0000-0000-0000-000000000001'); -- Downtown LA (very local)

-- A few 'carousel' format ads
INSERT INTO public.ads (id, category, format_type, advertiser_name, advertiser_avatar, headline, content_text, media_url, media_type, primary_color, cta_label, cta_url, likes, shares, latitude, longitude, owner_id) VALUES
('33333333-3333-3333-3333-333333333333', 'Fitness', 'carousel', 'FitLife Gym', 'FL', 'Join the Summer Challenge', 'Get in shape this summer with our 6-week intensive bootcamp.', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80', 'image', '#00cc00', 'Sign Up', 'https://example.com/signup', 342, 56, 34.1478, -118.1445, '00000000-0000-0000-0000-000000000001'); -- Pasadena (local)

-- Seed some initial user preferences for our dummy user "RJ"
INSERT INTO public.user_preferences (user_id, category) VALUES
('00000000-0000-0000-0000-000000000001', 'Food'),
('00000000-0000-0000-0000-000000000001', 'Tech'),
('00000000-0000-0000-0000-000000000001', 'Local');

-- Seed some dummy engagements
INSERT INTO public.engagements (user_id, ad_id, engagement_type) VALUES
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'view'),
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'click'),
('00000000-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'view');

-- Seed dummy reward history
INSERT INTO public.reward_history (user_id, action, points) VALUES
('00000000-0000-0000-0000-000000000001', 'Viewed TechGear Pro Ad', 1),
('00000000-0000-0000-0000-000000000001', 'Saved Urban Eat Offer', 2),
('00000000-0000-0000-0000-000000000001', 'Clicked TravelGo CTA', 5),
('00000000-0000-0000-0000-000000000001', 'Redeemed $5 Coffee Card', -500);
