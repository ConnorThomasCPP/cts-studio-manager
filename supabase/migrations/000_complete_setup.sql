-- ============================================================================
-- SSAM Complete Database Setup
-- ============================================================================
-- Run this file in Supabase SQL Editor to set up the entire database
-- This combines all migrations: schema, RLS policies, and functions
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: INITIAL SCHEMA
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'engineer', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'User profiles with role-based access control';

-- =============================================================================
-- LOCATIONS TABLE
-- =============================================================================
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.locations IS 'Physical locations for asset storage';

-- =============================================================================
-- CATEGORIES TABLE
-- =============================================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS 'Asset categories';

-- =============================================================================
-- ASSETS TABLE
-- =============================================================================
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (
    status IN ('available', 'checked_out', 'maintenance', 'missing')
  ),
  home_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  current_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.assets IS 'Studio equipment inventory';

-- =============================================================================
-- SESSIONS TABLE
-- =============================================================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  engineer TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (
    status IN ('planned', 'active', 'completed', 'cancelled')
  ),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.sessions IS 'Recording sessions';

-- =============================================================================
-- SESSION ASSETS TABLE
-- =============================================================================
CREATE TABLE public.session_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  checked_out_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_in_at TIMESTAMPTZ,
  check_out_condition TEXT CHECK (check_out_condition IN ('good', 'fair', 'damaged', 'needs_maintenance')),
  check_in_condition TEXT CHECK (check_in_condition IN ('good', 'fair', 'damaged', 'needs_maintenance')),
  notes TEXT,
  UNIQUE(session_id, asset_id)
);

COMMENT ON TABLE public.session_assets IS 'Tracks which assets are assigned to which sessions';

-- =============================================================================
-- TRANSACTIONS TABLE
-- =============================================================================
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (
    type IN ('check_out', 'check_in', 'status_change', 'created', 'updated')
  ),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  condition TEXT CHECK (condition IN ('good', 'fair', 'damaged', 'needs_maintenance')),
  from_status TEXT,
  to_status TEXT,
  from_location_id UUID REFERENCES public.locations(id),
  to_location_id UUID REFERENCES public.locations(id),
  note TEXT,
  metadata JSONB
);

COMMENT ON TABLE public.transactions IS 'Immutable audit log';

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_category ON public.assets(category_id);
CREATE INDEX idx_assets_asset_code ON public.assets(asset_code);
CREATE INDEX idx_assets_home_location ON public.assets(home_location_id);
CREATE INDEX idx_assets_current_location ON public.assets(current_location_id);
CREATE INDEX idx_assets_created_by ON public.assets(created_by);

CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_dates ON public.sessions(start_time, end_time);
CREATE INDEX idx_sessions_created_by ON public.sessions(created_by);

CREATE INDEX idx_session_assets_session ON public.session_assets(session_id);
CREATE INDEX idx_session_assets_asset ON public.session_assets(asset_id);
CREATE INDEX idx_session_assets_checked_in ON public.session_assets(checked_in_at) WHERE checked_in_at IS NULL;

CREATE INDEX idx_transactions_asset ON public.transactions(asset_id);
CREATE INDEX idx_transactions_session ON public.transactions(session_id);
CREATE INDEX idx_transactions_timestamp ON public.transactions(timestamp DESC);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SEED DATA
-- =============================================================================
INSERT INTO public.locations (name, description) VALUES
  ('Studio A', 'Main recording studio'),
  ('Studio B', 'Secondary studio'),
  ('Storage Room', 'Equipment storage'),
  ('Rack 1', 'Equipment rack in Studio A'),
  ('Rack 2', 'Equipment rack in Studio B');

INSERT INTO public.categories (name, color) VALUES
  ('Microphones', '#3b82f6'),
  ('Cables', '#10b981'),
  ('Instruments', '#f59e0b'),
  ('Preamps', '#8b5cf6'),
  ('Monitors', '#ec4899'),
  ('Accessories', '#6b7280');

-- ============================================================================
-- MIGRATION 002: RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Helper function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Users policies
CREATE POLICY "Users: Read all" ON public.users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users: Update own" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users: Admin insert" ON public.users FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Users: Admin delete" ON public.users FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Locations policies
CREATE POLICY "Locations: Read all" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Locations: Admin manage" ON public.locations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Categories policies
CREATE POLICY "Categories: Read all" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Categories: Admin manage" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Assets policies
CREATE POLICY "Assets: Read all" ON public.assets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Assets: Admin/Engineer insert" ON public.assets FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'engineer'))
);
CREATE POLICY "Assets: Admin/Engineer update" ON public.assets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'engineer'))
);
CREATE POLICY "Assets: Admin delete" ON public.assets FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Sessions policies
CREATE POLICY "Sessions: Read all" ON public.sessions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Sessions: Admin/Engineer insert" ON public.sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'engineer'))
);
CREATE POLICY "Sessions: Admin/Engineer update" ON public.sessions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'engineer'))
);
CREATE POLICY "Sessions: Admin delete" ON public.sessions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Session assets policies
CREATE POLICY "Session Assets: Read all" ON public.session_assets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Session Assets: Admin/Engineer manage" ON public.session_assets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'engineer'))
);

-- Transactions policies
CREATE POLICY "Transactions: Read all" ON public.transactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Transactions: Insert only" ON public.transactions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- MIGRATION 003: DATABASE FUNCTIONS
-- ============================================================================

-- Check out asset function
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
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  SELECT * INTO v_asset FROM public.assets WHERE id = p_asset_id FOR UPDATE;

  IF v_asset IS NULL THEN
    RAISE EXCEPTION 'Asset not found: %', p_asset_id;
  END IF;

  IF v_asset.status != 'available' THEN
    RAISE EXCEPTION 'Asset is not available (current status: %)', v_asset.status;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.sessions WHERE id = p_session_id AND status = 'active') THEN
    RAISE EXCEPTION 'Session must be active to check out assets';
  END IF;

  UPDATE public.assets SET status = 'checked_out', updated_at = NOW() WHERE id = p_asset_id;

  INSERT INTO public.session_assets (session_id, asset_id, check_out_condition, notes)
  VALUES (p_session_id, p_asset_id, p_condition, p_note) RETURNING id INTO v_session_asset_id;

  INSERT INTO public.transactions (asset_id, session_id, type, user_id, condition, from_status, to_status, note, metadata)
  VALUES (p_asset_id, p_session_id, 'check_out', p_user_id, p_condition, 'available', 'checked_out', p_note,
    jsonb_build_object('session_asset_id', v_session_asset_id, 'asset_code', v_asset.asset_code, 'asset_name', v_asset.name))
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check in asset function
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
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  SELECT * INTO v_asset FROM public.assets WHERE id = p_asset_id FOR UPDATE;

  IF v_asset IS NULL THEN
    RAISE EXCEPTION 'Asset not found: %', p_asset_id;
  END IF;

  IF v_asset.status != 'checked_out' THEN
    RAISE EXCEPTION 'Asset is not checked out (current status: %)', v_asset.status;
  END IF;

  v_new_status := CASE
    WHEN p_condition IN ('damaged', 'needs_maintenance') THEN 'maintenance'
    ELSE 'available'
  END;

  UPDATE public.assets SET status = v_new_status, current_location_id = home_location_id, updated_at = NOW()
  WHERE id = p_asset_id;

  IF p_session_id IS NOT NULL THEN
    UPDATE public.session_assets SET checked_in_at = NOW(), check_in_condition = p_condition
    WHERE session_id = p_session_id AND asset_id = p_asset_id AND checked_in_at IS NULL;
    v_session_asset_updated := FOUND;
  END IF;

  INSERT INTO public.transactions (asset_id, session_id, type, user_id, condition, from_status, to_status, note, metadata)
  VALUES (p_asset_id, p_session_id, 'check_in', p_user_id, p_condition, 'checked_out', v_new_status, p_note,
    jsonb_build_object('asset_code', v_asset.asset_code, 'asset_name', v_asset.name, 'session_asset_updated', v_session_asset_updated))
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Can complete session function
CREATE OR REPLACE FUNCTION public.can_complete_session(p_session_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_unreturned_count INTEGER;
  v_unreturned_assets JSONB;
BEGIN
  SELECT COUNT(*) INTO v_unreturned_count
  FROM public.session_assets WHERE session_id = p_session_id AND checked_in_at IS NULL;

  IF v_unreturned_count > 0 THEN
    SELECT jsonb_agg(jsonb_build_object(
      'asset_id', sa.asset_id, 'asset_code', a.asset_code,
      'asset_name', a.name, 'checked_out_at', sa.checked_out_at
    )) INTO v_unreturned_assets
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

  RETURN jsonb_build_object('can_complete', true, 'unreturned_count', 0, 'message', 'All assets returned');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate asset code function
CREATE OR REPLACE FUNCTION public.generate_asset_code(p_category_name TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_number INTEGER;
  v_code TEXT;
BEGIN
  v_prefix := COALESCE(
    CASE p_category_name
      WHEN 'Microphones' THEN 'MIC'
      WHEN 'Cables' THEN 'CBL'
      WHEN 'Instruments' THEN 'INS'
      WHEN 'Preamps' THEN 'PRE'
      WHEN 'Monitors' THEN 'MON'
      WHEN 'Accessories' THEN 'ACC'
      ELSE 'AST'
    END, 'AST'
  );

  SELECT COALESCE(MAX(
    CASE
      WHEN asset_code ~ ('^' || v_prefix || '-[0-9]{5}$')
      THEN CAST(SUBSTRING(asset_code FROM length(v_prefix) + 2) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1 INTO v_number
  FROM public.assets WHERE asset_code LIKE v_prefix || '-%';

  v_code := v_prefix || '-' || LPAD(v_number::TEXT, 5, '0');
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- Get asset history function
CREATE OR REPLACE FUNCTION public.get_asset_history(p_asset_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  transaction_id UUID, type TEXT, created_at TIMESTAMPTZ, user_name TEXT,
  session_name TEXT, from_status TEXT, to_status TEXT, condition TEXT, note TEXT, metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT t.id, t.type, t.timestamp, u.name, s.session_name,
    t.from_status, t.to_status, t.condition, t.note, t.metadata
  FROM public.transactions t
  LEFT JOIN public.users u ON u.id = t.user_id
  LEFT JOIN public.sessions s ON s.id = t.session_id
  WHERE t.asset_id = p_asset_id
  ORDER BY t.timestamp DESC LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get active session assets function
CREATE OR REPLACE FUNCTION public.get_active_session_assets(p_session_id UUID)
RETURNS TABLE (
  asset_id UUID, asset_code TEXT, asset_name TEXT, brand TEXT, model TEXT,
  checked_out_at TIMESTAMPTZ, check_out_condition TEXT,
  checked_in_at TIMESTAMPTZ, check_in_condition TEXT, notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT sa.asset_id, a.asset_code, a.name, a.brand, a.model,
    sa.checked_out_at, sa.check_out_condition,
    sa.checked_in_at, sa.check_in_condition, sa.notes
  FROM public.session_assets sa
  JOIN public.assets a ON a.id = sa.asset_id
  WHERE sa.session_id = p_session_id
  ORDER BY sa.checked_out_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STORAGE BUCKET SETUP (Run this separately in Supabase Storage)
-- ============================================================================

-- Instructions:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a new bucket called 'asset-photos' and make it public
-- 3. Then run these policies in the SQL Editor:

/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('asset-photos', 'asset-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Asset photos: Upload" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'asset-photos');

CREATE POLICY "Asset photos: Update" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'asset-photos');

CREATE POLICY "Asset photos: Public read" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'asset-photos');

CREATE POLICY "Asset photos: Admin delete" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'asset-photos' AND
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);
*/

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- Next step: Create your first user
-- 1. Sign up through the app
-- 2. Get your user ID from Authentication > Users
-- 3. Run: INSERT INTO public.users (id, name, role) VALUES ('your-uuid', 'Your Name', 'admin');
-- ============================================================================
