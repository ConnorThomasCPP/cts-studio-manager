-- Repair migration for databases that already applied recursive
-- account_memberships RLS policies.
-- PostgreSQL error observed: 42P17 (infinite recursion detected in policy).

ALTER TABLE public.account_memberships ENABLE ROW LEVEL SECURITY;

-- Remove any legacy/recursive membership policies.
DROP POLICY IF EXISTS "Memberships: members read account" ON public.account_memberships;
DROP POLICY IF EXISTS "Memberships: account admins insert" ON public.account_memberships;
DROP POLICY IF EXISTS "Memberships: account admins update" ON public.account_memberships;
DROP POLICY IF EXISTS "Memberships: account admins delete" ON public.account_memberships;

DROP POLICY IF EXISTS "Memberships: read own" ON public.account_memberships;
DROP POLICY IF EXISTS "Memberships: insert own" ON public.account_memberships;
DROP POLICY IF EXISTS "Memberships: update own" ON public.account_memberships;
DROP POLICY IF EXISTS "Memberships: delete own" ON public.account_memberships;

-- Non-recursive policy set.
-- Reads are enough for account context resolution and account switch UI.
CREATE POLICY "Memberships: read own"
  ON public.account_memberships
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin writes are done by service-role API routes.
-- Keep self-write rules minimal and non-recursive.
CREATE POLICY "Memberships: insert own"
  ON public.account_memberships
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Memberships: update own"
  ON public.account_memberships
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Memberships: delete own"
  ON public.account_memberships
  FOR DELETE
  USING (user_id = auth.uid());
