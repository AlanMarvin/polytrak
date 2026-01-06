-- Create trader analysis cache table for progressive loading
CREATE TABLE public.trader_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT NOT NULL,
  stage TEXT NOT NULL,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(address, stage)
);

-- Create index for fast lookups by address and stage
CREATE INDEX idx_trader_cache_lookup ON public.trader_analysis_cache(address, stage);

-- Create index for cache cleanup (TTL-based expiration)
CREATE INDEX idx_trader_cache_updated ON public.trader_analysis_cache(updated_at);

-- Enable RLS (table only accessed by edge function with service role key)
ALTER TABLE public.trader_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Add documentation comment
COMMENT ON TABLE public.trader_analysis_cache IS 'Cache for staged trader analysis data. TTL: 5 minutes.';