import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import StemPlayer from './components/StemPlayer'

export default async function TrackPlayerPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Fetch track with all related data
  const { data: track, error } = await supabase
    .from('tracks')
    .select(`
      *,
      projects(
        id,
        name,
        clients(id, name)
      ),
      stems(*)
    `)
    .eq('id', id)
    .single()

  if (error || !track) {
    notFound()
  }

  // Sort stems by sort_order
  const sortedStems = track.stems?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) || []

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Track header */}
      <div className="p-4 border-b bg-card shrink-0">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold truncate">{track.name}</h1>
            <p className="text-sm text-muted-foreground">
              {track.projects?.clients?.name} • {track.projects?.name}
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
          </div>
        </div>
      </div>

      {/* Stem player */}
      <StemPlayer trackId={track.id} stems={sortedStems} />
    </div>
  )
}
