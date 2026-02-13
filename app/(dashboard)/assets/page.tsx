/**
 * Assets List Page
 *
 * Browse and filter all studio assets
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { STATUS_COLORS } from '@/lib/utils/constants'

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('assets')
    .select(`
      *,
      categories(id, name, color),
      locations:locations!assets_home_location_id_fkey(id, name)
    `)
    .order('created_at', { ascending: false })

  if (params.status) {
    query = query.eq('status', params.status)
  }

  if (params.category) {
    query = query.eq('category_id', params.category)
  }

  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,asset_code.ilike.%${params.search}%,brand.ilike.%${params.search}%`
    )
  }

  const { data: assets } = await query

  // Get categories for filter
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground">
            Manage your studio equipment inventory
          </p>
        </div>
        <Button asChild>
          <Link href="/assets/new">Add Asset</Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter assets by status or category</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            asChild
            variant={!params.status ? 'default' : 'outline'}
            size="sm"
          >
            <Link href="/assets">All</Link>
          </Button>
          <Button
            asChild
            variant={params.status === 'available' ? 'default' : 'outline'}
            size="sm"
          >
            <Link href="/assets?status=available">Available</Link>
          </Button>
          <Button
            asChild
            variant={params.status === 'checked_out' ? 'default' : 'outline'}
            size="sm"
          >
            <Link href="/assets?status=checked_out">Checked Out</Link>
          </Button>
          <Button
            asChild
            variant={params.status === 'maintenance' ? 'default' : 'outline'}
            size="sm"
          >
            <Link href="/assets?status=maintenance">Maintenance</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {assets && assets.length > 0 ? (
          assets.map((asset: any) => (
            <Link key={asset.id} href={`/assets/${asset.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{asset.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {asset.asset_code}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${
                        STATUS_COLORS[
                          asset.status as keyof typeof STATUS_COLORS
                        ]?.bg
                      } ${
                        STATUS_COLORS[
                          asset.status as keyof typeof STATUS_COLORS
                        ]?.text
                      } ${
                        STATUS_COLORS[
                          asset.status as keyof typeof STATUS_COLORS
                        ]?.border
                      } border`}
                    >
                      {asset.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {asset.brand && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Brand:</span>
                        <span className="font-medium">{asset.brand}</span>
                      </div>
                    )}
                    {asset.model && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <span className="font-medium">{asset.model}</span>
                      </div>
                    )}
                    {asset.categories && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Category:</span>
                        <Badge
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
                    {asset.locations && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span className="font-medium">
                          {asset.locations.name}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-muted-foreground mb-4">No assets found</p>
                <Button asChild>
                  <Link href="/assets/new">Add your first asset</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
