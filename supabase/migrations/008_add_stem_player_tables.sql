-- =============================================================================
-- STEM PLAYER TABLES MIGRATION
-- =============================================================================
-- Creates tables for client/project/track hierarchy and stem player functionality
-- Includes: clients, projects, tracks, stems, stem_comments

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

CREATE INDEX idx_clients_name ON public.clients(name);
CREATE INDEX idx_clients_created_by ON public.clients(created_by);

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

CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_projects_created_by ON public.projects(created_by);

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

CREATE INDEX idx_tracks_project ON public.tracks(project_id);
CREATE INDEX idx_tracks_created_by ON public.tracks(created_by);

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

CREATE INDEX idx_stems_track ON public.stems(track_id);
CREATE INDEX idx_stems_sort_order ON public.stems(track_id, sort_order);
CREATE INDEX idx_stems_created_by ON public.stems(created_by);

COMMENT ON TABLE public.stems IS 'Individual instrument/vocal stems that compose a track';
COMMENT ON COLUMN public.stems.color IS 'Hex color for waveform visualization and UI elements';
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

CREATE INDEX idx_stem_comments_stem ON public.stem_comments(stem_id);
CREATE INDEX idx_stem_comments_user ON public.stem_comments(user_id);
CREATE INDEX idx_stem_comments_timestamp ON public.stem_comments(stem_id, timestamp);

COMMENT ON TABLE public.stem_comments IS 'Time-stamped comments on specific stems for feedback';
COMMENT ON COLUMN public.stem_comments.timestamp IS 'Position in seconds where the comment was made';

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at
  BEFORE UPDATE ON public.tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Engineers and admins can create clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

CREATE POLICY "Engineers and admins can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

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
CREATE POLICY "Authenticated users can view projects"
  ON public.projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Engineers and admins can create projects"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

CREATE POLICY "Engineers and admins can update projects"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

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
CREATE POLICY "Authenticated users can view tracks"
  ON public.tracks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Engineers and admins can create tracks"
  ON public.tracks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

CREATE POLICY "Engineers and admins can update tracks"
  ON public.tracks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

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
CREATE POLICY "Authenticated users can view stems"
  ON public.stems FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Engineers and admins can create stems"
  ON public.stems FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

CREATE POLICY "Engineers and admins can update stems"
  ON public.stems FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'engineer')
    )
  );

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
CREATE POLICY "Authenticated users can view comments"
  ON public.stem_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.stem_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.stem_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

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
CREATE OR REPLACE FUNCTION get_track_stems_with_comments(track_uuid UUID)
RETURNS TABLE (
  id UUID,
  track_id UUID,
  name TEXT,
  type TEXT,
  color TEXT,
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
    s.*,
    COUNT(sc.id) as comment_count
  FROM public.stems s
  LEFT JOIN public.stem_comments sc ON s.id = sc.stem_id
  WHERE s.track_id = track_uuid
  GROUP BY s.id
  ORDER BY s.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment stem download count
CREATE OR REPLACE FUNCTION increment_stem_download(stem_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.stems
  SET download_count = download_count + 1
  WHERE id = stem_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
