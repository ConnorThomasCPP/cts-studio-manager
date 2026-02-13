/**
 * Barcode Scanner Page
 *
 * Scans barcodes using phone camera and shows asset details with check-in/out options
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Camera, CameraOff, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Asset = {
  id: string
  asset_code: string
  name: string
  status: string
  brand: string | null
  model: string | null
  serial_number: string | null
  photo_url: string | null
  category: { name: string } | null
  home_location: { name: string } | null
}

export default function ScanPage() {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScanRef = useRef<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  // Start camera scanner
  async function startScanner() {
    try {
      setIsScanning(true)

      // Create scanner instance
      const scanner = new Html5Qrcode('reader')
      scannerRef.current = scanner

      // Start scanning
      await scanner.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 150 }
        },
        onScanSuccess,
        onScanError
      )
    } catch (error) {
      console.error('Scanner start error:', error)
      toast.error('Failed to start camera. Please allow camera permissions.')
      setIsScanning(false)
    }
  }

  // Stop camera scanner
  async function stopScanner() {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
        setIsScanning(false)
      } catch (error) {
        console.error('Scanner stop error:', error)
      }
    }
  }

  // Handle successful barcode scan
  async function onScanSuccess(decodedText: string) {
    // Prevent duplicate scans
    if (lastScanRef.current === decodedText) {
      return
    }
    lastScanRef.current = decodedText

    console.log('Scanned barcode:', decodedText)

    // Stop scanner
    await stopScanner()

    // Look up asset
    setLoading(true)
    try {
      const { data: asset, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:categories(name),
          home_location:locations!home_location_id(name)
        `)
        .eq('asset_code', decodedText)
        .single()

      console.log('Database response:', { asset, error })

      if (error) {
        console.error('Database error:', error)
        toast.error(`Error: ${error.message}`)
        setScannedAsset(null)
        return
      }

      if (!asset) {
        toast.error(`Asset not found: ${decodedText}`)
        setScannedAsset(null)
        return
      }

      setScannedAsset(asset)
      toast.success('Asset found!')
    } catch (error) {
      console.error('Asset lookup error:', error)
      toast.error('Failed to look up asset')
    } finally {
      setLoading(false)
    }
  }

  // Handle scan errors (most are just "not found" while scanning)
  function onScanError(error: string) {
    // Ignore - these fire constantly while scanning
  }

  // Check out asset
  async function handleCheckOut() {
    if (!scannedAsset) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('User:', user)
      if (!user) throw new Error('Not authenticated')

      // Update asset status
      const { error: updateError } = await supabase
        .from('assets')
        .update({ status: 'checked_out' })
        .eq('id', scannedAsset.id)

      console.log('Update result:', { updateError })
      if (updateError) {
        console.error('Update error details:', updateError)
        toast.error(`Update failed: ${updateError.message}`)
        return
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          asset_id: scannedAsset.id,
          type: 'check_out',
          user_id: user.id,
          note: 'Checked out via mobile scanner'
        })

      console.log('Transaction result:', { transactionError })
      if (transactionError) {
        console.error('Transaction error details:', transactionError)
        toast.error(`Transaction failed: ${transactionError.message}`)
        return
      }

      toast.success(`${scannedAsset.name} checked out!`)
      setScannedAsset({ ...scannedAsset, status: 'checked_out' })
    } catch (error: any) {
      console.error('Check out error:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', Object.keys(error || {}))
      toast.error(error?.message || 'Failed to check out asset')
    } finally {
      setLoading(false)
    }
  }

  // Check in asset
  async function handleCheckIn() {
    if (!scannedAsset) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      console.log('User:', user)
      if (!user) throw new Error('Not authenticated')

      // Update asset status
      const { error: updateError } = await supabase
        .from('assets')
        .update({ status: 'available' })
        .eq('id', scannedAsset.id)

      console.log('Update result:', { updateError })
      if (updateError) {
        console.error('Update error details:', updateError)
        toast.error(`Update failed: ${updateError.message}`)
        return
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          asset_id: scannedAsset.id,
          type: 'check_in',
          user_id: user.id,
          note: 'Checked in via mobile scanner'
        })

      console.log('Transaction result:', { transactionError })
      if (transactionError) {
        console.error('Transaction error details:', transactionError)
        toast.error(`Transaction failed: ${transactionError.message}`)
        return
      }

      toast.success(`${scannedAsset.name} checked in!`)
      setScannedAsset({ ...scannedAsset, status: 'available' })
    } catch (error: any) {
      console.error('Check in error:', error)
      console.error('Error type:', typeof error)
      console.error('Error keys:', Object.keys(error || {}))
      toast.error(error?.message || 'Failed to check in asset')
    } finally {
      setLoading(false)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  return (
    <div className="container max-w-2xl py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/assets')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Assets
        </Button>
        <h1 className="text-3xl font-bold">Scan Barcode</h1>
        <p className="text-muted-foreground">
          Scan asset barcodes to check in or check out equipment
        </p>
      </div>

      {/* Scanner */}
      {!scannedAsset && (
        <Card className="p-6 mb-6">
          <div id="reader" className="w-full mb-4" />

          {!isScanning ? (
            <Button onClick={startScanner} className="w-full" size="lg">
              <Camera className="mr-2 h-5 w-5" />
              Start Scanner
            </Button>
          ) : (
            <Button
              onClick={stopScanner}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              <CameraOff className="mr-2 h-5 w-5" />
              Stop Scanner
            </Button>
          )}

          <p className="text-xs text-muted-foreground mt-4 text-center">
            Point your camera at a barcode to scan
          </p>
        </Card>
      )}

      {/* Asset Details */}
      {scannedAsset && (
        <Card className="p-6 space-y-6">
          {/* Photo */}
          {scannedAsset.photo_url && (
            <img
              src={scannedAsset.photo_url}
              alt={scannedAsset.name}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          {/* Details */}
          <div>
            <h2 className="text-2xl font-bold mb-2">{scannedAsset.name}</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Code:</span>{' '}
                <span className="font-mono">{scannedAsset.asset_code}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  scannedAsset.status === 'available'
                    ? 'bg-green-100 text-green-800'
                    : scannedAsset.status === 'checked_out'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {scannedAsset.status.replace('_', ' ')}
                </span>
              </div>
              {scannedAsset.brand && (
                <div>
                  <span className="font-medium">Brand:</span> {scannedAsset.brand}
                </div>
              )}
              {scannedAsset.model && (
                <div>
                  <span className="font-medium">Model:</span> {scannedAsset.model}
                </div>
              )}
              {scannedAsset.serial_number && (
                <div>
                  <span className="font-medium">Serial:</span> {scannedAsset.serial_number}
                </div>
              )}
              {scannedAsset.category?.name && (
                <div>
                  <span className="font-medium">Category:</span> {scannedAsset.category.name}
                </div>
              )}
              {scannedAsset.home_location?.name && (
                <div>
                  <span className="font-medium">Location:</span> {scannedAsset.home_location.name}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {scannedAsset.status === 'available' ? (
              <Button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                Check Out
              </Button>
            ) : scannedAsset.status === 'checked_out' ? (
              <Button
                onClick={handleCheckIn}
                disabled={loading}
                className="w-full"
                size="lg"
                variant="outline"
              >
                Check In
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground text-center">
                Asset is {scannedAsset.status} and cannot be checked in/out
              </p>
            )}

            <Button
              onClick={() => {
                setScannedAsset(null)
                lastScanRef.current = null
              }}
              variant="ghost"
              className="w-full"
            >
              Scan Another
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
