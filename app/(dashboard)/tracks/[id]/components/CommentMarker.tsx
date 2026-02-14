'use client'

import type { StemComment } from '@/types/enhanced'

interface CommentMarkerProps {
  comment: StemComment
  duration: number
  canvasWidth: number
  color: string
  onHover: (comment: StemComment | null) => void
  onClick: () => void
}

export default function CommentMarker({
  comment,
  duration,
  canvasWidth,
  color,
  onHover,
  onClick
}: CommentMarkerProps) {
  // Calculate position based on timestamp
  const position = (comment.timestamp / duration) * canvasWidth

  return (
    <div
      className="absolute top-0 bottom-0 cursor-pointer group"
      style={{ left: `${position}px` }}
      onMouseEnter={() => onHover(comment)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      {/* Clickable area */}
      <div className="absolute -left-2 -right-2 top-0 bottom-0" />

      {/* Dot marker */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-background shadow-sm group-hover:scale-150 transition-transform"
        style={{ backgroundColor: color }}
      />

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-popover text-popover-foreground text-xs px-2 py-1 rounded border border-border whitespace-nowrap shadow-lg">
          {comment.content}
        </div>
      </div>
    </div>
  )
}
