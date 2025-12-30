-- Create the update function first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create copy_settings table for per user+trader settings
CREATE TABLE public.copy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trader_address TEXT NOT NULL,
  
  -- Entry sizing fields
  allocated_funds NUMERIC NOT NULL DEFAULT 100,
  trade_size_percent NUMERIC NOT NULL DEFAULT 10,
  copy_percentage NUMERIC NOT NULL DEFAULT 10,
  
  -- Exit mode: proportional, mirror, manual
  exit_mode TEXT NOT NULL DEFAULT 'proportional',
  
  -- Advanced settings
  max_amount_per_market NUMERIC NOT NULL DEFAULT 500,
  min_amount_per_market NUMERIC NOT NULL DEFAULT 5,
  max_copy_amount_per_trade NUMERIC NOT NULL DEFAULT 50,
  min_volume_per_market NUMERIC NOT NULL DEFAULT 10000,
  min_liquidity_per_market NUMERIC NOT NULL DEFAULT 5000,
  market_price_range_min NUMERIC NOT NULL DEFAULT 5,
  market_price_range_max NUMERIC NOT NULL DEFAULT 95,
  entry_slippage_pct NUMERIC NOT NULL DEFAULT 2,
  exit_slippage_pct NUMERIC NOT NULL DEFAULT 4,
  max_time_until_resolution TEXT NOT NULL DEFAULT 'any',
  
  -- Auto-optimization
  is_auto_optimized BOOLEAN NOT NULL DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Unique constraint on user + trader
  UNIQUE(user_id, trader_address)
);

-- Enable RLS
ALTER TABLE public.copy_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own copy settings"
ON public.copy_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own copy settings"
ON public.copy_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own copy settings"
ON public.copy_settings
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own copy settings"
ON public.copy_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_copy_settings_updated_at
BEFORE UPDATE ON public.copy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();