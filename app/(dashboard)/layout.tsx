/**
 * Dashboard Layout
 *
 * Protected layout for all authenticated pages
 * Includes navigation sidebar with dark studio theme
 */

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/AppLayout'
import { ACTIVE_ACCOUNT_COOKIE, resolveAccountContext } from '@/lib/account-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const cookieStore = await cookies()
  const preferredAccountId = cookieStore.get(ACTIVE_ACCOUNT_COOKIE)?.value
  const accountContext = await resolveAccountContext(supabase, user.id, preferredAccountId)

  if (!accountContext) {
    redirect('/account/setup')
  }

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const userData = {
    name: profile?.name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role: accountContext.currentRole,
    photo_url: profile?.photo_url || null,
  }

  return (
    <AppLayout
      user={userData}
      currentAccount={{
        id: accountContext.currentAccountId,
        name: accountContext.currentAccountName,
      }}
      currentAccountTheme={accountContext.currentAccountTheme}
      accounts={accountContext.memberships.map((m) => ({
        id: m.accountId,
        name: m.accountName,
        role: m.role,
      }))}
    >
      {children}
    </AppLayout>
  )
}
