'use client'

import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CommentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (content: string) => void
  initialContent?: string
  timestamp: number
  stemName: string
  position?: { x: number; y: number }
}

export default function CommentModal({
  isOpen,
  onClose,
  onSave,
  initialContent = '',
  timestamp,
  stemName,
  position
}: CommentModalProps) {
  const [content, setContent] = useState(initialContent)
  const inputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setContent(initialContent)
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, initialContent])

  // Calculate modal position to keep it within viewport
  const getModalStyle = (): React.CSSProperties => {
    if (!position) {
      // Default centered position
      return {}
    }

    const modalWidth = 384 // w-96 = 24rem = 384px
    const modalHeight = 200 // Approximate height
    const padding = 16

    let left = position.x
    let top = position.y

    // Ensure modal doesn't overflow right edge
    if (left + modalWidth > window.innerWidth - padding) {
      left = window.innerWidth - modalWidth - padding
    }

    // Ensure modal doesn't overflow left edge
    if (left < padding) {
      left = padding
    }

    // Ensure modal doesn't overflow bottom edge
    if (top + modalHeight > window.innerHeight - padding) {
      top = window.innerHeight - modalHeight - padding
    }

    // Ensure modal doesn't overflow top edge
    if (top < padding) {
      top = padding
    }

    return {
      position: 'absolute' as const,
      left: `${left}px`,
      top: `${top}px`,
    }
  }

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim())
      setContent('')
      onClose()
    }
  }

  const handleBlur = () => {
    // Auto-save on blur if there's content
    if (content.trim()) {
      onSave(content.trim())
      setContent('')
    }
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleEmojiClick = (emoji: string) => {
    onSave(emoji)
    onClose()
  }

  if (!isOpen) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const modalStyle = getModalStyle()

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
      style={position ? {} : { display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        ref={modalRef}
        className="bg-background border border-border rounded-lg p-4 w-96 shadow-lg"
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">Add Comment</h3>
            <p className="text-xs text-muted-foreground">
              {stemName} • {formatTime(timestamp)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick emoji reactions */}
        <div className="flex gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-lg hover:scale-110 transition-transform"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleEmojiClick('❤️')}
            title="Love it"
          >
            ❤️
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-lg hover:scale-110 transition-transform"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleEmojiClick('🔥')}
            title="Fire"
          >
            🔥
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-lg hover:scale-110 transition-transform"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleEmojiClick('👍')}
            title="Thumbs up"
          >
            👍
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-lg hover:scale-110 transition-transform"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleEmojiClick('⚠️')}
            title="Needs attention"
          >
            ⚠️
          </Button>
        </div>

        <Input
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder="Type your comment..."
          className="mb-3"
        />

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!content.trim()}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}
