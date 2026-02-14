'use client'

import { useEffect, useRef } from 'react'
import { usePlayerStore } from '@/lib/stores/player-store'

interface WaveformCanvasProps {
  peaks: number[]
  duration: number
  color: string
  stemId: string
}

export default function WaveformCanvas({ peaks, duration, color, stemId }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { currentTime, seek } = usePlayerStore()

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !peaks || peaks.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size (account for device pixel ratio for sharpness)
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Draw waveform
    const barWidth = rect.width / peaks.length
    const centerY = rect.height / 2

    // Draw bars
    peaks.forEach((peak, i) => {
      const barHeight = peak * (rect.height * 0.8) // Use 80% of height
      const x = i * barWidth
      const y = centerY - barHeight / 2

      // Determine if this bar is before or after current playhead
      const barTime = (i / peaks.length) * duration
      const isPlayed = barTime <= currentTime

      // Set color based on playback position
      ctx.fillStyle = isPlayed ? color : `${color}CC` // CC is hex for ~80% opacity

      ctx.fillRect(x, y, Math.max(barWidth - 1, 1), barHeight)
    })

    // Draw playback cursor
    const cursorX = (currentTime / duration) * rect.width
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cursorX, 0)
    ctx.lineTo(cursorX, rect.height)
    ctx.stroke()
  }, [peaks, duration, currentTime, color])

  // Handle click to seek
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const newTime = percent * duration

    seek(newTime)
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full h-16 cursor-pointer rounded hover:opacity-90 transition-opacity"
      style={{ display: 'block' }}
    />
  )
}
