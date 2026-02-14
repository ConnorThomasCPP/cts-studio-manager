import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Music, Plus, Play, Layers } from 'lucide-react'

export default async function TracksPage() {
  const supabase = await createClient()

  const { data: tracks, error } = await supabase
    .from('tracks')
    .select(`
      *,
      projects(
        id,
        name,
        clients(id, name)
      ),
      stems(id)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tracks:', error)
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '--:--'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tracks</h1>
          <p className="text-muted-foreground">
            Browse and play all your project tracks
          </p>
        </div>
        <Link href="/tracks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Track
          </Button>
        </Link>
      </div>

      {!tracks || tracks.length === 0 ? (
        <Card className="p-12 text-center">
          <Music className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">No tracks yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Get started by creating your first track
          </p>
          <Link href="/tracks/new">
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              New Track
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tracks.map((track) => (
            <Card
              key={track.id}
              className="p-6 transition-all hover:border-primary/20 hover:shadow-lg"
            >
              <div className="flex items-center gap-4">
                {/* Play button */}
                <Link href={`/tracks/${track.id}`}>
                  <Button size="icon" className="h-12 w-12 rounded-full shrink-0">
                    <Play className="h-5 w-5 ml-0.5" />
                  </Button>
                </Link>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/tracks/${track.id}`}>
                    <h3 className="font-semibold text-lg hover:text-primary transition-colors truncate">
                      {track.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{track.projects?.clients?.name}</span>
                    <span>•</span>
                    <span>{track.projects?.name}</span>
                  </div>
                </div>

                {/* Track metadata */}
                <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                  {track.bpm && (
                    <div className="text-center">
                      <div className="font-mono font-semibold text-foreground">
                        {track.bpm}
                      </div>
                      <div className="text-xs">BPM</div>
                    </div>
                  )}
                  {track.key && (
                    <div className="text-center">
                      <div className="font-semibold text-foreground">{track.key}</div>
                      <div className="text-xs">Key</div>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    <span>{track.stems?.length || 0} stems</span>
                  </div>
                  <div className="font-mono">
                    {formatDuration(track.duration)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
