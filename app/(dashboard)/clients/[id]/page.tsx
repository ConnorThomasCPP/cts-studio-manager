import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Building2, Mail, Phone, Plus, Folder } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default async function ClientDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select(`
      *,
      projects(*)
    `)
    .eq('id', id)
    .single()

  if (!client) notFound()

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
        <Link href="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
          {client.company && (
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Building2 className="h-4 w-4" />
              {client.company}
            </p>
          )}
        </div>
        <Link href={`/clients/${id}/edit`}>
          <Button variant="outline">Edit Client</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Information */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
          <div className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${client.email}`}
                  className="text-sm hover:underline"
                >
                  {client.email}
                </a>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${client.phone}`} className="text-sm hover:underline">
                  {client.phone}
                </a>
              </div>
            )}
            {!client.email && !client.phone && (
              <p className="text-sm text-muted-foreground">
                No contact information available
              </p>
            )}
          </div>

          {client.notes && (
            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-medium mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}
        </Card>

        {/* Projects */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Projects</h2>
            <Link href={`/projects/new?client=${id}`}>
              <Button size="sm">
                <Plus className="mr-2 h-3 w-3" />
                New Project
              </Button>
            </Link>
          </div>

          {!client.projects || client.projects.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No projects yet
              </p>
              <Link href={`/projects/new?client=${id}`}>
                <Button size="sm" variant="outline" className="mt-3">
                  Create First Project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {client.projects.map((project: any) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="p-4 rounded-lg border border-border hover:border-primary/20 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{project.name}</h3>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <Badge
                        className={projectStatusColors[project.status as keyof typeof projectStatusColors]}
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
