'use client'

import { usePlayerStore } from '@/lib/stores/player-store'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Play, Pause, SkipBack, SkipForward, Repeat, Loader2 } from 'lucide-react'

interface TransportControlsProps {
  isLoading?: boolean
}

export default function TransportControls({ isLoading }: TransportControlsProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    playbackSpeed,
    isLooping,
    play,
    pause,
    seek,
    setPlaybackSpeed,
    toggleLoop
  } = usePlayerStore()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSkipBackward = () => {
    seek(Math.max(0, currentTime - 5))
  }

  const handleSkipForward = () => {
    seek(Math.min(duration, currentTime + 5))
  }

  return (
    <div className="flex items-center justify-between p-4 border-b bg-card shrink-0">
      {/* Playback controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkipBackward}
          disabled={isLoading}
        >
          <SkipBack className="h-5 w-5" />
        </Button>

        <Button
          size="icon"
          className="h-12 w-12"
          onClick={() => (isPlaying ? pause() : play())}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkipForward}
          disabled={isLoading}
        >
          <SkipForward className="h-5 w-5" />
        </Button>

        <Button
          variant={isLooping ? 'default' : 'ghost'}
          size="icon"
          onClick={toggleLoop}
          disabled={isLoading}
        >
          <Repeat className="h-4 w-4" />
        </Button>
      </div>

      {/* Time display */}
      <div className="flex items-center gap-3">
        <div className="text-sm font-mono text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Playback speed */}
        {!isLoading && (
          <Select
            value={playbackSpeed.toString()}
            onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="0.75">0.75x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="1.25">1.25x</SelectItem>
              <SelectItem value="1.5">1.5x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
