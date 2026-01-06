-- Add TradeFox-compatible slippage setting (single max slippage per market in cents)
ALTER TABLE public.copy_settings
ADD COLUMN IF NOT EXISTS max_slippage_cents INTEGER NOT NULL DEFAULT 4;

-- Backfill from legacy entry/exit slippage percent fields (conservative: use ceiling of exit)
UPDATE public.copy_settings
SET max_slippage_cents = GREATEST(1, CEIL(exit_slippage_pct))::INTEGER
WHERE max_slippage_cents IS NULL OR max_slippage_cents = 0;

