'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { STATUS_COLORS } from '@/lib/utils/constants'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

type SortField = 'brand' | 'asset_code' | 'model' | 'replacement_cost' | 'location' | 'status' | 'name'
type SortDirection = 'asc' | 'desc' | null

interface Asset {
  id: string
  name: string
  asset_code: string
  brand: string | null
  model: string | null
  status: string
  replacement_cost: number | null
  categories?: { id: string; name: string; color: string | null }
  locations?: { id: string; name: string }
}

interface AssetsTableProps {
  assets: Asset[]
}

export function AssetsTable({ assets }: AssetsTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedAssets = useMemo(() => {
    if (!sortField || !sortDirection) return assets

    return [...assets].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'brand':
          aValue = a.brand?.toLowerCase() || ''
          bValue = b.brand?.toLowerCase() || ''
          break
        case 'asset_code':
          aValue = a.asset_code.toLowerCase()
          bValue = b.asset_code.toLowerCase()
          break
        case 'model':
          aValue = a.model?.toLowerCase() || ''
          bValue = b.model?.toLowerCase() || ''
          break
        case 'replacement_cost':
          aValue = a.replacement_cost || 0
          bValue = b.replacement_cost || 0
          break
        case 'location':
          aValue = a.locations?.name.toLowerCase() || ''
          bValue = b.locations?.name.toLowerCase() || ''
          break
        case 'status':
          aValue = a.status.toLowerCase()
          bValue = b.status.toLowerCase()
          break
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [assets, sortField, sortDirection])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="ml-2 h-4 w-4" />
    }
    return <ArrowDown className="ml-2 h-4 w-4" />
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('name')}
                className="h-8 px-2"
              >
                Asset Name
                <SortIcon field="name" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('asset_code')}
                className="h-8 px-2"
              >
                Asset Tag
                <SortIcon field="asset_code" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('brand')}
                className="h-8 px-2"
              >
                Brand
                <SortIcon field="brand" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('model')}
                className="h-8 px-2"
              >
                Model
                <SortIcon field="model" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('replacement_cost')}
                className="h-8 px-2"
              >
                Price
                <SortIcon field="replacement_cost" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('location')}
                className="h-8 px-2"
              >
                Location
                <SortIcon field="location" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort('status')}
                className="h-8 px-2"
              >
                Status
                <SortIcon field="status" />
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">Category</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedAssets.length > 0 ? (
            sortedAssets.map((asset) => (
              <TableRow key={asset.id} className="cursor-pointer hover:bg-accent/50">
                <TableCell>
                  <Link href={`/assets/${asset.id}`} className="font-medium hover:underline">
                    {asset.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono text-sm">{asset.asset_code}</TableCell>
                <TableCell>{asset.brand || '-'}</TableCell>
                <TableCell>{asset.model || '-'}</TableCell>
                <TableCell>
                  {asset.replacement_cost ? `£${asset.replacement_cost.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>{asset.locations?.name || '-'}</TableCell>
                <TableCell>
                  <Badge
                    className={`${
                      STATUS_COLORS[asset.status as keyof typeof STATUS_COLORS]?.bg
                    } ${
                      STATUS_COLORS[asset.status as keyof typeof STATUS_COLORS]?.text
                    } ${
                      STATUS_COLORS[asset.status as keyof typeof STATUS_COLORS]?.border
                    } border`}
                  >
                    {asset.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {asset.categories && (
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: asset.categories.color ?? undefined,
                        color: asset.categories.color ?? undefined,
                      }}
                    >
                      {asset.categories.name}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                No assets found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
