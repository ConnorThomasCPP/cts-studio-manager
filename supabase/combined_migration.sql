-- =============================================================================
-- COMBINED MIGRATION: STEM PLAYER TABLES (008 + 009)
-- =============================================================================
-- Run this entire script in your Supabase SQL Editor
-- Creates: clients, projects, tracks, stems, stem_comments tables
-- Adds: icon field to stems
-- =============================================================================

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON public.clients(created_by);

COMMENT ON TABLE public.clients IS 'Studio clients who commission projects';

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('planning', 'active', 'review', 'completed', 'archived')
  ),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_projects_client ON public.projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);

COMMENT ON TABLE public.projects IS 'Client projects containing multiple tracks';

-- =============================================================================
-- TRACKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tracks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  bpm NUMERIC(6,2), -- Beats per minute
  key TEXT, -- Musical key (e.g., "C Major")
  duration NUMERIC(10,2), -- Duration in seconds
  waveform_data JSONB, -- Cached waveform peaks for visualization
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_tracks_project ON public.tracks(project_id);
CREATE INDEX IF NOT EXISTS idx_tracks_created_by ON public.tracks(created_by);

COMMENT ON TABLE public.tracks IS 'Audio tracks within projects, composed of multiple stems';
COMMENT ON COLUMN public.tracks.waveform_data IS 'Pre-computed waveform peaks for fast rendering';

-- =============================================================================
-- STEMS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.stems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('vocals', 'drums', 'bass', 'guitar', 'keys', 'synth', 'fx', 'other')),
  color TEXT DEFAULT '#999999', -- Hex color for UI display
  icon TEXT DEFAULT 'music', -- Icon name for UI display (from migration 009)
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_size BIGINT, -- File size in bytes
  mime_type TEXT, -- e.g., 'audio/wav', 'audio/mpeg'
  duration NUMERIC(10,2), -- Duration in seconds
  waveform_data JSONB, -- Cached waveform peaks
  sort_order INTEGER DEFAULT 0, -- Display order
  download_count INTEGER DEFAULT 0, -- Track downloads for analytics
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_stems_track ON public.stems(track_id);
CREATE INDEX IF NOT EXISTS idx_stems_sort_order ON public.stems(track_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_stems_created_by ON public.stems(created_by);

COMMENT ON TABLE public.stems IS 'Individual instrument/vocal stems that compose a track';
COMMENT ON COLUMN public.stems.color IS 'Hex color for waveform visualization and UI elements';
COMMENT ON COLUMN public.stems.icon IS 'Icon name for UI display';
COMMENT ON COLUMN public.stems.waveform_data IS 'Pre-computed waveform peaks for fast rendering';
COMMENT ON COLUMN public.stems.sort_order IS 'Display order in player UI (0 = top)';

-- =============================================================================
-- STEM COMMENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.stem_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stem_id UUID NOT NULL REFERENCES public.stems(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  timestamp NUMERIC(10,2) NOT NULL, -- Timestamp in seconds within the audio
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stem_comments_stem ON public.stem_comments(stem_id);
CREATE INDEX IF NOT EXISTS idx_stem_comments_user ON public.stem_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_stem_comments_timestamp ON public.stem_comments(stem_id, timestamp);

COMMENT ON TABLE public.stem_comments IS 'Time-stamped comments on specific stems for feedback';
COMMENT ON COLUMN public.stem_comments.timestamp IS 'Position in seconds where the comment was made';

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tracks_updated_at ON public.tracks;
CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stems_updated_at ON public.stems;
CREATE TRIGGER update_stems_updated_at
  BEFORE UPDATE ON public.stems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_comments ENABLE ROW LEVEL SECURITY;

-- Clients policies
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Engineers and admins can create clients" ON public.clients;
CREATE POLICY "Engineers and admins can create clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

DROP POLICY IF EXISTS "Engineers and admins can update clients" ON public.clients;
CREATE POLICY "Engineers and admins can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;
CREATE POLICY "Admins can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Projects policies
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
CREATE POLICY "Authenticated users can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Engineers and admins can create projects" ON public.projects;
CREATE POLICY "Engineers and admins can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

DROP POLICY IF EXISTS "Engineers and admins can update projects" ON public.projects;
CREATE POLICY "Engineers and admins can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;
CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tracks policies
DROP POLICY IF EXISTS "Authenticated users can view tracks" ON public.tracks;
CREATE POLICY "Authenticated users can view tracks"
  ON public.tracks FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Engineers and admins can create tracks" ON public.tracks;
CREATE POLICY "Engineers and admins can create tracks"
  ON public.tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

DROP POLICY IF EXISTS "Engineers and admins can update tracks" ON public.tracks;
CREATE POLICY "Engineers and admins can update tracks"
  ON public.tracks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

DROP POLICY IF EXISTS "Admins can delete tracks" ON public.tracks;
CREATE POLICY "Admins can delete tracks"
  ON public.tracks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Stems policies
DROP POLICY IF EXISTS "Authenticated users can view stems" ON public.stems;
CREATE POLICY "Authenticated users can view stems"
  ON public.stems FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Engineers and admins can create stems" ON public.stems;
CREATE POLICY "Engineers and admins can create stems"
  ON public.stems FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

DROP POLICY IF EXISTS "Engineers and admins can update stems" ON public.stems;
CREATE POLICY "Engineers and admins can update stems"
  ON public.stems FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

DROP POLICY IF EXISTS "Admins can delete stems" ON public.stems;
CREATE POLICY "Admins can delete stems"
  ON public.stems FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Stem comments policies
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.stem_comments;
CREATE POLICY "Authenticated users can view comments"
  ON public.stem_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.stem_comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.stem_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.stem_comments;
CREATE POLICY "Users can update their own comments"
  ON public.stem_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments, admins can delete any" ON public.stem_comments;
CREATE POLICY "Users can delete their own comments, admins can delete any"
  ON public.stem_comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get all stems for a track with comment counts
DROP FUNCTION IF EXISTS get_track_stems_with_comments(UUID);
CREATE OR REPLACE FUNCTION get_track_stems_with_comments(track_uuid UUID)
RETURNS TABLE (
  id UUID,
  track_id UUID,
  name TEXT,
  type TEXT,
  color TEXT,
  icon TEXT,
  file_path TEXT,
  file_size BIGINT,
  mime_type TEXT,
  duration NUMERIC,
  waveform_data JSONB,
  sort_order INTEGER,
  download_count INTEGER,
  comment_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  created_by UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.track_id,
    s.name,
    s.type,
    s.color,
    s.icon,
    s.file_path,
    s.file_size,
    s.mime_type,
    s.duration,
    s.waveform_data,
    s.sort_order,
    s.download_count,
    COUNT(sc.id) as comment_count,
    s.created_at,
    s.updated_at,
    s.created_by
  FROM public.stems s
  LEFT JOIN public.stem_comments sc ON s.id = sc.stem_id
  WHERE s.track_id = track_uuid
  GROUP BY s.id, s.track_id, s.name, s.type, s.color, s.icon, s.file_path,
           s.file_size, s.mime_type, s.duration, s.waveform_data, s.sort_order,
           s.download_count, s.created_at, s.updated_at, s.created_by
  ORDER BY s.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment stem download count
DROP FUNCTION IF EXISTS increment_stem_download(UUID);
CREATE OR REPLACE FUNCTION increment_stem_download(stem_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.stems
  SET download_count = download_count + 1
  WHERE id = stem_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set default icons based on stem type (from migration 009)
UPDATE public.stems
SET icon = CASE
  WHEN type = 'vocals' THEN 'mic'
  WHEN type = 'drums' THEN 'circle'
  WHEN type = 'bass' THEN 'waves'
  WHEN type = 'guitar' THEN 'music2'
  WHEN type = 'keys' THEN 'music3'
  WHEN type = 'synth' THEN 'audio-waveform'
  WHEN type = 'fx' THEN 'sparkles'
  ELSE 'music'
END
WHERE icon IS NULL OR icon = 'music';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- You should see "Success. No rows returned" or similar
-- Next step: Create the audio-stems storage bucket in Supabase Storage
-- =============================================================================
