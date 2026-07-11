-- Migration 005: Create contact_messages table
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  brand TEXT,
  message TEXT NOT NULL,
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to submit contact messages (inserts only)
DROP POLICY IF EXISTS "Allow anonymous insert" ON public.contact_messages;
CREATE POLICY "Allow anonymous insert" ON public.contact_messages
  FOR INSERT WITH CHECK (true);

-- Policy: Allow admins to read contact messages
DROP POLICY IF EXISTS "Allow admin select" ON public.contact_messages;
CREATE POLICY "Allow admin select" ON public.contact_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
  );
