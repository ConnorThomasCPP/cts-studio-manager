'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { sessionService } from '@/lib/services/session-service'
import { projectService } from '@/lib/services/project-service'
import { clientService } from '@/lib/services/client-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { CalendarConnection, User } from '@/types/enhanced'

export default function NewSessionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProject = searchParams.get('project')

  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [clients, setClients] = useState<any[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([])
  const [loadingCalendars, setLoadingCalendars] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([])
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([])
  const [formData, setFormData] = useState({
    project_id: preselectedProject || '',
    session_name: '',
    client_id: '',
    client_name: '',
    engineer: '',
    start_time: '',
    end_time: '',
    status: 'planned' as 'planned' | 'active' | 'completed' | 'cancelled',
    notes: ''
  })

  useEffect(() => {
    loadProjects()
    loadClients()
    loadCalendarConnections()
    loadUsers()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects()
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadClients = async () => {
    try {
      const data = await clientService.getClients()
      setClients(data || [])
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoadingClients(false)
    }
  }

  const loadCalendarConnections = async () => {
    try {
      const response = await fetch('/api/calendar/connections')
      if (response.ok) {
        const data = await response.json()
        setCalendarConnections(data || [])
        // Auto-select calendars with auto_create_events enabled
        const autoSelected = data
          .filter((conn: CalendarConnection) => conn.auto_create_events)
          .map((conn: CalendarConnection) => conn.id)
        setSelectedCalendars(autoSelected)
      }
    } catch (error) {
      console.error('Error loading calendar connections:', error)
    } finally {
      setLoadingCalendars(false)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleClientChange = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId)
    setFormData({
      ...formData,
      client_id: clientId,
      client_name: selectedClient?.name || ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const session = await sessionService.createSession({
        project_id: formData.project_id || null,
        session_name: formData.session_name,
        client_name: formData.client_name,
        engineer: formData.engineer,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        status: formData.status,
        notes: formData.notes || null
      })

      // Sync to selected calendars
      if (selectedCalendars.length > 0) {
        try {
          const syncResponse = await fetch('/api/calendar/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: session.id,
              connectionIds: selectedCalendars,
              attendeeUserIds: selectedAttendees,
            }),
          })

          if (syncResponse.ok) {
            toast.success('Session created and synced to calendar(s)')
          } else {
            toast.success('Session created (calendar sync had issues)')
          }
        } catch (syncError) {
          console.error('Failed to sync to calendar:', syncError)
          toast.success('Session created (calendar sync failed)')
        }
      } else {
        toast.success('Session created successfully')
      }

      router.push(`/sessions/${session.id}`)
    } catch (error) {
      console.error('Error creating session:', error)
      toast.error('Failed to create session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sessions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Session</h1>
          <p className="text-muted-foreground">
            Create a new studio session
          </p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="session_name">
              Session Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="session_name"
              value={formData.session_name}
              onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client">
                Client <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.client_id}
                onValueChange={handleClientChange}
                disabled={loadingClients}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {clients.length === 0 && !loadingClients && (
                <p className="text-sm text-muted-foreground">
                  No clients found.{' '}
                  <Link href="/clients/new" className="text-primary hover:underline">
                    Create one first
                  </Link>
                </p>
              )}
              {clients.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Don't see your client?{' '}
                  <Link href="/clients/new" className="text-primary hover:underline">
                    Create new client
                  </Link>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="engineer">
                Engineer <span className="text-destructive">*</span>
              </Label>
              <Input
                id="engineer"
                value={formData.engineer}
                onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project (Optional)</Label>
            <Select
              value={formData.project_id}
              onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              disabled={loadingProjects}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name} - {project.clients?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {projects.length === 0 && !loadingProjects && (
              <p className="text-sm text-muted-foreground">
                No projects found.{' '}
                <Link href="/projects/new" className="text-primary hover:underline">
                  Create one first
                </Link>
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_time">
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>

          {/* Calendar Integration */}
          {!loadingCalendars && calendarConnections.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <CardTitle>Calendar Sync</CardTitle>
                </div>
                <CardDescription>
                  Add this session to your connected calendars
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {calendarConnections.map((connection) => (
                  <div key={connection.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`calendar-${connection.id}`}
                      checked={selectedCalendars.includes(connection.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCalendars([...selectedCalendars, connection.id])
                        } else {
                          setSelectedCalendars(
                            selectedCalendars.filter((id) => id !== connection.id)
                          )
                        }
                      }}
                    />
                    <Label
                      htmlFor={`calendar-${connection.id}`}
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <span>{connection.provider_account_email}</span>
                      <span className="text-muted-foreground">
                        ({connection.provider})
                      </span>
                    </Label>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Attendees */}
          {!loadingUsers && users.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <CardTitle>Session Attendees</CardTitle>
                </div>
                <CardDescription>
                  Add team members who will receive calendar invites
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`attendee-${user.id}`}
                        checked={selectedAttendees.includes(user.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAttendees([...selectedAttendees, user.id])
                          } else {
                            setSelectedAttendees(
                              selectedAttendees.filter((id) => id !== user.id)
                            )
                          }
                        }}
                      />
                      <Label
                        htmlFor={`attendee-${user.id}`}
                        className="text-sm font-normal cursor-pointer flex items-center gap-2"
                      >
                        <span>{user.name}</span>
                        {user.role && (
                          <span className="text-xs text-muted-foreground">
                            ({user.role})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedAttendees.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedAttendees.length} attendee(s) selected
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading || !formData.session_name || !formData.client_id || !formData.engineer || !formData.start_time}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Session
            </Button>
            <Link href="/sessions">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
