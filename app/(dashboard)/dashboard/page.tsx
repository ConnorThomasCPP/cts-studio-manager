/**
 * Main Dashboard Page
 *
 * Decision-first dashboard for studio operations
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FolderClock,
  MessageSquare,
  Music2,
  PackageOpen,
  Plus,
  ScanLine,
  Users,
} from 'lucide-react'

type SessionRow = {
  id: string
  session_name: string
  client_name: string
  engineer: string
  start_time: string
  status: string
}

type RecentTransactionRow = {
  id: string
  type: string
  timestamp: string
  assets: { name: string } | null
  users: { name: string } | null
}

type RecentStemCommentRow = {
  id: string
  content: string | null
  created_at: string
  users: { name: string } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()
  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const monthAhead = new Date(now)
  monthAhead.setDate(monthAhead.getDate() + 30)

  // Asset status snapshot (compact KPIs)
  const { data: assets } = await supabase
    .from('assets')
    .select('status')

  const statusCounts = {
    available: assets?.filter((a) => a.status === 'available').length || 0,
    checked_out: assets?.filter((a) => a.status === 'checked_out').length || 0,
    maintenance: assets?.filter((a) => a.status === 'maintenance').length || 0,
    missing: assets?.filter((a) => a.status === 'missing').length || 0,
  }

  // Week-first schedule + extra upcoming items for show more
  const { data: weekSessions } = await supabase
    .from('sessions')
    .select('id, session_name, client_name, engineer, start_time, status')
    .gte('start_time', now.toISOString())
    .lt('start_time', weekEnd.toISOString())
    .order('start_time', { ascending: true })

  const { data: upcomingSessions } = await supabase
    .from('sessions')
    .select('id, session_name, client_name, engineer, start_time, status')
    .gte('start_time', now.toISOString())
    .lt('start_time', monthAhead.toISOString())
    .order('start_time', { ascending: true })
    .limit(16)

  const weekSessionRows = (weekSessions || []) as SessionRow[]
  const upcomingSessionRows = (upcomingSessions || []) as SessionRow[]
  const activeSessionsCount = weekSessionRows.filter((s) => s.status === 'active').length

  // Recent asset activity feed
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select('id, type, timestamp, assets(name), users(name)')
    .order('timestamp', { ascending: false })
    .limit(4)
  const recentTransactionRows = (recentTransactions || []) as RecentTransactionRow[]

  // Track pipeline and attention signals
  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, name, status, updated_at')

  const { data: recentStemComments } = await supabase
    .from('stem_comments')
    .select('id, content, created_at, stems(name, tracks(name, projects(name))), users(name)')
    .order('created_at', { ascending: false })
    .limit(5)
  const recentStemCommentRows = (recentStemComments || []) as RecentStemCommentRow[]

  const staleDate = new Date()
  staleDate.setDate(staleDate.getDate() - 7)

  const trackStatusBuckets = {
    writing: 0,
    tracking: 0,
    editing: 0,
    mixing: 0,
    mastering: 0,
    delivered: 0,
    other: 0,
  }

  const staleTracks =
    tracks?.filter((track) => {
      const updatedAt = track.updated_at ? new Date(track.updated_at) : null
      return updatedAt ? updatedAt < staleDate : false
    }) || []

  tracks?.forEach((track) => {
    const key = (track.status || 'other') as keyof typeof trackStatusBuckets
    if (key in trackStatusBuckets) {
      trackStatusBuckets[key] += 1
    } else {
      trackStatusBuckets.other += 1
    }
  })

  const quickActions = [
    { href: '/sessions/new', label: 'New Session', icon: CalendarClock },
    { href: '/assets/new', label: 'Add Asset', icon: PackageOpen },
    { href: '/tracks/new', label: 'Add Track', icon: Music2 },
    { href: '/scan', label: 'Scan Asset', icon: ScanLine },
    { href: '/projects/new', label: 'New Project', icon: FolderClock },
    { href: '/users', label: 'Invite Team', icon: Users },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          This week at a glance: schedule, risk, and production flow
        </p>
      </div>

      {/* Decision KPIs */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Sessions This Week</p>
            <p className="mt-1 text-3xl font-mono font-semibold">{weekSessionRows.length}</p>
            <p className="text-xs text-muted-foreground">{activeSessionsCount} currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Assets Checked Out</p>
            <p className="mt-1 text-3xl font-mono font-semibold">{statusCounts.checked_out}</p>
            <p className="text-xs text-muted-foreground">{statusCounts.available} ready to deploy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Tracks Needing Attention</p>
            <p className="mt-1 text-3xl font-mono font-semibold">
              {staleTracks.length + (recentStemComments?.length || 0)}
            </p>
            <p className="text-xs text-muted-foreground">
              {staleTracks.length} stale, {recentStemComments?.length || 0} recent comments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Asset Risk</p>
            <p className="mt-1 text-3xl font-mono font-semibold">
              {statusCounts.maintenance + statusCounts.missing}
            </p>
            <p className="text-xs text-muted-foreground">
              {statusCounts.maintenance} maintenance, {statusCounts.missing} missing
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Week Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              This Week
            </CardTitle>
            <CardDescription>
              Focused 7-day schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weekSessionRows.length > 0 ? (
              <div className="space-y-4">
                {weekSessionRows.slice(0, 5).map((session) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="block rounded-lg border p-3 transition-colors hover:bg-secondary/50"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{session.session_name}</p>
                      <Badge variant="outline" className="capitalize">
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{session.client_name} - {session.engineer}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(session.start_time).toLocaleString()}
                    </p>
                  </Link>
                ))}

                <details className="group">
                  <summary className="list-none">
                    <Button variant="ghost" size="sm" className="w-full justify-between">
                      Show more
                      <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                    </Button>
                  </summary>
                  <div className="mt-2 space-y-2">
                    {upcomingSessionRows.slice(5, 14).map((session) => (
                      <Link
                        key={session.id}
                        href={`/sessions/${session.id}`}
                        className="block rounded-md border p-2 text-sm hover:bg-secondary/50"
                      >
                        <p className="font-medium">{session.session_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(session.start_time).toLocaleString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                </details>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/sessions">Open Full Schedule</Link>
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No sessions booked this week</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/sessions/new">Schedule a session</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Production / Tracks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music2 className="h-4 w-4" />
              Production
            </CardTitle>
            <CardDescription>Track pipeline and feedback activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                ['Writing', trackStatusBuckets.writing],
                ['Tracking', trackStatusBuckets.tracking],
                ['Editing', trackStatusBuckets.editing],
                ['Mixing', trackStatusBuckets.mixing],
                ['Mastering', trackStatusBuckets.mastering],
                ['Delivered', trackStatusBuckets.delivered],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border p-2 text-center">
                  <p className="text-muted-foreground">{label}</p>
                  <p className="text-lg font-mono font-semibold">{value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium mb-2">Recent Feedback</p>
              {recentStemCommentRows.length > 0 ? (
                <div className="space-y-2">
                  {recentStemCommentRows.slice(0, 3).map((comment) => (
                    <div key={comment.id} className="text-sm">
                      <p className="line-clamp-1">{comment.content || 'Comment added'}</p>
                      <p className="text-xs text-muted-foreground">
                        {comment.users?.name || 'Unknown'} - {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent comments</p>
              )}
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Stale Tracks</p>
              <p className="text-xs text-muted-foreground">
                {staleTracks.length} tracks with no updates in 7+ days
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/tracks">Open Tracks</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Activity + Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Actions & Activity
            </CardTitle>
            <CardDescription>Fast paths and latest movement</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.href}
                    asChild
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2"
                  >
                    <Link href={action.href}>
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </Link>
                  </Button>
                )
              })}
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-sm font-medium">Recent Asset Activity</p>
              {recentTransactionRows.length > 0 ? (
                recentTransactionRows.map((transaction) => (
                  <div key={transaction.id} className="text-sm">
                    <p className="font-medium line-clamp-1">{transaction.assets?.name || 'Asset update'}</p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.type.replace('_', ' ')} by {transaction.users?.name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No recent transactions</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="outline">Available {statusCounts.available}</Badge>
              <Badge variant="outline">Out {statusCounts.checked_out}</Badge>
              <Badge variant="outline">Maintenance {statusCounts.maintenance}</Badge>
              <Badge variant="outline">Missing {statusCounts.missing}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary spotlight */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Feedback Queue
            </CardTitle>
            <CardDescription>Most recent track/stem discussion</CardDescription>
          </CardHeader>
          <CardContent>
            {recentStemCommentRows.length > 0 ? (
              <div className="space-y-3">
                {recentStemCommentRows.map((comment) => (
                  <div key={comment.id} className="rounded-lg border p-3">
                    <p className="line-clamp-2 text-sm">{comment.content || 'Comment added'}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {comment.users?.name || 'Unknown user'} - {new Date(comment.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No feedback yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderClock className="h-4 w-4" />
              Delivery Focus
            </CardTitle>
            <CardDescription>Keep production moving this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <p className="font-medium">Tracks in mix/master stages</p>
              <p className="text-muted-foreground">
                {trackStatusBuckets.mixing + trackStatusBuckets.mastering} currently in late-stage production.
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium">Stale risk</p>
              <p className="text-muted-foreground">
                {staleTracks.length} tracks have not been touched in 7+ days.
              </p>
            </div>
            <Button asChild size="sm" className="w-full">
              <Link href="/projects">
                Review Projects
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Fallback for empty accounts */}
      {assets?.length === 0 && weekSessionRows.length === 0 && (tracks?.length || 0) === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">No data yet. Start with a session, asset, or track.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Button asChild size="sm">
                <Link href="/sessions/new">
                  <Plus className="h-4 w-4 mr-1" />
                  New Session
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/assets/new">Add Asset</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/tracks/new">Add Track</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
