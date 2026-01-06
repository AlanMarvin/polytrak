-- Server-side cache for public Polymarket-derived analytics (used by edge functions)
CREATE TABLE IF NOT EXISTS public.trader_analysis_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  address TEXT NOT NULL,
  stage TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(address, stage)
);

-- Enable RLS (no policies) to prevent direct client access; edge functions should use service role.
ALTER TABLE public.trader_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Helpful indexes for TTL checks and lookups.
CREATE INDEX IF NOT EXISTS trader_analysis_cache_updated_at_idx
ON public.trader_analysis_cache (updated_at);

-- updated_at trigger
CREATE TRIGGER update_trader_analysis_cache_updated_at
BEFORE UPDATE ON public.trader_analysis_cache
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

