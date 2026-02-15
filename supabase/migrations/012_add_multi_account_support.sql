-- Multi-account foundation for SaaS tenancy
-- Adds workspace accounts and per-account memberships so one auth user
-- can belong to multiple accounts with different roles.

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.account_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'engineer', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_account_memberships_user ON public.account_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_account_memberships_account ON public.account_memberships(account_id);
CREATE INDEX IF NOT EXISTS idx_account_memberships_account_role
  ON public.account_memberships(account_id, role)
  WHERE status = 'active';

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_memberships_updated_at
  BEFORE UPDATE ON public.account_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_memberships ENABLE ROW LEVEL SECURITY;

-- Account visibility is membership-bound.
DROP POLICY IF EXISTS "Accounts: members can read" ON public.accounts;
CREATE POLICY "Accounts: members can read"
  ON public.accounts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.account_memberships am
      WHERE am.account_id = accounts.id
        AND am.user_id = auth.uid()
        AND am.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Accounts: authenticated create" ON public.accounts;
CREATE POLICY "Accounts: authenticated create"
  ON public.accounts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND created_by = auth.uid());

DROP POLICY IF EXISTS "Accounts: admins update" ON public.accounts;
CREATE POLICY "Accounts: admins update"
  ON public.accounts
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.account_memberships am
      WHERE am.account_id = accounts.id
        AND am.user_id = auth.uid()
        AND am.role = 'admin'
        AND am.status = 'active'
    )
  );

-- IMPORTANT: avoid recursive policy checks on account_memberships itself.
-- Admin writes are handled through service-role API routes.
DROP POLICY IF EXISTS "Memberships: members read account" ON public.account_memberships;
CREATE POLICY "Memberships: read own"
  ON public.account_memberships
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Memberships: account admins insert" ON public.account_memberships;
CREATE POLICY "Memberships: insert own"
  ON public.account_memberships
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Memberships: account admins update" ON public.account_memberships;
CREATE POLICY "Memberships: update own"
  ON public.account_memberships
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Memberships: account admins delete" ON public.account_memberships;
CREATE POLICY "Memberships: delete own"
  ON public.account_memberships
  FOR DELETE
  USING (user_id = auth.uid());

-- Backfill single-tenant installs into one default account.
DO $$
DECLARE
  v_account_id UUID;
  v_creator_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.users) THEN
    SELECT id INTO v_creator_id FROM public.users ORDER BY created_at LIMIT 1;

    INSERT INTO public.accounts (name, slug, created_by)
    VALUES ('Default Workspace', 'default-workspace', v_creator_id)
    ON CONFLICT (slug) DO NOTHING;

    SELECT id INTO v_account_id FROM public.accounts WHERE slug = 'default-workspace' LIMIT 1;

    INSERT INTO public.account_memberships (account_id, user_id, role, status)
    SELECT v_account_id, u.id, u.role, 'active'
    FROM public.users u
    ON CONFLICT (account_id, user_id) DO NOTHING;
  END IF;
END $$;
