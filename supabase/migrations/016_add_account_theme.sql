-- Account-level theme selection for multi-tenant branding.
-- Applied to all users within the currently active account.

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS theme TEXT;

UPDATE public.accounts
SET theme = 'studio-default'
WHERE theme IS NULL;

ALTER TABLE public.accounts
  ALTER COLUMN theme SET DEFAULT 'studio-default';

ALTER TABLE public.accounts
  ALTER COLUMN theme SET NOT NULL;

ALTER TABLE public.accounts
  DROP CONSTRAINT IF EXISTS accounts_theme_check;

ALTER TABLE public.accounts
  ADD CONSTRAINT accounts_theme_check
  CHECK (theme IN ('studio-default', 'neon-space-station', 'neon-daylight'));

COMMENT ON COLUMN public.accounts.theme IS 'Account-wide UI theme preset';
