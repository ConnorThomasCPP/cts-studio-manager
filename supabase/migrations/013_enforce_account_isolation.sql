-- Enforce tenant isolation by active account.
-- This migration introduces:
-- 1) users.active_account_id (selected workspace)
-- 2) account_id on core business tables
-- 3) account-aware helper functions
-- 4) strict RLS policies tied to active account + membership role

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS active_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL;

-- Initialize active account for existing users from first active membership.
UPDATE public.users u
SET active_account_id = sub.account_id
FROM (
  SELECT DISTINCT ON (am.user_id)
    am.user_id,
    am.account_id
  FROM public.account_memberships am
  WHERE am.status = 'active'
  ORDER BY am.user_id, am.created_at
) sub
WHERE u.id = sub.user_id
  AND u.active_account_id IS NULL;

CREATE OR REPLACE FUNCTION public.get_active_account_id()
RETURNS UUID AS $$
  SELECT active_account_id
  FROM public.users
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_active_account_member(p_account_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_memberships am
    WHERE am.user_id = auth.uid()
      AND am.account_id = p_account_id
      AND am.status = 'active'
      AND am.account_id = public.get_active_account_id()
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_active_account_role(p_account_id UUID, p_roles TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_memberships am
    WHERE am.user_id = auth.uid()
      AND am.account_id = p_account_id
      AND am.status = 'active'
      AND am.account_id = public.get_active_account_id()
      AND am.role = ANY(p_roles)
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Add account_id to tenant data tables.
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.session_assets ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.tracks ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.stems ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.stem_comments ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.calendar_connections ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.calendar_syncs ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.session_attendees ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES public.accounts(id) ON DELETE CASCADE;

-- Default account assignment for new rows.
ALTER TABLE public.clients ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.projects ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.assets ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.sessions ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.session_assets ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.transactions ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.tracks ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.stems ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.stem_comments ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.calendar_connections ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.calendar_syncs ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.session_attendees ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.categories ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();
ALTER TABLE public.locations ALTER COLUMN account_id SET DEFAULT public.get_active_account_id();

-- Resolve a fallback account for legacy rows.
DO $$
DECLARE
  v_default_account UUID;
BEGIN
  SELECT id INTO v_default_account
  FROM public.accounts
  ORDER BY created_at
  LIMIT 1;

  -- Base tables first.
  UPDATE public.clients SET account_id = v_default_account WHERE account_id IS NULL;
  UPDATE public.projects SET account_id = v_default_account WHERE account_id IS NULL;
  UPDATE public.assets SET account_id = v_default_account WHERE account_id IS NULL;
  UPDATE public.sessions SET account_id = v_default_account WHERE account_id IS NULL;
  UPDATE public.tracks SET account_id = v_default_account WHERE account_id IS NULL;
  UPDATE public.calendar_connections SET account_id = v_default_account WHERE account_id IS NULL;
  UPDATE public.categories SET account_id = v_default_account WHERE account_id IS NULL;
  UPDATE public.locations SET account_id = v_default_account WHERE account_id IS NULL;

  -- Child tables derive from parent when possible.
  UPDATE public.stems s
  SET account_id = t.account_id
  FROM public.tracks t
  WHERE s.track_id = t.id AND s.account_id IS NULL;
  UPDATE public.stems SET account_id = v_default_account WHERE account_id IS NULL;

  UPDATE public.stem_comments sc
  SET account_id = s.account_id
  FROM public.stems s
  WHERE sc.stem_id = s.id AND sc.account_id IS NULL;
  UPDATE public.stem_comments SET account_id = v_default_account WHERE account_id IS NULL;

  UPDATE public.session_assets sa
  SET account_id = se.account_id
  FROM public.sessions se
  WHERE sa.session_id = se.id AND sa.account_id IS NULL;
  UPDATE public.session_assets SET account_id = v_default_account WHERE account_id IS NULL;

  UPDATE public.session_attendees sa
  SET account_id = se.account_id
  FROM public.sessions se
  WHERE sa.session_id = se.id AND sa.account_id IS NULL;
  UPDATE public.session_attendees SET account_id = v_default_account WHERE account_id IS NULL;

  UPDATE public.calendar_syncs cs
  SET account_id = cc.account_id
  FROM public.calendar_connections cc
  WHERE cs.connection_id = cc.id AND cs.account_id IS NULL;
  UPDATE public.calendar_syncs SET account_id = v_default_account WHERE account_id IS NULL;

  UPDATE public.transactions t
  SET account_id = a.account_id
  FROM public.assets a
  WHERE t.asset_id = a.id AND t.account_id IS NULL;
  UPDATE public.transactions t
  SET account_id = s.account_id
  FROM public.sessions s
  WHERE t.session_id = s.id AND t.account_id IS NULL;
  UPDATE public.transactions SET account_id = v_default_account WHERE account_id IS NULL;
END $$;

-- Enforce NOT NULL after backfill.
ALTER TABLE public.clients ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.projects ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.assets ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.sessions ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.session_assets ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.transactions ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.tracks ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.stems ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.stem_comments ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.calendar_connections ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.calendar_syncs ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.session_attendees ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.categories ALTER COLUMN account_id SET NOT NULL;
ALTER TABLE public.locations ALTER COLUMN account_id SET NOT NULL;

-- Uniqueness should be account-scoped for shared names.
DROP INDEX IF EXISTS idx_assets_asset_code;
CREATE UNIQUE INDEX IF NOT EXISTS uq_assets_account_asset_code
  ON public.assets(account_id, asset_code);
CREATE INDEX IF NOT EXISTS idx_assets_asset_code ON public.assets(asset_code);

ALTER TABLE public.categories DROP CONSTRAINT IF EXISTS categories_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_account_name
  ON public.categories(account_id, name);

ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS locations_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS uq_locations_account_name
  ON public.locations(account_id, name);

-- Helpful account indexes.
CREATE INDEX IF NOT EXISTS idx_clients_account ON public.clients(account_id);
CREATE INDEX IF NOT EXISTS idx_projects_account ON public.projects(account_id);
CREATE INDEX IF NOT EXISTS idx_assets_account ON public.assets(account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_account ON public.sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_session_assets_account ON public.session_assets(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_tracks_account ON public.tracks(account_id);
CREATE INDEX IF NOT EXISTS idx_stems_account ON public.stems(account_id);
CREATE INDEX IF NOT EXISTS idx_stem_comments_account ON public.stem_comments(account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_account ON public.calendar_connections(account_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_account ON public.calendar_syncs(account_id);
CREATE INDEX IF NOT EXISTS idx_session_attendees_account ON public.session_attendees(account_id);
CREATE INDEX IF NOT EXISTS idx_categories_account ON public.categories(account_id);
CREATE INDEX IF NOT EXISTS idx_locations_account ON public.locations(account_id);

-- Refresh RLS policies for tenant tables.
DROP POLICY IF EXISTS "Users: Read all" ON public.users;
DROP POLICY IF EXISTS "Users: Update own profile" ON public.users;
DROP POLICY IF EXISTS "Users: Update own" ON public.users;
DROP POLICY IF EXISTS "Users: Admin insert" ON public.users;
DROP POLICY IF EXISTS "Users: Admin delete" ON public.users;

CREATE POLICY "Users: members can read active account"
  ON public.users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.account_memberships am
      WHERE am.user_id = users.id
        AND am.account_id = public.get_active_account_id()
        AND am.status = 'active'
    )
  );

CREATE POLICY "Users: update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Locations: Read all" ON public.locations;
DROP POLICY IF EXISTS "Locations: Admin manage" ON public.locations;
CREATE POLICY "Locations: active account read"
  ON public.locations
  FOR SELECT
  USING (public.is_active_account_member(account_id));
CREATE POLICY "Locations: active account admin manage"
  ON public.locations
  FOR ALL
  USING (public.has_active_account_role(account_id, ARRAY['admin']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin']));

DROP POLICY IF EXISTS "Categories: Read all" ON public.categories;
DROP POLICY IF EXISTS "Categories: Admin manage" ON public.categories;
CREATE POLICY "Categories: active account read"
  ON public.categories
  FOR SELECT
  USING (public.is_active_account_member(account_id));
CREATE POLICY "Categories: active account admin manage"
  ON public.categories
  FOR ALL
  USING (public.has_active_account_role(account_id, ARRAY['admin']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin']));

DROP POLICY IF EXISTS "Assets: Read all" ON public.assets;
DROP POLICY IF EXISTS "Assets: Admin/Engineer insert" ON public.assets;
DROP POLICY IF EXISTS "Assets: Admin/Engineer update" ON public.assets;
DROP POLICY IF EXISTS "Assets: Admin delete" ON public.assets;
CREATE POLICY "Assets: active account read"
  ON public.assets
  FOR SELECT
  USING (public.is_active_account_member(account_id));
CREATE POLICY "Assets: active account manage"
  ON public.assets
  FOR INSERT
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));
CREATE POLICY "Assets: active account update"
  ON public.assets
  FOR UPDATE
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));
CREATE POLICY "Assets: active account admin delete"
  ON public.assets
  FOR DELETE
  USING (public.has_active_account_role(account_id, ARRAY['admin']));

DROP POLICY IF EXISTS "Sessions: Read all" ON public.sessions;
DROP POLICY IF EXISTS "Sessions: Admin/Engineer insert" ON public.sessions;
DROP POLICY IF EXISTS "Sessions: Admin/Engineer update" ON public.sessions;
DROP POLICY IF EXISTS "Sessions: Admin delete" ON public.sessions;
CREATE POLICY "Sessions: active account read"
  ON public.sessions
  FOR SELECT
  USING (public.is_active_account_member(account_id));
CREATE POLICY "Sessions: active account manage"
  ON public.sessions
  FOR INSERT
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));
CREATE POLICY "Sessions: active account update"
  ON public.sessions
  FOR UPDATE
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));
CREATE POLICY "Sessions: active account admin delete"
  ON public.sessions
  FOR DELETE
  USING (public.has_active_account_role(account_id, ARRAY['admin']));

DROP POLICY IF EXISTS "Session Assets: Read all" ON public.session_assets;
DROP POLICY IF EXISTS "Session Assets: Admin/Engineer manage" ON public.session_assets;
CREATE POLICY "Session Assets: active account read"
  ON public.session_assets
  FOR SELECT
  USING (public.is_active_account_member(account_id));
CREATE POLICY "Session Assets: active account manage"
  ON public.session_assets
  FOR ALL
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

DROP POLICY IF EXISTS "Transactions: Read all" ON public.transactions;
DROP POLICY IF EXISTS "Transactions: Insert only" ON public.transactions;
CREATE POLICY "Transactions: active account read"
  ON public.transactions
  FOR SELECT
  USING (public.is_active_account_member(account_id));
CREATE POLICY "Transactions: active account insert"
  ON public.transactions
  FOR INSERT
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

DROP POLICY IF EXISTS "Users can view own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can create own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can update own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Users can delete own calendar connections" ON public.calendar_connections;
CREATE POLICY "Calendar connections: active account read"
  ON public.calendar_connections
  FOR SELECT
  USING (public.is_active_account_member(account_id));
CREATE POLICY "Calendar connections: active account manage"
  ON public.calendar_connections
  FOR ALL
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

DROP POLICY IF EXISTS "Users can view own calendar syncs" ON public.calendar_syncs;
DROP POLICY IF EXISTS "Users can create calendar syncs" ON public.calendar_syncs;
DROP POLICY IF EXISTS "Users can update calendar syncs" ON public.calendar_syncs;
DROP POLICY IF EXISTS "Users can delete calendar syncs" ON public.calendar_syncs;
CREATE POLICY "Calendar syncs: active account read"
  ON public.calendar_syncs
  FOR SELECT
  USING (public.is_active_account_member(account_id));
CREATE POLICY "Calendar syncs: active account manage"
  ON public.calendar_syncs
  FOR ALL
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

DROP POLICY IF EXISTS "Users can view session attendees" ON public.session_attendees;
DROP POLICY IF EXISTS "Users can add session attendees" ON public.session_attendees;
DROP POLICY IF EXISTS "Users can remove session attendees" ON public.session_attendees;
CREATE POLICY "Session attendees: active account read"
  ON public.session_attendees
  FOR SELECT
  USING (public.is_active_account_member(account_id));
CREATE POLICY "Session attendees: active account manage"
  ON public.session_attendees
  FOR ALL
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

