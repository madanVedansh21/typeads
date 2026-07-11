-- Migration 006: Create advertiser_inquiries table
CREATE TABLE IF NOT EXISTS public.advertiser_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  budget TEXT,
  brief TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.advertiser_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to submit advertiser inquiries (inserts only)
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.advertiser_inquiries;
CREATE POLICY "Allow anonymous insert" ON public.advertiser_inquiries
  FOR INSERT WITH CHECK (true);

-- Policy: Allow admins to read advertiser inquiries
DROP POLICY IF EXISTS "Allow admin select" ON public.advertiser_inquiries;
CREATE POLICY "Allow admin select" ON public.advertiser_inquiries
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
