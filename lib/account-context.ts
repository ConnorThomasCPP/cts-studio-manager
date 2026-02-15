export const ACTIVE_ACCOUNT_COOKIE = 'cts_active_account_id'

export type AccountMembership = {
  account_id: string
  role: 'admin' | 'engineer' | 'viewer'
  status: string
  accounts: {
    id: string
    name: string
    slug: string
    theme?: string | null
  } | null
}

export type AccountContext = {
  currentAccountId: string
  currentAccountName: string
  currentAccountTheme: string
  currentRole: 'admin' | 'engineer' | 'viewer'
  isLegacy?: boolean
  memberships: Array<{
    accountId: string
    accountName: string
    accountSlug: string
    accountTheme: string
    role: 'admin' | 'engineer' | 'viewer'
  }>
}

export async function resolveAccountContext(
  supabase: any,
  userId: string,
  preferredAccountId?: string
): Promise<AccountContext | null> {
  let profileRole: 'admin' | 'engineer' | 'viewer' = 'viewer'
  let activeFromProfile: string | null = null

  try {
    const { data: profileWithAccount, error: profileAccountError } = await (supabase as any)
      .from('users')
      .select('role, active_account_id')
      .eq('id', userId)
      .maybeSingle()

    if (profileAccountError) {
      // active_account_id does not exist yet on legacy schema
      if (profileAccountError.code === '42703') {
        const { data: legacyProfile, error: legacyError } = await (supabase as any)
          .from('users')
          .select('role')
          .eq('id', userId)
          .maybeSingle()
        if (legacyError) throw legacyError
        profileRole = (legacyProfile?.role || 'viewer') as 'admin' | 'engineer' | 'viewer'
      } else {
        throw profileAccountError
      }
    } else {
      profileRole = (profileWithAccount?.role || 'viewer') as 'admin' | 'engineer' | 'viewer'
      activeFromProfile = profileWithAccount?.active_account_id || null
    }
  } catch {
    profileRole = 'viewer'
  }

  const { data, error } = await (supabase as any)
    .from('account_memberships')
    .select('account_id, role, status, accounts(id, name, slug, theme)')
    .eq('user_id', userId)
    .eq('status', 'active')

  let membershipsData = data
  let membershipsError = error

  // Backward-compatible fallback while the theme column rolls out.
  if (membershipsError?.code === '42703') {
    const fallbackResult = await (supabase as any)
      .from('account_memberships')
      .select('account_id, role, status, accounts(id, name, slug)')
      .eq('user_id', userId)
      .eq('status', 'active')
    membershipsData = fallbackResult.data
    membershipsError = fallbackResult.error
  }

  if (membershipsError) {
    // Legacy schema fallback while migrations are being rolled out.
    if (membershipsError.code === '42P01' || membershipsError.code === '42703' || membershipsError.code === '42P17') {
      return {
        currentAccountId: 'legacy',
        currentAccountName: 'Default Workspace',
        currentAccountTheme: 'studio-default',
        currentRole: profileRole,
        isLegacy: true,
        memberships: [
          {
            accountId: 'legacy',
            accountName: 'Default Workspace',
            accountSlug: 'legacy',
            accountTheme: 'studio-default',
            role: profileRole,
          },
        ],
      }
    }
    throw membershipsError
  }

  const memberships = (membershipsData || []) as unknown as AccountMembership[]
  if (memberships.length === 0) {
    return null
  }

  const selected =
    memberships.find((m) => m.account_id === preferredAccountId) ||
    memberships.find((m) => m.account_id === activeFromProfile) ||
    memberships[0]

  return {
    currentAccountId: selected.account_id,
    currentAccountName: selected.accounts?.name || 'Workspace',
    currentAccountTheme: selected.accounts?.theme || 'studio-default',
    currentRole: selected.role,
    memberships: memberships.map((m) => ({
      accountId: m.account_id,
      accountName: m.accounts?.name || 'Workspace',
      accountSlug: m.accounts?.slug || '',
      accountTheme: m.accounts?.theme || 'studio-default',
      role: m.role,
    })),
  }
}
