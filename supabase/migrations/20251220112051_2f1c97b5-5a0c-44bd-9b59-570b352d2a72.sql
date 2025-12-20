-- Create table for public recent analyses (shared across all users)
CREATE TABLE public.public_recent_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  username TEXT,
  profile_image TEXT,
  smart_score INTEGER NOT NULL,
  sharpe_ratio NUMERIC(10, 2) NOT NULL,
  copy_suitability TEXT NOT NULL CHECK (copy_suitability IN ('Low', 'Medium', 'High')),
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_address UNIQUE (address)
);

-- Enable Row Level Security
ALTER TABLE public.public_recent_analyses ENABLE ROW LEVEL SECURITY;

-- Everyone can view public analyses
CREATE POLICY "Anyone can view public analyses"
ON public.public_recent_analyses
FOR SELECT
USING (true);

-- Anyone can insert (unauthenticated access for public tracking)
CREATE POLICY "Anyone can insert public analyses"
ON public.public_recent_analyses
FOR INSERT
WITH CHECK (true);

-- Anyone can update existing entries (for deduplication)
CREATE POLICY "Anyone can update public analyses"
ON public.public_recent_analyses
FOR UPDATE
USING (true);

-- Create index for faster ordering by analyzed_at
CREATE INDEX idx_public_recent_analyses_analyzed_at ON public.public_recent_analyses (analyzed_at DESC);

-- Create index for address lookups
CREATE INDEX idx_public_recent_analyses_address ON public.public_recent_analyses (address);