'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayerStore } from '@/lib/stores/player-store'
import { stemService } from '@/lib/services/stem-service'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Stem, WaveformData, StemComment } from '@/types/enhanced'
import WaveformCanvas from './WaveformCanvas'
import StemHeader from './StemHeader'

interface StemTrackRowProps {
  stem: Stem
  trackId: string
  comments?: StemComment[]
  onCommentClick?: (timestamp: number, position: { x: number; y: number }) => void
}

export default function StemTrackRow({
  stem,
  trackId,
  comments = [],
  onCommentClick
}: StemTrackRowProps) {
  const router = useRouter()
  const [downloading, setDownloading] = useState(false)
  const [showVolume, setShowVolume] = useState(false)

  const {
    mutedStems,
    stemVolumes,
    soloStem,
    toggleMute,
    setVolume,
    setSolo
  } = usePlayerStore()

  const isMuted = mutedStems.includes(stem.id)
  const isSolo = soloStem === stem.id
  const volume = stemVolumes[stem.id] ?? 1

  // Initialize volume in store if not set (useEffect to avoid setState during render)
  useEffect(() => {
    if (stemVolumes[stem.id] === undefined) {
      setVolume(stem.id, 1)
    }
  }, [stem.id, stemVolumes, setVolume])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const signedUrl = await stemService.getDownloadUrl(stem.id)

      // Create download link
      const link = document.createElement('a')
      link.href = signedUrl
      link.download = `${stem.name}.${stem.file_path.split('.').pop()}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Downloading ${stem.name}`)
    } catch (error) {
      console.error('Error downloading stem:', error)
      toast.error('Failed to download stem')
    } finally {
      setDownloading(false)
    }
  }

  const handleSolo = () => {
    if (isSolo) {
      setSolo(null) // Clear solo
    } else {
      setSolo(stem.id) // Solo this stem
    }
  }

  const waveformPeaks = (stem.waveform_data as WaveformData | null)?.peaks || []

  const handleUpdate = () => {
    router.refresh()
  }

  return (
    <div
      className="border-b hover:bg-accent/50 transition-colors group flex"
      style={{
        borderLeftColor: stem.color ?? undefined,
        borderLeftWidth: '4px'
      }}
    >
      {/* Left sidebar - M/S/Vol buttons (DAW style) */}
      <div className="flex flex-col gap-1 p-2 border-r border-border relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleMute(stem.id)}
          className={`h-7 w-7 p-0 font-bold text-xs ${isMuted ? 'bg-destructive/20 text-destructive' : ''}`}
          disabled={soloStem !== null && !isSolo}
          title="Mute"
        >
          M
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleSolo}
          className={`h-7 w-7 p-0 font-bold text-xs ${isSolo ? 'bg-primary text-primary-foreground' : ''}`}
          title="Solo"
        >
          S
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowVolume(!showVolume)}
          className={`h-7 w-7 p-0 font-bold text-xs ${showVolume ? 'bg-accent' : ''}`}
          title="Volume"
        >
          V
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col relative">
        {/* Waveform */}
        {waveformPeaks.length > 0 && stem.duration && (
          <WaveformCanvas
            peaks={waveformPeaks}
            duration={stem.duration}
            color={stem.color || '#999999'}
            stemId={stem.id}
            comments={comments}
            onCommentClick={onCommentClick}
            stemName={stem.name}
          />
        )}

        {/* Volume slider overlay - shown when Vol button is clicked */}
        {showVolume && (
          <div className="absolute top-2 left-2 bg-surface-1/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg z-10 min-w-[200px]">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                onValueChange={(value) => setVolume(stem.id, value[0] / 100)}
                className="cursor-pointer flex-1"
                disabled={soloStem !== null && !isSolo}
              />
            </div>
          </div>
        )}

        {/* Bottom controls */}
        <div className="flex items-center gap-4 px-4 py-2">
          {/* Stem info with editable name and icon */}
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <StemHeader stem={stem} onUpdate={handleUpdate} />

            {stem.duration && (
              <p className="text-xs text-muted-foreground font-mono ml-auto">
                {Math.floor(stem.duration / 60)}:{Math.floor(stem.duration % 60).toString().padStart(2, '0')}
              </p>
            )}
          </div>

          {/* Download button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            disabled={downloading}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
