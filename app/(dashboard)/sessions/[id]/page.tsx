'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { sessionService } from '@/lib/services/session-service'
import { projectService } from '@/lib/services/project-service'
import { clientService } from '@/lib/services/client-service'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Calendar, Clock, User, Folder, Pencil, Save, X, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { Session } from '@/types/enhanced'

export default function SessionDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    session_name: '',
    client_id: '',
    client_name: '',
    engineer: '',
    start_time: '',
    end_time: '',
    status: 'planned' as 'planned' | 'active' | 'completed' | 'cancelled',
    notes: '',
    project_id: ''
  })

  useEffect(() => {
    loadSession()
    loadProjects()
    loadClients()
  }, [id])

  const loadSession = async () => {
    try {
      const data = await sessionService.getSession(id)
      if (!data) {
        router.push('/sessions')
        return
      }
      setSession(data)
      setFormData({
        session_name: data.session_name,
        client_id: '', // Will be set when clients load
        client_name: data.client_name,
        engineer: data.engineer,
        start_time: data.start_time.slice(0, 16), // Format for datetime-local
        end_time: data.end_time ? data.end_time.slice(0, 16) : '',
        status: data.status,
        notes: data.notes || '',
        project_id: data.project_id || ''
      })
    } catch (error) {
      console.error('Failed to load session:', error)
      toast.error('Failed to load session')
      router.push('/sessions')
    } finally {
      setLoading(false)
    }
  }

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects()
      setProjects(data || [])
    } catch (error) {
      console.error('Failed to load projects:', error)
    }
  }

  const loadClients = async () => {
    try {
      const data = await clientService.getClients()
      setClients(data || [])
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    // Reset form data to original session values
    if (session) {
      setFormData({
        session_name: session.session_name,
        client_id: '',
        client_name: session.client_name,
        engineer: session.engineer,
        start_time: session.start_time.slice(0, 16),
        end_time: session.end_time ? session.end_time.slice(0, 16) : '',
        status: session.status,
        notes: session.notes || '',
        project_id: session.project_id || ''
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await sessionService.updateSession(id, {
        session_name: formData.session_name,
        client_name: formData.client_name,
        engineer: formData.engineer,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        status: formData.status,
        notes: formData.notes || null,
        project_id: formData.project_id || null
      })
      toast.success('Session updated successfully')
      setIsEditing(false)
      loadSession() // Reload to get fresh data
    } catch (error) {
      console.error('Failed to update session:', error)
      toast.error('Failed to update session')
    } finally {
      setSaving(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session) return null

  const sessionStatusColors = {
    planned: 'bg-blue-500/10 text-blue-500',
    active: 'bg-green-500/10 text-green-500',
    completed: 'bg-gray-500/10 text-gray-500',
    cancelled: 'bg-red-500/10 text-red-500'
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const startDateTime = formatDateTime(session.start_time)
  const endDateTime = session.end_time ? formatDateTime(session.end_time) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sessions">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          {isEditing ? (
            <Input
              value={formData.session_name}
              onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
              className="text-3xl font-bold h-auto py-2 px-3 mb-2"
              placeholder="Session Name"
            />
          ) : (
            <h1 className="text-3xl font-bold tracking-tight">{session.session_name}</h1>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-muted-foreground">{startDateTime.date}</span>
            <Badge className={sessionStatusColors[session.status as keyof typeof sessionStatusColors]}>
              {session.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Session
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Session Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Session Details</h2>
          <div className="space-y-4">
            {/* Client */}
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Client</div>
                {isEditing ? (
                  <Select
                    value={formData.client_id}
                    onValueChange={handleClientChange}
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
                ) : (
                  <div className="text-sm font-medium">{session.client_name}</div>
                )}
              </div>
            </div>

            {/* Engineer */}
            <div className="flex items-start gap-3">
              <User className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Engineer</div>
                {isEditing ? (
                  <Input
                    value={formData.engineer}
                    onChange={(e) => setFormData({ ...formData, engineer: e.target.value })}
                  />
                ) : (
                  <div className="text-sm font-medium">{session.engineer}</div>
                )}
              </div>
            </div>

            {/* Start Time */}
            <div className="flex items-start gap-3 pt-3 border-t">
              <Clock className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Start Time</div>
                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  />
                ) : (
                  <div className="text-sm font-medium">
                    {startDateTime.date} at {startDateTime.time}
                  </div>
                )}
              </div>
            </div>

            {/* End Time */}
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">End Time (Optional)</div>
                {isEditing ? (
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                ) : endDateTime ? (
                  <div className="text-sm font-medium">
                    {endDateTime.date} at {endDateTime.time}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">Not set</div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3 pt-3 border-t">
              <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                {isEditing ? (
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
                ) : (
                  <Badge className={sessionStatusColors[session.status as keyof typeof sessionStatusColors]}>
                    {session.status}
                  </Badge>
                )}
              </div>
            </div>

            {/* Project */}
            <div className="flex items-start gap-3 pt-3 border-t">
              <Folder className="h-4 w-4 text-muted-foreground mt-1" />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-1">Project (Optional)</div>
                {isEditing ? (
                  <Select
                    value={formData.project_id}
                    onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : session.project_id && (session as any).projects ? (
                  <Link
                    href={`/projects/${session.project_id}`}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {(session as any).projects.name}
                  </Link>
                ) : (
                  <div className="text-sm text-muted-foreground italic">No project</div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Notes - Large Text Area */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Notes</h2>
          {isEditing ? (
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={16}
              className="resize-y min-h-[300px]"
              placeholder="Add session notes..."
            />
          ) : session.notes ? (
            <div className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[300px] p-4 bg-muted/30 rounded-md">
              {session.notes}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic min-h-[300px] p-4 bg-muted/30 rounded-md">
              No notes for this session
            </p>
          )}
        </Card>
      </div>

      {/* Metadata */}
      {!isEditing && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Metadata</h2>
          <div className="grid gap-4 md:grid-cols-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{session.created_at ? new Date(session.created_at).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{session.updated_at ? new Date(session.updated_at).toLocaleString() : 'N/A'}</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
