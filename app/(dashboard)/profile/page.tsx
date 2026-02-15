/**
 * User Profile Page
 *
 * Edit user profile including name, photo, and other details
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Upload, User, Calendar, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import md5 from 'md5'
import type { CalendarConnection } from '@/types/enhanced'

type UserProfile = {
  id: string
  first_name: string | null
  last_name: string | null
  name: string | null
  email: string
  photo_url: string | null
  role: string
}

function getGravatarUrl(email: string, size: number = 200): string {
  const hash = md5(email.trim().toLowerCase())
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [calendarConnections, setCalendarConnections] = useState<CalendarConnection[]>([])
  const [loadingCalendars, setLoadingCalendars] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    loadCalendarConnections()
  }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  async function loadCalendarConnections() {
    setLoadingCalendars(true)
    try {
      const response = await fetch('/api/calendar/connections')
      if (!response.ok) {
        throw new Error('Failed to fetch connections')
      }
      const data = await response.json()
      setCalendarConnections(data)
    } catch (error) {
      console.error('Failed to load calendar connections:', error)
      // Don't show error toast, just silently fail
    } finally {
      setLoadingCalendars(false)
    }
  }

  function handleConnectCalendar(provider: 'google' | 'microsoft') {
    window.location.href = `/api/calendar/connect/${provider}`
  }

  async function handleSaveProfile(formData: FormData) {
    if (!profile) return

    setSaving(true)
    try {
      const firstName = formData.get('first_name') as string
      const lastName = formData.get('last_name') as string

      // Update name to be the combination (fallback to 'User' if both names are empty)
      const name = [firstName, lastName].filter(Boolean).join(' ') || 'User'

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName || null,
          last_name: lastName || null,
          name: name,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save profile')
      }

      toast.success('Profile updated successfully')
      loadProfile()
    } catch (error: any) {
      console.error('Failed to save profile:', error)
      toast.error(error.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!profile) return
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${profile.id}.${fileExt}`
      const filePath = `profile-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('asset-photos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('asset-photos')
        .getPublicUrl(filePath)

      // Update profile
      const updateResponse = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: publicUrl }),
      })
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update profile photo')
      }

      toast.success('Profile photo updated')
      loadProfile()
    } catch (error: any) {
      console.error('Failed to upload photo:', error)
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemovePhoto() {
    if (!profile) return

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: null }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to remove photo')
      }

      toast.success('Profile photo removed')
      loadProfile()
    } catch (error: any) {
      console.error('Failed to remove photo:', error)
      toast.error(error.message || 'Failed to remove photo')
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!profile) {
    return <div className="p-8">Failed to load profile</div>
  }

  const displayPhotoUrl = profile.photo_url || getGravatarUrl(profile.email)
  const initials = [profile.first_name?.[0], profile.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || profile.email[0].toUpperCase()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your profile information and photo</p>
      </div>

      {/* Profile Photo */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>
            {profile.photo_url
              ? 'Your custom profile photo'
              : 'Using Gravatar (based on your email)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={displayPhotoUrl} alt={profile.name || profile.email} />
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  onClick={() => document.getElementById('photo-upload')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
                {profile.photo_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleRemovePhoto}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <p className="text-xs text-muted-foreground">
                {profile.photo_url
                  ? 'JPG, PNG or GIF. Max 5MB.'
                  : 'Upload a custom photo or update your Gravatar at gravatar.com'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your name and other details</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  placeholder="John"
                  defaultValue={profile.first_name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  placeholder="Doe"
                  defaultValue={profile.last_name || ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed here. Contact an administrator to update your email.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                name="role"
                value={profile.role}
                disabled
                className="bg-muted capitalize"
              />
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Calendar Connections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>
                Connect your calendar to sync studio sessions
              </CardDescription>
            </div>
            <Link href="/settings/calendar">
              <Button variant="outline" size="sm">
                Manage Calendars
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCalendars ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : calendarConnections.length > 0 ? (
            <div className="space-y-3">
              {calendarConnections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {connection.provider_account_email}
                        </span>
                        <Badge
                          variant={
                            connection.provider === 'google'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-xs"
                        >
                          {connection.provider}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {connection.calendar_name}
                      </p>
                    </div>
                  </div>
                  {connection.sync_enabled ? (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Paused
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No calendars connected
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  onClick={() => handleConnectCalendar('google')}
                  variant="outline"
                  size="sm"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </Button>
                <Button
                  onClick={() => handleConnectCalendar('microsoft')}
                  variant="outline"
                  size="sm"
                  disabled
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Connect Outlook (Coming Soon)
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
