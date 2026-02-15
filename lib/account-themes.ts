export const ACCOUNT_THEMES = ['studio-default', 'neon-space-station', 'neon-daylight'] as const

export type AccountTheme = (typeof ACCOUNT_THEMES)[number]

export const ACCOUNT_THEME_OPTIONS: Array<{
  value: AccountTheme
  label: string
  description: string
}> = [
  {
    value: 'studio-default',
    label: 'Studio Default',
    description: 'Neutral dark grey',
  },
  {
    value: 'neon-space-station',
    label: 'Neon Space Station',
    description: 'Dark neon purple and cyan',
  },
  {
    value: 'neon-daylight',
    label: 'Neon Daylight',
    description: 'Warm light with neon accents',
  },
]

export function normalizeAccountTheme(input: unknown): AccountTheme {
  const value = String(input || '').trim()
  if (ACCOUNT_THEMES.includes(value as AccountTheme)) {
    return value as AccountTheme
  }
  return 'studio-default'
}
