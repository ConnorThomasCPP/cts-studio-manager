'use client'

import { useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'
import { usePlayerStore } from '@/lib/stores/player-store'
import TransportControls from './TransportControls'
import StemTrackRow from './StemTrackRow'
import type { Stem } from '@/types/enhanced'

interface StemPlayerProps {
  trackId: string
  stems: Stem[]
}

export default function StemPlayer({ trackId, stems }: StemPlayerProps) {
  const howlers = useRef<Map<string, Howl>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const animationFrameRef = useRef<number | undefined>(undefined)

  const {
    isPlaying,
    currentTime,
    duration,
    mutedStems,
    stemVolumes,
    playbackSpeed,
    setDuration,
    setCurrentTime,
    play,
    pause,
    resetPlayer
  } = usePlayerStore()

  // Initialize Howler instances for each stem
  useEffect(() => {
    setIsLoading(true)

    // Create Howler instance for each stem
    stems.forEach((stem) => {
      const howl = new Howl({
        src: [stem.file_path],
        html5: true, // Stream for large files
        preload: true,
        volume: stemVolumes[stem.id] ?? 1,
        mute: mutedStems.includes(stem.id),
        rate: playbackSpeed,
        onload: () => {
          // Set duration to max of all stems
          setDuration(howl.duration())
          setIsLoading(false)
        },
        onloaderror: (id, error) => {
          console.error(`Failed to load stem ${stem.name}:`, error)
        }
      })
      howlers.current.set(stem.id, howl)
    })

    // Cleanup on unmount
    return () => {
      howlers.current.forEach((howl) => howl.unload())
      howlers.current.clear()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      resetPlayer()
    }
  }, [stems, trackId])

  // Update playback time
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const updateTime = () => {
      // Get position from first playing stem
      const firstHowl = howlers.current.values().next().value
      if (firstHowl && firstHowl.playing()) {
        const time = firstHowl.seek()
        setCurrentTime(typeof time === 'number' ? time : 0)
      }

      animationFrameRef.current = requestAnimationFrame(updateTime)
    }

    updateTime()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying])

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      // Sync all stems to current time and play
      howlers.current.forEach((howl) => {
        howl.seek(currentTime)
        if (!howl.playing()) {
          howl.play()
        }
      })
    } else {
      // Pause all stems
      howlers.current.forEach((howl) => {
        if (howl.playing()) {
          howl.pause()
        }
      })
    }
  }, [isPlaying])

  // Sync when seeking
  useEffect(() => {
    if (!isPlaying) {
      howlers.current.forEach((howl) => {
        howl.seek(currentTime)
      })
    }
  }, [currentTime, isPlaying])

  // Update mute states
  useEffect(() => {
    howlers.current.forEach((howl, stemId) => {
      howl.mute(mutedStems.includes(stemId))
    })
  }, [mutedStems])

  // Update volumes
  useEffect(() => {
    howlers.current.forEach((howl, stemId) => {
      howl.volume(stemVolumes[stemId] ?? 1)
    })
  }, [stemVolumes])

  // Update playback speed
  useEffect(() => {
    howlers.current.forEach((howl) => {
      howl.rate(playbackSpeed)
    })
  }, [playbackSpeed])

  // Sync drift correction - check every 100ms
  useEffect(() => {
    if (!isPlaying) return

    const syncInterval = setInterval(() => {
      const positions = Array.from(howlers.current.values()).map((h) => {
        const pos = h.seek()
        return typeof pos === 'number' ? pos : 0
      })

      if (positions.length === 0) return

      const avgPosition = positions.reduce((a, b) => a + b, 0) / positions.length

      // Re-sync any stem that drifts more than 50ms
      Array.from(howlers.current.values()).forEach((howl, index) => {
        const pos = positions[index]
        if (Math.abs(pos - avgPosition) > 0.05) {
          howl.seek(avgPosition)
        }
      })
    }, 100)

    return () => clearInterval(syncInterval)
  }, [isPlaying])

  if (!stems || stems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No stems uploaded yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Upload some stems to start playing
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Transport controls */}
      <TransportControls isLoading={isLoading} />

      {/* Stem list */}
      <div className="flex-1 overflow-y-auto bg-surface-0">
        {stems.map((stem) => (
          <StemTrackRow key={stem.id} stem={stem} trackId={trackId} />
        ))}
      </div>
    </div>
  )
}
