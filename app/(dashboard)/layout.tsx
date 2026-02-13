/**
 * Dashboard Layout
 *
 * Protected layout for all authenticated pages
 * Includes navigation header and sidebar
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import md5 from 'md5'

function getGravatarUrl(email: string): string {
  const hash = md5(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?s=200&d=mp`
}

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

  // Get profile photo (custom or Gravatar)
  const photoUrl = profile?.photo_url || getGravatarUrl(user.email || '')
  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || profile?.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-slate-950 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="font-bold text-xl">CTs Studio Manager</div>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Dashboard
              </Link>
              <Link
                href="/assets"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Assets
              </Link>
              <Link
                href="/sessions"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Sessions
              </Link>
              <Link
                href="/scan"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Scan
              </Link>
              <Link
                href="/transactions"
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                History
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 hover:bg-accent">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={photoUrl} alt={profile?.name || user.email || 'User'} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium">{profile?.name || 'User'}</div>
                    <div className="text-xs text-muted-foreground">{profile?.role || 'viewer'}</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.name || 'User'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile Settings</Link>
                </DropdownMenuItem>
                {profile?.role === 'admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin Settings</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={handleSignOut}>
                    <button type="submit" className="w-full text-left">
                      Sign Out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 px-4">{children}</main>
    </div>
  )
}
