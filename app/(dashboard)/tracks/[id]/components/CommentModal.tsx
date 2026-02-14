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
}

export default function CommentModal({
  isOpen,
  onClose,
  onSave,
  initialContent = '',
  timestamp,
  stemName
}: CommentModalProps) {
  const [content, setContent] = useState(initialContent)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setContent(initialContent)
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, initialContent])

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

  if (!isOpen) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-lg p-4 w-96 shadow-lg"
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
