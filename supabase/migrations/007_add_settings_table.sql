-- Create settings table for app configuration
-- Migration 007: Settings table with admin-only access

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.settings IS 'Application settings and configuration (admin-only access)';

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Only admins can read settings
CREATE POLICY "Settings: Admin read"
  ON public.settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can insert settings
CREATE POLICY "Settings: Admin insert"
  ON public.settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update settings
CREATE POLICY "Settings: Admin update"
  ON public.settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete settings
CREATE POLICY "Settings: Admin delete"
  ON public.settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add trigger to update updated_at
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default setting for Anthropic API key
INSERT INTO public.settings (key, value, description)
VALUES ('anthropic_api_key', '', 'Anthropic API key for AI features (replacement cost search)')
ON CONFLICT (key) DO NOTHING;
