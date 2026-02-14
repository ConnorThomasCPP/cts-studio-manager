/**
 * Assets List Page
 *
 * Browse and filter all studio assets
 */

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AssetsTable } from '@/components/assets/assets-table'

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

      {/* Assets Table */}
      {assets && assets.length > 0 ? (
        <AssetsTable assets={assets} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No assets found</p>
            <Button asChild>
              <Link href="/assets/new">Add your first asset</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
