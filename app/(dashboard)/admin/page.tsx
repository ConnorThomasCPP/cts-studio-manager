/**
 * Admin Settings Page
 *
 * Manage locations, categories, and system settings
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2, X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

type Location = {
  id: string
  name: string
  description: string | null
}

type Category = {
  id: string
  name: string
  color: string | null
}

export default function AdminPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [locationDialogOpen, setLocationDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [apiKey, setApiKey] = useState('')
  const [savingApiKey, setSavingApiKey] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [locationsResult, categoriesResult] = await Promise.all([
        supabase.from('locations').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
      ])

      const settingsResult = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'anthropic_api_key')
        .maybeSingle()

      if (locationsResult.data) setLocations(locationsResult.data)
      if (categoriesResult.data) setCategories(categoriesResult.data)
      if (settingsResult.data?.value) setApiKey(settingsResult.data.value)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveApiKey() {
    setSavingApiKey(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('settings')
        .update({
          value: apiKey,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('key', 'anthropic_api_key')

      if (error) throw error

      toast.success('API key saved successfully')
      setShowApiKey(false)
    } catch (error: any) {
      console.error('Failed to save API key:', error)
      toast.error(error.message || 'Failed to save API key')
    } finally {
      setSavingApiKey(false)
    }
  }

  async function handleSaveLocation(formData: FormData) {
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!name) {
      toast.error('Location name is required')
      return
    }

    try {
      if (editingLocation) {
        const { error } = await supabase
          .from('locations')
          .update({ name, description })
          .eq('id', editingLocation.id)

        if (error) throw error
        toast.success('Location updated')
      } else {
        const { error } = await supabase
          .from('locations')
          .insert({ name, description })

        if (error) throw error
        toast.success('Location added')
      }

      setLocationDialogOpen(false)
      setEditingLocation(null)
      loadData()
    } catch (error: any) {
      console.error('Failed to save location:', error)
      toast.error(error.message || 'Failed to save location')
    }
  }

  async function handleSaveCategory(formData: FormData) {
    const name = formData.get('name') as string
    const color = formData.get('color') as string

    if (!name) {
      toast.error('Category name is required')
      return
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update({ name, color: color || null })
          .eq('id', editingCategory.id)

        if (error) throw error
        toast.success('Category updated')
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({ name, color: color || null })

        if (error) throw error
        toast.success('Category added')
      }

      setCategoryDialogOpen(false)
      setEditingCategory(null)
      loadData()
    } catch (error: any) {
      console.error('Failed to save category:', error)
      toast.error(error.message || 'Failed to save category')
    }
  }

  async function handleDeleteLocation(id: string) {
    if (!confirm('Are you sure you want to delete this location?')) return

    try {
      const { error } = await supabase.from('locations').delete().eq('id', id)
      if (error) throw error
      toast.success('Location deleted')
      loadData()
    } catch (error: any) {
      console.error('Failed to delete location:', error)
      toast.error(error.message || 'Failed to delete location')
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Are you sure you want to delete this category?')) return

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id)
      if (error) throw error
      toast.success('Category deleted')
      loadData()
    } catch (error: any) {
      console.error('Failed to delete category:', error)
      toast.error(error.message || 'Failed to delete category')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <p className="text-muted-foreground">Manage locations, categories, and system settings</p>
      </div>

      {/* Locations */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Locations</CardTitle>
              <CardDescription>Manage physical locations for asset storage</CardDescription>
            </div>
            <Button onClick={() => setLocationDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {locations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No locations yet</p>
            ) : (
              locations.map((location) => (
                <div
                  key={location.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{location.name}</div>
                    {location.description && (
                      <div className="text-sm text-muted-foreground">{location.description}</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingLocation(location)
                        setLocationDialogOpen(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteLocation(location.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Categories</CardTitle>
              <CardDescription>Manage asset categories and colors</CardDescription>
            </div>
            <Button onClick={() => setCategoryDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet</p>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {category.color && (
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: category.color }}
                      />
                    )}
                    <div className="font-medium">{category.name}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingCategory(category)
                        setCategoryDialogOpen(true)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteCategory(category.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Settings */}
      <Card>
        <CardHeader>
          <CardTitle>API Settings</CardTitle>
          <CardDescription>Configure API keys for AI features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api_key">Anthropic API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="api_key"
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-..."
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? 'Hide' : 'Show'}
              </Button>
              <Button
                type="button"
                onClick={handleSaveApiKey}
                disabled={savingApiKey}
              >
                {savingApiKey ? 'Saving...' : 'Save'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Required for AI-powered replacement cost search. Get your key from{' '}
              <a
                href="https://console.anthropic.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Location Dialog */}
      <Dialog
        open={locationDialogOpen}
        onOpenChange={(open) => {
          setLocationDialogOpen(open)
          if (!open) setEditingLocation(null)
        }}
      >
        <DialogContent>
          <form action={handleSaveLocation}>
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Edit Location' : 'Add Location'}
              </DialogTitle>
              <DialogDescription>
                {editingLocation
                  ? 'Update the location details'
                  : 'Add a new physical location for asset storage'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., Studio A, Storage Room"
                  defaultValue={editingLocation?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Additional details about this location"
                  defaultValue={editingLocation?.description || ''}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setLocationDialogOpen(false)
                  setEditingLocation(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingLocation ? 'Update' : 'Add'} Location
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open)
          if (!open) setEditingCategory(null)
        }}
      >
        <DialogContent>
          <form action={handleSaveCategory}>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Update the category details'
                  : 'Add a new asset category with optional color'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  name="name"
                  placeholder="e.g., Microphones, Cables"
                  defaultValue={editingCategory?.name}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    name="color"
                    type="color"
                    className="w-20"
                    defaultValue={editingCategory?.color || '#3b82f6'}
                  />
                  <Input
                    type="text"
                    placeholder="#3b82f6"
                    defaultValue={editingCategory?.color || ''}
                    onChange={(e) => {
                      const colorInput = document.getElementById('color') as HTMLInputElement
                      if (colorInput && e.target.value.match(/^#[0-9A-F]{6}$/i)) {
                        colorInput.value = e.target.value
                      }
                    }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCategoryDialogOpen(false)
                  setEditingCategory(null)
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? 'Update' : 'Add'} Category
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
