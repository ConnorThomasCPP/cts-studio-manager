/**
 * Dashboard Layout
 *
 * Protected layout for all authenticated pages
 * Includes navigation sidebar with dark studio theme
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppLayout } from '@/components/AppLayout'

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

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const userData = {
    name: profile?.name || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    role: profile?.role || 'viewer',
  }

  return <AppLayout user={userData}>{children}</AppLayout>
}
