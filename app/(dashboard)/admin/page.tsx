/**
 * Admin Settings Page
 *
 * Manage locations, categories, and system settings
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, Trash2, Edit2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

// Create Supabase client outside component to ensure proper typing
const getSupabaseClient = () => createClient()

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

type AccountTheme = 'studio-default' | 'neon-space-station' | 'neon-daylight'

const THEME_OPTIONS: Array<{
  value: AccountTheme
  label: string
  description: string
}> = [
  {
    value: 'studio-default',
    label: 'Studio Default',
    description: 'Current baseline studio look',
  },
  {
    value: 'neon-space-station',
    label: 'Neon Space Station',
    description: 'Deep dark surfaces with purple/cyan neon glow',
  },
  {
    value: 'neon-daylight',
    label: 'Neon Daylight',
    description: 'Cream daylight surfaces with vivid neon accents',
  },
]

export default function AdminPage() {
  const router = useRouter()
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
  const [currentAccountName, setCurrentAccountName] = useState<string>('')
  const [accountNameInput, setAccountNameInput] = useState('')
  const [currentRole, setCurrentRole] = useState<'admin' | 'engineer' | 'viewer'>('viewer')
  const [currentAccountTheme, setCurrentAccountTheme] = useState<AccountTheme>('studio-default')
  const [savingTheme, setSavingTheme] = useState(false)
  const [savingAccountName, setSavingAccountName] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  const supabase = getSupabaseClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [locationsResult, categoriesResult, accountsResponse] = await Promise.all([
        supabase.from('locations').select('*').order('name'),
        supabase.from('categories').select('*').order('name'),
        fetch('/api/accounts'),
      ])

      // Load API key separately
      // TODO: Re-enable after settings table migration is applied
      // const settingsResult = await supabase
      //   .from('settings')
      //   .select('*')
      //   .eq('key', 'anthropic_api_key')
      //   .maybeSingle()
      // const apiKeySetting = settingsResult.data as Database['public']['Tables']['settings']['Row'] | null

      if (locationsResult.data) setLocations(locationsResult.data)
      if (categoriesResult.data) setCategories(categoriesResult.data)
      if (accountsResponse.ok) {
        const accountData = await accountsResponse.json()
        setCurrentAccountName(accountData.currentAccountName || '')
        setAccountNameInput(accountData.currentAccountName || '')
        setCurrentRole((accountData.currentRole || 'viewer') as 'admin' | 'engineer' | 'viewer')
        setCurrentAccountTheme((accountData.currentAccountTheme || 'studio-default') as AccountTheme)
      }
      // if (apiKeySetting?.value) {
      //   setApiKey(typeof apiKeySetting.value === 'string' ? apiKeySetting.value : JSON.stringify(apiKeySetting.value))
      // }
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
      // TODO: Re-enable after settings table migration is applied
      // const { data: { user } } = await supabase.auth.getUser()
      // if (!user) throw new Error('Not authenticated')

      // const { error } = await supabase
      //   .from('settings')
      //   .update({
      //     value: apiKey,
      //     updated_at: new Date().toISOString(),
      //   } as Database['public']['Tables']['settings']['Update'])
      //   .eq('key', 'anthropic_api_key')

      // if (error) throw error

      toast.success('API key saved successfully (feature disabled until migration)')
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

  async function handleDeleteAccount() {
    if (deleteConfirmation.trim() !== 'DELETE ACCOUNT') {
      toast.error('Type DELETE ACCOUNT to confirm')
      return
    }

    setDeletingAccount(true)
    try {
      const response = await fetch('/api/accounts/current', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText: deleteConfirmation }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      toast.success('Account deleted successfully')
      setDeleteConfirmation('')

      if (data.hasRemainingAccount) {
        router.push('/dashboard')
        router.refresh()
      } else {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
      }
    } catch (error: any) {
      console.error('Failed to delete account:', error)
      toast.error(error.message || 'Failed to delete account')
    } finally {
      setDeletingAccount(false)
    }
  }

  async function handleSaveTheme() {
    setSavingTheme(true)
    try {
      const response = await fetch('/api/accounts/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: currentAccountTheme }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update account theme')
      }

      toast.success('Account theme updated')
      router.refresh()
    } catch (error: any) {
      console.error('Failed to save account theme:', error)
      toast.error(error.message || 'Failed to save account theme')
    } finally {
      setSavingTheme(false)
    }
  }

  async function handleSaveAccountName() {
    const trimmedName = accountNameInput.trim()
    if (!trimmedName) {
      toast.error('Account name is required')
      return
    }

    setSavingAccountName(true)
    try {
      const response = await fetch('/api/accounts/current', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update account name')
      }

      setCurrentAccountName(data.name || trimmedName)
      setAccountNameInput(data.name || trimmedName)
      toast.success('Account name updated')
      router.refresh()
    } catch (error: any) {
      console.error('Failed to save account name:', error)
      toast.error(error.message || 'Failed to save account name')
    } finally {
      setSavingAccountName(false)
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

      {currentRole === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Account Name</CardTitle>
            <CardDescription>
              Update the workspace name displayed across the app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="account-name">Account Name</Label>
              <Input
                id="account-name"
                value={accountNameInput}
                onChange={(e) => setAccountNameInput(e.target.value)}
                placeholder="Enter account name"
                maxLength={120}
              />
            </div>
            <Button onClick={handleSaveAccountName} disabled={savingAccountName}>
              {savingAccountName ? 'Saving name...' : 'Save Account Name'}
            </Button>
          </CardContent>
        </Card>
      )}

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

      {currentRole === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Account Theme</CardTitle>
            <CardDescription>
              This theme applies to everyone in {currentAccountName || 'this account'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = currentAccountTheme === theme.value
                return (
                  <button
                    key={theme.value}
                    type="button"
                    onClick={() => setCurrentAccountTheme(theme.value)}
                    className={`rounded-xl border p-3 text-left transition ${
                      isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="mb-3 h-16 rounded-lg border overflow-hidden">
                      {theme.value === 'studio-default' && (
                        <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700" />
                      )}
                      {theme.value === 'neon-space-station' && (
                        <div className="h-full w-full bg-[linear-gradient(135deg,#0e0b15,#181324_45%,#24173c_72%,#00ffd5)]" />
                      )}
                      {theme.value === 'neon-daylight' && (
                        <div className="h-full w-full bg-[linear-gradient(135deg,#f8f6f1,#f2efe8_45%,#d8d5de_72%,#4ab8a4)]" />
                      )}
                    </div>
                    <p className="font-medium">{theme.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                  </button>
                )
              })}
            </div>
            <Button onClick={handleSaveTheme} disabled={savingTheme}>
              {savingTheme ? 'Saving theme...' : 'Apply Theme'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Permanently delete the entire account{currentAccountName ? ` (${currentAccountName})` : ''}.
            This removes all account data and cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="delete-account-confirm">
              Type <span className="font-mono">DELETE ACCOUNT</span> to confirm
            </Label>
            <Input
              id="delete-account-confirm"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="DELETE ACCOUNT"
              disabled={deletingAccount}
            />
          </div>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmation.trim() !== 'DELETE ACCOUNT' || deletingAccount}
          >
            {deletingAccount ? 'Deleting account...' : 'Delete Account'}
          </Button>
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
