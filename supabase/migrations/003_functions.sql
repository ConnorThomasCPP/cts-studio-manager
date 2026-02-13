-- Studio Session Asset Manager (SSAM) - Database Functions
-- Migration 003: Functions for Asset Check-Out/Check-In Operations

-- =============================================================================
-- CHECK OUT ASSET FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_out_asset(
  p_asset_id UUID,
  p_session_id UUID,
  p_user_id UUID DEFAULT auth.uid(),
  p_condition TEXT DEFAULT 'good',
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_asset RECORD;
  v_transaction_id UUID;
  v_session_asset_id UUID;
BEGIN
  -- Validate user
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Lock and get asset
  SELECT * INTO v_asset
  FROM public.assets
  WHERE id = p_asset_id
  FOR UPDATE;

  -- Check if asset exists
  IF v_asset IS NULL THEN
    RAISE EXCEPTION 'Asset not found: %', p_asset_id;
  END IF;

  -- Validate asset is available
  IF v_asset.status != 'available' THEN
    RAISE EXCEPTION 'Asset is not available (current status: %)', v_asset.status;
  END IF;

  -- Validate session exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.sessions
    WHERE id = p_session_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Session must be active to check out assets';
  END IF;

  -- Update asset status
  UPDATE public.assets
  SET
    status = 'checked_out',
    updated_at = NOW()
  WHERE id = p_asset_id;

  -- Create session asset record
  INSERT INTO public.session_assets (
    session_id,
    asset_id,
    check_out_condition,
    notes
  ) VALUES (
    p_session_id,
    p_asset_id,
    p_condition,
    p_note
  )
  RETURNING id INTO v_session_asset_id;

  -- Log transaction
  INSERT INTO public.transactions (
    asset_id,
    session_id,
    type,
    user_id,
    condition,
    from_status,
    to_status,
    note,
    metadata
  ) VALUES (
    p_asset_id,
    p_session_id,
    'check_out',
    p_user_id,
    p_condition,
    'available',
    'checked_out',
    p_note,
    jsonb_build_object(
      'session_asset_id', v_session_asset_id,
      'asset_code', v_asset.asset_code,
      'asset_name', v_asset.name
    )
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'session_asset_id', v_session_asset_id,
    'asset_id', p_asset_id,
    'asset_code', v_asset.asset_code,
    'asset_name', v_asset.name,
    'new_status', 'checked_out'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Check-out failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_out_asset IS 'Atomically check out an asset to a session with transaction logging';

-- =============================================================================
-- CHECK IN ASSET FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_in_asset(
  p_asset_id UUID,
  p_session_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT auth.uid(),
  p_condition TEXT DEFAULT 'good',
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_asset RECORD;
  v_transaction_id UUID;
  v_new_status TEXT;
  v_session_asset_updated BOOLEAN := false;
BEGIN
  -- Validate user
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Lock and get asset
  SELECT * INTO v_asset
  FROM public.assets
  WHERE id = p_asset_id
  FOR UPDATE;

  -- Check if asset exists
  IF v_asset IS NULL THEN
    RAISE EXCEPTION 'Asset not found: %', p_asset_id;
  END IF;

  -- Validate asset is checked out
  IF v_asset.status != 'checked_out' THEN
    RAISE EXCEPTION 'Asset is not checked out (current status: %)', v_asset.status;
  END IF;

  -- Determine new status based on condition
  v_new_status := CASE
    WHEN p_condition IN ('damaged', 'needs_maintenance') THEN 'maintenance'
    ELSE 'available'
  END;

  -- Update asset status and return to home location
  UPDATE public.assets
  SET
    status = v_new_status,
    current_location_id = home_location_id,
    updated_at = NOW()
  WHERE id = p_asset_id;

  -- Update session asset record if session provided
  IF p_session_id IS NOT NULL THEN
    UPDATE public.session_assets
    SET
      checked_in_at = NOW(),
      check_in_condition = p_condition
    WHERE
      session_id = p_session_id
      AND asset_id = p_asset_id
      AND checked_in_at IS NULL;

    v_session_asset_updated := FOUND;
  END IF;

  -- Log transaction
  INSERT INTO public.transactions (
    asset_id,
    session_id,
    type,
    user_id,
    condition,
    from_status,
    to_status,
    note,
    metadata
  ) VALUES (
    p_asset_id,
    p_session_id,
    'check_in',
    p_user_id,
    p_condition,
    'checked_out',
    v_new_status,
    p_note,
    jsonb_build_object(
      'asset_code', v_asset.asset_code,
      'asset_name', v_asset.name,
      'session_asset_updated', v_session_asset_updated
    )
  )
  RETURNING id INTO v_transaction_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', v_transaction_id,
    'asset_id', p_asset_id,
    'asset_code', v_asset.asset_code,
    'asset_name', v_asset.name,
    'new_status', v_new_status,
    'needs_maintenance', v_new_status = 'maintenance'
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Check-in failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_in_asset IS 'Atomically check in an asset (optionally from a session) with condition assessment and transaction logging';

-- =============================================================================
-- GET ACTIVE SESSION ASSETS FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_active_session_assets(p_session_id UUID)
RETURNS TABLE (
  asset_id UUID,
  asset_code TEXT,
  asset_name TEXT,
  brand TEXT,
  model TEXT,
  checked_out_at TIMESTAMPTZ,
  check_out_condition TEXT,
  checked_in_at TIMESTAMPTZ,
  check_in_condition TEXT,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sa.asset_id,
    a.asset_code,
    a.name AS asset_name,
    a.brand,
    a.model,
    sa.checked_out_at,
    sa.check_out_condition,
    sa.checked_in_at,
    sa.check_in_condition,
    sa.notes
  FROM public.session_assets sa
  JOIN public.assets a ON a.id = sa.asset_id
  WHERE sa.session_id = p_session_id
  ORDER BY sa.checked_out_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_active_session_assets IS 'Get all assets assigned to a session with their check-out/in details';

-- =============================================================================
-- CHECK SESSION COMPLETION FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.can_complete_session(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_unreturned_count INTEGER;
  v_unreturned_assets JSONB;
BEGIN
  -- Count unreturned assets
  SELECT COUNT(*) INTO v_unreturned_count
  FROM public.session_assets
  WHERE session_id = p_session_id AND checked_in_at IS NULL;

  -- If there are unreturned assets, get their details
  IF v_unreturned_count > 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'asset_id', sa.asset_id,
        'asset_code', a.asset_code,
        'asset_name', a.name,
        'checked_out_at', sa.checked_out_at
      )
    )
    INTO v_unreturned_assets
    FROM public.session_assets sa
    JOIN public.assets a ON a.id = sa.asset_id
    WHERE sa.session_id = p_session_id AND sa.checked_in_at IS NULL;

    RETURN jsonb_build_object(
      'can_complete', false,
      'unreturned_count', v_unreturned_count,
      'unreturned_assets', v_unreturned_assets,
      'message', format('%s asset(s) still checked out', v_unreturned_count)
    );
  END IF;

  RETURN jsonb_build_object(
    'can_complete', true,
    'unreturned_count', 0,
    'message', 'All assets returned'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_complete_session IS 'Check if a session can be completed (all assets returned)';

-- =============================================================================
-- AUTO-GENERATE ASSET CODE FUNCTION
-- =============================================================================

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

COMMENT ON FUNCTION public.generate_asset_code IS 'Auto-generate unique asset code based on category (e.g., MIC-00001)';

-- =============================================================================
-- GET ASSET TRANSACTION HISTORY
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_asset_history(p_asset_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  transaction_id UUID,
  type TEXT,
  timestamp TIMESTAMPTZ,
  user_name TEXT,
  session_name TEXT,
  from_status TEXT,
  to_status TEXT,
  condition TEXT,
  note TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id AS transaction_id,
    t.type,
    t.timestamp,
    u.name AS user_name,
    s.session_name,
    t.from_status,
    t.to_status,
    t.condition,
    t.note,
    t.metadata
  FROM public.transactions t
  LEFT JOIN public.users u ON u.id = t.user_id
  LEFT JOIN public.sessions s ON s.id = t.session_id
  WHERE t.asset_id = p_asset_id
  ORDER BY t.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_asset_history IS 'Get transaction history for a specific asset';
