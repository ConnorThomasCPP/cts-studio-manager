-- Update asset code generation to support Camera category
-- Migration 005: Add Camera → CAM prefix mapping

CREATE OR REPLACE FUNCTION public.generate_asset_code(p_category_name TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_number INTEGER;
  v_code TEXT;
BEGIN
  -- Determine prefix from category (or use 'AST' as default)
  v_prefix := COALESCE(
    CASE p_category_name
      WHEN 'Microphones' THEN 'MIC'
      WHEN 'Cables' THEN 'CBL'
      WHEN 'Instruments' THEN 'INS'
      WHEN 'Preamps' THEN 'PRE'
      WHEN 'Monitors' THEN 'MON'
      WHEN 'Accessories' THEN 'ACC'
      WHEN 'Camera' THEN 'CAM'
      WHEN 'Cameras' THEN 'CAM'
      ELSE 'AST'
    END,
    'AST'
  );

  -- Find the next available number for this prefix
  SELECT COALESCE(MAX(
    CASE
      WHEN asset_code ~ ('^' || v_prefix || '-[0-9]{5}$')
      THEN CAST(SUBSTRING(asset_code FROM length(v_prefix) + 2) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO v_number
  FROM public.assets
  WHERE asset_code LIKE v_prefix || '-%';

  -- Format as PREFIX-00000
  v_code := v_prefix || '-' || LPAD(v_number::TEXT, 5, '0');

  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.generate_asset_code IS 'Auto-generate unique asset code based on category (e.g., MIC-00001, CAM-00001)';
