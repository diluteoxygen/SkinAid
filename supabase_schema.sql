-- Run this in your Supabase SQL Editor to set up the SkinAid database

-- 1. Create Sessions table
CREATE TABLE IF NOT EXISTS public.sessions (
  session_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  profile JSONB,
  severity_index INTEGER,
  marked_image_url TEXT
);

-- 2. Create Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  message_id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(session_id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  suggested_follow_ups JSONB,
  timestamp TIMESTAMPTZ NOT NULL
);

-- 3. Create Images table
CREATE TABLE IF NOT EXISTS public.images (
  image_id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(session_id) ON DELETE CASCADE,
  image_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL,
  width INTEGER,
  height INTEGER
);

-- 4. Create Prediction History table
CREATE TABLE IF NOT EXISTS public.prediction_history (
  prediction_id UUID PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(session_id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.images(image_id) ON DELETE CASCADE,
  top_k JSONB NOT NULL,
  confidence TEXT NOT NULL
);

-- 5. Set up Row Level Security (RLS)
-- We'll allow authenticated users (the admin) full access to these tables.
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for authenticated users to sessions" ON public.sessions FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for authenticated users to messages" ON public.messages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for authenticated users to images" ON public.images FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access for authenticated users to prediction_history" ON public.prediction_history FOR ALL USING (auth.role() = 'authenticated');

-- 6. Storage Setup
-- You need to manually create a storage bucket named "images" in the Supabase Dashboard.
-- After creating it, make it PUBLIC so frontend can read images directly.
