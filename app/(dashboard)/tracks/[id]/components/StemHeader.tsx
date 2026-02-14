'use client'

import { useState } from 'react'
import { stemService } from '@/lib/services/stem-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Mic,
  Music2,
  Music3,
  AudioWaveform,
  Waves,
  Sparkles,
  Music,
  Circle,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/database'
import { LucideIcon } from 'lucide-react'

type Stem = Database['public']['Tables']['stems']['Row']

interface StemHeaderProps {
  stem: Stem
  onUpdate?: () => void
}

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  mic: Mic,
  'music2': Music2,
  'music3': Music3,
  'audio-waveform': AudioWaveform,
  waves: Waves,
  sparkles: Sparkles,
  music: Music,
  circle: Circle
}

const iconOptions = [
  { value: 'mic', label: 'Microphone', Icon: Mic },
  { value: 'music2', label: 'Guitar', Icon: Music2 },
  { value: 'music3', label: 'Keys', Icon: Music3 },
  { value: 'audio-waveform', label: 'Synth', Icon: AudioWaveform },
  { value: 'waves', label: 'Bass', Icon: Waves },
  { value: 'sparkles', label: 'Effects', Icon: Sparkles },
  { value: 'music', label: 'Music', Icon: Music },
  { value: 'circle', label: 'Drums', Icon: Circle }
]

const colorPresets = [
  { name: 'Pink', value: '#f6bbd6' },
  { name: 'Green', value: '#348c32' },
  { name: 'Orange', value: '#d4573b' },
  { name: 'Yellow', value: '#f8a01c' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Lavender', value: '#a78bfa' },
  { name: 'Gray', value: '#94a3b8' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Amber', value: '#f59e0b' }
]

export default function StemHeader({ stem, onUpdate }: StemHeaderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(stem.name)
  const [saving, setSaving] = useState(false)

  const Icon = iconMap[stem.icon] || Music

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      toast.error('Stem name cannot be empty')
      return
    }

    if (editedName === stem.name) {
      setIsEditing(false)
      return
    }

    setSaving(true)
    try {
      await stemService.updateStem(stem.id, { name: editedName })
      toast.success('Stem name updated')
      setIsEditing(false)
      onUpdate?.()
    } catch (error) {
      console.error('Error updating stem name:', error)
      toast.error('Failed to update stem name')
    } finally {
      setSaving(false)
    }
  }

  const handleIconChange = async (newIcon: string) => {
    setSaving(true)
    try {
      await stemService.updateStem(stem.id, { icon: newIcon })
      toast.success('Icon updated')
      onUpdate?.()
    } catch (error) {
      console.error('Error updating icon:', error)
      toast.error('Failed to update icon')
    } finally {
      setSaving(false)
    }
  }

  const handleColorChange = async (newColor: string) => {
    setSaving(true)
    try {
      await stemService.updateStem(stem.id, { color: newColor })
      toast.success('Color updated')
      onUpdate?.()
    } catch (error) {
      console.error('Error updating color:', error)
      toast.error('Failed to update color')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      setEditedName(stem.name)
      setIsEditing(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Icon selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 hover:bg-accent"
            disabled={saving}
          >
            <Icon className="h-4 w-4" style={{ color: stem.color }} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>Icon</DropdownMenuLabel>
          {iconOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleIconChange(option.value)}
              className="flex items-center gap-2"
            >
              <option.Icon className="h-4 w-4" />
              <span>{option.label}</span>
              {stem.icon === option.value && <Check className="h-4 w-4 ml-auto" />}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuLabel>Color</DropdownMenuLabel>
          <div className="grid grid-cols-6 gap-2 p-2">
            {colorPresets.map((color) => (
              <button
                key={color.value}
                onClick={() => handleColorChange(color.value)}
                className="h-8 w-8 rounded border-2 hover:scale-110 transition-transform relative"
                style={{
                  backgroundColor: color.value,
                  borderColor: stem.color === color.value ? '#ffffff' : 'transparent'
                }}
                title={color.name}
              >
                {stem.color === color.value && (
                  <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                )}
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Editable name */}
      {isEditing ? (
        <Input
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onBlur={handleSaveName}
          onKeyDown={handleKeyDown}
          className="h-6 text-sm font-medium px-2 py-0"
          style={{ color: stem.color }}
          autoFocus
          disabled={saving}
        />
      ) : (
        <h3
          className="font-medium truncate text-sm hover:text-primary transition-colors cursor-pointer"
          style={{ color: stem.color }}
          onClick={() => setIsEditing(true)}
        >
          {stem.name}
        </h3>
      )}

      {stem.type && (
        <Badge variant="outline" className="text-xs capitalize">
          {stem.type}
        </Badge>
      )}
    </div>
  )
}
