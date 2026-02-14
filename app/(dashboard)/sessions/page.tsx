import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calendar, Plus, MapPin, Folder } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function SessionsPage() {
  const supabase = await createClient()

  const { data: sessions, error } = await supabase
    .from('sessions')
    .select(`
      *,
      projects(id, name, clients(name))
    `)
    .order('start_time', { ascending: false })

  if (error) {
    console.error('Error fetching sessions:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sessions</h1>
          <p className="text-muted-foreground">
            Manage studio sessions and track work events
          </p>
        </div>
        <Link href="/sessions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No sessions yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating your first session
          </p>
          <Link href="/sessions/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              New Session
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <Card className="p-6 transition-all hover:border-primary/20 hover:shadow-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">
                        {session.session_name}
                      </h3>
                      <Badge variant="outline">
                        {new Date(session.start_time).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                        {session.end_time && ` - ${new Date(session.end_time).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}`}
                      </Badge>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      {new Date(session.start_time).toLocaleDateString('en-GB', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>Client: {session.client_name}</span>
                      <span>•</span>
                      <span>Engineer: {session.engineer}</span>
                    </div>

                    {session.projects && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Folder className="h-3 w-3" />
                        <span>{session.projects.name}</span>
                        {session.projects.clients && (
                          <>
                            <span>•</span>
                            <span>{session.projects.clients.name}</span>
                          </>
                        )}
                      </div>
                    )}

                    {session.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
                        {session.notes}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
