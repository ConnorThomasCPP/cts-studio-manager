-- Add pricing fields to assets table
-- Migration 006: Add purchase_value and replacement_cost

ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS purchase_value DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS replacement_cost DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS replacement_cost_updated_at TIMESTAMPTZ;

COMMENT ON COLUMN public.assets.purchase_value IS 'Original purchase price/value of the asset';
COMMENT ON COLUMN public.assets.replacement_cost IS 'Current estimated cost to replace this asset';
COMMENT ON COLUMN public.assets.replacement_cost_updated_at IS 'When the replacement cost was last updated';
