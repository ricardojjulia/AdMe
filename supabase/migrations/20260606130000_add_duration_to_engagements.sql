-- Migration to add view_duration_seconds column to engagements table for advertiser analytics
ALTER TABLE public.engagements ADD COLUMN IF NOT EXISTS view_duration_seconds NUMERIC DEFAULT 0;
