'use client'

import { useState } from 'react'
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
  const [showTooltip, setShowTooltip] = useState(false)

  // Calculate position based on timestamp
  const position = (comment.timestamp / duration) * canvasWidth

  // Check if comment is an emoji (short content, likely single emoji)
  const isEmoji = comment.content.length <= 2

  return (
    <div
      className="absolute top-0 bottom-0 cursor-pointer"
      style={{ left: `${position}px` }}
      onClick={onClick}
    >
      {/* Clickable area */}
      <div className="absolute -left-2 -right-2 top-0 bottom-0" />

      {/* Marker with hover */}
      <div
        className="absolute top-1/2 -translate-y-1/2 hover:scale-150 transition-transform z-10"
        onMouseEnter={() => {
          setShowTooltip(true)
          onHover(comment)
        }}
        onMouseLeave={() => {
          setShowTooltip(false)
          onHover(null)
        }}
      >
        {isEmoji ? (
          // Emoji marker
          <div className="text-sm leading-none">
            {comment.content}
          </div>
        ) : (
          // Dot marker for text comments
          <div
            className="w-2 h-2 rounded-full border-2 border-background shadow-sm"
            style={{ backgroundColor: color }}
          />
        )}

        {/* Tooltip next to marker - only show for text comments */}
        {showTooltip && !isEmoji && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none whitespace-nowrap z-20">
            <div className="bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded border border-border shadow-lg">
              {comment.content}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
