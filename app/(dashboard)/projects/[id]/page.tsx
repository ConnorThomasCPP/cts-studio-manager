import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Plus, Music, Calendar, Users, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function ProjectDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select(`
      *,
      clients(id, name, email, phone, company),
      tracks(*)
    `)
    .eq('id', id)
    .single()

  if (!project) notFound()

  // Get sessions for this project
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('project_id', id)
    .order('start_time', { ascending: false })

  const projectStatusColors = {
    planning: 'bg-blue-500/10 text-blue-500',
    active: 'bg-green-500/10 text-green-500',
    review: 'bg-yellow-500/10 text-yellow-500',
    completed: 'bg-gray-500/10 text-gray-500',
    archived: 'bg-gray-400/10 text-gray-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Link
              href={`/clients/${project.clients?.id}`}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {project.clients?.name}
            </Link>
            <Badge className={projectStatusColors[project.status as keyof typeof projectStatusColors]}>
              {project.status}
            </Badge>
          </div>
        </div>
        <Link href={`/projects/${id}/edit`}>
          <Button variant="outline">Edit Project</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Project Details</h2>
          <div className="space-y-3">
            {project.description && (
              <div>
                <h3 className="text-sm font-medium mb-1">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </p>
              </div>
            )}

            {project.deadline && (
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Deadline</div>
                  <div className="text-sm font-medium">
                    {new Date(project.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}

            {project.clients && (
              <div className="flex items-center gap-3 pt-3 border-t border-border">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">Client</div>
                  <Link
                    href={`/clients/${project.clients.id}`}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    {project.clients.name}
                  </Link>
                  {project.clients.company && (
                    <div className="text-xs text-muted-foreground">
                      {project.clients.company}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Tracks */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tracks</h2>
            <Link href={`/tracks/new?project=${id}`}>
              <Button size="sm">
                <Plus className="mr-2 h-3 w-3" />
                New Track
              </Button>
            </Link>
          </div>

          {!project.tracks || project.tracks.length === 0 ? (
            <div className="text-center py-8">
              <Music className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No tracks yet
              </p>
              <Link href={`/tracks/new?project=${id}`}>
                <Button size="sm" variant="outline" className="mt-3">
                  Create First Track
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {project.tracks.map((track: any) => (
                <Link key={track.id} href={`/tracks/${track.id}`}>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Button size="icon" className="h-10 w-10 rounded-full shrink-0">
                        <Music className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{track.name}</h3>
                        {track.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                            {track.description}
                          </p>
                        )}
                      </div>
                      {track.bpm && (
                        <div className="text-sm text-muted-foreground">
                          {track.bpm} BPM
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Sessions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Sessions</h2>
          <Link href={`/sessions/new?project=${id}`}>
            <Button size="sm">
              <Plus className="mr-2 h-3 w-3" />
              New Session
            </Button>
          </Link>
        </div>

        {!sessions || sessions.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              No sessions yet
            </p>
            <Link href={`/sessions/new?project=${id}`}>
              <Button size="sm" variant="outline" className="mt-3">
                Create First Session
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {sessions.map((session: any) => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <div className="p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{session.session_name}</h3>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(session.start_time).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                        {' · '}
                        {new Date(session.start_time).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {session.client_name} · {session.engineer}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
