/**
 * Asset Detail Page
 *
 * View details of a specific asset
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { STATUS_COLORS } from '@/lib/utils/constants'
import { BarcodeDisplay } from '@/components/assets/barcode-display'

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: asset, error } = await supabase
    .from('assets')
    .select(`
      *,
      categories(id, name, color),
      locations:locations!assets_home_location_id_fkey(id, name),
      current_location:locations!assets_current_location_id_fkey(id, name),
      created_by_user:users!assets_created_by_fkey(id, name)
    `)
    .eq('id', id)
    .single()

  if (error || !asset) {
    notFound()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{asset.name}</h1>
          <p className="text-muted-foreground">{asset.asset_code}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/assets/${asset.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/assets">Back to Assets</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Photo */}
        {asset.photo_url && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={asset.photo_url}
                alt={asset.name}
                className="max-w-md rounded-lg border"
              />
            </CardContent>
          </Card>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge
                className={`mt-1 ${
                  STATUS_COLORS[asset.status as keyof typeof STATUS_COLORS]?.bg
                } ${
                  STATUS_COLORS[asset.status as keyof typeof STATUS_COLORS]?.text
                } ${
                  STATUS_COLORS[asset.status as keyof typeof STATUS_COLORS]
                    ?.border
                } border`}
              >
                {asset.status}
              </Badge>
            </div>

            {asset.categories && (
              <div>
                <div className="text-sm text-muted-foreground">Category</div>
                <Badge
                  className="mt-1"
                  variant="outline"
                  style={{
                    borderColor: asset.categories.color,
                    color: asset.categories.color,
                  }}
                >
                  {asset.categories.name}
                </Badge>
              </div>
            )}

            {asset.brand && (
              <div>
                <div className="text-sm text-muted-foreground">Brand</div>
                <div className="font-medium">{asset.brand}</div>
              </div>
            )}

            {asset.model && (
              <div>
                <div className="text-sm text-muted-foreground">Model</div>
                <div className="font-medium">{asset.model}</div>
              </div>
            )}

            {asset.serial_number && (
              <div>
                <div className="text-sm text-muted-foreground">Serial Number</div>
                <div className="font-medium font-mono">{asset.serial_number}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {asset.locations && (
              <div>
                <div className="text-sm text-muted-foreground">Home Location</div>
                <div className="font-medium">{asset.locations.name}</div>
              </div>
            )}

            {asset.current_location && (
              <div>
                <div className="text-sm text-muted-foreground">
                  Current Location
                </div>
                <div className="font-medium">{asset.current_location.name}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Barcode */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Barcode (Code 128)</CardTitle>
            <CardDescription>
              Scan this barcode to check-out or check-in this asset, or print a label
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BarcodeDisplay assetCode={asset.asset_code} assetName={asset.name} />
          </CardContent>
        </Card>

        {/* Notes */}
        {asset.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{asset.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span>{new Date(asset.created_at).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span>{new Date(asset.updated_at).toLocaleString()}</span>
            </div>
            {asset.created_by_user && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By:</span>
                <span>{asset.created_by_user.name}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
