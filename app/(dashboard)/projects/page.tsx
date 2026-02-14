import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Folder, Plus, Music } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients(id, name),
      tracks(id)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
  }

  const projectStatusColors = {
    planning: 'bg-blue-500/10 text-blue-500',
    active: 'bg-green-500/10 text-green-500',
    review: 'bg-yellow-500/10 text-yellow-500',
    completed: 'bg-gray-500/10 text-gray-500',
    archived: 'bg-gray-400/10 text-gray-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            Manage client projects and their tracks
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <Card className="p-12 text-center">
          <Folder className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No projects yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating your first project
          </p>
          <Link href="/projects/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="p-6 transition-all hover:border-primary/20 hover:shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">
                      {project.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.clients?.name}
                    </p>
                  </div>
                  <Badge
                    className={projectStatusColors[project.status as keyof typeof projectStatusColors]}
                  >
                    {project.status}
                  </Badge>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                    {project.description}
                  </p>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-border text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Music className="h-3 w-3" />
                    <span>{project.tracks?.length || 0} track{project.tracks?.length !== 1 ? 's' : ''}</span>
                  </div>
                  {project.deadline && (
                    <div>
                      Due {new Date(project.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
