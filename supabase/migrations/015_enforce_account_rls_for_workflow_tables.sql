-- Enforce account-scoped RLS on workflow/media tables that were still using
-- legacy "authenticated can view" policies from migration 008.

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stem_comments ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Engineers and admins can create clients" ON public.clients;
DROP POLICY IF EXISTS "Engineers and admins can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admins can delete clients" ON public.clients;

CREATE POLICY "Clients: active account read"
  ON public.clients
  FOR SELECT
  USING (public.is_active_account_member(account_id));

CREATE POLICY "Clients: active account insert"
  ON public.clients
  FOR INSERT
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

CREATE POLICY "Clients: active account update"
  ON public.clients
  FOR UPDATE
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

CREATE POLICY "Clients: active account admin delete"
  ON public.clients
  FOR DELETE
  USING (public.has_active_account_role(account_id, ARRAY['admin']));

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view projects" ON public.projects;
DROP POLICY IF EXISTS "Engineers and admins can create projects" ON public.projects;
DROP POLICY IF EXISTS "Engineers and admins can update projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON public.projects;

CREATE POLICY "Projects: active account read"
  ON public.projects
  FOR SELECT
  USING (public.is_active_account_member(account_id));

CREATE POLICY "Projects: active account insert"
  ON public.projects
  FOR INSERT
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

CREATE POLICY "Projects: active account update"
  ON public.projects
  FOR UPDATE
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

CREATE POLICY "Projects: active account admin delete"
  ON public.projects
  FOR DELETE
  USING (public.has_active_account_role(account_id, ARRAY['admin']));

-- ---------------------------------------------------------------------------
-- Tracks
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view tracks" ON public.tracks;
DROP POLICY IF EXISTS "Engineers and admins can create tracks" ON public.tracks;
DROP POLICY IF EXISTS "Engineers and admins can update tracks" ON public.tracks;
DROP POLICY IF EXISTS "Admins can delete tracks" ON public.tracks;

CREATE POLICY "Tracks: active account read"
  ON public.tracks
  FOR SELECT
  USING (public.is_active_account_member(account_id));

CREATE POLICY "Tracks: active account insert"
  ON public.tracks
  FOR INSERT
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

CREATE POLICY "Tracks: active account update"
  ON public.tracks
  FOR UPDATE
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

CREATE POLICY "Tracks: active account admin delete"
  ON public.tracks
  FOR DELETE
  USING (public.has_active_account_role(account_id, ARRAY['admin']));

-- ---------------------------------------------------------------------------
-- Stems
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view stems" ON public.stems;
DROP POLICY IF EXISTS "Engineers and admins can create stems" ON public.stems;
DROP POLICY IF EXISTS "Engineers and admins can update stems" ON public.stems;
DROP POLICY IF EXISTS "Admins can delete stems" ON public.stems;

CREATE POLICY "Stems: active account read"
  ON public.stems
  FOR SELECT
  USING (public.is_active_account_member(account_id));

CREATE POLICY "Stems: active account insert"
  ON public.stems
  FOR INSERT
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

CREATE POLICY "Stems: active account update"
  ON public.stems
  FOR UPDATE
  USING (public.has_active_account_role(account_id, ARRAY['admin','engineer']))
  WITH CHECK (public.has_active_account_role(account_id, ARRAY['admin','engineer']));

CREATE POLICY "Stems: active account admin delete"
  ON public.stems
  FOR DELETE
  USING (public.has_active_account_role(account_id, ARRAY['admin']));

-- ---------------------------------------------------------------------------
-- Stem Comments
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.stem_comments;
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.stem_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.stem_comments;
DROP POLICY IF EXISTS "Users can delete their own comments, admins can delete any" ON public.stem_comments;

CREATE POLICY "Stem comments: active account read"
  ON public.stem_comments
  FOR SELECT
  USING (public.is_active_account_member(account_id));

CREATE POLICY "Stem comments: active account insert"
  ON public.stem_comments
  FOR INSERT
  WITH CHECK (
    public.is_active_account_member(account_id)
    AND user_id = auth.uid()
  );

CREATE POLICY "Stem comments: active account update"
  ON public.stem_comments
  FOR UPDATE
  USING (
    public.is_active_account_member(account_id)
    AND (
      user_id = auth.uid()
      OR public.has_active_account_role(account_id, ARRAY['admin','engineer'])
    )
  )
  WITH CHECK (public.is_active_account_member(account_id));

CREATE POLICY "Stem comments: active account delete"
  ON public.stem_comments
  FOR DELETE
  USING (
    public.is_active_account_member(account_id)
    AND (
      user_id = auth.uid()
      OR public.has_active_account_role(account_id, ARRAY['admin','engineer'])
    )
  );
