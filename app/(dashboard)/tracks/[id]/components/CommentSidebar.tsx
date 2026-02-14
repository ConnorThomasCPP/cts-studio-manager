'use client'

import { useState } from 'react'
import { MessageSquare, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { StemComment, Stem } from '@/types/enhanced'

interface CommentWithStem extends StemComment {
  stem?: Stem
}

interface CommentSidebarProps {
  isOpen: boolean
  onClose: () => void
  comments: CommentWithStem[]
  stems: Stem[]
  onSeek: (timestamp: number) => void
  onDelete: (commentId: string) => void
  currentUserId?: string
}

export default function CommentSidebar({
  isOpen,
  onClose,
  comments,
  stems,
  onSeek,
  onDelete,
  currentUserId
}: CommentSidebarProps) {
  const [hoveredComment, setHoveredComment] = useState<string | null>(null)

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Sort comments by timestamp
  const sortedComments = [...comments].sort((a, b) => a.timestamp - b.timestamp)

  // Get stem info for each comment
  const commentsWithStemInfo = sortedComments.map(comment => {
    const stem = stems.find(s => s.id === comment.stem_id)
    return { ...comment, stem }
  })

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="font-semibold">Comments</h2>
          <span className="text-xs text-muted-foreground">
            ({comments.length})
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {commentsWithStemInfo.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-8">
            No comments yet. Enter comment mode and click on a waveform to add one.
          </div>
        ) : (
          commentsWithStemInfo.map((comment) => (
            <div
              key={comment.id}
              className="group relative bg-accent/50 hover:bg-accent rounded-lg p-3 cursor-pointer transition-colors"
              onClick={() => onSeek(comment.timestamp)}
              onMouseEnter={() => setHoveredComment(comment.id)}
              onMouseLeave={() => setHoveredComment(null)}
            >
              {/* Timestamp */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-muted-foreground">
                  {formatTime(comment.timestamp)}
                </span>
                {currentUserId === comment.user_id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 transition-opacity ${
                      hoveredComment === comment.id ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(comment.id)
                    }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>

              {/* Stem name */}
              {comment.stem && (
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: comment.stem.color || '#999999' }}
                >
                  {comment.stem.name}
                </div>
              )}

              {/* Comment content */}
              <p className="text-sm">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
