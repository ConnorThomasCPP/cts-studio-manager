'use client'

/**
 * Calendar Settings Page
 *
 * Manage calendar connections (Google, Outlook, etc.)
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Calendar, Trash2, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import type { CalendarConnection } from '@/types/enhanced'

export default function CalendarSettingsPage() {
  const searchParams = useSearchParams()
  const [connections, setConnections] = useState<CalendarConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadConnections()

    // Check for OAuth callback results
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      toast.success(`Successfully connected ${success} calendar!`)
      // Clear URL params
      window.history.replaceState({}, '', '/settings/calendar')
    }

    if (error) {
      toast.error(`Failed to connect calendar: ${error}`)
      window.history.replaceState({}, '', '/settings/calendar')
    }
  }, [searchParams])

  const loadConnections = async () => {
    try {
      const response = await fetch('/api/calendar/connections')
      if (!response.ok) {
        throw new Error('Failed to fetch connections')
      }
      const data = await response.json()
      setConnections(data)
    } catch (error) {
      console.error('Failed to load connections:', error)
      toast.error('Failed to load calendar connections')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = (provider: 'google' | 'microsoft') => {
    // Redirect to OAuth flow
    window.location.href = `/api/calendar/connect/${provider}`
  }

  const handleDisconnect = async (id: string, provider: string) => {
    if (!confirm(`Are you sure you want to disconnect this ${provider} calendar? All synced events will remain in your calendar, but future sessions won't sync automatically.`)) {
      return
    }

    setActionLoading(id)
    try {
      const response = await fetch(`/api/calendar/connections/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        throw new Error('Failed to delete connection')
      }
      toast.success('Calendar disconnected')
      loadConnections()
    } catch (error) {
      console.error('Failed to disconnect:', error)
      toast.error('Failed to disconnect calendar')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleSync = async (id: string, enabled: boolean) => {
    setActionLoading(id)
    try {
      const response = await fetch(`/api/calendar/connections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync_enabled: enabled }),
      })
      if (!response.ok) {
        throw new Error('Failed to update connection')
      }
      toast.success(enabled ? 'Sync enabled' : 'Sync disabled')
      loadConnections()
    } catch (error) {
      console.error('Failed to toggle sync:', error)
      toast.error('Failed to update sync settings')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRefreshToken = async (id: string) => {
    setActionLoading(id)
    try {
      const response = await fetch(`/api/calendar/connections/${id}/refresh`, {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to refresh token')
      }
      toast.success('Token refreshed successfully')
      loadConnections()
    } catch (error) {
      console.error('Failed to refresh token:', error)
      toast.error('Failed to refresh token. Try reconnecting.')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar Integration</h1>
        <p className="text-muted-foreground">
          Connect your calendar to automatically sync studio sessions
        </p>
      </div>

      {/* Connected Calendars */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Calendars</CardTitle>
            <CardDescription>Manage your calendar connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">
                        {connection.provider_account_email}
                      </span>
                      <Badge
                        variant={
                          connection.provider === 'google'
                            ? 'default'
                            : connection.provider === 'microsoft'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {connection.provider}
                      </Badge>
                      {connection.sync_enabled ? (
                        <Badge variant="outline" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Paused
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {connection.calendar_name}
                      {connection.last_sync_at && (
                        <> · Last synced: {new Date(connection.last_sync_at).toLocaleString()}</>
                      )}
                    </p>
                    {connection.last_sync_error && (
                      <p className="text-sm text-destructive mt-1">
                        Error: {connection.last_sync_error}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={connection.sync_enabled}
                      onCheckedChange={(checked) =>
                        handleToggleSync(connection.id, checked)
                      }
                      disabled={actionLoading === connection.id}
                    />
                    <Label className="text-sm">Sync</Label>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRefreshToken(connection.id)}
                    disabled={actionLoading === connection.id}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        actionLoading === connection.id ? 'animate-spin' : ''
                      }`}
                    />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      handleDisconnect(connection.id, connection.provider)
                    }
                    disabled={actionLoading === connection.id}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Connect New Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Calendar</CardTitle>
          <CardDescription>
            Add a new calendar connection to sync your sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => handleConnect('google')}
            className="w-full justify-start"
            variant="outline"
            size="lg"
          >
            <Calendar className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Connect Google Calendar</div>
              <div className="text-xs text-muted-foreground">
                Sync with your Google Calendar account
              </div>
            </div>
          </Button>

          <Button
            onClick={() => handleConnect('microsoft')}
            className="w-full justify-start"
            variant="outline"
            size="lg"
            disabled
          >
            <Calendar className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Connect Outlook Calendar</div>
              <div className="text-xs text-muted-foreground">
                Coming soon - Microsoft Graph integration
              </div>
            </div>
          </Button>

          <Button
            disabled
            className="w-full justify-start"
            variant="outline"
            size="lg"
          >
            <Calendar className="mr-3 h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Connect Apple Calendar</div>
              <div className="text-xs text-muted-foreground">
                Future enhancement - iCloud calendar sync
              </div>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Calendar Sync Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Automatic Event Creation</p>
              <p className="text-sm text-muted-foreground">
                When you create a session, it's automatically added to your connected
                calendar with all session details
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Two-Way Sync</p>
              <p className="text-sm text-muted-foreground">
                Updates to sessions are reflected in your calendar, keeping everything
                in sync
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Team Invites</p>
              <p className="text-sm text-muted-foreground">
                Add team members as attendees and they'll receive calendar invites
                automatically
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Privacy & Security</p>
              <p className="text-sm text-muted-foreground">
                Your calendar credentials are encrypted and only you can access your
                connections
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* No Connections Empty State */}
      {connections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No calendars connected</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              Connect your Google Calendar to automatically sync studio sessions and
              keep your schedule up to date
            </p>
            <Button onClick={() => handleConnect('google')}>
              <Calendar className="mr-2 h-4 w-4" />
              Connect Google Calendar
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
