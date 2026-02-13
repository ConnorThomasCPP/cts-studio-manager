/**
 * Main Dashboard Page
 *
 * Overview of studio assets and sessions
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Get counts for each asset status
  const { data: assets } = await supabase
    .from('assets')
    .select('status')

  const statusCounts = {
    available: assets?.filter((a) => a.status === 'available').length || 0,
    checked_out: assets?.filter((a) => a.status === 'checked_out').length || 0,
    maintenance: assets?.filter((a) => a.status === 'maintenance').length || 0,
    missing: assets?.filter((a) => a.status === 'missing').length || 0,
  }

  // Get active sessions
  const { data: activeSessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('status', 'active')
    .order('start_time', { ascending: false })

  // Get recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select(`
      *,
      assets(name, asset_code),
      users(name)
    `)
    .order('timestamp', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your studio equipment and sessions
        </p>
      </div>

      {/* Asset Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              {statusCounts.available}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.available}</div>
            <p className="text-xs text-muted-foreground">Ready to use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Checked Out</CardTitle>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
              {statusCounts.checked_out}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.checked_out}</div>
            <p className="text-xs text-muted-foreground">Currently in use</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              {statusCounts.maintenance}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.maintenance}</div>
            <p className="text-xs text-muted-foreground">Needs repair</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing</CardTitle>
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
              {statusCounts.missing}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.missing}</div>
            <p className="text-xs text-muted-foreground">Lost or stolen</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and workflows</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild className="h-auto flex-col gap-2 py-4">
            <Link href="/assets/new">
              <div className="text-2xl">📦</div>
              <div>Add Asset</div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/sessions/new">
              <div className="text-2xl">🎵</div>
              <div>New Session</div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/scan">
              <div className="text-2xl">📱</div>
              <div>Scan Barcode</div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto flex-col gap-2 py-4">
            <Link href="/assets">
              <div className="text-2xl">📋</div>
              <div>View All Assets</div>
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Active Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
            <CardDescription>
              {activeSessions?.length || 0} session(s) in progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeSessions && activeSessions.length > 0 ? (
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="block p-3 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="font-medium">{session.session_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {session.client_name} • {session.engineer}
                    </div>
                    <Badge className="mt-2 bg-green-100 text-green-800 border-green-300">
                      Active
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No active sessions</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href="/sessions/new">Create a session</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest asset transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions && recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction: any) => (
                  <div
                    key={transaction.id}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
                    <div className="flex-1">
                      <div className="font-medium">
                        {transaction.assets?.name || 'Unknown Asset'}
                      </div>
                      <div className="text-muted-foreground">
                        {transaction.type.replace('_', ' ')} by{' '}
                        {transaction.users?.name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
