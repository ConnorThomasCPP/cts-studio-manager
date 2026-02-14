-- Add icon field to stems table
ALTER TABLE public.stems
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'music';

-- Set default icons based on stem type
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
