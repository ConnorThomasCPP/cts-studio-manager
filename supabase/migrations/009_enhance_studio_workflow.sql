-- ============================================================================
-- Migration: Enhance Studio Workflow Schema
-- Description: Add professional studio metadata and link Sessions to Projects
-- ============================================================================

-- ============================================================================
-- 1. ENHANCE CLIENTS TABLE
-- ============================================================================

-- Add client type and billing information
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'artist' CHECK (type IN ('artist', 'band', 'label', 'producer', 'other')),
ADD COLUMN IF NOT EXISTS billing_email TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS default_hourly_rate DECIMAL(10, 2);

COMMENT ON COLUMN clients.type IS 'Type of client: artist, band, label, producer, other';
COMMENT ON COLUMN clients.billing_email IS 'Email for invoicing';
COMMENT ON COLUMN clients.billing_address IS 'Billing address for invoices';
COMMENT ON COLUMN clients.default_hourly_rate IS 'Default hourly rate in GBP for this client';

-- ============================================================================
-- 2. ENHANCE PROJECTS TABLE
-- ============================================================================

-- Add project lifecycle and business metadata
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'on_hold', 'delivered', 'archived')),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE,
ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'recording' CHECK (project_type IN ('recording', 'mixing', 'mastering', 'podcast', 'film', 'other')),
ADD COLUMN IF NOT EXISTS storage_policy TEXT DEFAULT 'retain_90' CHECK (storage_policy IN ('retain_30', 'retain_90', 'metadata_only')),
ADD COLUMN IF NOT EXISTS rate_model TEXT DEFAULT 'per_day' CHECK (rate_model IN ('per_day', 'per_track', 'fixed_rate')),
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN projects.status IS 'Project lifecycle status';
COMMENT ON COLUMN projects.start_date IS 'Project start date';
COMMENT ON COLUMN projects.end_date IS 'Project end date or deadline';
COMMENT ON COLUMN projects.project_type IS 'Type of production work';
COMMENT ON COLUMN projects.storage_policy IS 'How long to retain project files';
COMMENT ON COLUMN projects.rate_model IS 'Billing model for this project';
COMMENT ON COLUMN projects.notes IS 'Project-level notes and details';

-- ============================================================================
-- 3. ENHANCE TRACKS TABLE
-- ============================================================================

-- Add track ordering and workflow status
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS track_no INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'tracking' CHECK (status IN ('writing', 'tracking', 'editing', 'mixing', 'mastering', 'delivered'));

COMMENT ON COLUMN tracks.track_no IS 'Track number/order in project';
COMMENT ON COLUMN tracks.status IS 'Production workflow status';

-- ============================================================================
-- 4. LINK SESSIONS TO PROJECTS
-- ============================================================================

-- Add project_id to sessions to bridge asset management with production work
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);

COMMENT ON COLUMN sessions.project_id IS 'Links session (work event + asset checkout) to a project';

-- ============================================================================
-- 5. UPDATE RELATIONSHIPS DIAGRAM
-- ============================================================================

/*
Enhanced relationship structure:

Client
  └─→ Projects (client_id)
      ├─→ Tracks (project_id) - musical outputs
      │   └─→ Stems (track_id)
      │       └─→ Stem Comments (stem_id)
      └─→ Sessions (project_id) - work events
          └─→ Session Assets (session_id) - equipment checkouts
              └─→ Assets (asset_id)

Key insight: Sessions now bridge the equipment/asset world with the creative/production world
*/

-- ============================================================================
-- 6. DATA QUALITY INDEXES
-- ============================================================================

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_tracks_status ON tracks(status);
CREATE INDEX IF NOT EXISTS idx_tracks_project_track_no ON tracks(project_id, track_no);

-- ============================================================================
-- 7. ROW LEVEL SECURITY (preserve existing policies)
-- ============================================================================

-- No changes to RLS - existing policies still apply
-- All authenticated users can read, admins and engineers can write

-- ============================================================================
-- 8. HELPFUL VIEWS (optional - for reporting)
-- ============================================================================

-- View: Active projects with session count
CREATE OR REPLACE VIEW active_projects_summary AS
SELECT
  p.id,
  p.name,
  p.status,
  p.project_type,
  c.name as client_name,
  COUNT(DISTINCT t.id) as track_count,
  COUNT(DISTINCT s.id) as session_count,
  p.start_date,
  p.end_date
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN tracks t ON t.project_id = p.id
LEFT JOIN sessions s ON s.project_id = p.id
WHERE p.status IN ('draft', 'active', 'on_hold')
GROUP BY p.id, p.name, p.status, p.project_type, c.name, p.start_date, p.end_date;

COMMENT ON VIEW active_projects_summary IS 'Summary of active projects with counts';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 009 completed successfully!';
  RAISE NOTICE 'Added: Client types, billing info, default rates';
  RAISE NOTICE 'Added: Project status, dates, type, storage policy, rate model';
  RAISE NOTICE 'Added: Track numbers and workflow status';
  RAISE NOTICE 'Added: Session → Project link (project_id)';
  RAISE NOTICE 'Next steps: Update UI to use new fields';
END $$;
