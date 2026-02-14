'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { trackService } from '@/lib/services/track-service'
import { projectService } from '@/lib/services/project-service'
import { stemService } from '@/lib/services/stem-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Loader2, Upload, X, Music } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface StemFile {
  file: File
  name: string
  type: 'vocals' | 'drums' | 'bass' | 'guitar' | 'keys' | 'synth' | 'fx' | 'other'
  color: string
}

const stemTypeColors: Record<string, string> = {
  vocals: '#f6bbd6',
  drums: '#348c32',
  bass: '#d4573b',
  guitar: '#f8a01c',
  keys: '#8b5cf6',
  synth: '#06b6d4',
  fx: '#a78bfa',
  other: '#94a3b8'
}

export default function NewTrackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedProject = searchParams.get('project')

  const [loading, setLoading] = useState(false)
  const [uploadingStems, setUploadingStems] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [stems, setStems] = useState<StemFile[]>([])

  const [formData, setFormData] = useState({
    project_id: preselectedProject || '',
    name: '',
    description: '',
    bpm: '',
    key: ''
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectService.getProjects()
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const audioFiles = files.filter(file => file.type.startsWith('audio/'))

    if (audioFiles.length !== files.length) {
      toast.error('Some files were not audio files and were skipped')
    }

    const newStems: StemFile[] = audioFiles.map(file => ({
      file,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      type: 'other',
      color: stemTypeColors.other
    }))

    setStems([...stems, ...newStems])
    e.target.value = '' // Reset input
  }

  const removeStem = (index: number) => {
    setStems(stems.filter((_, i) => i !== index))
  }

  const updateStem = (index: number, field: keyof StemFile, value: any) => {
    const newStems = [...stems]
    newStems[index] = { ...newStems[index], [field]: value }

    // Update color when type changes
    if (field === 'type') {
      newStems[index].color = stemTypeColors[value] || stemTypeColors.other
    }

    setStems(newStems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (stems.length === 0) {
      toast.error('Please upload at least one stem')
      return
    }

    setLoading(true)
    setUploadingStems(true)

    try {
      // Create track
      const track = await trackService.createTrack({
        project_id: formData.project_id,
        name: formData.name,
        description: formData.description || null,
        bpm: formData.bpm ? parseFloat(formData.bpm) : null,
        key: formData.key || null
      })

      toast.success('Track created! Uploading stems...')

      // Upload stems
      let uploadedCount = 0
      for (const stem of stems) {
        try {
          await stemService.createStem(
            formData.project_id,
            track.id,
            stem.name,
            stem.type,
            stem.file,
            stem.color
          )
          uploadedCount++
          toast.success(`Uploaded ${uploadedCount}/${stems.length} stems`)
        } catch (error) {
          console.error(`Failed to upload stem ${stem.name}:`, error)
          toast.error(`Failed to upload ${stem.name}`)
        }
      }

      // Update track duration based on uploaded stems
      await trackService.updateTrackDuration(track.id)

      toast.success(`Track created with ${uploadedCount} stems!`)
      router.push(`/tracks/${track.id}`)
    } catch (error) {
      console.error('Error creating track:', error)
      toast.error('Failed to create track')
    } finally {
      setLoading(false)
      setUploadingStems(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tracks">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Track</h1>
          <p className="text-muted-foreground">
            Create a new track and upload stems
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Track Info */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Track Information</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">
                Project <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                disabled={loadingProjects}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} - {project.clients?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && !loadingProjects && (
                <p className="text-sm text-muted-foreground">
                  No projects found.{' '}
                  <Link href="/projects/new" className="text-primary hover:underline">
                    Create one first
                  </Link>
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Track Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Track Title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="key">Key</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="C Major"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bpm">BPM</Label>
              <Input
                id="bpm"
                type="number"
                step="0.01"
                value={formData.bpm}
                onChange={(e) => setFormData({ ...formData, bpm: e.target.value })}
                placeholder="120"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Track notes..."
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Stem Upload */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Stems</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-center border-2 border-dashed border-border rounded-lg p-8">
              <label className="cursor-pointer text-center">
                <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click to upload audio files or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  WAV, MP3, FLAC, OGG (max 100MB per file)
                </p>
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={uploadingStems}
                />
              </label>
            </div>

            {stems.length > 0 && (
              <div className="space-y-2">
                {stems.map((stem, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                    style={{ borderLeftColor: stem.color, borderLeftWidth: '4px' }}
                  >
                    <Music className="h-4 w-4 text-muted-foreground shrink-0" />

                    <Input
                      value={stem.name}
                      onChange={(e) => updateStem(index, 'name', e.target.value)}
                      placeholder="Stem name"
                      className="flex-1"
                    />

                    <Select
                      value={stem.type}
                      onValueChange={(value: any) => updateStem(index, 'type', value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vocals">Vocals</SelectItem>
                        <SelectItem value="drums">Drums</SelectItem>
                        <SelectItem value="bass">Bass</SelectItem>
                        <SelectItem value="guitar">Guitar</SelectItem>
                        <SelectItem value="keys">Keys</SelectItem>
                        <SelectItem value="synth">Synth</SelectItem>
                        <SelectItem value="fx">FX</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>

                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatFileSize(stem.file.size)}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || !formData.name || !formData.project_id || stems.length === 0}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {uploadingStems ? 'Uploading stems...' : `Create Track (${stems.length} stems)`}
          </Button>
          <Link href="/tracks">
            <Button type="button" variant="outline" disabled={loading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
