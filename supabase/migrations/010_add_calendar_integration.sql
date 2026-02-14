-- Calendar Integration for CTS Studio Manager
-- Migration 010: Calendar connections, syncs, and session attendees

-- =============================================================================
-- ENABLE EXTENSIONS
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- CALENDAR CONNECTIONS TABLE
-- =============================================================================
-- Stores OAuth credentials and connection metadata per user

CREATE TABLE public.calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'microsoft', 'apple')),
  provider_account_id TEXT NOT NULL,
  provider_account_email TEXT NOT NULL,

  -- OAuth tokens (store encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Connection metadata
  calendar_id TEXT,
  calendar_name TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,

  -- Sync preferences
  auto_create_events BOOLEAN DEFAULT true,
  auto_import_events BOOLEAN DEFAULT false,
  sync_direction TEXT DEFAULT 'bidirectional' CHECK (
    sync_direction IN ('session_to_calendar', 'calendar_to_session', 'bidirectional')
  ),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One connection per provider per user
  UNIQUE(user_id, provider, provider_account_id)
);

COMMENT ON TABLE public.calendar_connections IS 'OAuth calendar connections per user';
COMMENT ON COLUMN public.calendar_connections.access_token IS 'OAuth access token - encrypt in production';
COMMENT ON COLUMN public.calendar_connections.refresh_token IS 'OAuth refresh token for renewing access';
COMMENT ON COLUMN public.calendar_connections.sync_direction IS 'Direction of sync: session_to_calendar, calendar_to_session, or bidirectional';
COMMENT ON COLUMN public.calendar_connections.auto_create_events IS 'Automatically create calendar events when sessions are created';
COMMENT ON COLUMN public.calendar_connections.auto_import_events IS 'Automatically import calendar events as sessions';

-- =============================================================================
-- CALENDAR SYNCS TABLE
-- =============================================================================
-- Tracks which sessions are synced to which calendar events

CREATE TABLE public.calendar_syncs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.calendar_connections(id) ON DELETE CASCADE,

  -- Calendar event details
  external_event_id TEXT NOT NULL,
  external_calendar_id TEXT NOT NULL,

  -- Sync metadata
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  session_updated_at TIMESTAMPTZ,
  event_updated_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'synced' CHECK (
    sync_status IN ('synced', 'pending', 'error', 'conflict')
  ),
  sync_error TEXT,

  -- Conflict resolution
  local_etag TEXT,
  remote_etag TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One sync per session per connection
  UNIQUE(session_id, connection_id)
);

COMMENT ON TABLE public.calendar_syncs IS 'Tracks session-to-calendar event synchronization';
COMMENT ON COLUMN public.calendar_syncs.sync_status IS 'synced: up to date, pending: needs sync, error: sync failed, conflict: both sides modified';
COMMENT ON COLUMN public.calendar_syncs.external_event_id IS 'Event ID from calendar provider (Google, Microsoft, etc.)';

-- =============================================================================
-- SESSION ATTENDEES TABLE
-- =============================================================================
-- Tracks which users are invited to sessions (for calendar invites)

CREATE TABLE public.session_attendees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_organizer BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One user per session (unique attendee)
  UNIQUE(session_id, user_id)
);

COMMENT ON TABLE public.session_attendees IS 'Tracks which users are invited to sessions for calendar integration';
COMMENT ON COLUMN public.session_attendees.is_organizer IS 'True if this user created/organizes the session';

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Calendar Connections
CREATE INDEX idx_calendar_connections_user ON public.calendar_connections(user_id);
CREATE INDEX idx_calendar_connections_provider ON public.calendar_connections(provider);
CREATE INDEX idx_calendar_connections_sync_enabled ON public.calendar_connections(sync_enabled) WHERE sync_enabled = true;

-- Calendar Syncs
CREATE INDEX idx_calendar_syncs_session ON public.calendar_syncs(session_id);
CREATE INDEX idx_calendar_syncs_connection ON public.calendar_syncs(connection_id);
CREATE INDEX idx_calendar_syncs_status ON public.calendar_syncs(sync_status);
CREATE INDEX idx_calendar_syncs_external_event ON public.calendar_syncs(external_event_id);

-- Session Attendees
CREATE INDEX idx_session_attendees_session ON public.session_attendees(session_id);
CREATE INDEX idx_session_attendees_user ON public.session_attendees(user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Update updated_at timestamp on calendar_connections
CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON public.calendar_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at timestamp on calendar_syncs
CREATE TRIGGER update_calendar_syncs_updated_at
  BEFORE UPDATE ON public.calendar_syncs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS POLICIES
-- =============================================================================

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attendees ENABLE ROW LEVEL SECURITY;

-- ===== CALENDAR CONNECTIONS POLICIES =====

-- Users can view their own calendar connections
CREATE POLICY "Users can view own calendar connections"
  ON public.calendar_connections
  FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own calendar connections
CREATE POLICY "Users can create own calendar connections"
  ON public.calendar_connections
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own calendar connections
CREATE POLICY "Users can update own calendar connections"
  ON public.calendar_connections
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own calendar connections
CREATE POLICY "Users can delete own calendar connections"
  ON public.calendar_connections
  FOR DELETE
  USING (user_id = auth.uid());

-- ===== CALENDAR SYNCS POLICIES =====

-- Users can view syncs for their own connections
CREATE POLICY "Users can view own calendar syncs"
  ON public.calendar_syncs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_connections
      WHERE id = calendar_syncs.connection_id
      AND user_id = auth.uid()
    )
  );

-- Users can create syncs for their own connections
CREATE POLICY "Users can create calendar syncs"
  ON public.calendar_syncs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.calendar_connections
      WHERE id = calendar_syncs.connection_id
      AND user_id = auth.uid()
    )
  );

-- Users can update syncs for their own connections
CREATE POLICY "Users can update calendar syncs"
  ON public.calendar_syncs
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_connections
      WHERE id = calendar_syncs.connection_id
      AND user_id = auth.uid()
    )
  );

-- Users can delete syncs for their own connections
CREATE POLICY "Users can delete calendar syncs"
  ON public.calendar_syncs
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.calendar_connections
      WHERE id = calendar_syncs.connection_id
      AND user_id = auth.uid()
    )
  );

-- ===== SESSION ATTENDEES POLICIES =====

-- Users can view attendees for sessions they have access to
CREATE POLICY "Users can view session attendees"
  ON public.session_attendees
  FOR SELECT
  USING (true); -- All authenticated users can see session attendees

-- Session creators (engineers/admins) can add attendees
CREATE POLICY "Users can add session attendees"
  ON public.session_attendees
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('engineer', 'admin')
    )
  );

-- Session creators can remove attendees
CREATE POLICY "Users can remove session attendees"
  ON public.session_attendees
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE id = session_attendees.session_id
      AND created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get user email for calendar invites
CREATE OR REPLACE FUNCTION get_user_emails_for_session(p_session_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  name TEXT,
  is_organizer BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    COALESCE(u.name, u.email) as name,
    sa.is_organizer
  FROM public.session_attendees sa
  JOIN public.users u ON u.id = sa.user_id
  WHERE sa.session_id = p_session_id
  ORDER BY sa.is_organizer DESC, u.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_emails_for_session IS 'Helper function to fetch attendee emails for calendar events';
