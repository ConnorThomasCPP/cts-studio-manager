-- Studio Session Asset Manager (SSAM) - Initial Schema
-- Migration 001: Tables, Indexes, and Triggers

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
-- Extends Supabase auth.users with app-specific fields
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'engineer', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'User profiles with role-based access control';
COMMENT ON COLUMN public.users.role IS 'admin: full access, engineer: manage assets/sessions, viewer: read-only';

-- =============================================================================
-- LOCATIONS TABLE
-- =============================================================================
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.locations IS 'Physical locations for asset storage (e.g., Studio A, Rack 1)';

-- =============================================================================
-- CATEGORIES TABLE
-- =============================================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  color TEXT, -- Hex color for UI display
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.categories IS 'Asset categories (e.g., Microphones, Cables, Instruments)';

-- =============================================================================
-- ASSETS TABLE
-- =============================================================================
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_code TEXT NOT NULL UNIQUE, -- Barcode value (Code 128)
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
  photo_url TEXT, -- Supabase Storage URL
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.assets IS 'Studio equipment inventory';
COMMENT ON COLUMN public.assets.asset_code IS 'Unique barcode identifier (Code 128 format)';
COMMENT ON COLUMN public.assets.status IS 'available: ready to use, checked_out: in use, maintenance: needs repair, missing: lost/stolen';
COMMENT ON COLUMN public.assets.home_location_id IS 'Default storage location';
COMMENT ON COLUMN public.assets.current_location_id IS 'Current physical location';

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

COMMENT ON TABLE public.sessions IS 'Recording sessions (hire contracts for equipment)';
COMMENT ON COLUMN public.sessions.status IS 'planned: scheduled, active: in progress, completed: finished, cancelled: not happening';

-- =============================================================================
-- SESSION ASSETS TABLE
-- =============================================================================
-- Junction table for session-asset assignments
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
COMMENT ON COLUMN public.session_assets.checked_out_at IS 'When asset was checked out';
COMMENT ON COLUMN public.session_assets.checked_in_at IS 'When asset was returned (NULL if still out)';

-- =============================================================================
-- TRANSACTIONS TABLE
-- =============================================================================
-- Immutable audit log of all asset movements and changes
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
  metadata JSONB -- Flexible field for additional context
);

COMMENT ON TABLE public.transactions IS 'Immutable audit log - never update or delete records';
COMMENT ON COLUMN public.transactions.type IS 'Action type: check_out, check_in, status_change, created, updated';
COMMENT ON COLUMN public.transactions.metadata IS 'Additional context (e.g., edited fields, reasons)';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Assets
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_category ON public.assets(category_id);
CREATE INDEX idx_assets_asset_code ON public.assets(asset_code); -- Fast barcode lookups
CREATE INDEX idx_assets_home_location ON public.assets(home_location_id);
CREATE INDEX idx_assets_current_location ON public.assets(current_location_id);
CREATE INDEX idx_assets_created_by ON public.assets(created_by);

-- Sessions
CREATE INDEX idx_sessions_status ON public.sessions(status);
CREATE INDEX idx_sessions_dates ON public.sessions(start_time, end_time);
CREATE INDEX idx_sessions_created_by ON public.sessions(created_by);

-- Session Assets
CREATE INDEX idx_session_assets_session ON public.session_assets(session_id);
CREATE INDEX idx_session_assets_asset ON public.session_assets(asset_id);
CREATE INDEX idx_session_assets_checked_in ON public.session_assets(checked_in_at) WHERE checked_in_at IS NULL; -- Active checkouts

-- Transactions
CREATE INDEX idx_transactions_asset ON public.transactions(asset_id);
CREATE INDEX idx_transactions_session ON public.transactions(session_id);
CREATE INDEX idx_transactions_timestamp ON public.transactions(timestamp DESC);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- SEED DATA
-- =============================================================================

-- Insert default locations
INSERT INTO public.locations (name, description) VALUES
  ('Studio A', 'Main recording studio'),
  ('Studio B', 'Secondary studio'),
  ('Storage Room', 'Equipment storage'),
  ('Rack 1', 'Equipment rack in Studio A'),
  ('Rack 2', 'Equipment rack in Studio B');

-- Insert default categories
INSERT INTO public.categories (name, color) VALUES
  ('Microphones', '#3b82f6'),      -- Blue
  ('Cables', '#10b981'),            -- Green
  ('Instruments', '#f59e0b'),       -- Orange
  ('Preamps', '#8b5cf6'),           -- Purple
  ('Monitors', '#ec4899'),          -- Pink
  ('Accessories', '#6b7280');       -- Gray
