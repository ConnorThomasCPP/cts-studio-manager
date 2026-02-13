-- Add profile fields to users table
-- Migration 004: Add first_name, last_name, and photo_url to users

ALTER TABLE public.users
  ADD COLUMN first_name TEXT,
  ADD COLUMN last_name TEXT,
  ADD COLUMN photo_url TEXT;

COMMENT ON COLUMN public.users.first_name IS 'User first name';
COMMENT ON COLUMN public.users.last_name IS 'User last name';
COMMENT ON COLUMN public.users.photo_url IS 'Profile photo URL (Supabase Storage or external)';

-- Update existing users to split name into first_name and last_name
UPDATE public.users
SET
  first_name = SPLIT_PART(name, ' ', 1),
  last_name = CASE
    WHEN array_length(string_to_array(name, ' '), 1) > 1
    THEN substring(name from position(' ' in name) + 1)
    ELSE NULL
  END
WHERE name IS NOT NULL;
