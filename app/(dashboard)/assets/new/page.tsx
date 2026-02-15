/**
 * New Asset Page
 *
 * Form to create a new asset
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NewAssetPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [generatedCode, setGeneratedCode] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const [fetchingCost, setFetchingCost] = useState(false)

  const [formData, setFormData] = useState({
    asset_code: '',
    name: '',
    category_id: '',
    brand: '',
    model: '',
    serial_number: '',
    home_location_id: '',
    notes: '',
    purchase_value: '',
    replacement_cost: '',
  })

  // Load categories and locations
  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [categoriesRes, locationsRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('locations').select('*').order('name'),
    ])

    if (categoriesRes.data) setCategories(categoriesRes.data)
    if (locationsRes.data) setLocations(locationsRes.data)
  }

  // Handle photo selection
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setPhotoFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  // Auto-generate asset code
  async function generateCode() {
    try {
      const categoryName = categories.find((c) => c.id === formData.category_id)?.name
      const { data, error } = await supabase.rpc('generate_asset_code', {
        p_category_name: categoryName || null,
      })

      if (error) throw error
      setGeneratedCode(data)
      setFormData({ ...formData, asset_code: data })
      toast.success('Asset code generated!')
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Find replacement cost using AI
  async function findReplacementCost() {
    if (!formData.brand && !formData.model && !formData.name) {
      toast.error('Please enter at least brand, model, or name first')
      return
    }

    setFetchingCost(true)
    try {
      const response = await fetch('/api/assets/find-replacement-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: formData.brand,
          model: formData.model,
          name: formData.name,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to find replacement cost')
      }

      if (result.estimatedCost) {
        setFormData({ ...formData, replacement_cost: result.estimatedCost.toString() })
        toast.success(`Found replacement cost: £${result.estimatedCost} (${result.confidence} confidence)`)
        if (result.notes) {
          toast.info(result.notes, { duration: 5000 })
        }
      } else {
        toast.error(result.notes || 'Could not find a reliable price')
      }
    } catch (error: any) {
      console.error('Find replacement cost error:', error)
      toast.error(error.message || 'Failed to find replacement cost')
    } finally {
      setFetchingCost(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('You must be logged in')
        return
      }

      // Validate required fields
      if (!formData.asset_code || !formData.name) {
        toast.error('Asset code and name are required')
        return
      }

      // Upload photo if provided
      let photoUrl = null
      if (photoFile) {
        try {
          const fileExt = photoFile.name.split('.').pop()
          const fileName = `${formData.asset_code}-${Date.now()}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('asset-photos')
            .upload(fileName, photoFile)

          if (uploadError) throw uploadError

          // Get public URL
          const {
            data: { publicUrl },
          } = supabase.storage.from('asset-photos').getPublicUrl(fileName)

          photoUrl = publicUrl
          toast.success('Photo uploaded!')
        } catch (error: any) {
          toast.error(`Photo upload failed: ${error.message}`)
          // Continue with asset creation even if photo fails
        }
      }

      // Create asset (convert empty strings to null for UUID fields)
      const { data: asset, error } = await supabase
        .from('assets')
        .insert({
          asset_code: formData.asset_code,
          name: formData.name,
          category_id: formData.category_id || null,
          brand: formData.brand || null,
          model: formData.model || null,
          serial_number: formData.serial_number || null,
          home_location_id: formData.home_location_id || null,
          photo_url: photoUrl,
          notes: formData.notes || null,
          purchase_value: formData.purchase_value ? parseFloat(formData.purchase_value) : null,
          replacement_cost: formData.replacement_cost ? parseFloat(formData.replacement_cost) : null,
          replacement_cost_updated_at: formData.replacement_cost ? new Date().toISOString() : null,
          created_by: user.id,
          status: 'available',
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Asset created successfully!')
      router.push(`/assets/${asset.id}`)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add New Asset</h1>
        <p className="text-muted-foreground">
          Create a new asset in your inventory
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Asset Details</CardTitle>
            <CardDescription>
              Enter the information for the new asset
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Asset Code */}
            <div className="space-y-2">
              <Label htmlFor="asset_code">
                Asset Code <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="asset_code"
                  value={formData.asset_code}
                  onChange={(e) =>
                    setFormData({ ...formData, asset_code: e.target.value })
                  }
                  placeholder="MIC-00001"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateCode}
                  disabled={loading}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Unique identifier for this asset (will be printed on barcode)
              </p>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Shure SM57"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                placeholder="Shure"
              />
            </div>

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="SM57-LC"
              />
            </div>

            {/* Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="serial_number">Serial Number</Label>
              <Input
                id="serial_number"
                value={formData.serial_number}
                onChange={(e) =>
                  setFormData({ ...formData, serial_number: e.target.value })
                }
                placeholder="12345678"
              />
            </div>

            {/* Purchase Value */}
            <div className="space-y-2">
              <Label htmlFor="purchase_value">Purchase Value</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                <Input
                  id="purchase_value"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_value}
                  onChange={(e) =>
                    setFormData({ ...formData, purchase_value: e.target.value })
                  }
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                What you originally paid for this item
              </p>
            </div>

            {/* Replacement Cost */}
            <div className="space-y-2">
              <Label htmlFor="replacement_cost">Replacement Cost</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                  <Input
                    id="replacement_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.replacement_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, replacement_cost: e.target.value })
                    }
                    placeholder="0.00"
                    className="pl-7"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={findReplacementCost}
                  disabled={loading || fetchingCost}
                >
                  {fetchingCost ? 'Searching...' : 'Find Cost'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Current market price to replace this item (click Find Cost to search automatically)
              </p>
            </div>

            {/* Home Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Home Location</Label>
              <Select
                value={formData.home_location_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, home_location_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Default storage location for this asset
              </p>
            </div>

            {/* Photo Upload */}
            <div className="space-y-2">
              <Label htmlFor="photo">Photo</Label>
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                disabled={loading}
              />
              {photoPreview && (
                <div className="mt-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="max-w-xs rounded-lg border"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Maximum file size: 5MB. Supported formats: JPG, PNG, WEBP
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional information about this asset..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Asset'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/assets">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
